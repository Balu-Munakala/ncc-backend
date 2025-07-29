// backend/controllers/masterGlobalSearchController.js
const pool = require('../config/db');

/**
 * GET /api/master/global-search?q=...
 * Master may search for partial matches in user names, admin names, phone/email, etc.
 */
exports.searchAll = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may perform global search.' });
  }
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ msg: 'Query parameter q is required.' });
  }
  const wildcard = `%${q}%`;
  try {
    // 1) Search cadets (users)
    const [cadets] = await pool.execute(
      `SELECT 'user' AS type, regimental_number AS id, name, email, contact
         FROM users
        WHERE name LIKE ? OR email LIKE ? OR regimental_number LIKE ?`,
      [wildcard, wildcard, wildcard]
    );

    // 2) Search admins
    const [admins] = await pool.execute(
      `SELECT 'admin' AS type, ano_id AS id, name, email, contact
         FROM admins
        WHERE name LIKE ? OR email LIKE ? OR ano_id LIKE ?`,
      [wildcard, wildcard, wildcard]
    );

    // 3) Search masters (just in case)
    const [masters] = await pool.execute(
      `SELECT 'master' AS type, phone AS id, name, email, phone AS contact
         FROM masters
        WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?`,
      [wildcard, wildcard, wildcard]
    );

    return res.json({ cadets, admins, masters });
  } catch (err) {
    console.error('[Global Search Error]', err);
    return res.status(500).json({ msg: 'Database error while performing search.' });
  }
};
