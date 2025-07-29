// backend/routes/master/platformConfig.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const ctrl    = require('../../controllers/masterPlatformConfigController');

// GET all config entries
router.get('/', authenticate, ctrl.getAllConfig);

// POST /api/master/platform-config
router.post('/', authenticate, ctrl.createConfig);

// PUT  /api/master/platform-config/:config_id
router.put('/:config_id', authenticate, ctrl.updateConfig);

// DELETE /api/master/platform-config/:config_id
router.delete('/:config_id', authenticate, ctrl.deleteConfig);

module.exports = router;
