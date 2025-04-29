const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

// Get profile route
router.get('/', protect, getProfile);

// Update profile route
router.put('/', protect, updateProfile);

module.exports = router;
