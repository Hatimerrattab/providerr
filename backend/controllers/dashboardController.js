// controllers/dashboardController.js
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const mongoose = require('mongoose');

// Dashboard Controller
const getProviderDashboard = async (req, res) => {
  try {
    const providerId = req.user.id;

    const provider = await Provider.findById(providerId).select('-password -__v');
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const pendingBookings = await Booking.countDocuments({ providerId, status: 'pending' });
    const todayBookings = await Booking.countDocuments({ providerId, status: 'confirmed', date: { $gte: todayStart, $lte: todayEnd } });

    const unreadMessages = 0; // Change this if you have messages system
    const newReviews = await Review.countDocuments({ providerId, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });

    const upcomingJobs = await Booking.find({ providerId, status: 'confirmed', date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(3)
      .populate('customerId', 'firstName lastName email profilePhoto')
      .populate('serviceId', 'name');

    const recentReviews = await Review.find({ providerId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('customerId', 'firstName lastName profilePhoto');

      const ratingResult = await Review.aggregate([
        { $match: { providerId: new mongoose.Types.ObjectId(providerId) } },
        { $group: { _id: null, averageRating: { $avg: "$rating" }, count: { $sum: 1 } } }
      ]);
      

    const ratingData = ratingResult.length > 0 ? ratingResult[0] : { averageRating: 0, count: 0 };

    res.json({
      provider,
      stats: {
        pendingBookings,
        todayBookings,
        unreadMessages,
        newReviews
      },
      upcomingJobs: upcomingJobs.map(job => ({
        _id: job._id,
        serviceName: job.serviceId?.name || 'Service',
        date: job.date,
        customerId: job.customerId
      })),
      feedback: {
        rating: ratingData.averageRating,
        totalReviews: ratingData.count,
        recentReviews
      }
    });
  } catch (error) {
    console.error('Error in provider dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProviderDashboard };
