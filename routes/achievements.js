// backend/routes/achievements.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const multerConfig = require('../middleware/multerConfig');
const achievementsController = require('../controllers/achievementsController');

// ─── Admin Endpoints ────────────────────────────────────────────────
// POST   /api/achievements/admin
//        Create a new achievement (image + title + description)
router.post(
  '/admin',
  authenticate,
  multerConfig.single('image'),
  achievementsController.createAchievement
);

// GET    /api/achievements/admin
//        List all achievements for this ANO
router.get(
  '/admin',
  authenticate,
  achievementsController.getAdminAchievements
);

// DELETE /api/achievements/admin/:achievementId
//        Delete an achievement by ID
router.delete(
  '/admin/:achievementId',
  authenticate,
  achievementsController.deleteAchievement
);

// ─── Cadet (User) Endpoint ──────────────────────────────────────────
// GET    /api/achievements
//        List all achievements for the cadet’s ANO
router.get(
  '/',
  authenticate,
  achievementsController.getUserAchievements
);

module.exports = router;
