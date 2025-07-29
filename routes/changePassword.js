// routes/changePassword.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const changePasswordController = require('../controllers/changePasswordController');

// POST /api/change-password
router.post('/change-password', authenticate, changePasswordController.changePassword);

module.exports = router;    
 