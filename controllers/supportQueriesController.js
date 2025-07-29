// controllers/supportQueriesController.js

const pool = require('../config/db');

/**
 * POST /api/support-queries
 * User submits a new support query.
 * Only userType==='user' may call.
 * Body: { message }
 */
exports.createQuery = async (req, res) => {
  if (req.user.userType !== 'user') {
    return res.status(403).json({ msg: 'Only cadets may submit support queries.' });
  }

  const regimental_number = req.user.regimental_number;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ msg: 'Message is required.' });
  }

  try {
    // Insert the new support query
    await pool.execute(
      `INSERT INTO support_queries (regimental_number, message)
       VALUES (?, ?)`,
      [regimental_number, message.trim()]
    );
    return res.json({ msg: 'Query submitted successfully.' });
  } catch (err) {
    console.error('[Create Query Error]', err);
    return res.status(500).json({ msg: 'Database error while creating query.' });
  }
};

/**
 * GET /api/user/support-queries
 * List all queries (with response) for the logged‐in cadet.
 * Only userType==='user' may call.
 */
exports.getUserQueries = async (req, res) => {
  if (req.user.userType !== 'user') {
    return res.status(403).json({ msg: 'Only cadets may view their queries.' });
  }

  const regimental_number = req.user.regimental_number;
  try {
    const [rows] = await pool.execute(
      `SELECT query_id, message, response, status, created_at, updated_at
       FROM support_queries
       WHERE regimental_number = ?
       ORDER BY created_at DESC`,
      [regimental_number]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get User Queries Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching queries.' });
  }
};

/**
 * GET /api/admin/support-queries
 * List all queries from all cadets, in descending order.
 * Only userType==='admin' may call.
 */
exports.getAllQueries = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may view all queries.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT sq.query_id,
              sq.regimental_number,
              u.name AS cadet_name,
              sq.message,
              sq.response,
              sq.status,
              sq.created_at,
              sq.updated_at
         FROM support_queries sq
         JOIN users u ON sq.regimental_number = u.regimental_number
        ORDER BY sq.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get All Queries Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching all queries.' });
  }
};

/**
 * PUT /api/admin/support-queries/:queryId
 * Admin replies to a query (and marks it Closed).
 * Body: { response }
 * Only userType==='admin'.
 * After replying, notify that cadet.
 */
exports.replyToQuery = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may reply to queries.' });
  }

  const queryId = req.params.queryId;
  const { response } = req.body;

  if (!response || !response.trim()) {
    return res.status(400).json({ msg: 'Response text is required.' });
  }

  try {
    // 1) Fetch the regimental_number tied to this query
    const [rows] = await pool.execute(
      `SELECT regimental_number FROM support_queries WHERE query_id = ?`,
      [queryId]
    );
    if (!rows.length) {
      return res.status(404).json({ msg: 'Query not found.' });
    }
    const regimental_number = rows[0].regimental_number;

    // 2) Update the query: set response, status = 'Closed'
    await pool.execute(
      `UPDATE support_queries
         SET response = ?, status = 'Closed', updated_at = CURRENT_TIMESTAMP
       WHERE query_id = ?`,
      [response.trim(), queryId]
    );

    // 3) Insert a notification for that cadet
    const message = `Admin replied to your support query.`;
    const link = `/cadet/support-queries`; // front-end route

    await pool.execute(
      `INSERT INTO notifications (regimental_number, type, message, link)
       VALUES (?, 'SupportQuery', ?, ?)`,
      [regimental_number, message, link]
    );

    return res.json({ msg: 'Response saved and notification sent.' });
  } catch (err) {
    console.error('[Reply To Query Error]', err);
    return res.status(500).json({ msg: 'Database error while updating query.' });
  }
};

/**
 * DELETE /api/admin/support-queries/:queryId
 * Admin deletes a query entirely.
 * Only userType==='admin'.
 */
exports.deleteQuery = async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ msg: 'Only ANOs may delete queries.' });
  }

  const queryId = req.params.queryId;
  try {
    const [result] = await pool.execute(
      `DELETE FROM support_queries WHERE query_id = ?`,
      [queryId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Query not found.' });
    }
    return res.json({ msg: 'Query deleted successfully.' });
  } catch (err) {
    console.error('[Delete Query Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting query.' });
  }
};
