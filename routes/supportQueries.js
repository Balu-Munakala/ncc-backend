// routes/supportQueries.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const supportQueriesController = require('../controllers/supportQueriesController');

// USER endpoints:
// POST   /api/support-queries      → create a new query
// GET    /api/user/support-queries → list own queries
router.post('/', authenticate, supportQueriesController.createQuery);
router.get('/user', authenticate, supportQueriesController.getUserQueries);

// ADMIN endpoints:
// GET    /api/admin/support-queries           → list all queries
// PUT    /api/admin/support-queries/:queryId  → reply (and close) a query
// DELETE /api/admin/support-queries/:queryId  → delete a query
router.get('/admin', authenticate, supportQueriesController.getAllQueries);
router.put('/admin/:queryId', authenticate, supportQueriesController.replyToQuery);
router.delete('/admin/:queryId', authenticate, supportQueriesController.deleteQuery);

module.exports = router;
