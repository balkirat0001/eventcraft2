import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  UsersIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CogIcon,
  BellIcon,
  UserGroupIcon,
  TicketIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { adminService, approveEvent, rejectEvent, getPendingEvents } from '../services/adminService';

const AdminDashboard = () => {
  const user = useSelector((state) => state.user.user);
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [processingEvent, setProcessingEvent] = useState(null);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Set admin role for API requests
  useEffect(() => {
    localStorage.setItem('userRole', 'admin');
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching admin data...');
      
      // Fetch admin statistics
      console.log('Fetching stats...');
      const statsData = await adminService.getStats();
      console.log('Stats data:', statsData);
      setStats(statsData || {});
      
      // Fetch recent users
      console.log('Fetching recent users...');
      const usersData = await adminService.getRecentUsers();
      console.log('Users data:', usersData);
      setRecentUsers(usersData || []);

      // Fetch pending events
      console.log('Fetching pending events...');
      const eventsData = await getPendingEvents();
      console.log('Events data:', eventsData);
      setPendingEvents(eventsData?.events || []);

      // Fetch revenue data
      console.log('Fetching revenue data...');
      const revenueData = await adminService.getRevenueData();
      console.log('Revenue data:', revenueData);
      setRevenueData(revenueData || []);

      // Fetch activity data
      console.log('Fetching activity data...');
      const activityData = await adminService.getActivity();
      console.log('Activity data:', activityData);
      setActivityData(activityData || []);
      
      console.log('All admin data fetched successfully');
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError(`Failed to load admin data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      setProcessingEvent(eventId);
      await approveEvent(eventId);
      
      // Remove approved event from list and update UI
      setPendingEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
      
      // Update stats if they exist
      setStats(prev => ({
        ...prev,
        pendingEvents: (prev.pendingEvents || 0) - 1
      }));
      
      alert('Event approved successfully!');
    } catch (error) {
      console.error('Error approving event:', error);
      alert('Failed to approve event. Please try again.');
    } finally {
      setProcessingEvent(null);
    }
  };

  const handleRejectClick = (event) => {
    setSelectedEvent(event);
    setShowRejectModal(true);
  };

  const handleRejectEvent = async () => {
    if (!selectedEvent || !rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    try {
      setProcessingEvent(selectedEvent._id);
      await rejectEvent(selectedEvent._id, rejectionReason);
      
      // Remove rejected event from list and update UI
      setPendingEvents(prevEvents => prevEvents.filter(event => event._id !== selectedEvent._id));
      
      // Update stats if they exist
      setStats(prev => ({
        ...prev,
        pendingEvents: (prev.pendingEvents || 0) - 1
      }));
      
      setShowRejectModal(false);
      setSelectedEvent(null);
      setRejectionReason('');
      alert('Event rejected successfully!');
    } catch (error) {
      console.error('Error rejecting event:', error);
      alert('Failed to reject event. Please try again.');
    } finally {
      setProcessingEvent(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>
  );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-red-700">{error}</p>
          <Button 
            variant="secondary" 
            className="mt-2"
            onClick={fetchAdminData}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Admin Dashboard ⚙️
            </h1>
            <p className="text-gray-600">
              Manage users, events, and system analytics
            </p>
          </div>
          
          {/* Notification Bell & Actions */}
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <BellIcon className="w-6 h-6" />
                {stats.pendingEvents > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.pendingEvents > 9 ? '9+' : stats.pendingEvents}
                  </span>
                )}
              </button>
            </div>
            
            <Button
              variant="primary"
              size="sm"
              onClick={fetchAdminData}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Refreshing...
                </>
              ) : (
                'Refresh Data'
              )}
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        {!loading && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="flex flex-wrap items-center justify-between text-sm">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">System Health: <span className="font-medium text-green-600">Excellent</span></span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Uptime: <span className="font-medium text-blue-600">99.9%</span></span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Last Updated: <span className="font-medium text-purple-600">Just now</span></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-800">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalUsers?.toLocaleString() || 0}</p>
                {stats.newUsersThisMonth > 0 && (
                  <p className="text-xs text-blue-600 flex items-center">
                    <span className="inline-block w-1 h-1 bg-green-400 rounded-full mr-1"></span>
                    +{stats.newUsersThisMonth} this month
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
          
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-800">Total Events</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalEvents?.toLocaleString() || 0}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-green-600">
                    {stats.pendingEvents || 0} pending review
                  </p>
                  {stats.pendingEvents > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 animate-pulse">
                      Action Required
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
          
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-800">Platform Revenue</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalRevenue || 0)}</p>
                <p className="text-xs text-purple-600 flex items-center">
                  <span className="inline-block w-1 h-1 bg-green-400 rounded-full mr-1"></span>
                  10% commission rate
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
          
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-800">Active Events</p>
                <p className="text-2xl font-bold text-orange-900">{stats.activeEvents?.toLocaleString() || 0}</p>
                <p className="text-xs text-orange-600 flex items-center">
                  <span className="inline-block w-1 h-1 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  Currently running
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🚀</span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <Link to="/admin/moderation" className="block">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-md">
                    <ShieldCheckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-yellow-900">Event Moderation</p>
                    <p className="text-xs text-yellow-700">
                      {stats.pendingEvents || 0} pending approval
                      {stats.pendingEvents > 0 && ' 🔥'}
                    </p>
                  </div>
                </div>
              </Link>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <Link to="/admin/users" className="block">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-900">User Management</p>
                    <p className="text-xs text-blue-700">Manage all users 👥</p>
                  </div>
                </div>
              </Link>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <Link to="/admin/reports" className="block">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-900">Reports & Analytics</p>
                    <p className="text-xs text-green-700">View detailed reports 📊</p>
                  </div>
                </div>
              </Link>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <Link to="/admin/settings" className="block">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                    <CogIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-900">System Settings</p>
                    <p className="text-xs text-purple-700">Configure platform ⚙️</p>
                  </div>
                </div>
              </Link>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Rest of the dashboard components... */}
      
      {/* Pending Events Section */}
      {pendingEvents && pendingEvents.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">⏳</span>
              Pending Event Approvals ({pendingEvents.length})
            </h2>
            <Link 
              to="/admin/moderation"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingEvents.slice(0, 4).map((event) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {event.location?.address || 'TBD'}
                      </div>
                      <div className="flex items-center">
                        <TicketIcon className="w-4 h-4 mr-1" />
                        ${event.price || 0}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Created by: {event.organizer?.name || 'Unknown'} • {formatDate(event.createdAt)}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveEvent(event._id)}
                    disabled={processingEvent === event._id}
                  >
                    {processingEvent === event._id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600"
                    onClick={() => handleRejectClick(event)}
                    disabled={processingEvent === event._id}
                  >
                    {processingEvent === event._id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <XMarkIcon className="w-4 h-4 mr-1" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity & Users Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
              <Link 
                to="/admin/users"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </Link>
            </div>
            
            {recentUsers.length > 0 ? (
              <div className="space-y-3">
                {recentUsers.slice(0, 5).map((user) => (
                  <div key={user._id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'organizer' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UsersIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No recent users</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-green-800">API Status</span>
                </div>
                <span className="text-sm text-green-600">Operational</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-green-800">Database</span>
                </div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-blue-800">Pending Actions</span>
                </div>
                <span className="text-sm text-blue-600">{stats.pendingEvents || 0} events</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-purple-800">Active Sessions</span>
                </div>
                <span className="text-sm text-purple-600">{stats.activeSessions || 0}</span>
              </div>
            </div>
            
            {/* Refresh Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchAdminData}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Refreshing...
                  </>
                ) : (
                  'Refresh Data'
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Reject Event Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reject Event</h2>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            <div className="mt-4 flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRejectEvent}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

