// backend/controllers/masterSystemLogsController.js
const pool = require('../config/db');

/**
 * GET /api/master/system-logs
 * Return all entries from system_logs, newest first. Master only.
 */
exports.getAllLogs = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may view system logs.' });
  }
  try {
    const [rows] = await pool.execute(
      `SELECT log_id, user_type, user_id, action, ip_address, created_at
         FROM system_logs
        ORDER BY created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get System Logs Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching system logs.' });
  }
};
