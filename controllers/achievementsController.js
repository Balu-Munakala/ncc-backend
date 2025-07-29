// controllers/achievementsController.js

const pool = require('../config/db');
const path = require('path');

/**
 * POST   /api/admin/achievements
 * Body: (multipart/form-data) → { title, description, image (file) }
 * Only an ANO may create.
 * After creation, notifies all cadets under that ANO.
 */
exports.createAchievement = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may create achievements.' });
  }

  const ano_id = req.user.ano_id;
  const { title, description } = req.body;
  let image_path = null;

  if (!title) {
    return res.status(400).json({ msg: 'Title is required.' });
  }

  if (req.file) {
    image_path = req.file.filename;
  }

  try {
    // 1) Insert into achievements
    const [result] = await pool.execute(
      `INSERT INTO achievements (ano_id, title, description, image_path)
       VALUES (?, ?, ?, ?)`,
      [ano_id, title, description || null, image_path]
    );
    const newAchievementId = result.insertId;

    // 2) Fetch all cadets under this ANO
    const [cadets] = await pool.execute(
      `SELECT regimental_number FROM users WHERE ano_id = ?`,
      [ano_id]
    );

    // 3) Build notification message & link
    const message = `New Achievement: "${title}". Check it out!`;
    const link = `/cadet/achievements`;

    // 4) Bulk‐insert notifications for each cadet
    const insertPromises = cadets.map((c) =>
      pool.execute(
        `INSERT INTO notifications (regimental_number, type, message, link)
         VALUES (?, 'Achievement', ?, ?)`,
        [c.regimental_number, message, link]
      )
    );
    await Promise.all(insertPromises);

    return res.json({
      msg: 'Achievement posted successfully and notifications sent.',
      achievement_id: newAchievementId
    });
  } catch (err) {
    console.error('[Create Achievement Error]', err);
    return res.status(500).json({ msg: 'Database error while creating achievement.' });
  }
};

/**
 * GET    /api/admin/achievements
 * Returns all achievements for logged‐in ANO (descending by created_at).
 */
exports.getAdminAchievements = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may view their achievements.' });
  }

  const ano_id = req.user.ano_id;
  try {
    const [rows] = await pool.execute(
      `SELECT achievement_id, title, description, image_path, created_at
         FROM achievements
        WHERE ano_id = ?
        ORDER BY created_at DESC`,
      [ano_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get Admin Achievements Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching achievements.' });
  }
};

/**
 * GET    /api/achievements
 * Returns all achievements for the cadet’s ANO (descending by created_at).
 * Only a “user” may call.
 */
exports.getUserAchievements = async (req, res) => {
  if (req.user.userType !== 'user') {
    return res.status(403).json({ msg: 'Only cadets may view achievements.' });
  }

  const ano_id = req.user.ano_id;
  try {
    const [rows] = await pool.execute(
      `SELECT achievement_id, title, description, image_path, created_at
         FROM achievements
        WHERE ano_id = ?
        ORDER BY created_at DESC`,
      [ano_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get User Achievements Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching achievements.' });
  }
};

/**
 * DELETE /api/admin/achievements/:achievementId
 * Deletes a single achievement. Only the ANO who posted it may delete.
 * After deletion, notifies all cadets under that ANO.
 */
exports.deleteAchievement = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may delete achievements.' });
  }

  const ano_id = req.user.ano_id;
  const achievementId = req.params.achievementId;

  try {
    // 1) Verify that this achievement belongs to this ANO & fetch its title
    const [rows] = await pool.execute(
      `SELECT title, image_path
         FROM achievements
        WHERE achievement_id = ?
          AND ano_id = ?`,
      [achievementId, ano_id]
    );
    if (!rows.length) {
      return res.status(404).json({ msg: 'Achievement not found or not under your ANO.' });
    }

    const { title, image_path } = rows[0];

    // 2) Delete the database row
    await pool.execute(
      `DELETE FROM achievements
        WHERE achievement_id = ?`,
      [achievementId]
    );

    // 3) Optionally remove the associated image file
    if (image_path) {
      const filePath = path.join(__dirname, '..', 'uploads', image_path);
      const fs = require('fs');
      fs.unlink(filePath, (err) => {
        if (err) {
          console.warn(`[Delete Achievement] Could not remove file ${filePath}:`, err.message);
        }
      });
    }

    // 4) Fetch all cadets under this ANO
    const [cadets] = await pool.execute(
      `SELECT regimental_number FROM users WHERE ano_id = ?`,
      [ano_id]
    );

    // 5) Build notification message & link
    const message = `Achievement removed: "${title}".`;
    const link = `/cadet/achievements`;

    // 6) Bulk‐insert notifications for each cadet
    const insertPromises = cadets.map((c) =>
      pool.execute(
        `INSERT INTO notifications (regimental_number, type, message, link)
         VALUES (?, 'Achievement', ?, ?)`,
        [c.regimental_number, message, link]
      )
    );
    await Promise.all(insertPromises);

    return res.json({ msg: 'Achievement deleted and notifications sent.' });
  } catch (err) {
    console.error('[Delete Achievement Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting achievement.' });
  }
};
