// controllers/manageUsersController.js

const pool = require('../config/db');

/**
 * GET /api/admin/manage-users
 * Return all cadet users whose `ano_id` matches the logged-in ANO.
 */
exports.getAllUsers = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may manage cadet registrations.' });
  }

  const ano_id = req.user.ano_id;

  try {
    const [rows] = await pool.execute(
      `SELECT 
         id,
         regimental_number,
         name,
         email,
         contact,
         is_approved
       FROM users
       WHERE ano_id = ?
       ORDER BY is_approved ASC, name ASC`,
      [ano_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get All Users Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching users.' });
  }
};

/**
 * PUT /api/admin/manage-users/approve/:userId
 * Set is_approved = 1 for the specified cadet, only if they belong to this ANO.
 * After approving, notify that cadet.
 */
exports.approveUser = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may approve cadets.' });
  }

  const ano_id = req.user.ano_id;
  const userId = req.params.userId;

  try {
    // 1) Verify that this cadet belongs to this ANO and fetch their regimental_number
    const [rows] = await pool.execute(
      `SELECT regimental_number 
         FROM users 
        WHERE id = ? 
          AND ano_id = ?`,
      [userId, ano_id]
    );
    if (!rows.length) {
      return res.status(404).json({ msg: 'Cadet not found or not under your ANO.' });
    }
    const regimental_number = rows[0].regimental_number;

    // 2) Update is_approved = 1
    await pool.execute(
      `UPDATE users
         SET is_approved = 1,
             updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [userId]
    );

    // 3) Insert a notification for that cadet
    const message = `Your account has been approved! You may now log in.`;
    const link = `/cadet/dashboard`;

    await pool.execute(
      `INSERT INTO notifications 
         (regimental_number, type, message, link)
       VALUES (?, 'ManageUsers', ?, ?)`,
      [regimental_number, message, link]
    );

    return res.json({ msg: 'Cadet approved and notification sent.' });
  } catch (err) {
    console.error('[Approve User Error]', err);
    return res.status(500).json({ msg: 'Database error while approving cadet.' });
  }
};

/**
 * DELETE /api/admin/manage-users/:userId
 * Remove a cadet’s user row entirely, only if they belong to this ANO.
 * Before deletion, notify the cadet that their registration was rejected.
 */
exports.deleteUser = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may delete cadets.' });
  }

  const ano_id = req.user.ano_id;
  const userId = req.params.userId;

  try {
    // 1) Verify that this cadet belongs to this ANO and fetch their regimental_number
    const [rows] = await pool.execute(
      `SELECT regimental_number 
         FROM users
        WHERE id = ?
          AND ano_id = ?`,
      [userId, ano_id]
    );
    if (!rows.length) {
      return res.status(404).json({ msg: 'Cadet not found or not under your ANO.' });
    }
    const regimental_number = rows[0].regimental_number;

    // 2) Insert a “rejection” notification before deleting the user row
    const message = `Your registration has been rejected by the ANO.`;
    const link = null; // no link

    await pool.execute(
      `INSERT INTO notifications
         (regimental_number, type, message, link)
       VALUES (?, 'ManageUsers', ?, ?)`,
      [regimental_number, message, link]
    );

    // 3) Delete the user row
    await pool.execute(
      `DELETE FROM users 
        WHERE id = ?`,
      [userId]
    );

    return res.json({ msg: 'Cadet deleted and notification sent.' });
  } catch (err) {
    console.error('[Delete User Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting cadet.' });
  }
};
