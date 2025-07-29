// backend/routes/events.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const eventsController = require('../controllers/eventsController');

// ─── Admin (ANO) Endpoints ────────────────────────────────────
// GET    /api/events/admin
//         List all events for this ANO
router.get('/admin', authenticate, eventsController.getAdminEvents);

// POST   /api/events/admin
//         Create a new event
router.post('/admin', authenticate, eventsController.createEvent);

// PUT    /api/events/admin/:eventId
//         Update an existing event
router.put('/admin/:eventId', authenticate, eventsController.updateEvent);

// DELETE /api/events/admin/:eventId
//         Delete an event
router.delete('/admin/:eventId', authenticate, eventsController.deleteEvent);

// ─── Cadet (User) Endpoint ──────────────────────────────────
// GET    /api/events
//         List all events for this cadet’s ANO
router.get('/', authenticate, eventsController.getUserEvents);

module.exports = router;
