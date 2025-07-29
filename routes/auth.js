// routes/auth.js
const express           = require('express');
const authController    = require('../controllers/authController');
const { authenticate }  = require('../middleware/authMiddleware');
const router            = express.Router();

// ─── Public routes ──────────────────────────────────────────────────────────
router.post('/register-user',  authController.registerUser);
router.post('/register-admin', authController.registerAdmin);
router.post('/login',          authController.login);
router.post('/logout',         authController.logout);
router.get('/anos',            authController.getAnos);

// ─── Protected route ────────────────────────────────────────────────────────
router.get('/validate-role', authenticate, authController.validateRole);

module.exports = router;
