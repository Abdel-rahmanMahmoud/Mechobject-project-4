const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const { User } = require('../models');
const httpStatusText = require('../utils/httpStatusText');
const appError = require('../utils/appError');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const verifyToken = async (req, res, next) => {
  let token = req.cookies.token;
  
  if (!token) {
    const authHeaders = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeaders) {
      token = authHeaders.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      status: httpStatusText.Fail,
      code: 401,
      message: "Unauthorized - No token provided"
    });
  }

  try {
    let currentUser;
    
    // Try Firebase token first
    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Get user from database using Firebase UID
      const user = await User.findOne({ 
        where: { firebaseUid: decodedToken.uid } 
      });
      
      if (!user) {
        return res.status(401).json({
          status: httpStatusText.Fail,
          code: 401,
          message: "User not found in database"
        });
      }
      
      currentUser = {
        userId: user.id, // Database ID for relations
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        firebaseUid: user.firebaseUid
      };
    } catch (firebaseError) {
      // Verify regular JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      currentUser = decoded;
    }
    
    req.currentUser = currentUser;
    next();
  } catch (error) {
    return next(
      appError.createError("Invalid token", 401, httpStatusText.Fail)
    );
  }
};

module.exports = verifyToken;