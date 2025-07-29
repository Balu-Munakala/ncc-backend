// routes/user.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerConfig');
const userController = require('../controllers/userController');

// GET full user profile
router.get('/profile', authenticate, userController.getProfile);

// POST: Create or update user profile
router.post('/update-profile', authenticate, userController.updateProfile);

// POST: Upload profile picture
router.post(
  '/upload-profile-pic',
  authenticate,
  upload.single('profile_pic'),
  userController.uploadProfilePic
);

// GET: Serve profile picture
router.get('/profile-pic', authenticate, userController.getProfilePic);

module.exports = router;
