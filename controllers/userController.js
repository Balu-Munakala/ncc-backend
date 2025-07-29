// controllers/userController.js
const pool = require('../config/db');
const path = require('path');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      `
      SELECT 
        u.name, 
        u.email, 
        u.contact, 
        u.regimental_number,
        p.dob, 
        p.age, 
        p.mother_name, 
        p.father_name, 
        p.parent_phone,
        p.parent_email, 
        p.address, 
        p.wing, 
        p.category,
        u.ano_id,
        a.name AS ano_name, 
        a.type,
        p.current_year, 
        p.institution_name,
        p.studying, 
        p.year_class, 
        p.profile_pic_path
      FROM users u
      LEFT JOIN users_profile p 
        ON u.regimental_number = p.regimental_number
      LEFT JOIN admins a 
        ON u.ano_id = a.ano_id
      WHERE u.id = ?
      `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[User Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [userRows] = await pool.execute(
      'SELECT regimental_number FROM users WHERE id = ?',
      [userId]
    );
    if (!userRows.length) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const regimental_number = userRows[0].regimental_number;
    const {
      dob,
      age,
      mother_name,
      father_name,
      parent_phone,
      parent_email,
      address,
      wing,
      category,
      current_year,
      institution_name,
      studying,
      year_class
    } = req.body;

    await pool.execute(
      `
      INSERT INTO users_profile (
        regimental_number, 
        dob, 
        age, 
        mother_name, 
        father_name, 
        parent_phone,
        parent_email, 
        address, 
        wing, 
        category,
        current_year, 
        institution_name, 
        studying, 
        year_class
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        dob = VALUES(dob),
        age = VALUES(age),
        mother_name = VALUES(mother_name),
        father_name = VALUES(father_name),
        parent_phone = VALUES(parent_phone),
        parent_email = VALUES(parent_email),
        address = VALUES(address),
        wing = VALUES(wing),
        category = VALUES(category),
        current_year = VALUES(current_year),
        institution_name = VALUES(institution_name),
        studying = VALUES(studying),
        year_class = VALUES(year_class)
      `,
      [
        regimental_number,
        dob,
        age,
        mother_name,
        father_name,
        parent_phone,
        parent_email,
        address,
        wing,
        category,
        current_year,
        institution_name,
        studying,
        year_class
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[Update Profile Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const userId = req.user.id;
    const [userRows] = await pool.execute(
      'SELECT regimental_number FROM users WHERE id = ?',
      [userId]
    );
    if (!userRows.length) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const regimental_number = userRows[0].regimental_number;
    const filename = req.file.filename;

    await pool.execute(
      `
      UPDATE users_profile
      SET profile_pic_path = ?
      WHERE regimental_number = ?
      `,
      [filename, regimental_number]
    );

    res.json({ success: true, filename });
  } catch (err) {
    console.error('[Upload Profile Pic Error]', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getProfilePic = async (req, res) => {
  try {
    const userId = req.user.id;
    const [picRows] = await pool.execute(
      `
      SELECT profile_pic_path
      FROM users_profile
      WHERE regimental_number = (
        SELECT regimental_number 
        FROM users 
        WHERE id = ?
      )
      `,
      [userId]
    );

    if (!picRows.length || !picRows[0].profile_pic_path) {
      return res.status(404).send('Profile picture not found');
    }

    const filePath = path.resolve(
      __dirname,
      '..',
      'uploads',
      picRows[0].profile_pic_path
    );
    return res.sendFile(filePath);
  } catch (err) {
    console.error('[Serve Profile Pic Error]', err);
    res.status(500).send('Error');
  }
};
