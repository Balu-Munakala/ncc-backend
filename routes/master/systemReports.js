// backend/routes/master/systemReports.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const ctrl    = require('../../controllers/masterSystemReportsController');

// GET /api/master/system-reports/summary
router.get('/summary', authenticate, ctrl.getSummary);

// GET /api/master/system-reports/attendance-trends
router.get('/attendance-trends', authenticate, ctrl.getAttendanceTrends);

module.exports = router;
