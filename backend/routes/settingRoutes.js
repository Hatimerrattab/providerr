const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, sensitiveOperationLimiter } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getSettings);
router.put('/', protect, sensitiveOperationLimiter, updateSettings); 

module.exports = router;
