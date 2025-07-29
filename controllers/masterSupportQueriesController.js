// backend/controllers/masterSupportQueriesController.js
const pool = require('../config/db');

/**
 * GET /api/master/support-queries
 * Return all support queries (joined with cadet name). Master only.
 */
exports.getAllSupportQueries = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may view support queries.' });
  }
  try {
    const [rows] = await pool.execute(
      `SELECT 
         sq.query_id,
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
    console.error('[Get All Support Queries Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching support queries.' });
  }
};

/**
 * DELETE /api/master/support-queries/:query_id
 * Delete a query entirely. Master only.
 */
exports.deleteQuery = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may delete support queries.' });
  }
  const { query_id } = req.params;
  try {
    const [result] = await pool.execute(
      `DELETE FROM support_queries WHERE query_id = ?`,
      [query_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Query not found.' });
    }
    return res.json({ msg: 'Support query deleted.' });
  } catch (err) {
    console.error('[Delete Support Query Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting query.' });
  }
};
