const Provider = require('../models/Provider');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Configure upload directory
const UPLOAD_DIR = path.join(__dirname, '../uploads/providers');
fs.ensureDirSync(UPLOAD_DIR);

// Helper function to process and save images
const processImage = async (fileBuffer, prefix, providerId) => {
  const filename = `${prefix}-${providerId}-${Date.now()}.webp`;
  const filepath = path.join(UPLOAD_DIR, filename);
  
  await sharp(fileBuffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filepath);
  
  return `/uploads/providers/${filename}`;
};

exports.registerProvider = async (req, res) => {
  try {
    // 1. Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'password', 
      'phone', 'dob', 'address', 'city', 'zip',
      'services', 'experience', 'availability', 
      'serviceAreas', 'bio', 'terms'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missing: missingFields
      });
    }

    // 2. Check if provider already exists
    const existingProvider = await Provider.findOne({ email: req.body.email });
    if (existingProvider) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // 3. Create provider first to get ID for filenames
    const provider = new Provider({
      ...req.body,
      services: JSON.parse(req.body.services),
      serviceAreas: JSON.parse(req.body.serviceAreas),
      verificationToken: crypto.randomBytes(32).toString('hex'),
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    // 4. Process and save files
    const [idPhoto, selfiePhoto, profilePhoto] = await Promise.all([
      processImage(req.files.idPhoto[0].buffer, 'id', provider._id),
      processImage(req.files.selfiePhoto[0].buffer, 'selfie', provider._id),
      processImage(req.files.profilePhoto[0].buffer, 'profile', provider._id)
    ]);

    // 5. Update provider with file paths
    provider.idPhoto = idPhoto;
    provider.selfiePhoto = selfiePhoto;
    provider.profilePhoto = profilePhoto;

    // 6. Hash password and save provider
    await provider.save();

    // 7. Generate JWT token
    const token = jwt.sign(
      { id: provider._id, role: 'provider' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 8. Send response
    res.status(201).json({
      success: true,
      token,
      provider: {
        id: provider._id,
        fullName: provider.fullName,
        email: provider.email,
        status: provider.status,
        profilePhoto: provider.profilePhoto
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};