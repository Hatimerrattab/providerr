const Provider = require('../models/Provider');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');

// @desc    Get provider profile
// @route   GET /api/providers/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.user.id)
    .select('-password -__v -createdAt -passwordChangedAt -idPhoto -selfiePhoto -backgroundCheck -status');
  
  if (!provider) {
    res.status(404);
    throw new Error('Provider not found');
  }

  // Transform data to match frontend expectations
  const profileData = {
    firstName: provider.firstName,
    lastName: provider.lastName,
    email: provider.email,
    phone: provider.phone,
    bio: provider.bio,
    services: provider.services,
    serviceAreas: provider.serviceAreas,
    experience: provider.experience,
    profilePhoto: provider.profilePhoto,
    address: provider.address,
    city: provider.city,
    zip: provider.zip,
    country: provider.country,
    dob: provider.dob
  };

  res.status(200).json(profileData);
});

// @desc    Update provider profile
// @route   PUT /api/providers/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.user.id);

  if (!provider) {
    res.status(404);
    throw new Error('Provider not found');
  }

  const {
    firstName,
    lastName,
    phone,
    bio,
    services,
    serviceAreas,
    experience,
    profilePhoto,
    address,
    city,
    zip,
    country,
    dob
  } = req.body;

  // Update profile fields
  provider.firstName = firstName || provider.firstName;
  provider.lastName = lastName || provider.lastName;
  provider.phone = phone || provider.phone;
  provider.bio = bio || provider.bio;
  provider.services = services || provider.services;
  provider.serviceAreas = serviceAreas || provider.serviceAreas;
  provider.experience = experience || provider.experience;
  provider.profilePhoto = profilePhoto || provider.profilePhoto;
  provider.address = address || provider.address;
  provider.city = city || provider.city;
  provider.zip = zip || provider.zip;
  provider.country = country || provider.country;
  provider.dob = dob || provider.dob;

  const updatedProvider = await provider.save();

  // Return updated profile without sensitive data
  res.status(200).json({
    firstName: updatedProvider.firstName,
    lastName: updatedProvider.lastName,
    email: updatedProvider.email,
    phone: updatedProvider.phone,
    bio: updatedProvider.bio,
    services: updatedProvider.services,
    serviceAreas: updatedProvider.serviceAreas,
    experience: updatedProvider.experience,
    profilePhoto: updatedProvider.profilePhoto,
    address: updatedProvider.address,
    city: updatedProvider.city,
    zip: updatedProvider.zip,
    country: updatedProvider.country,
    dob: updatedProvider.dob
  });
});

module.exports = {
  getProfile,
  updateProfile
};