const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// Add this new route
router.get('/dashboard', authMiddleware.protect, async (req, res) => {
  try {
    const providerId = req.user.id;
    
    // Get provider data
    const provider = await Provider.findById(providerId)
      .select('-password -__v');
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Get stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const pendingBookings = await Booking.countDocuments({ 
      providerId, 
      status: 'pending' 
    });
    
    const todayBookings = await Booking.countDocuments({ 
      providerId, 
      status: 'confirmed',
      date: { $gte: todayStart, $lte: todayEnd }
    });
    
    const unreadMessages = 0; // Would come from a messaging system
    
    const newReviews = await Review.countDocuments({ 
      providerId, 
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    // Get upcoming bookings
    const upcomingJobs = await Booking.find({ 
      providerId, 
      status: 'confirmed',
      date: { $gte: new Date() }
    })
    .sort({ date: 1 })
    .limit(3)
    .populate('clientId', 'firstName lastName email profilePhoto');

    // Get recent reviews
    const recentReviews = await Review.find({ providerId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('clientId', 'firstName lastName');

    // Calculate average rating
    const ratingResult = await Review.aggregate([
      { $match: { providerId: mongoose.Types.ObjectId(providerId) } },
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
      upcomingJobs,
      feedback: {
        rating: ratingData.averageRating,
        totalReviews: ratingData.count,
        recentReviews
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ... rest of your existing routes

module.exports = router;