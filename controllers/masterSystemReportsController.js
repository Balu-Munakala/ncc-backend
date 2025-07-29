// backend/controllers/masterSystemReportsController.js
const pool = require('../config/db');

/**
 * GET /api/master/system-reports/summary
 * Returns overall counts: totalCadets, totalAdmins, totalMasters, totalFallins, totalEvents, totalAchievements, etc.
 */
exports.getSummary = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may view system reports.' });
  }
  try {
    // Cadets
    const [[{ totalCadets }]] = await pool.execute(
      `SELECT COUNT(*) AS totalCadets FROM users`
    );
    // Admins
    const [[{ totalAdmins }]] = await pool.execute(
      `SELECT COUNT(*) AS totalAdmins FROM admins`
    );
    // Masters
    const [[{ totalMasters }]] = await pool.execute(
      `SELECT COUNT(*) AS totalMasters FROM masters`
    );
    // Fall‐ins
    const [[{ totalFallins }]] = await pool.execute(
      `SELECT COUNT(*) AS totalFallins FROM fallin`
    );
    // Events
    const [[{ totalEvents }]] = await pool.execute(
      `SELECT COUNT(*) AS totalEvents FROM events`
    );
    // Achievements
    const [[{ totalAchievements }]] = await pool.execute(
      `SELECT COUNT(*) AS totalAchievements FROM achievements`
    );
    // Support Queries
    const [[{ totalQueries }]] = await pool.execute(
      `SELECT COUNT(*) AS totalQueries FROM support_queries`
    );

    return res.json({
      totalCadets,
      totalAdmins,
      totalMasters,
      totalFallins,
      totalEvents,
      totalAchievements,
      totalQueries
    });
  } catch (err) {
    console.error('[Get Summary Error]', err);
    return res.status(500).json({ msg: 'Database error while generating summary.' });
  }
};

/**
 * GET /api/master/system-reports/attendance-trends
 * Returns last N fall‐in dates with overall attendance percentages across the entire platform.
 */
exports.getAttendanceTrends = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may view attendance trends.' });
  }
  try {
    // For each fallin (across all ANOs), compute attendance %
    // We limit to last 5 for example
    const [rows] = await pool.execute(
      `SELECT 
         f.fallin_id,
         f.date,
         f.time,
         SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS presentCount,
         COUNT(a.regimental_number) AS totalCount,
         ROUND(
           (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(a.regimental_number)) * 100,
           2
         ) AS percentage
       FROM fallin f
       LEFT JOIN attendance a ON f.fallin_id = a.fallin_id
       GROUP BY f.fallin_id
       ORDER BY f.date DESC, f.time DESC
       LIMIT 5`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get Attendance Trends Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching attendance trends.' });
  }
};
