import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FiPlus, FiClock, FiStar, FiCheckCircle, 
  FiUser, FiMail, FiPhone, FiMapPin, 
  FiCalendar, FiWatch, FiAward, FiAlertCircle, 
  FiDollarSign, FiEye, FiChevronRight, FiMessageSquare,
  FiBookmark, FiBell, FiUsers, FiBriefcase
} from 'react-icons/fi';

const PROFILE_COMPLETION_WEIGHTS = {
  businessName: 30,
  email: 20,
  phoneNumber: 20,
  services: 20,
  description: 10
};

// Reusable Components
const ProfileInfoItem = ({ icon: Icon, label, value, isRole = false }) => (
  <div className="flex items-start">
    {isRole ? (
      <div className="w-8 h-8 bg-[#076870] rounded-full mr-3 flex items-center justify-center flex-shrink-0">
        <Icon className="text-white" size={14} />
      </div>
    ) : (
      <Icon className="text-[#076870] mr-3 mt-1 flex-shrink-0" size={18} />
    )}
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value || 'Not provided'}</p>
    </div>
  </div>
);

const QuickActionButton = ({ icon: Icon, label, href }) => (
  <a 
    href={href}
    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center hover:border-[#076870]/50 group"
  >
    <div className="bg-[#E0F2F1] text-[#076870] p-3 rounded-full mb-3 group-hover:bg-[#076870] group-hover:text-white transition-colors">
      <Icon size={20} />
    </div>
    <h3 className="font-medium text-gray-800 group-hover:text-[#076870] transition-colors">{label}</h3>
  </a>
);

const JobDetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="text-[#076870] mt-0.5 flex-shrink-0" size={16} />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  </div>
);

const ReviewItem = ({ client, service, rating, comment, date }) => (
  <div className="p-4 hover:bg-gray-50 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-medium text-gray-800">{service}</h3>
      <div className="flex items-center bg-[#E0F2F1] px-2 py-1 rounded">
        <FiStar className="text-yellow-400 fill-yellow-400 mr-1" size={14} />
        <span className="text-sm font-medium">{rating}</span>
      </div>
    </div>
    <p className="text-gray-600 text-sm mb-2">"{comment}"</p>
    <p className="text-gray-400 text-xs">{new Date(date).toLocaleDateString()}</p>
  </div>
);

const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${bgColor} ${color}`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const DashboardHome = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const authToken = localStorage.getItem('authToken'); // this is the correct variable
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/provider/dashboard`, {
          headers: {
            Authorization: `Bearer ${authToken}` // <-- FIXED here
          }
        });
        setDashboardData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error.response ? error.response.data : error.message);
        setLoading(false);
      }
    };
  
    fetchDashboardData();
  }, []);
  

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  if (!dashboardData) return <div className="text-center mt-10">Failed to load dashboard data.</div>;

  const { provider, stats, upcomingJobs, feedback } = dashboardData;

  const calculateProfileCompletion = () => {
    let completion = 0;
    Object.entries(PROFILE_COMPLETION_WEIGHTS).forEach(([key, value]) => {
      if (provider && provider[key]) completion += value;
    });
    return Math.min(completion, 100);
  };

  const profileCompletion = calculateProfileCompletion();

  return (
    <>
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-[#076870] to-[#0a7c85] p-6 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Welcome Back, {provider?.businessName || 'Provider'}!
                </h2>
                <p className="text-white/90 mt-1 text-sm md:text-base">
                  {provider?.createdAt
                    ? `Member since ${new Date(provider.createdAt).toLocaleDateString()}`
                    : "Welcome to your provider dashboard"}
                </p>

                {/* Profile Completion */}
                <div className="mt-4 max-w-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">Profile Completion</span>
                    <span className="text-sm font-medium text-white flex items-center">
                      {profileCompletion}% <FiCheckCircle className="ml-1" size={14} />
                    </span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {provider?.avatar && (
                <div className="hidden md:block">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50">
                    <img
                      src={provider.avatar}
                      alt="Provider"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon={FiCalendar}
              title="Today's Bookings"
              value={stats.todayBookings}
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
            <StatCard 
              icon={FiBookmark}
              title="Pending Requests"
              value={stats.pendingBookings}
              color="text-amber-600"
              bgColor="bg-amber-100"
            />
            <StatCard 
              icon={FiMessageSquare}
              title="Unread Messages"
              value={stats.unreadMessages}
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatCard 
              icon={FiStar}
              title="New Reviews"
              value={stats.newReviews}
              color="text-purple-600"
              bgColor="bg-purple-100"
            />
          </div>

          {/* Provider Information */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Your Business Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProfileInfoItem icon={FiBriefcase} label="Business Name" value={provider?.businessName} />
              <ProfileInfoItem icon={FiMail} label="Email" value={provider?.email} />
              <ProfileInfoItem icon={FiPhone} label="Phone Number" value={provider?.phoneNumber} />
              <ProfileInfoItem icon={FiUsers} label="Account Type" value={provider?.role || 'Provider'} isRole />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#E0F2F1] rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionButton icon={FiPlus} label="Add New Service" href="/services/new" />
              <QuickActionButton icon={FiClock} label="Manage Schedule" href="/schedule" />
              <QuickActionButton icon={FiStar} label="View Reviews" href="/reviews" />
              <QuickActionButton icon={FiMessageSquare} label="Customer Messages" href="/messages" />
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="bg-[#E0F2F1] rounded-xl border border-gray-200 overflow-hidden shadow-sm mt-6">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#076870]">Upcoming Bookings</h2>
            </div>

            <div className="bg-white">
              {upcomingJobs.length === 0 ? (
                <div className="text-center py-6 text-gray-500">No upcoming bookings</div>
              ) : (
                upcomingJobs.map((job, index) => (
                  <div key={index} className="p-5 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg text-[#076870] mb-3">{job.serviceName}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <JobDetailRow icon={FiCalendar} label="Date" value={new Date(job.date).toLocaleDateString()} />
                        <JobDetailRow icon={FiClock} label="Time" value={new Date(job.date).toLocaleTimeString()} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side - Ratings */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-[#E0F2F1] rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-[#076870] text-center">Your Ratings</h2>
            </div>
            <div className="p-5">
              <div className="bg-gradient-to-r from-[#076870] to-[#0a7c85] rounded-xl p-5 text-center mb-4">
                <div className="text-4xl font-bold text-white">{feedback.rating.toFixed(1)}</div>
                <div className="flex justify-center my-2">
                  {[...Array(5)].map((_, i) => (
                    <FiStar 
                      key={i}
                      size={20}
                      className={`mx-0.5 ${i < Math.round(feedback.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-white/90">{feedback.totalReviews} reviews</p>
              </div>

              <div className="space-y-3">
                {feedback.recentReviews.map((review, index) => (
                  <ReviewItem 
                    key={index}
                    client={`${review.customerId.firstName} ${review.customerId.lastName}`}
                    service={review.service || 'Service'}
                    rating={review.rating}
                    comment={review.comment}
                    date={review.createdAt}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default DashboardHome;
