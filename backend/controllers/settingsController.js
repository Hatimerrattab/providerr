const Provider = require('../models/Provider');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const rateLimit = require('express-rate-limit');

// Rate limiting for sensitive operations
const sensitiveOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many attempts, please try again later'
});

// Helper function to validate service areas
const validateServiceAreas = (serviceAreas) => {
  if (!Array.isArray(serviceAreas)) {
    throw new Error('Service areas must be an array');
  }
  return serviceAreas.map(item => {
    const area = typeof item === 'object' ? item.area : item;
    if (!area || typeof area !== 'string' || area.trim().length === 0) {
      throw new Error('Invalid service area format');
    }
    return area.trim();
  });
};

// Helper function to validate work hours
const validateWorkHours = (workHours) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const isValidTime = (time) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);

  const validatedHours = {};
  
  for (const day of days) {
    if (workHours[day]) {
      if (typeof workHours[day].available !== 'boolean') {
        throw new Error(`Invalid availability for ${day}`);
      }
      
      validatedHours[day] = { available: workHours[day].available };
      
      if (workHours[day].available) {
        if (!isValidTime(workHours[day].start) || !isValidTime(workHours[day].end)) {
          throw new Error(`Invalid time format for ${day}`);
        }
        validatedHours[day].start = workHours[day].start;
        validatedHours[day].end = workHours[day].end;
      } else {
        validatedHours[day].start = '';
        validatedHours[day].end = '';
      }
    } else {
      validatedHours[day] = { 
        available: false,
        start: '',
        end: '' 
      };
    }
  }
  
  return validatedHours;
};

// @desc    Get provider settings
// @route   GET /api/providers/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
  try {
    const provider = await Provider.findById(req.user.id)
      .select('-password -__v -createdAt -passwordChangedAt -idPhoto -selfiePhoto -backgroundCheck -status');
    
    if (!provider) {
      res.status(404);
      throw new Error('Provider not found');
    }

    // Transform data to match frontend expectations
    const settingsData = {
      profileImage: provider.profilePhoto || '',
      firstName: provider.firstName || '',
      lastName: provider.lastName || '',
      nickName: provider.nickName || '',
      country: provider.country || 'United States',
      phone: provider.phone || '',
      email: provider.email || '',
      birthDate: provider.dob ? new Date(provider.dob).toISOString().split('T')[0] : '',
      description: provider.bio || '',
      additionalEmails: provider.additionalEmails || [],
      serviceAreas: (provider.serviceAreas || []).map(area => ({
        id: area && area._id ? area._id.toString() : Date.now().toString(),
        area: area && typeof area === 'object' && area.area ? area.area : (area || ''),
        radius: '10 miles'
      })),
      emailNotifications: provider.notifications?.email !== undefined ? provider.notifications.email : true,
      smsNotifications: provider.notifications?.sms !== undefined ? provider.notifications.sms : false,
      bookingAlerts: provider.notifications?.bookingAlerts !== undefined ? provider.notifications.bookingAlerts : true,
      promotionAlerts: provider.notifications?.promotionAlerts !== undefined ? provider.notifications.promotionAlerts : true,
      workHours: provider.workHours || {
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '17:00', available: true },
        saturday: { start: '10:00', end: '15:00', available: false },
        sunday: { start: '', end: '', available: false }
      }
    };

    res.status(200).json(settingsData);
  } catch (error) {
    console.error('Error getting provider settings:', error);
    res.status(500).json({ message: 'Server error while fetching settings' });
  }
});

// @desc    Update provider settings
// @route   PUT /api/providers/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const providerId = req.user.id;
    const {
      profileImage,
      firstName,
      lastName,
      nickName,
      country,
      phone,
      email,
      birthDate,
      description,
      additionalEmails,
      serviceAreas,
      emailNotifications,
      smsNotifications,
      bookingAlerts,
      promotionAlerts,
      workHours,
      currentPassword,
      newPassword,
      confirmPassword
    } = req.body;

    // Find the provider
    const provider = await Provider.findById(providerId);

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Update profile fields
    provider.profileImage = profileImage || provider.profileImage;
    provider.firstName = firstName || provider.firstName;
    provider.lastName = lastName || provider.lastName;
    provider.nickName = nickName || provider.nickName;
    provider.country = country || provider.country;
    provider.phone = phone || provider.phone;
    provider.email = email || provider.email;
    provider.birthDate = birthDate || provider.birthDate;
    provider.description = description || provider.description;
    provider.additionalEmails = additionalEmails || provider.additionalEmails;
    provider.serviceAreas = serviceAreas || provider.serviceAreas;
    provider.notifications = {
      emailNotifications,
      smsNotifications,
      bookingAlerts,
      promotionAlerts
    };
    provider.workHours = workHours || provider.workHours;

    if (serviceAreas && Array.isArray(serviceAreas)) {
      provider.serviceAreas = serviceAreas.map(item => {
        if (typeof item === 'string') {
          return item; 
        }
        if (!item.area) {
          throw new Error('Each service area must have an area property');
        }
        return item.area; 
      });
    }

    // Handle password change if needed
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'All password fields are required to change the password.' });
      }

      const isPasswordMatch = await bcrypt.compare(currentPassword, provider.password);
      if (!isPasswordMatch) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirm password do not match.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      provider.password = hashedPassword;
    }

    await provider.save();

    res.status(200).json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  sensitiveOperationLimiter
};