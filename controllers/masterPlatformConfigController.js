// backend/controllers/masterPlatformConfigController.js
const pool = require('../config/db');

/**
 * GET /api/master/platform-config
 * List all key/value pairs. Master only.
 */
exports.getAllConfig = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may view platform configuration.' });
  }
  try {
    const [rows] = await pool.execute(
      `SELECT config_id, cfg_key, cfg_value, description, updated_at
         FROM platform_config
        ORDER BY cfg_key ASC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Get Config Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching config.' });
  }
};

/**
 * POST /api/master/platform-config
 * Body: { cfg_key, cfg_value, description? }
 */
exports.createConfig = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may create configuration.' });
  }
  const { cfg_key, cfg_value, description } = req.body;
  if (!cfg_key || !cfg_value) {
    return res.status(400).json({ msg: 'cfg_key and cfg_value are required.' });
  }
  try {
    await pool.execute(
      `INSERT INTO platform_config (cfg_key, cfg_value, description)
       VALUES (?, ?, ?)`,
      [cfg_key, cfg_value, description || null]
    );
    return res.json({ msg: 'Configuration created.' });
  } catch (err) {
    console.error('[Create Config Error]', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'cfg_key already exists.' });
    }
    return res.status(500).json({ msg: 'Database error while creating config.' });
  }
};

/**
 * PUT /api/master/platform-config/:config_id
 * Body: { cfg_value, description? }
 */
exports.updateConfig = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may update configuration.' });
  }
  const { config_id } = req.params;
  const { cfg_value, description } = req.body;
  if (!cfg_value) {
    return res.status(400).json({ msg: 'cfg_value is required.' });
  }
  try {
    const [result] = await pool.execute(
      `UPDATE platform_config
         SET cfg_value = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE config_id = ?`,
      [cfg_value, description || null, config_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Configuration not found.' });
    }
    return res.json({ msg: 'Configuration updated.' });
  } catch (err) {
    console.error('[Update Config Error]', err);
    return res.status(500).json({ msg: 'Database error while updating config.' });
  }
};

/**
 * DELETE /api/master/platform-config/:config_id
 */
exports.deleteConfig = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may delete configuration.' });
  }
  const { config_id } = req.params;
  try {
    const [result] = await pool.execute(
      `DELETE FROM platform_config WHERE config_id = ?`,
      [config_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Configuration not found.' });
    }
    return res.json({ msg: 'Configuration deleted.' });
  } catch (err) {
    console.error('[Delete Config Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting config.' });
  }
};
