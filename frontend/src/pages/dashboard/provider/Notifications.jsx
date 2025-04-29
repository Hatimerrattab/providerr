import React, { useState, useEffect } from 'react';
import {
  FiBell, FiCheck, FiX, FiCalendar, FiDollarSign,
  FiGift, FiAlertCircle, FiChevronDown, FiChevronUp,
  FiTrash2, FiMail, FiClock, FiUser, FiMapPin
} from 'react-icons/fi';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [notifications, setNotifications] = useState({
    all: [],
    bookings: [],
    payments: [],
    updates: [],
    promotions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get auth token from storage
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') ||
           sessionStorage.getItem('authToken') ||
           sessionStorage.getItem('token');
  };

  // Notification type icons
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'booking': return <FiCalendar className="text-blue-500 text-xl" />;
      case 'payment': return <FiDollarSign className="text-green-500 text-xl" />;
      case 'update': return <FiAlertCircle className="text-purple-500 text-xl" />;
      case 'promotion': return <FiGift className="text-orange-500 text-xl" />;
      default: return <FiBell className="text-gray-500 text-xl" />;
    }
  };

  // Action button configurations
  const getActionButton = (action) => {
    switch(action) {
      case 'accept':
        return { text: 'Accept', icon: <FiCheck />, color: 'bg-[#076870] hover:bg-[#065a60]' };
      case 'reject':
        return { text: 'Reject', icon: <FiX />, color: 'bg-red-600 hover:bg-red-700' };
      case 'view':
        return { text: 'View', icon: <FiCalendar />, color: 'bg-[#076870] hover:bg-[#065a60]' };
      case 'receipt':
        return { text: 'Receipt', icon: <FiDollarSign />, color: 'bg-gray-600 hover:bg-gray-700' };
      case 'reschedule':
        return { text: 'Reschedule', icon: <FiClock />, color: 'bg-[#076870] hover:bg-[#065a60]' };
      case 'contact':
        return { text: 'Contact', icon: <FiMail />, color: 'bg-gray-600 hover:bg-gray-700' };
      case 'apply':
        return { text: 'Apply', icon: <FiCheck />, color: 'bg-[#076870] hover:bg-[#065a60]' };
      case 'share':
        return { text: 'Share', icon: <FiUser />, color: 'bg-gray-600 hover:bg-gray-700' };
      case 'remind':
        return { text: 'Remind', icon: <FiMail />, color: 'bg-[#076870] hover:bg-[#065a60]' };
      case 'cancel':
        return { text: 'Cancel', icon: <FiX />, color: 'bg-red-600 hover:bg-red-700' };
      case 'confirm':
        return { text: 'Confirm', icon: <FiCheck />, color: 'bg-[#076870] hover:bg-[#065a60]' };
      case 'refer':
        return { text: 'Refer', icon: <FiUser />, color: 'bg-[#076870] hover:bg-[#065a60]' };
      default:
        return { text: 'View', icon: <FiChevronDown />, color: 'bg-[#076870] hover:bg-[#065a60]' };
    }
  };

  // Format time to relative (e.g., "2 hours ago")
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Please login to view notifications');
      }

      const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const allNotifications = response.data.data.notifications;
      setNotifications({
        all: allNotifications,
        bookings: allNotifications.filter(n => n.type === 'booking'),
        payments: allNotifications.filter(n => n.type === 'payment'),
        updates: allNotifications.filter(n => n.type === 'update'),
        promotions: allNotifications.filter(n => n.type === 'promotion'),
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Common request handler with auth
  const makeAuthenticatedRequest = async (method, url, data = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    return axios({
      method,
      url: `${API_BASE_URL}${url}`,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const markAsRead = async (id) => {
    try {
      await makeAuthenticatedRequest('PATCH', `/api/notifications/read/${id}`);
      fetchNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await makeAuthenticatedRequest('PATCH', '/api/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await makeAuthenticatedRequest('DELETE', `/api/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAction = async (notificationId, action) => {
    try {
      console.log(`Action ${action} on notification ${notificationId}`);
      // Implement specific action API calls here if needed
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        <button 
          onClick={markAllAsRead}
          className="text-sm font-medium text-[#076870] hover:text-[#065a60] transition-colors"
        >
          Mark all as read
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error === 'Please login to view notifications' ? (
            <div>
              <p>{error}</p>
              <a 
                href="/login" 
                className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
              >
                Go to Login
              </a>
            </div>
          ) : (
            <p>{error}</p>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto pb-2 mb-6 scrollbar-hide border-b border-gray-200">
        {['all', 'bookings', 'payments', 'updates', 'promotions'].map((tab) => (
          <button
            key={tab}
            className={`py-3 px-4 font-medium text-sm flex items-center whitespace-nowrap transition-colors ${
              activeTab === tab 
                ? 'text-[#076870] border-b-2 border-[#076870]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' && <FiBell className="mr-2" />}
            {tab === 'bookings' && <FiCalendar className="mr-2" />}
            {tab === 'payments' && <FiDollarSign className="mr-2" />}
            {tab === 'updates' && <FiAlertCircle className="mr-2" />}
            {tab === 'promotions' && <FiGift className="mr-2" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {notifications[tab].filter(n => !n.read).length > 0 && (
              <span className="ml-2 bg-[#076870] text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {notifications[tab].filter(n => !n.read).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#076870]"></div>
        </div>
      ) : (
        /* Notifications List */
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {notifications[activeTab].length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {notifications[activeTab].map(notification => (
                <li 
                  key={notification._id} 
                  className={`p-5 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${
                      !notification.read ? 'bg-[#076870] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className={`text-base font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      
                      {/* Expanded Details */}
                      {expandedId === notification._id && (
                        <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                          {Object.entries(notification.details).map(([key, value]) => (
                            <div key={key} className="flex text-sm mb-1 last:mb-0">
                              <span className="font-medium text-gray-700 w-32 capitalize">{key}:</span>
                              <span className="text-gray-600">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-4 flex items-center space-x-3">
                        {notification.actions.map((action, index) => {
                          const btn = getActionButton(action);
                          return (
                            <button
                              key={index}
                              onClick={() => handleAction(notification._id, action)}
                              className={`${btn.color} text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors`}
                            >
                              {btn.icon && <span className="mr-1.5">{btn.icon}</span>}
                              {btn.text}
                            </button>
                          );
                        })}
                        
                        <div className="flex-1 flex justify-end space-x-2">
                          <button 
                            onClick={() => toggleExpand(notification._id)}
                            className="text-[#076870] hover:text-[#065a60] text-xs font-medium flex items-center transition-colors"
                          >
                            {expandedId === notification._id ? (
                              <>
                                <FiChevronUp className="mr-1" /> Hide Details
                              </>
                            ) : (
                              <>
                                <FiChevronDown className="mr-1" /> View Details
                              </>
                            )}
                          </button>
                          <button 
                            onClick={() => deleteNotification(notification._id)}
                            className="text-gray-500 hover:text-gray-700 text-xs font-medium flex items-center transition-colors"
                          >
                            <FiTrash2 className="mr-1" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <FiBell className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-700 mb-1">No Notifications</h3>
              <p className="text-gray-500">You don't have any {activeTab} notifications at the moment.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;