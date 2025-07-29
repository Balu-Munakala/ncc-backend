// backend/routes/master/manageAdmins.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const ctrl    = require('../../controllers/masterManageAdminsController');

// All endpoints here require master‐level access
// (we assume authenticate() puts { userType, phone } or { userType, id, role } into req.user).
// We enforce userType === 'master' inside each controller method.

router.get('/', authenticate, ctrl.getAllAdmins);                // GET  /api/master/manage-admins
router.put('/:ano_id/disable', authenticate, ctrl.disableAdmin); // PUT  /api/master/manage-admins/:ano_id/disable
router.put('/:ano_id/enable', authenticate, ctrl.enableAdmin);   // PUT  /api/master/manage-admins/:ano_id/enable
router.delete('/:ano_id', authenticate, ctrl.deleteAdmin);       // DELETE /api/master/manage-admins/:ano_id

module.exports = router;
