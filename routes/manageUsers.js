// routes/manageUsers.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const manageUsersController = require('../controllers/manageUsersController');

// All routes under /api/admin/manage-users

// GET  /api/admin/manage-users
//      List all cadets under this ANO (pending + approved)
router.get('/', authenticate, manageUsersController.getAllUsers);

// PUT  /api/admin/manage-users/approve/:userId
//      Approve a cadet (set is_approved = 1)
router.put('/approve/:userId', authenticate, manageUsersController.approveUser);

// DELETE /api/admin/manage-users/:userId
//        Reject/Delete a cadet
router.delete('/:userId', authenticate, manageUsersController.deleteUser);

module.exports = router;
