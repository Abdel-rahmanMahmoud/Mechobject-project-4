const express = require('express');
const multer = require('multer');
const authController = require('../controllers/authController');
const { loginValidation, registerValidation } = require('../middleware/validation');

const router = express.Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split('/')[1];
    const fileName = `user-${Date.now()}.${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage });

router.post('/register', upload.single('avatar'), registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/firebase-login', authController.firebaseLogin);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;