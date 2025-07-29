// controllers/fallinController.js

const pool = require('../config/db');

/**
 * Return all fallins belonging to the cadet’s ANO.
 * Only cadets (userType === 'user') may call this.
 */
exports.getUserFallins = async (req, res) => {
  if (req.user.userType !== 'user') {
    return res.status(403).json({ msg: 'Only cadets may view these fallins.' });
  }

  const ano_id = req.user.ano_id;

  try {
    const [rows] = await pool.execute(
      `SELECT fallin_id, date, time, location, dress_code, instructions, activity_details
         FROM fallin
        WHERE ano_id = ?
        ORDER BY date DESC, time DESC`,
      [ano_id]
    );

    return res.json(rows);
  } catch (err) {
    console.error('[Get User Fallins Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching fallins.' });
  }
};

/**
 * CREATE a new fallin.
 * Only an 'admin' (ANO) may post a fallin.
 * This automatically uses req.user.ano_id as the foreign key.
 * After creating, notify all cadets under this ANO.
 */
exports.createFallin = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may create fallins.' });
  }

  const { date, time, type, location, dress_code, instructions, activity_details } = req.body;
  const ano_id = req.user.ano_id; // pulled from JWT

  if (!date || !time || !dress_code) {
    return res.status(400).json({ msg: 'Missing required fields: date, time, or dress_code.' });
  }

  try {
    // 1) Insert into fallin table
    const [result] = await pool.execute(
      `INSERT INTO fallin
         (date, time, type, ano_id, location, dress_code, instructions, activity_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [date, time, type || 'Afternoon', ano_id, location || null, dress_code, instructions || null, activity_details || null]
    );
    const newFallinId = result.insertId;

    // 2) Fetch all cadets under this ANO
    const [cadets] = await pool.execute(
      `SELECT regimental_number FROM users WHERE ano_id = ?`,
      [ano_id]
    );

    // 3) Build a notification message and link
    const formattedDate = new Date(date).toLocaleDateString();
    const message = `New Fall-In posted on ${formattedDate} @ ${time} @ ${location || '—'}.`;
    const link = `/cadet/fallin`;

    // 4) Bulk‐insert notifications for each cadet
    const insertPromises = cadets.map((c) =>
      pool.execute(
        `INSERT INTO notifications (regimental_number, type, message, link)
         VALUES (?, 'Fallin', ?, ?)`,
        [c.regimental_number, message, link]
      )
    );
    await Promise.all(insertPromises);

    return res.status(201).json({ msg: 'Fallin created and notifications sent.', fallin_id: newFallinId });
  } catch (err) {
    console.error('[Create Fallin Error]', err);
    return res.status(500).json({ msg: 'Database error while creating fallin.' });
  }
};

/**
 * GET all fallins visible to the current user.
 * - If userType === 'admin', return only fallins whose ano_id matches req.user.ano_id.
 * - If userType === 'user' (cadet), return only fallins whose ano_id matches req.user.ano_id.
 * - Masters are not allowed to view fallins; return 403.
 */
exports.listFallins = async (req, res) => {
  const { userType, ano_id } = req.user;

  if (userType !== 'admin' && userType !== 'user') {
    return res.status(403).json({ msg: 'Only cadets or ANOs may view fallins.' });
  }

  try {
    // Both cadets and their ANO view the same set: filtering by ano_id
    const [rows] = await pool.execute(
      `SELECT fallin_id, date, time, type, location, dress_code, instructions, activity_details, created_at, updated_at
         FROM fallin
        WHERE ano_id = ?
        ORDER BY date DESC, time DESC`,
      [ano_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[List Fallins Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching fallins.' });
  }
};

/**
 * GET one fallin by ID.
 * Only if it belongs to the current user's ano_id.
 */
exports.getFallinById = async (req, res) => {
  const fallinId = req.params.id;
  const { userType, ano_id } = req.user;

  if (userType !== 'admin' && userType !== 'user') {
    return res.status(403).json({ msg: 'Only cadets or ANOs may view fallins.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT fallin_id, date, time, type, location, dress_code, instructions, activity_details, created_at, updated_at
         FROM fallin
        WHERE fallin_id = ? AND ano_id = ?`,
      [fallinId, ano_id]
    );

    if (!rows.length) {
      return res.status(404).json({ msg: 'Fallin not found or not authorized.' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('[Get Fallin Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching fallin.' });
  }
};

/**
 * UPDATE an existing fallin.
 * Only the ANO (admin) who created that fallin may update it.
 * After updating, send notifications to all cadets under this ANO.
 */
exports.updateFallin = async (req, res) => {
  const fallinId = req.params.id;
  const { userType, ano_id } = req.user;

  if (userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs can update fallins.' });
  }

  const { date, time, type, location, dress_code, instructions, activity_details } = req.body;
  if (!date || !time || !dress_code) {
    return res.status(400).json({ msg: 'Missing required fields: date, time, or dress_code.' });
  }

  try {
    // 1) Verify this fallin belongs to this ANO
    const [checkRows] = await pool.execute(
      `SELECT ano_id FROM fallin WHERE fallin_id = ?`,
      [fallinId]
    );
    if (!checkRows.length || checkRows[0].ano_id !== ano_id) {
      return res.status(403).json({ msg: 'You are not authorized to update this fallin.' });
    }

    // 2) Perform the update
    const [result] = await pool.execute(
      `UPDATE fallin
          SET date = ?, time = ?, type = ?, location = ?, dress_code = ?, instructions = ?, activity_details = ?
        WHERE fallin_id = ?`,
      [date, time, type || 'Afternoon', location || null, dress_code, instructions || null, activity_details || null, fallinId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Fallin not found.' });
    }

    // 3) Fetch all cadets under this ANO
    const [cadets] = await pool.execute(
      `SELECT regimental_number FROM users WHERE ano_id = ?`,
      [ano_id]
    );

    // 4) Build notification message and link
    const formattedDate = new Date(date).toLocaleDateString();
    const message = `Fall-In updated: ${formattedDate} @ ${time} @ ${location || '—'}.`;
    const link = `/cadet/fallin`;

    // 5) Bulk‐insert notifications for each cadet
    const insertPromises = cadets.map((c) =>
      pool.execute(
        `INSERT INTO notifications (regimental_number, type, message, link)
         VALUES (?, 'Fallin', ?, ?)`,
        [c.regimental_number, message, link]
      )
    );
    await Promise.all(insertPromises);

    return res.json({ msg: 'Fallin updated and notifications sent.' });
  } catch (err) {
    console.error('[Update Fallin Error]', err);
    return res.status(500).json({ msg: 'Database error while updating fallin.' });
  }
};

/**
 * DELETE a fallin by ID.
 * Only the ANO (admin) who created it may delete it.
 * After deleting, notify all cadets under this ANO.
 */
exports.deleteFallin = async (req, res) => {
  const fallinId = req.params.id;
  const { userType, ano_id } = req.user;

  if (userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs can delete fallins.' });
  }

  try {
    // 1) Verify ownership and fetch the fallen record’s date/time/location for message
    const [checkRows] = await pool.execute(
      `SELECT date, time, location, ano_id FROM fallin WHERE fallin_id = ?`,
      [fallinId]
    );
    if (!checkRows.length || checkRows[0].ano_id !== ano_id) {
      return res.status(403).json({ msg: 'You are not authorized to delete this fallin.' });
    }
    const { date, time, location } = checkRows[0];

    // 2) Delete the fallin
    const [result] = await pool.execute(
      `DELETE FROM fallin WHERE fallin_id = ?`,
      [fallinId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Fallin not found.' });
    }

    // 3) Fetch all cadets under this ANO
    const [cadets] = await pool.execute(
      `SELECT regimental_number FROM users WHERE ano_id = ?`,
      [ano_id]
    );

    // 4) Build notification message and link
    const formattedDate = new Date(date).toLocaleDateString();
    const message = `Fall-In removed: ${formattedDate} @ ${time} @ ${location || '—'}.`;
    const link = `/cadet/fallin`;

    // 5) Bulk‐insert notifications for each cadet
    const insertPromises = cadets.map((c) =>
      pool.execute(
        `INSERT INTO notifications (regimental_number, type, message, link)
         VALUES (?, 'Fallin', ?, ?)`,
        [c.regimental_number, message, link]
      )
    );
    await Promise.all(insertPromises);

    return res.json({ msg: 'Fallin deleted and notifications sent.' });
  } catch (err) {
    console.error('[Delete Fallin Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting fallin.' });
  }
};
