// backend/routes/master/manageUsers.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const ctrl    = require('../../controllers/masterManageUsersController');

// GET all cadets in the system
router.get('/', authenticate, ctrl.getAllCadets);

// PUT /api/master/manage-users/:regimental_number/enable
router.put('/:regimental_number/enable', authenticate, ctrl.enableCadet);

// PUT /api/master/manage-users/:regimental_number/disable
router.put('/:regimental_number/disable', authenticate, ctrl.disableCadet);

// DELETE /api/master/manage-users/:regimental_number
router.delete('/:regimental_number', authenticate, ctrl.deleteCadet);

module.exports = router;
