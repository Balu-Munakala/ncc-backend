// backend/routes/master/notificationManager.js
const express        = require('express');
const router         = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const ctrl           = require('../../controllers/masterNotificationController');

// GET  /api/master/notification-manager
router.get('/', authenticate, ctrl.getAllNotifications);

// POST /api/master/notification-manager
router.post('/', authenticate, ctrl.createNotification);

// DELETE /api/master/notification-manager/:notification_id
router.delete('/:notification_id', authenticate, ctrl.deleteNotification);

module.exports = router;
