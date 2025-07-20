const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const { User } = require('../models');
const httpStatusText = require('../utils/httpStatusText');
const asyncWrapper = require('../middleware/asyncWrapper');
const appError = require('../utils/appError');
const generateJWT = require('../utils/generateJWT');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const formatErrors = (errors) =>
  errors.array().map((error) => ({
    [`error of ${error.path}`]: error.msg
  }));

const register = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      appError.createError(formatErrors(errors), 400, httpStatusText.Fail)
    );
  }

  const { firstName, lastName, email, password, role } = req.body;
  
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(
      appError.createError('Email already exists', 400, httpStatusText.Fail)
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role: role || 'USER',
    avatar: req.file ? req.file.filename : 'profile.png',
    isFirebaseUser: false
  });

  const token = generateJWT({
    email: newUser.email,
    userId: newUser.id,
    role: newUser.role
  });

  // Set HTTP-Only cookie for regular users
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });


  res.status(201).json({
    status: httpStatusText.Success,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        avatar: newUser.avatar
      }
    }
  });
});

const login = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      appError.createError(formatErrors(errors), 400, httpStatusText.Fail)
    );
  }

  const { email, password } = req.body;
  
  const user = await User.findOne({ where: { email, isFirebaseUser: false } });
  if (!user) {
    return next(
      appError.createError('Invalid email or password', 401, httpStatusText.Fail)
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(
      appError.createError('Invalid email or password', 401, httpStatusText.Fail)
    );
  }

  const token = generateJWT({
    email: user.email,
    userId: user.id,
    role: user.role
  });

  // Set HTTP-Only cookie for regular users
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });


  res.json({
    status: httpStatusText.Success,
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    }
  });
});

// Firebase login - creates/updates user in database and stores Firebase ID token
const firebaseLogin = asyncWrapper(async (req, res, next) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return next(
      appError.createError('Firebase ID token is required', 400, httpStatusText.Fail)
    );
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if user exists in database
    let user = await User.findOne({ 
      where: { firebaseUid: decodedToken.uid } 
    });

    if (!user) {
      // Create new Firebase user in database
      user = await User.create({
        firebaseUid: decodedToken.uid,
        firstName: decodedToken.name?.split(' ')[0] || 'User',
        lastName: decodedToken.name?.split(' ').slice(1).join(' ') || 'Name',
        email: decodedToken.email,
        password: null, // No password for Firebase users
        role: 'USER',
        avatar: decodedToken.picture || 'profile.png',
        isFirebaseUser: true
      });
    } else {
      // Update existing user info
      await user.update({
        firstName: decodedToken.name?.split(' ')[0] || user.firstName,
        lastName: decodedToken.name?.split(' ').slice(1).join(' ') || user.lastName,
        avatar: decodedToken.picture || user.avatar
      });
    }

    // Set Firebase ID token in HTTP-Only cookie
    res.cookie('token', idToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour (Firebase tokens expire in 1 hour)
    });


    res.json({
      status: httpStatusText.Success,
      data: {
        user: {
          id: user.id, // Database ID for relations
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    return next(
      appError.createError('Invalid Firebase token', 401, httpStatusText.Fail)
    );
  }
});

const logout = asyncWrapper(async (req, res, next) => {
  res.clearCookie('token');
  
  res.json({
    status: httpStatusText.Success,
    message: 'Logged out successfully'
  });
});

const forgotPassword = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;
  
  const user = await User.findOne({ 
    where: { email, isFirebaseUser: false } 
  });
  
  if (!user) {
    return next(
      appError.createError('User not found or is a social media user', 404, httpStatusText.Fail)
    );
  }

  const resetSecret = process.env.JWT_SECRET_KEY + user.password;
  const resetToken = jwt.sign(
    { userId: user.id, email: user.email },
    resetSecret,
    { expiresIn: '15m' }
  );

  const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}&id=${user.id}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link will expire in 15 minutes.</p>
    `
  };

  await transporter.sendMail(mailOptions);

  res.json({
    status: httpStatusText.Success,
    message: 'Password reset link sent to your email'
  });
});

const resetPassword = asyncWrapper(async (req, res, next) => {
  const { token, id, password } = req.body;
  
  const user = await User.findOne({ 
    where: { id, isFirebaseUser: false } 
  });
  
  if (!user) {
    return next(
      appError.createError('User not found or is a social media user', 404, httpStatusText.Fail)
    );
  }

  try {
    const resetSecret = process.env.JWT_SECRET_KEY + user.password;
    jwt.verify(token, resetSecret);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password: hashedPassword });

    res.json({
      status: httpStatusText.Success,
      message: 'Password reset successfully'
    });
  } catch (error) {
    return next(
      appError.createError('Invalid or expired token', 401, httpStatusText.Fail)
    );
  }
});

module.exports = {
  register,
  login,
  firebaseLogin,
  logout,
  forgotPassword,
  resetPassword
};