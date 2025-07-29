// routes/adminReports.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const adminReportsController = require('../controllers/adminReportsController');

// GET /api/admin/reports/users
router.get('/users', authenticate, adminReportsController.getUserCounts);

// GET /api/admin/reports/events-count
router.get('/events-count', authenticate, adminReportsController.getEventsCount);

// GET /api/admin/reports/attendance-summary
router.get('/attendance-summary', authenticate, adminReportsController.getAttendanceSummary);

// GET /api/admin/reports/attendance-details
router.get('/attendance-details', authenticate, adminReportsController.getAttendanceDetails);

module.exports = router;
