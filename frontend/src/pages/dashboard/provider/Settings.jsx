import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiChevronRight, FiCheck,
  FiEdit2, FiPlus, FiTrash2, FiEye, FiEyeOff,
  FiMail, FiCalendar, FiGlobe, FiPhone
} from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    profileImage: '',
    firstName: '',
    lastName: '',
    nickName: '',
    country: 'United States',
    phone: '',
    email: '',
    birthDate: '',
    description: '',
    additionalEmails: [],
    newEmail: '',
    serviceAreas: [],
    newArea: '',
    newRadius: '',
    emailNotifications: true,
    smsNotifications: false,
    bookingAlerts: true,
    promotionAlerts: true,
    workHours: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '10:00', end: '15:00', available: false },
      sunday: { start: '', end: '', available: false }
    },
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') ||
           sessionStorage.getItem('authToken') ||
           sessionStorage.getItem('token');
  };

  // Fetch settings from backend
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Please login to view settings');
      }

      const response = await axios.get(`${API_BASE_URL}/api/providers/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setFormData(prev => ({
        ...prev,
        ...response.data,
        newEmail: '',
        newArea: '',
        newRadius: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profileImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      profileImage: ''
    }));
  };

  const addEmail = () => {
    if (formData.newEmail && !formData.additionalEmails.includes(formData.newEmail)) {
      setFormData(prev => ({
        ...prev,
        additionalEmails: [...prev.additionalEmails, prev.newEmail],
        newEmail: ''
      }));
    }
  };

  const removeEmail = (emailToRemove) => {
    setFormData(prev => ({
      ...prev,
      additionalEmails: prev.additionalEmails.filter(email => email !== emailToRemove)
    }));
  };

  const handleWorkHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      workHours: {
        ...prev.workHours,
        [day]: {
          ...prev.workHours[day],
          [field]: value
        }
      }
    }));
  };

  const toggleDayAvailability = (day) => {
    setFormData(prev => ({
      ...prev,
      workHours: {
        ...prev.workHours,
        [day]: {
          ...prev.workHours[day],
          available: !prev.workHours[day].available
        }
      }
    }));
  };

  const addServiceArea = () => {
    if (formData.newArea && formData.newRadius) {
      setFormData(prev => ({
        ...prev,
        serviceAreas: [
          ...prev.serviceAreas,
          {
            id: Date.now(),
            area: prev.newArea,
            radius: prev.newRadius
          }
        ],
        newArea: '',
        newRadius: ''
      }));
    }
  };

  const removeServiceArea = (id) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter(area => area.id !== id)
    }));
  };

  // Update settings in backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Please login to update settings');
      }

      // Prepare data for backend
      const settingsData = {
        profileImage: formData.profileImage,
        firstName: formData.firstName,
        lastName: formData.lastName,
        nickName: formData.nickName,
        country: formData.country,
        phone: formData.phone,
        email: formData.email,
        birthDate: formData.birthDate,
        description: formData.description,
        additionalEmails: formData.additionalEmails,
        serviceAreas: formData.serviceAreas,
        emailNotifications: formData.emailNotifications,
        smsNotifications: formData.smsNotifications,
        bookingAlerts: formData.bookingAlerts,
        promotionAlerts: formData.promotionAlerts,
        workHours: formData.workHours,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      };

      await axios.put(`${API_BASE_URL}/api/providers/settings`, settingsData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Reset password fields after successful update
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      alert('Settings saved successfully!');
      fetchSettings(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('Error updating settings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.firstName) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#076870]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Top Navigation Bar */}
      <div className="mb-6">
        <nav className="flex space-x-6 mb-8 border-b border-gray-300">
          {[
            { id: 'personal', label: 'Personal Details' },
            { id: 'service', label: 'Service Areas' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'hours', label: 'Work Hours' },
            { id: 'security', label: 'Security' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-lg font-medium transition-colors ${activeTab === tab.id ? 'text-[#076870] border-b-2 border-[#076870]' : 'text-gray-600 hover:text-[#076870]'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error === 'Please login to view settings' ? (
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

      {/* Main Content */}
      <div className="flex flex-col gap-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Personal Details Tab */}
          {activeTab === 'personal' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Personal Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      <img 
                        src={formData.profileImage || 'https://randomuser.me/api/portraits/men/32.jpg'} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                      />
                      {formData.profileImage && (
                        <button 
                          onClick={removeImage}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                    <label className="cursor-pointer bg-[#076870] text-white px-4 py-2 rounded-lg">
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleImageChange}
                        accept="image/*"
                      />
                      {formData.profileImage ? 'Change Photo' : 'Upload Photo'}
                    </label>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                      <input
                        type="text"
                        name="nickName"
                        value={formData.nickName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Tell clients about your experience and services"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Emails</label>
                    <div className="flex mb-2">
                      <input
                        type="email"
                        name="newEmail"
                        value={formData.newEmail}
                        onChange={handleInputChange}
                        placeholder="Add additional email"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={addEmail}
                        className="ml-2 px-4 py-2 bg-[#076870] text-white rounded-md"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.additionalEmails.map((email, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                          <span>{email}</span>
                          <button
                            onClick={() => removeEmail(email)}
                            className="text-red-500"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Areas Tab */}
          {activeTab === 'service' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Service Areas
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                    <input
                      type="text"
                      name="newArea"
                      value={formData.newArea}
                      onChange={handleInputChange}
                      placeholder="City, State"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Radius</label>
                    <select
                      name="newRadius"
                      value={formData.newRadius}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select radius</option>
                      <option value="5 miles">5 miles</option>
                      <option value="10 miles">10 miles</option>
                      <option value="15 miles">15 miles</option>
                      <option value="20 miles">20 miles</option>
                      <option value="25 miles">25 miles</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addServiceArea}
                      className="px-4 py-2 bg-[#076870] text-white rounded-md flex items-center"
                      disabled={!formData.newArea || !formData.newRadius}
                    >
                      <FiPlus className="mr-1" /> Add Area
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-700 mb-3">Your Service Areas</h3>
                  <div className="space-y-3">
                    {formData.serviceAreas.length > 0 ? (
                      formData.serviceAreas.map(area => (
                        <div key={area.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium">{area.area}</p>
                            <p className="text-sm text-gray-500">Radius: {area.radius}</p>
                          </div>
                          <button
                            onClick={() => removeServiceArea(area.id)}
                            className="text-red-500 p-1"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No service areas added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings Tab */}
          {activeTab === 'notifications' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Notification Settings
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Notification Methods</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="emailNotifications"
                          checked={formData.emailNotifications}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#076870]"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via text message</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="smsNotifications"
                          checked={formData.smsNotifications}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#076870]"></div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-700 mb-3">Notification Types</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Booking Alerts</p>
                        <p className="text-sm text-gray-500">Get notified when you receive new bookings</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="bookingAlerts"
                          checked={formData.bookingAlerts}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#076870]"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Promotions & Offers</p>
                        <p className="text-sm text-gray-500">Receive updates about promotions and special offers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="promotionAlerts"
                          checked={formData.promotionAlerts}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#076870]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Work Hours Tab */}
          {activeTab === 'hours' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Work Hours Availability
              </h2>
              <div className="space-y-4">
                {Object.entries(formData.workHours).map(([day, hours]) => (
                  <div key={day} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={hours.available}
                          onChange={() => toggleDayAvailability(day)}
                          className="h-4 w-4 text-[#076870] rounded border-gray-300 focus:ring-[#076870]"
                        />
                        <span className="ml-2 font-medium capitalize">{day}</span>
                      </label>
                      {hours.available && (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            <input
                              type="time"
                              value={hours.start}
                              onChange={(e) => handleWorkHoursChange(day, 'start', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded-md"
                            />
                          </div>
                          <span>to</span>
                          <div className="flex items-center">
                            <input
                              type="time"
                              value={hours.end}
                              onChange={(e) => handleWorkHoursChange(day, 'end', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Security
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Enter current password"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-500"
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Enter new password"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-500"
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Confirm new password"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-500"
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-700 mb-3">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Authentication</p>
                      <p className="text-sm text-gray-500">Use your phone to verify your identity</p>
                    </div>
                    <button className="px-4 py-2 border border-[#076870] text-[#076870] rounded-md">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end">
            <button
              type="submit"
              className="bg-[#076870] hover:bg-[#065a60] text-white px-6 py-2 rounded-lg font-medium flex items-center transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <FiCheck className="mr-2" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;