import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { eventService } from '../services/eventService';
import { useNotification } from '../components/NotificationContext';

const EventManagement = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const { success, error } = useNotification();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, published, draft, upcoming, past

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.getOrganizerEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching events:', err);
      error('Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await eventService.deleteEvent(eventId);
        success('Event deleted successfully');
        fetchEvents(); // Refresh the list
      } catch (err) {
        error('Failed to delete event');
      }
    }
  };

  const getFilteredEvents = () => {
    if (!Array.isArray(events)) return [];
    
    const now = new Date();
    
    switch (filter) {
      case 'published':
        return events.filter(event => event.status === 'published');
      case 'draft':
        return events.filter(event => event.status === 'draft');
      case 'upcoming':
        return events.filter(event => new Date(event.date) > now);
      case 'past':
        return events.filter(event => new Date(event.date) <= now);
      default:
        return events;
    }
  };

  const filteredEvents = getFilteredEvents();

  const getStatusBadge = (status) => {
    const badges = {
      published: 'bg-green-100 text-green-800 border border-green-200',
      draft: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      completed: 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    
    const labels = {
      published: '✓ Published',
      draft: '📝 Draft',
      cancelled: '✗ Cancelled',
      completed: '🎉 Completed'
    };

    return (
      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${badges[status] || badges.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Event Management 🎪
              </h1>
              <p className="text-xl text-gray-600">
                Manage and track all your events
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Link to="/organizer/create-event">
                <Button variant="primary" className="flex items-center space-x-2 shadow-lg">
                  <PlusIcon className="w-5 h-5" />
                  <span>Create New Event</span>
                </Button>
              </Link>
              
              <Button 
                variant="secondary" 
                onClick={() => navigate('/organizer/dashboard')}
                className="flex items-center space-x-2"
              >
                <ChartBarIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Events',
              value: events.length,
              icon: CalendarIcon,
              color: 'blue'
            },
            {
              title: 'Published',
              value: events.filter(e => e.status === 'published').length,
              icon: EyeIcon,
              color: 'green'
            },
            {
              title: 'Upcoming',
              value: events.filter(e => new Date(e.date) > new Date()).length,
              icon: ClockIcon,
              color: 'purple'
            },
            {
              title: 'Total Attendees',
              value: events.reduce((sum, e) => sum + (e.attendees?.length || 0), 0),
              icon: UserGroupIcon,
              color: 'orange'
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
                case 'orange':
                  return { bg: 'bg-orange-100', text: 'text-orange-600' };
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
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card className="p-1">
            <div className="flex space-x-1">
              {[
                { id: 'all', name: 'All Events', count: events.length },
                { id: 'published', name: 'Published', count: events.filter(e => e.status === 'published').length },
                { id: 'draft', name: 'Draft', count: events.filter(e => e.status === 'draft').length },
                { id: 'upcoming', name: 'Upcoming', count: events.filter(e => new Date(e.date) > new Date()).length },
                { id: 'past', name: 'Past', count: events.filter(e => new Date(e.date) <= new Date()).length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filter === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    filter === tab.id 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Events List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {filter === 'all' ? 'All Events' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Events`}
            </h3>
            <span className="text-sm text-gray-500">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No events yet' : `No ${filter} events`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? 'Get started by creating your first event'
                  : `You don't have any ${filter} events at the moment`
                }
              </p>
              {filter === 'all' && (
                <Link to="/organizer/create-event">
                  <Button variant="primary">Create Your First Event</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h4>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(event.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="w-4 h-4 mr-2" />
                          <span>{new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPinIcon className="w-4 h-4 mr-2" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <UserGroupIcon className="w-4 h-4 mr-2" />
                          <span>{event.attendees?.length || 0} / {event.capacity} attendees</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                            <span>${event.ticketPrice || 0}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <TagIcon className="w-4 h-4 mr-1" />
                            <span>{event.category}</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
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
                            onClick={() => handleDeleteEvent(event._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EventManagement;
