// controllers/notificationsController.js

const pool = require('../config/db');

/**
 * GET /api/notifications/user
 * Returns all notifications (newest first) for the logged-in cadet.
 * Only userType === 'user' may call.
 */
exports.getUserNotifications = async (req, res) => {
  if (req.user.userType !== 'user') {
    return res.status(403).json({ msg: 'Only cadets may view notifications.' });
  }

  const regimental_number = req.user.regimental_number;
  try {
    const [rows] = await pool.execute(
      `
      SELECT notification_id,
             type,
             message,
             link,
             is_read,
             created_at
        FROM notifications
       WHERE regimental_number = ?
       ORDER BY created_at DESC
      `,
      [regimental_number]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get User Notifications Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching notifications.' });
  }
};

/**
 * PUT /api/notifications/:notificationId/read
 * Marks a single notification as "read" (is_read = 1).
 * Only userType === 'user' may call, and only on their own notifications.
 */
exports.markAsRead = async (req, res) => {
  if (req.user.userType !== 'user') {
    return res.status(403).json({ msg: 'Only cadets may mark notifications.' });
  }

  const regimental_number = req.user.regimental_number;
  const notificationId = req.params.notificationId;

  try {
    // Verify that the notification belongs to this cadet
    const [rows] = await pool.execute(
      `
      SELECT notification_id
        FROM notifications
       WHERE notification_id = ?
         AND regimental_number = ?
      `,
      [notificationId, regimental_number]
    );
    if (!rows.length) {
      return res.status(404).json({ msg: 'Notification not found.' });
    }

    // Mark as read
    await pool.execute(
      `
      UPDATE notifications
         SET is_read = 1, updated_at = CURRENT_TIMESTAMP
       WHERE notification_id = ?
      `,
      [notificationId]
    );
    return res.json({ msg: 'Notification marked as read.' });
  } catch (err) {
    console.error('[Mark Notification As Read Error]', err);
    return res.status(500).json({ msg: 'Database error while updating notification.' });
  }
};
