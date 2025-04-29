const express = require('express');
const router = express.Router();
const { 
  clientSignup, 
  login, 
  providerSignup, 
  adminLogin, 
  adminSignup,
  forgotPassword,
  resetPassword
} = require('../controllers/auth');  // <-- now also forgotPassword, resetPassword
const { validateLogin, validateClientSignup, validateProviderSignup } = require('../middleware/validation');

// POST /api/auth/client/signup
router.post('/client/signup', validateClientSignup, clientSignup);

// POST /api/auth/provider/signup
router.post('/provider/signup', validateProviderSignup, providerSignup);

// POST /api/auth/login
router.post('/login', validateLogin, login);

// POST /api/auth/admin/signup
router.post('/admin/signup', adminSignup);

// POST /api/auth/admin/login
router.post('/admin/login', validateLogin, adminLogin);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

module.exports = router;
