// routes/attendance.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const attendanceController = require('../controllers/attendanceController');

// 1) List all fallins for attendance (admin view)
router.get('/fallins', authenticate, attendanceController.listFallinsForAttendance);

// 2) Given a fallinId, get eligible cadets
router.get('/students/:fallinId',authenticate, attendanceController.getEligibleCadetsForFallin);

// 3) Bulk upsert attendance for a fallin
router.post('/mark/:fallinId', authenticate, attendanceController.markAttendance);

// 4) View attendance for a fallin
router.get('/view/:fallinId', authenticate, attendanceController.viewAttendance);

// 5) GET single attendance record by attendance_id
router.get('/:attendanceId', authenticate, attendanceController.getAttendanceById);

// 6) UPDATE single attendance record by attendance_id
router.put('/:attendanceId', authenticate, attendanceController.updateAttendanceById);

// 7) DELETE single attendance record by attendance_id
router.delete('/:attendanceId', authenticate, attendanceController.deleteAttendanceById);

module.exports = router;
