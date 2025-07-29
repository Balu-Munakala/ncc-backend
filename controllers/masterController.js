// controllers/masterController.js
const pool = require('../config/db');
const path = require('path');

exports.getProfile = async (req, res) => {
  try {
    const phone = req.user.phone;
    const [rows] = await pool.execute(
      `
      SELECT 
        m.name, 
        m.email, 
        m.phone, 
        p.address, 
        p.profile_pic_path
      FROM masters m
      LEFT JOIN master_profile p 
        ON m.phone = p.phone
      WHERE m.phone = ?
      `,
      [phone]
    );
    if (!rows.length) {
      return res.status(404).json({ msg: 'Master not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[Master Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const phone = req.user.phone;
    const { address } = req.body;

    await pool.execute(
      `
      INSERT INTO master_profile (phone, address)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        address = VALUES(address)
      `,
      [phone, address]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[Update Master Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const phone = req.user.phone;
    const filename = req.file.filename;

    await pool.execute(
      `
      UPDATE master_profile
      SET profile_pic_path = ?
      WHERE phone = ?
      `,
      [filename, phone]
    );

    res.json({ success: true, filename });
  } catch (err) {
    console.error('[Upload Master Pic Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getProfilePic = async (req, res) => {
  try {
    const phone = req.user.phone;
    const [rows] = await pool.execute(
      `
      SELECT profile_pic_path
      FROM master_profile
      WHERE phone = ?
      `,
      [phone]
    );

    if (!rows.length || !rows[0].profile_pic_path) {
      return res.status(404).send('No profile picture');
    }

    const filePath = path.resolve(
      __dirname,
      '..',
      'uploads',
      rows[0].profile_pic_path
    );
    res.sendFile(filePath);
  } catch (err) {
    console.error('[Serve Master Pic Error]', err);
    res.status(500).send('Error');
  }
};
