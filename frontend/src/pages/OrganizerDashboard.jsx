import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, 
  PlusIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BellIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  TicketIcon,
  StarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  CalendarIcon as CalendarSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  CurrencyDollarIcon as CurrencyDollarSolidIcon,
  ChartBarIcon as ChartBarSolidIcon
} from '@heroicons/react/24/solid';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { eventService } from '../services/eventService';
import { useNotification } from '../components/NotificationContext';

const OrganizerDashboard = () => {
  const user = useSelector((state) => state.user.user);
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Set organizer role for API requests
  useEffect(() => {
    localStorage.setItem('userRole', 'organizer');
  }, []);

  useEffect(() => {
    fetchOrganizerData();
  }, []);

  const fetchOrganizerData = async () => {
    try {
      setLoading(true);
      
      // Fetch organizer's events and analytics in parallel
      const [eventsData, analyticsData] = await Promise.all([
        eventService.getOrganizerEvents(),
        eventService.getEventAnalytics()
      ]);

      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setAnalytics(analyticsData?.data || analyticsData || {});
      
    } catch (err) {
      console.error('Error fetching data:', err);
      error('Failed to load dashboard data');
      setEvents([]);
      setAnalytics({});
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(eventId);
        success('Event deleted successfully');
        fetchOrganizerData(); // Refresh data
      } catch (err) {
        error('Failed to delete event');
      }
    }
  };

  // Calculate dashboard metrics
  const safeEvents = Array.isArray(events) ? events : [];
  const upcomingEvents = safeEvents.filter(event => new Date(event.date) > new Date());
  const draftEvents = safeEvents.filter(event => event.status === 'draft');
  const publishedEvents = safeEvents.filter(event => event.status === 'published');
  const pendingApprovalEvents = safeEvents.filter(event => event.status === 'pending_approval');
  const rejectedEvents = safeEvents.filter(event => event.status === 'rejected');
  const recentEvents = safeEvents.slice(0, 3);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name || 'Organizer'}! 👋
              </h1>
              <p className="text-xl text-gray-600">
                Manage your events and grow your audience
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Link to="/organizer/create-event">
                <Button variant="primary" className="flex items-center space-x-2 shadow-lg">
                  <PlusIcon className="w-5 h-5" />
                  <span>Create Event</span>
                </Button>
              </Link>
              
              <Button variant="secondary" className="flex items-center space-x-2">
                <CogIcon className="w-5 h-5" />
                <span>Settings</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Events',
              value: safeEvents.length,
              icon: CalendarSolidIcon,
              color: 'blue',
              change: '+2 this month',
              trend: 'up'
            },
            {
              title: 'Total Attendees',
              value: analytics.totalAttendees || 0,
              icon: UserGroupSolidIcon,
              color: 'green',
              change: `+${Math.floor(Math.random() * 20)}% this month`,
              trend: 'up'
            },
            {
              title: 'Total Revenue',
              value: `$${analytics.totalRevenue || 0}`,
              icon: CurrencyDollarSolidIcon,
              color: 'purple',
              change: '+$1,200 this month',
              trend: 'up'
            },
            {
              title: 'Avg. Rating',
              value: '4.8',
              icon: StarIcon,
              color: 'yellow',
              change: '+0.2 this month',
              trend: 'up'
            }
          ].map((stat, index) => {
            const getColorClasses = (color) => {
              switch (color) {
                case 'blue':
                  return { bg: 'bg-blue-100', text: 'text-blue-600' };
                case 'green':
                  return { bg: 'bg-green-100', text: 'text-green-600' };
                case 'purple':
                  return { bg: 'bg-purple-100', text: 'text-purple-600' };
                case 'yellow':
                  return { bg: 'bg-yellow-100', text: 'text-yellow-600' };
                default:
                  return { bg: 'bg-gray-100', text: 'text-gray-600' };
              }
            };
            
            const colorClasses = getColorClasses(stat.color);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card className="p-6 bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-xl ${colorClasses.bg}`}>
                      <stat.icon className={`w-8 h-8 ${colorClasses.text}`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <div className="flex items-center mt-1">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">{stat.change}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="border-b border-gray-200 bg-white rounded-t-lg">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'events', name: 'My Events', icon: CalendarIcon, badge: safeEvents.length },
                { id: 'analytics', name: 'Analytics', icon: DocumentTextIcon },
                { id: 'notifications', name: 'Notifications', icon: BellIcon, badge: 3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                
                {/* Quick Actions Section */}
                <Card className="p-6 bg-gradient-to-r from-primary-500 to-purple-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Ready to create your next event?</h3>
                      <p className="text-primary-100">Get started with our easy event creation process</p>
                    </div>
                    <Link to="/organizer/create-event">
                      <Button variant="secondary" className="bg-white text-primary-600 hover:bg-gray-50">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Create Event
                      </Button>
                    </Link>
                  </div>
                </Card>

                {/* Events Status Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
                      <span className="text-2xl font-bold text-blue-600">{upcomingEvents.length}</span>
                    </div>
                    <div className="space-y-3">
                      {upcomingEvents.slice(0, 3).map((event) => (
                        <div key={event._id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(event.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {upcomingEvents.length === 0 && (
                        <p className="text-gray-500 text-sm">No upcoming events</p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Draft Events</h3>
                      <span className="text-2xl font-bold text-yellow-600">{draftEvents.length}</span>
                    </div>
                    <div className="space-y-3">
                      {draftEvents.slice(0, 3).map((event) => (
                        <div key={event._id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                            <p className="text-xs text-gray-500">Awaiting approval</p>
                          </div>
                        </div>
                      ))}
                      {draftEvents.length === 0 && (
                        <p className="text-gray-500 text-sm">No draft events</p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Published Events</h3>
                      <span className="text-2xl font-bold text-green-600">{publishedEvents.length}</span>
                    </div>
                    <div className="space-y-3">
                      {publishedEvents.slice(0, 3).map((event) => (
                        <div key={event._id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                            <p className="text-xs text-gray-500">
                              {event.attendees?.length || 0} attendees
                            </p>
                          </div>
                        </div>
                      ))}
                      {publishedEvents.length === 0 && (
                        <p className="text-gray-500 text-sm">No published events</p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                    {[
                      { type: 'ticket_sold', message: 'New ticket sold for "Tech Conference 2024"', time: '2 minutes ago', color: 'green' },
                      { type: 'event_created', message: 'Event "Music Festival" created', time: '1 hour ago', color: 'blue' },
                      { type: 'event_approved', message: 'Event "Business Summit" approved by admin', time: '3 hours ago', color: 'purple' }
                    ].map((activity, index) => {
                      const getActivityColorClass = (color) => {
                        switch (color) {
                          case 'green':
                            return 'bg-green-500';
                          case 'blue':
                            return 'bg-blue-500';
                          case 'purple':
                            return 'bg-purple-500';
                          default:
                            return 'bg-gray-500';
                        }
                      };
                      
                      return (
                        <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className={`w-3 h-3 ${getActivityColorClass(activity.color)} rounded-full`}></div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.message}</p>
                            <p className="text-sm text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">My Events</h3>
                      <p className="text-gray-600">Manage and track your events</p>
                    </div>
                    <Link to="/organizer/create-event">
                      <Button variant="primary" className="flex items-center space-x-2">
                        <PlusIcon className="w-5 h-5" />
                        <span>Create New Event</span>
                      </Button>
                    </Link>
                  </div>

                  {safeEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
                      <p className="text-gray-600 mb-6">Get started by creating your first event</p>
                      <Link to="/organizer/create-event">
                        <Button variant="primary">Create Your First Event</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {safeEvents.map((event) => (
                        <motion.div
                          key={event._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ y: -5, transition: { duration: 0.2 } }}
                          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                        >
                          <div className="relative">
                            <img 
                              src={event.image || 'https://picsum.photos/400/200'} 
                              alt={event.title}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-4 right-4">
                              <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                event.status === 'published' ? 'bg-green-100 text-green-800 border border-green-200' :
                                event.status === 'pending_approval' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                event.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                                event.status === 'draft' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                event.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                                {event.status === 'published' ? '✓ Published' :
                                 event.status === 'pending_approval' ? '⏳ Pending Approval' :
                                 event.status === 'rejected' ? '❌ Rejected' :
                                 event.status === 'draft' ? '📝 Draft' :
                                 event.status === 'cancelled' ? '✗ Cancelled' :
                                 '📝 Draft'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-6">
                            <h4 className="font-semibold text-gray-900 mb-2 text-lg">{event.title}</h4>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {event.description}
                            </p>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-gray-500">
                                <ClockIcon className="w-4 h-4 mr-2" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <MapPinIcon className="w-4 h-4 mr-2" />
                                <span className="truncate">{event.location}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <TicketIcon className="w-4 h-4 mr-2" />
                                <span>{event.attendees?.length || 0} / {event.capacity} attendees</span>
                                <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2 max-w-20">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${Math.min(((event.attendees?.length || 0) / event.capacity) * 100, 100)}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => navigate(`/event/${event._id}/edit`)}
                              >
                                <PencilIcon className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => navigate(`/event/${event._id}`)}
                              >
                                <EyeIcon className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteEvent(event._id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Performance Metrics */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Overview</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Events Created', value: safeEvents.length, icon: CalendarIcon, color: 'blue' },
                        { label: 'Total Attendees', value: analytics.totalAttendees || 0, icon: UserGroupIcon, color: 'green' },
                        { label: 'Revenue Generated', value: `$${analytics.totalRevenue || 0}`, icon: CurrencyDollarIcon, color: 'purple' },
                        { label: 'Average Rating', value: '4.8/5', icon: StarIcon, color: 'yellow' }
                      ].map((metric, index) => {
                        const getMetricColorClasses = (color) => {
                          switch (color) {
                            case 'blue':
                              return { bg: 'bg-blue-100', text: 'text-blue-600' };
                            case 'green':
                              return { bg: 'bg-green-100', text: 'text-green-600' };
                            case 'purple':
                              return { bg: 'bg-purple-100', text: 'text-purple-600' };
                            case 'yellow':
                              return { bg: 'bg-yellow-100', text: 'text-yellow-600' };
                            default:
                              return { bg: 'bg-gray-100', text: 'text-gray-600' };
                          }
                        };
                        
                        const colorClasses = getMetricColorClasses(metric.color);
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
                                <metric.icon className={`w-5 h-5 ${colorClasses.text}`} />
                              </div>
                              <span className="font-medium text-gray-900">{metric.label}</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">{metric.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Event Status Breakdown */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Event Status</h3>
                    <div className="space-y-4">
                      {[
                        { status: 'Published', count: publishedEvents.length, color: 'green' },
                        { status: 'Draft', count: draftEvents.length, color: 'yellow' },
                        { status: 'Upcoming', count: upcomingEvents.length, color: 'blue' }
                      ].map((item, index) => {
                        const getStatusColorClass = (color) => {
                          switch (color) {
                            case 'green':
                              return 'bg-green-500';
                            case 'yellow':
                              return 'bg-yellow-500';
                            case 'blue':
                              return 'bg-blue-500';
                            default:
                              return 'bg-gray-500';
                          }
                        };
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${getStatusColorClass(item.color)}`}></div>
                              <span className="font-medium text-gray-900">{item.status} Events</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">{item.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>

                {/* Growth Trends */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Growth Trends</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { metric: 'Event Views', change: '+24%', trend: 'up' },
                      { metric: 'Ticket Sales', change: '+18%', trend: 'up' },
                      { metric: 'Revenue', change: '+32%', trend: 'up' }
                    ].map((trend, index) => (
                      <div key={index} className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">{trend.metric}</p>
                        <div className="flex items-center justify-center mt-2">
                          <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mr-1" />
                          <span className="text-lg font-bold text-green-600">{trend.change}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">vs last month</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Notifications</h3>
                <div className="space-y-4">
                  {[
                    {
                      type: 'success',
                      title: 'Event Approved',
                      message: 'Your event "Tech Conference 2024" has been approved and is now live.',
                      time: '2 hours ago',
                      icon: CalendarIcon
                    },
                    {
                      type: 'info',
                      title: 'New Ticket Sale',
                      message: 'Someone just purchased a ticket for "Music Festival".',
                      time: '5 hours ago',
                      icon: TicketIcon
                    },
                    {
                      type: 'warning',
                      title: 'Event Capacity Alert',
                      message: 'Your event "Business Summit" is 90% full.',
                      time: '1 day ago',
                      icon: ExclamationTriangleIcon
                    }
                  ].map((notification, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${
                        notification.type === 'success' ? 'bg-green-100' :
                        notification.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        <notification.icon className={`w-5 h-5 ${
                          notification.type === 'success' ? 'text-green-600' :
                          notification.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
