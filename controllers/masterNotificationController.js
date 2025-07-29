// backend/controllers/masterNotificationController.js
const pool = require('../config/db');

/**
 * GET /api/master/notification-manager
 *   Returns all rows from your existing `notification` table, sorted newest first.
 *   Only userType==='master' may call.
 */
exports.getAllNotifications = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may view notifications.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT 
         notification_id,
         sender_type,
         sender_id,
         target_type,
         target_id,
         message,
         created_at
       FROM notification
       ORDER BY created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get Notifications Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching notifications.' });
  }
};

/**
 * POST /api/master/notification-manager
 *   Body: { target_type, target_id?, message }
 *   sender_type = 'master'; sender_id = req.user.phone
 *   Only userType==='master' may call.
 */
exports.createNotification = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may create notifications.' });
  }

  const sender_type = 'master';
  const sender_id   = req.user.phone; 
  let { target_type, target_id, message } = req.body;

  // Validate target_type
  const validTargets = ['all','admin','user','master'];
  if (!validTargets.includes(target_type)) {
    return res.status(400).json({ msg: 'Invalid target_type.' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ msg: 'Message is required.' });
  }

  try {
    await pool.execute(
      `INSERT INTO notification 
         (sender_type, sender_id, target_type, target_id, message)
       VALUES (?, ?, ?, ?, ?)`,
      [sender_type, sender_id, target_type, target_id || null, message.trim()]
    );
    return res.json({ msg: 'Notification created.' });
  } catch (err) {
    console.error('[Create Notification Error]', err);
    return res.status(500).json({ msg: 'Database error while creating notification.' });
  }
};

/**
 * DELETE /api/master/notification-manager/:notification_id
 *   Only userType==='master' may call.
 */
exports.deleteNotification = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may delete notifications.' });
  }
  const { notification_id } = req.params;
  try {
    const [result] = await pool.execute(
      `DELETE FROM notification WHERE notification_id = ?`,
      [notification_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Notification not found.' });
    }
    return res.json({ msg: 'Notification deleted.' });
  } catch (err) {
    console.error('[Delete Notification Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting notification.' });
  }
};
