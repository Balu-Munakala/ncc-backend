// controllers/adminReportsController.js

const pool = require('../config/db');

/**
 * GET /api/admin/reports/users
 * Returns { totalCadets: number, pendingCadets: number }
 */
exports.getUserCounts = async (req, res) => {
  const ano_id = req.user.ano_id;
  try {
    const [rows] = await pool.execute(
      `
      SELECT 
        COUNT(*) AS totalCadets,
        SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) AS pendingCadets
      FROM users
      WHERE ano_id = ?
      `,
      [ano_id]
    );
    const totalCadets = Number(rows[0].totalCadets || 0);
    const pendingCadets = Number(rows[0].pendingCadets || 0);
    return res.json({ totalCadets, pendingCadets });
  } catch (err) {
    console.error('[Get User Counts Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching user counts.' });
  }
};

/**
 * GET /api/admin/reports/events-count
 * Returns { totalEvents: number }
 *
 * Note: switched to count rows in `fallin` instead of `events`.
 */
exports.getEventsCount = async (req, res) => {
  const ano_id = req.user.ano_id;
  try {
    const [rows] = await pool.execute(
      `
      SELECT COUNT(*) AS totalEvents
      FROM fallin
      WHERE ano_id = ?
      `,
      [ano_id]
    );
    const totalEvents = Number(rows[0].totalEvents || 0);
    return res.json({ totalEvents });
  } catch (err) {
    console.error('[Get Events Count Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching events count.' });
  }
};

/**
 * GET /api/admin/reports/attendance-summary
 * Returns { avgAttendance: number }
 */
exports.getAttendanceSummary = async (req, res) => {
  const ano_id = req.user.ano_id;
  try {
    const [rows] = await pool.execute(
      `
      SELECT AVG(pcnt) AS avgAttendance FROM (
        SELECT 
          (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS pcnt
        FROM attendance a
        JOIN fallin f ON a.fallin_id = f.fallin_id
        WHERE f.ano_id = ?
        GROUP BY a.fallin_id
      ) t
      `,
      [ano_id]
    );

    // rows[0].avgAttendance may be a string or null
    const raw = rows[0].avgAttendance;
    const num = raw !== null ? Number(raw) : 0;
    const avgAttendance = Number(num.toFixed(2));
    return res.json({ avgAttendance });
  } catch (err) {
    console.error('[Get Attendance Summary Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching attendance summary.' });
  }
};

/**
 * GET /api/admin/reports/attendance-details
 * Returns an array of recent fall‐in attendance summaries
 */
exports.getAttendanceDetails = async (req, res) => {
  const ano_id = req.user.ano_id;
  try {
    const [rows] = await pool.execute(
      `
      SELECT 
        f.fallin_id,
        f.date,
        f.time,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS attendedCount,
        COUNT(a.regimental_number) AS totalCadets,
        (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(a.regimental_number)) * 100 AS percentage
      FROM attendance a
      JOIN fallin f ON a.fallin_id = f.fallin_id
      WHERE f.ano_id = ?
      GROUP BY f.fallin_id
      ORDER BY f.date DESC, f.time DESC
      LIMIT 5
      `,
      [ano_id]
    );

    const details = rows.map((r) => {
      // r.percentage may be a string or null
      const rawPct = r.percentage;
      const pctNum = rawPct !== null ? Number(rawPct) : 0;
      return {
        fallin_id: r.fallin_id,
        date: r.date,
        time: r.time,
        attendedCount: Number(r.attendedCount || 0),
        totalCadets: Number(r.totalCadets || 0),
        percentage: Number(pctNum.toFixed(2))
      };
    });

    return res.json(details);
  } catch (err) {
    console.error('[Get Attendance Details Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching attendance details.' });
  }
};
