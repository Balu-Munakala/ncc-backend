// backend/routes/master/globalSearch.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const ctrl    = require('../../controllers/masterGlobalSearchController');

// GET /api/master/global-search?q=anything
router.get('/', authenticate, ctrl.searchAll);

module.exports = router;
