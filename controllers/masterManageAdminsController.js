// backend/controllers/masterManageAdminsController.js
const pool = require('../config/db');

/**
 * GET /api/master/manage-admins
 * Return all rows from `admins` table, along with approval status.
 * Only userType==='master' may call.
 */
exports.getAllAdmins = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may manage admins.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT ano_id, name, email, contact, role, type, is_approved, created_at, updated_at
         FROM admins
        ORDER BY is_approved ASC, name ASC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get All Admins Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching admins.' });
  }
};

/**
 * PUT /api/master/manage-admins/:ano_id/disable
 * Set is_approved=0 or is_active=0 (depending on your schema) for that admin.
 */
exports.disableAdmin = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may disable admins.' });
  }
  const { ano_id } = req.params;
  try {
    // Option A: if you have is_approved column in admins
    await pool.execute(
      `UPDATE admins
         SET is_approved = 0, updated_at = CURRENT_TIMESTAMP
       WHERE ano_id = ?`,
      [ano_id]
    );
    return res.json({ msg: 'Admin disabled.' });
  } catch (err) {
    console.error('[Disable Admin Error]', err);
    return res.status(500).json({ msg: 'Database error while disabling admin.' });
  }
};

/**
 * PUT /api/master/manage-admins/:ano_id/enable
 * Set is_approved=1 for that admin.
 */
exports.enableAdmin = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may enable admins.' });
  }
  const { ano_id } = req.params;
  try {
    await pool.execute(
      `UPDATE admins
         SET is_approved = 1, updated_at = CURRENT_TIMESTAMP
       WHERE ano_id = ?`,
      [ano_id]
    );
    return res.json({ msg: 'Admin enabled.' });
  } catch (err) {
    console.error('[Enable Admin Error]', err);
    return res.status(500).json({ msg: 'Database error while enabling admin.' });
  }
};

/**
 * DELETE /api/master/manage-admins/:ano_id
 * Permanently delete that admin row.
 */
exports.deleteAdmin = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may delete admins.' });
  }
  const { ano_id } = req.params;
  try {
    const [result] = await pool.execute(
      `DELETE FROM admins WHERE ano_id = ?`,
      [ano_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Admin not found.' });
    }
    return res.json({ msg: 'Admin deleted.' });
  } catch (err) {
    console.error('[Delete Admin Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting admin.' });
  }
};
