// controllers/adminController.js
const pool = require('../config/db');
const path = require('path');

exports.getProfile = async (req, res) => {
  try {
    const adminId = req.user.id;

    const [rows] = await pool.execute(
      `
      SELECT 
        a.name, 
        a.email, 
        a.contact, 
        a.ano_id, 
        a.role, 
        a.type,
        p.dob, 
        p.address, 
        p.unit_name, 
        p.institution_name, 
        p.profile_pic_path
      FROM admins a
      LEFT JOIN admin_profile p 
        ON a.ano_id = p.ano_id
      WHERE a.id = ?
      `,
      [adminId]
    );

    if (!rows.length) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[Admin Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const [adminRows] = await pool.execute(
      'SELECT ano_id FROM admins WHERE id = ?',
      [adminId]
    );
    if (!adminRows.length) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    const ano_id = adminRows[0].ano_id;
    const { dob, address, role, unit_name, institution_name } = req.body;

    await pool.execute(
      `
      INSERT INTO admin_profile (
        ano_id, 
        dob, 
        address, 
        role, 
        unit_name, 
        institution_name
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        dob = VALUES(dob),
        address = VALUES(address),
        role = VALUES(role),
        unit_name = VALUES(unit_name),
        institution_name = VALUES(institution_name)
      `,
      [ano_id, dob, address, role, unit_name, institution_name]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[Update Admin Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const adminId = req.user.id;
    const [adminRows] = await pool.execute(
      'SELECT ano_id FROM admins WHERE id = ?',
      [adminId]
    );
    if (!adminRows.length) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    const ano_id = adminRows[0].ano_id;
    const filename = req.file.filename;

    await pool.execute(
      'UPDATE admin_profile SET profile_pic_path = ? WHERE ano_id = ?',
      [filename, ano_id]
    );

    res.json({ success: true, filename });
  } catch (err) {
    console.error('[Admin Upload Pic Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getProfilePic = async (req, res) => {
  try {
    const adminId = req.user.id;
    const [picRows] = await pool.execute(
      `
      SELECT profile_pic_path
      FROM admin_profile
      WHERE ano_id = (
        SELECT ano_id 
        FROM admins 
        WHERE id = ?
      )
      `,
      [adminId]
    );

    if (!picRows.length || !picRows[0].profile_pic_path) {
      return res.status(404).send('Not found');
    }

    const filePath = path.resolve(
      __dirname,
      '..',
      'uploads',
      picRows[0].profile_pic_path
    );
    return res.sendFile(filePath);
  } catch (err) {
    console.error('[Serve Admin Pic Error]', err);
    res.status(500).send('Error');
  }
};
