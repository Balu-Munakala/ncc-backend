// backend/routes/master/systemLogs.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const ctrl    = require('../../controllers/masterSystemLogsController');

// GET /api/master/system-logs
router.get('/', authenticate, ctrl.getAllLogs);
// (Optionally, add DELETE or filter endpoints here)

module.exports = router;
