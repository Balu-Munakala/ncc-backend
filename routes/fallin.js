// routes/fallin.js
const express           = require('express');
const router            = express.Router();
const { authenticate }  = require('../middleware/authMiddleware');
const fallinController  = require('../controllers/fallinController');

// All routes here require authentication; the controller methods will also check userType.

// 1) Create a new fallin (admin only)
router.post('/', authenticate, fallinController.createFallin);

// 2) List all fallins visible to this user (admin or cadet)
router.get('/', authenticate, fallinController.listFallins);

// 3) Get all faalin details for a cadet (userType === 'user')
router.get('/userfallin', authenticate, fallinController.getUserFallins);

// 4) Get a single fallin by ID (must belong to this user's ano_id)
router.get('/:id', authenticate, fallinController.getFallinById);

// 5) Update a fallin (admin only, and must be theirs)
router.put('/:id', authenticate, fallinController.updateFallin);

// 6) Delete a fallin (admin only, and must be theirs)
router.delete('/:id', authenticate, fallinController.deleteFallin);

module.exports = router;
