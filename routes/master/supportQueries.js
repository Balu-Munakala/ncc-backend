// backend/routes/master/supportQueries.js
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const ctrl    = require('../../controllers/masterSupportQueriesController');

// GET /api/master/support-queries
router.get('/', authenticate, ctrl.getAllSupportQueries);

// (We assume only admin replies; master can only view / delete)
router.delete('/:query_id', authenticate, ctrl.deleteQuery);

module.exports = router;
