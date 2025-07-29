// controllers/eventsController.js

const pool = require('../config/db');

/**
 * GET /api/admin/events
 * Return all events for the logged-in ANO, sorted newest first.
 */
exports.getAdminEvents = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may view their events.' });
  }
  const ano_id = req.user.ano_id;
  try {
    const [rows] = await pool.execute(
      `SELECT 
         event_id,
         event_date,
         fallin_time,
         dress_code,
         location,
         instructions,
         created_at
       FROM events
       WHERE ano_id = ?
       ORDER BY event_date DESC, fallin_time DESC`,
      [ano_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get Admin Events Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching events.' });
  }
};

/**
 * POST /api/admin/events
 * Body: { event_date (YYYY-MM-DD), fallin_time (HH:MM:SS), dress_code, location, instructions }
 * Creates a new event under this ANO.
 * After creation, notifies all cadets under that ANO.
 */
exports.createEvent = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may create events.' });
  }
  const ano_id = req.user.ano_id;
  const { event_date, fallin_time, dress_code, location, instructions } = req.body;

  if (!event_date || !fallin_time || !dress_code || !location || !instructions) {
    return res.status(400).json({ msg: 'All fields are required.' });
  }

  try {
    // 1) Insert into events table
    const [result] = await pool.execute(
      `INSERT INTO events
         (ano_id, event_date, fallin_time, dress_code, location, instructions)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ano_id, event_date, fallin_time, dress_code, location, instructions]
    );
    const newEventId = result.insertId;

    // 2) Fetch all cadets under this ANO
    const [cadets] = await pool.execute(
      `SELECT regimental_number FROM users WHERE ano_id = ?`,
      [ano_id]
    );

    // 3) Build notification message & link
    const formattedDate = new Date(event_date).toLocaleDateString();
    const message = `New Event: "${location}" on ${formattedDate} at ${fallin_time}.`;
    const link = `/cadet/events`;

    // 4) Bulk‐insert notifications for each cadet
    const insertPromises = cadets.map((c) =>
      pool.execute(
        `INSERT INTO notifications (regimental_number, type, message, link)
         VALUES (?, 'Event', ?, ?)`,
        [c.regimental_number, message, link]
      )
    );
    await Promise.all(insertPromises);

    return res.json({ msg: 'Event created and notifications sent.', event_id: newEventId });
  } catch (err) {
    console.error('[Create Event Error]', err);
    return res.status(500).json({ msg: 'Database error while creating event.' });
  }
};

/**
 * PUT /api/admin/events/:eventId
 * Body: { event_date, fallin_time, dress_code, location, instructions }
 * Updates a single event, if it belongs to this ANO.
 * After updating, notifies all cadets under that ANO.
 */
exports.updateEvent = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may update events.' });
  }
  const ano_id = req.user.ano_id;
  const eventId = req.params.eventId;
  const { event_date, fallin_time, dress_code, location, instructions } = req.body;

  if (!event_date || !fallin_time || !dress_code || !location || !instructions) {
    return res.status(400).json({ msg: 'All fields are required.' });
  }

  try {
    // 1) Verify ownership
    const [rows] = await pool.execute(
      `SELECT event_id FROM events WHERE event_id = ? AND ano_id = ?`,
      [eventId, ano_id]
    );
    if (!rows.length) {
      return res.status(404).json({ msg: 'Event not found or unauthorized.' });
    }

    // 2) Update the event
    await pool.execute(
      `UPDATE events
         SET event_date = ?,
             fallin_time = ?,
             dress_code = ?,
             location = ?,
             instructions = ?,
             updated_at = CURRENT_TIMESTAMP
       WHERE event_id = ?`,
      [event_date, fallin_time, dress_code, location, instructions, eventId]
    );

    // 3) Fetch all cadets under this ANO
    const [cadets] = await pool.execute(
      `SELECT regimental_number FROM users WHERE ano_id = ?`,
      [ano_id]
    );

    // 4) Build notification message & link
    const formattedDate = new Date(event_date).toLocaleDateString();
    const message = `Event updated: "${location}" on ${formattedDate} at ${fallin_time}.`;
    const link = `/cadet/events`;

    // 5) Bulk‐insert notifications for each cadet
    const insertPromises = cadets.map((c) =>
      pool.execute(
        `INSERT INTO notifications (regimental_number, type, message, link)
         VALUES (?, 'Event', ?, ?)`,
        [c.regimental_number, message, link]
      )
    );
    await Promise.all(insertPromises);

    return res.json({ msg: 'Event updated and notifications sent.' });
  } catch (err) {
    console.error('[Update Event Error]', err);
    return res.status(500).json({ msg: 'Database error while updating event.' });
  }
};

/**
 * DELETE /api/admin/events/:eventId
 * Deletes a single event if it belongs to this ANO.
 * After deletion, notifies all cadets under that ANO.
 */
exports.deleteEvent = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may delete events.' });
  }
  const ano_id = req.user.ano_id;
  const eventId = req.params.eventId;

  try {
    // 1) Verify ownership and fetch event_date/fallin_time/location
    const [rows] = await pool.execute(
      `SELECT event_date, fallin_time, location 
         FROM events 
        WHERE event_id = ? 
          AND ano_id = ?`,
      [eventId, ano_id]
    );
    if (!rows.length) {
      return res.status(404).json({ msg: 'Event not found or unauthorized.' });
    }
    const { event_date, fallin_time, location } = rows[0];

    // 2) Delete the event
    await pool.execute(
      `DELETE FROM events WHERE event_id = ?`,
      [eventId]
    );

    // 3) Fetch all cadets under this ANO
    const [cadets] = await pool.execute(
      `SELECT regimental_number FROM users WHERE ano_id = ?`,
      [ano_id]
    );

    // 4) Build notification message & link
    const formattedDate = new Date(event_date).toLocaleDateString();
    const message = `Event removed: "${location}" on ${formattedDate} at ${fallin_time}.`;
    const link = `/cadet/events`;

    // 5) Bulk‐insert notifications for each cadet
    const insertPromises = cadets.map((c) =>
      pool.execute(
        `INSERT INTO notifications (regimental_number, type, message, link)
         VALUES (?, 'Event', ?, ?)`,
        [c.regimental_number, message, link]
      )
    );
    await Promise.all(insertPromises);

    return res.json({ msg: 'Event deleted and notifications sent.' });
  } catch (err) {
    console.error('[Delete Event Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting event.' });
  }
};

/**
 * GET /api/events
 * Returns all events for a cadet’s ANO (logged-in userType === 'user'), sorted newest first.
 */
exports.getUserEvents = async (req, res) => {
  if (req.user.userType !== 'user') {
    return res.status(403).json({ msg: 'Only cadets may view events.' });
  }
  const ano_id = req.user.ano_id;
  try {
    const [rows] = await pool.execute(
      `SELECT 
         event_id,
         event_date,
         fallin_time,
         dress_code,
         location,
         instructions,
         created_at
       FROM events
       WHERE ano_id = ?
       ORDER BY event_date DESC, fallin_time DESC`,
      [ano_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get User Events Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching events.' });
  }
};
