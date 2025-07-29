// backend/controllers/masterManageUsersController.js
const pool = require('../config/db');

/**
 * GET /api/master/manage-users
 * Return all cadet rows from `users`. Only Master may call.
 */
exports.getAllCadets = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may manage cadets.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT 
         id,
         regimental_number,
         name,
         email,
         contact,
         ano_id,
         is_approved,
         created_at
       FROM users
       ORDER BY is_approved ASC, name ASC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get All Cadets Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching cadets.' });
  }
};

/**
 * PUT /api/master/manage-users/:regimental_number/enable
 * Set is_approved=1 for that cadet
 */
exports.enableCadet = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may enable cadets.' });
  }
  const { regimental_number } = req.params;
  try {
    const [result] = await pool.execute(
      `UPDATE users
         SET is_approved = 1, updated_at = CURRENT_TIMESTAMP
       WHERE regimental_number = ?`,
      [regimental_number]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Cadet not found.' });
    }
    return res.json({ msg: 'Cadet enabled.' });
  } catch (err) {
    console.error('[Enable Cadet Error]', err);
    return res.status(500).json({ msg: 'Database error while enabling cadet.' });
  }
};

/**
 * PUT /api/master/manage-users/:regimental_number/disable
 * Set is_approved=0 for that cadet
 */
exports.disableCadet = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may disable cadets.' });
  }
  const { regimental_number } = req.params;
  try {
    const [result] = await pool.execute(
      `UPDATE users
         SET is_approved = 0, updated_at = CURRENT_TIMESTAMP
       WHERE regimental_number = ?`,
      [regimental_number]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Cadet not found.' });
    }
    return res.json({ msg: 'Cadet disabled.' });
  } catch (err) {
    console.error('[Disable Cadet Error]', err);
    return res.status(500).json({ msg: 'Database error while disabling cadet.' });
  }
};

/**
 * DELETE /api/master/manage-users/:regimental_number
 * Permanently remove that cadet
 */
exports.deleteCadet = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may delete cadets.' });
  }
  const { regimental_number } = req.params;
  try {
    const [result] = await pool.execute(
      `DELETE FROM users WHERE regimental_number = ?`,
      [regimental_number]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Cadet not found.' });
    }
    return res.json({ msg: 'Cadet deleted.' });
  } catch (err) {
    console.error('[Delete Cadet Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting cadet.' });
  }
};
