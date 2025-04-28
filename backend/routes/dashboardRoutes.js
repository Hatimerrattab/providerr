const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getProviderDashboard } = require('../controllers/dashboardController');

// @route    GET /api/provider/dashboard
// @desc     Get provider dashboard data
// @access   Private
router.get('/dashboard', authMiddleware.protect, getProviderDashboard);

module.exports = router;
