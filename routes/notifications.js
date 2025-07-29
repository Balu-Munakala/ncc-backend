// routes/notifications.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const notificationsController = require('../controllers/notificationsController');

// Fetch all notifications for the logged-in cadet
router.get('/user', authenticate, notificationsController.getUserNotifications);

// Mark single notification as read
router.put('/:notificationId/read', authenticate, notificationsController.markAsRead);

module.exports = router;
