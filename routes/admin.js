// routes/admin.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerConfig');
const adminController = require('../controllers/adminController');

// GET full admin profile
router.get('/profile', authenticate, adminController.getProfile);

// POST: Insert or update admin profile
router.post('/update-admin-profile', authenticate, adminController.updateProfile);

// POST: Upload admin profile picture
router.post(
  '/upload-profile-pic',
  authenticate,
  upload.single('profile_pic'),
  adminController.uploadProfilePic
);

// GET: Serve admin profile picture
router.get('/profile-pic', authenticate, adminController.getProfilePic);

module.exports = router;
