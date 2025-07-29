// controllers/changePasswordController.js

const bcrypt = require('bcryptjs');
const pool = require('../config/db');

exports.changePassword = async (req, res) => {
  const { userType } = req.user;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Both current and new passwords are required.' });
  }

  try {
    // ── 1) Handle cadet (user)
    if (userType === 'user') {
      const userId = req.user.id;

      // Fetch existing hash + regimental_number
      const [userRows] = await pool.execute(
        `SELECT password_hash, regimental_number
           FROM users
          WHERE id = ?`,
        [userId]
      );
      if (!userRows.length) {
        return res.status(404).json({ message: 'Cadet not found.' });
      }

      const { password_hash, regimental_number } = userRows[0];

      // Verify current_password
      const isMatch = await bcrypt.compare(current_password, password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }

      // Ensure new ≠ current
      const newIsSame = await bcrypt.compare(new_password, password_hash);
      if (newIsSame) {
        return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
      }

      // Hash and update
      const newHash = await bcrypt.hash(new_password, 12);
      await pool.execute(
        `UPDATE users
            SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
        [newHash, userId]
      );

      // Insert notification for cadet
      const notifMessage = 'Your password was changed successfully.';
      const notifLink = '/cadet/profile'; // or wherever you want them to click

      await pool.execute(
        `INSERT INTO notifications
           (regimental_number, type, message, link)
         VALUES (?, 'Password', ?, ?)`,
        [regimental_number, notifMessage, notifLink]
      );

      return res.json({ success: true });
    }

    // ── 2) Handle admin (ANO)
    if (userType === 'admin') {
      const adminId = req.user.id;

      // Fetch existing hash
      const [adminRows] = await pool.execute(
        `SELECT password_hash
           FROM admins
          WHERE id = ?`,
        [adminId]
      );
      if (!adminRows.length) {
        return res.status(404).json({ message: 'Admin not found.' });
      }
      const { password_hash } = adminRows[0];

      // Verify current
      const isMatch = await bcrypt.compare(current_password, password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }

      // Ensure new ≠ current
      const newIsSame = await bcrypt.compare(new_password, password_hash);
      if (newIsSame) {
        return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
      }

      // Hash and update
      const newHash = await bcrypt.hash(new_password, 12);
      await pool.execute(
        `UPDATE admins
            SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
        [newHash, adminId]
      );

      // (Optional) No notification insertion here, since notifications table is keyed by cadet regimental_number

      return res.json({ success: true });
    }

    // ── 3) Handle master
    if (userType === 'master') {
      const masterPhone = req.user.phone;

      // Fetch existing hash
      const [masterRows] = await pool.execute(
        `SELECT password_hash
           FROM masters
          WHERE phone = ?`,
        [masterPhone]
      );
      if (!masterRows.length) {
        return res.status(404).json({ message: 'Master not found.' });
      }
      const { password_hash } = masterRows[0];

      // Verify current
      const isMatch = await bcrypt.compare(current_password, password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }

      // Ensure new ≠ current
      const newIsSame = await bcrypt.compare(new_password, password_hash);
      if (newIsSame) {
        return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
      }

      // Hash and update
      const newHash = await bcrypt.hash(new_password, 12);
      await pool.execute(
        `UPDATE masters
            SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
          WHERE phone = ?`,
        [newHash, masterPhone]
      );

      // (Optional) No notification insertion for masters

      return res.json({ success: true });
    }

    // If userType is something else
    return res.status(403).json({ message: 'Not authorized to change password.' });
  } catch (err) {
    console.error('[Change Password Error]', err);
    return res.status(500).json({ message: 'Server error while changing password.' });
  }
};
