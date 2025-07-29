// routes/master.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerConfig');
const masterController = require('../controllers/masterController');

// GET master full profile
router.get('/profile', authenticate, masterController.getProfile);

// POST: Insert or update master profile
router.post('/update-master-profile', authenticate, masterController.updateProfile);

// POST: Upload master profile picture
router.post('/upload-profile-pic', authenticate, upload.single('profile_pic'), masterController.uploadProfilePic);

// GET: Serve master profile picture
router.get('/profile-pic', authenticate, masterController.getProfilePic);

module.exports = router;
