const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const Provider = require('../models/Provider');
const Admin = require('../models/Admin');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


// Function to generate JWT token
const generateAuthToken = (user, role) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: role },
    process.env.JWT_SECRET, // Ensure JWT_SECRET is set in your .env
    { expiresIn: '1h' }
  );
};

// Function to create authentication response
const createAuthResponse = (user, role) => {
  return {
    success: true,
    token: generateAuthToken(user, role),
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName || '',
      role: role,
      phoneNumber: user.phoneNumber || '',
    }
  };
};

// Client Signup
exports.clientSignup = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'Email already in use' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: 'client' // Explicitly set role
    });

    res.status(201).json(createAuthResponse(user, 'client'));

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message || 'Client registration failed' 
    });
  }
};

// General Login for client, provider, and admin
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email }) || 
               await Provider.findOne({ email }) || 
               await Admin.findOne({ email });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    let role;
    if (user instanceof User) role = 'client';
    if (user instanceof Provider) role = 'provider';
    if (user instanceof Admin) role = 'admin';

    const token = generateAuthToken(user, role);
    const userData = {
      id: user._id,
      email: user.email,
      role: role
    };

    res.status(200).json({
      success: true,
      token: token,
      user: userData
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed' 
    });
  }
};

exports.providerSignup = async (req, res) => {
  try {
    const providerRoutes = require('./routes/provider');
    return providerRoutes._router.handle(req, res);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Provider registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin Signup
exports.adminSignup = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;

    // Check if the admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: 'admin',
      isVerified: true, // Admins are typically verified by default
    });

    res.status(201).json(createAuthResponse(admin, 'admin'));

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Admin registration failed'
    });
  }
};

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid admin credentials' 
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid admin credentials' 
      });
    }

    res.status(200).json(createAuthResponse(admin, 'admin'));

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Admin login failed' 
    });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;


  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log("Generated reset token hash for user:", hashedToken);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const resetUrl = `http://localhost:5173/auth/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports like 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h3>Hello ${user.fullName || ''},</h3>
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset it:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p><strong>This link will expire in 15 minutes.</strong></p>
      `
    });

    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Email could not be sent. Try again later.' });
  }
};

exports.resetPassword = async (req, res) => {

  const { token, password } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
    });

    if (!user) {
      console.log(`Token is invalid or expired: ${token}`);
      return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    console.log(`Password reset successful for user: ${user.email}`);

    return res.status(200).json({ success: true, message: 'Password reset successful. You can now log in.' });

  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password. Please try again.' });
  }
};

