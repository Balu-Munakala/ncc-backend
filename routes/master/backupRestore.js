// backend/routes/master/backupRestore.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const ctrl    = require('../../controllers/masterBackupRestoreController');

// GET  /api/master/backup-restore/backup
router.get('/backup', authenticate, ctrl.createBackup);

// POST /api/master/backup-restore/restore
router.post('/restore', authenticate, ctrl.restoreFromBackup);

module.exports = router;
