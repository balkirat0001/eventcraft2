import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../services/eventService';
import ticketService from '../services/ticketService';
import favoritesService from '../services/favoritesService';
import FavoriteButton from '../components/FavoriteButton';
import { useSelector } from 'react-redux';

const AttendeeDashboard = () => {
  console.log('AttendeeDashboard rendering...');
  
  const navigate = useNavigate();
  
  // State management
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get user from Redux store
  const user = useSelector(state => state.user.user) || { name: 'Attendee User', email: 'attendee@example.com' };
  const isAuthenticated = !!user;

  // Set attendee role for API requests
  useEffect(() => {
    localStorage.setItem('userRole', 'attendee');
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...');
      setLoading(true);
      setError(null);

      // Load events (published events for attendees)
      const eventsResponse = await eventService.getEvents({ 
        status: 'published',
        limit: 50 
      });
      
      console.log('Events response:', eventsResponse);
      
      // Handle both array response and object with events property
      const eventsData = Array.isArray(eventsResponse) 
        ? eventsResponse 
        : eventsResponse.events || eventsResponse.data || [];
      
      setEvents(eventsData);

      // Fetch user tickets
      try {
        console.log('Fetching user tickets...');
        const ticketsResponse = await ticketService.getMyTickets();
        console.log('Tickets response:', ticketsResponse);
        
        // Handle both array response and object with tickets property
        const ticketsData = Array.isArray(ticketsResponse) 
          ? ticketsResponse 
          : ticketsResponse.tickets || ticketsResponse.data || [];
        
        setTickets(ticketsData);
        console.log('User tickets loaded:', ticketsData.length);
      } catch (ticketError) {
        console.error('Error loading tickets:', ticketError);
        // Don't fail the whole dashboard if tickets fail to load
        setTickets([]);
      }

      // Fetch user's favorite events
      try {
        console.log('Fetching user favorites...');
        const favoritesResponse = await favoritesService.getFavorites();
        console.log('Favorites response:', favoritesResponse);
        
        const favoritesData = Array.isArray(favoritesResponse) 
          ? favoritesResponse 
          : favoritesResponse.favoriteEvents || favoritesResponse.data || [];
        
        setFavoriteEvents(favoritesData);
        console.log('User favorites loaded:', favoritesData.length);
      } catch (favError) {
        console.error('Error loading favorites:', favError);
        // Don't fail the whole dashboard if favorites fail to load
        setFavoriteEvents([]);
      }

      console.log('Dashboard data loaded successfully', { eventsCount: eventsData.length });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on search and category
  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchTerm || 
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if event.categories array includes the selected category
    // or if event.category string matches the selected category
    const matchesCategory = selectedCategory === 'all' || 
      (event.categories && Array.isArray(event.categories) && 
        event.categories.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase())) ||
      (event.category && typeof event.category === 'string' && 
        event.category.toLowerCase() === selectedCategory.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date TBD';
    }
  };

  // Format price helper
  const formatPrice = (price) => {
    if (!price || price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access your dashboard.</p>
          <button 
            onClick={() => navigate('/auth')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Discover amazing events and manage your tickets
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={loadDashboardData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎫</div>
              <div>
                <p className="text-sm font-medium text-gray-600">My Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎯</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Available Events</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">❤️</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Favorites</p>
                <p className="text-2xl font-bold text-gray-900">{favoriteEvents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">✅</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Attended</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'discover', label: 'Discover Events', icon: '🔍' },
                { id: 'tickets', label: 'My Tickets', icon: '🎫' },
                { id: 'favorites', label: 'Favorites', icon: '❤️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Events</h3>
                  {filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredEvents.slice(0, 6).map((event) => (
                        <EventCard 
                          key={event._id} 
                          event={event} 
                          formatDate={formatDate} 
                          formatPrice={formatPrice} 
                          navigate={navigate}
                          onFavoriteUpdate={() => loadDashboardData()} // Refresh favorites when updated
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="text-4xl mb-4">🎭</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Available</h3>
                      <p className="text-gray-600">Check back later for exciting events!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Discover Events Tab */}
            {activeTab === 'discover' && (
              <div className="space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="technology">Technology</option>
                    <option value="music">Music</option>
                    <option value="business">Business</option>
                    <option value="food">Food & Drink</option>
                    <option value="sports">Sports</option>
                    <option value="arts">Arts & Culture</option>
                    <option value="education">Education</option>
                    <option value="health">Health & Wellness</option>
                    <option value="science">Science</option>
                    <option value="community">Community</option>
                    <option value="charity">Charity & Causes</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="fashion">Fashion</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="networking">Networking</option>
                    <option value="outdoor">Outdoor & Recreation</option>
                    <option value="travel">Travel & Tourism</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Events Grid */}
                {filteredEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                      <EventCard 
                        key={event._id} 
                        event={event} 
                        formatDate={formatDate} 
                        formatPrice={formatPrice} 
                        navigate={navigate} 
                        showFavoriteButton={true}
                        onFavoriteUpdate={() => loadDashboardData()} // Refresh favorites when updated
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                    <p className="text-gray-600">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            )}

            {/* My Tickets Tab */}
            {activeTab === 'tickets' && (
              <div>
                {tickets && tickets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map((ticket) => (
                      <TicketCard key={ticket._id || ticket.id} ticket={ticket} formatDate={formatDate} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-4">🎫</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets Yet</h3>
                    <p className="text-gray-600 mb-4">Start exploring events and purchase your first ticket!</p>
                    <button
                      onClick={() => setActiveTab('discover')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Discover Events
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                {favoriteEvents && favoriteEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteEvents.map((event) => (
                      <EventCard 
                        key={event._id || event.id} 
                        event={event} 
                        formatDate={formatDate} 
                        formatPrice={formatPrice} 
                        navigate={navigate} 
                        showFavoriteButton={true}
                        onFavoriteUpdate={() => loadDashboardData()} // Refresh data when favorite is removed
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-4">❤️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Favorites Yet</h3>
                    <p className="text-gray-600 mb-4">Save events you're interested in to see them here!</p>
                    <button
                      onClick={() => setActiveTab('discover')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Discover Events
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Event Card Component
const EventCard = ({ event, formatDate, formatPrice, navigate, showFavoriteButton = true, onFavoriteUpdate }) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center relative">
        {event.image ? (
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-white text-6xl">🎭</div>
        )}
        {showFavoriteButton && (
          <div className="absolute top-2 right-2">
            <FavoriteButton 
              eventId={event._id || event.id} 
              size="md" 
              className="bg-white/90 backdrop-blur-sm border border-white/20" 
              onUpdate={onFavoriteUpdate}
            />
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {event.category || 'General'}
          </span>
          <span className="text-lg font-bold text-green-600">
            {formatPrice(event.ticketPrice || event.ticketTypes?.[0]?.price)}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {event.title || 'Untitled Event'}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {event.description || 'No description available'}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-2">📅</span>
            {formatDate(event.date)}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-2">📍</span>
            {event.location || 'Location TBD'}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/event/${event._id || event.id}`)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Ticket Card Component
const TicketCard = ({ ticket, formatDate }) => {
  const navigate = useNavigate();
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'used': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleViewTicket = () => {
    // Debug logging
    console.log('Viewing ticket:', ticket);
    console.log('Ticket ID:', ticket.id || ticket._id);
    console.log('Event ID:', ticket.event?._id);
    console.log('Ticket ID type:', typeof (ticket.id || ticket._id));
    
    // Navigate to ticket detail page
    const ticketIdToUse = ticket.id || ticket._id;
    const eventIdToUse = ticket.event?._id;
    
    console.log('Using ticket ID for navigation:', ticketIdToUse);
    console.log('Using event ID for navigation:', eventIdToUse);
    
    // Use the correct route path: /event/:eventId/ticket/:ticketId or fallback to /ticket/:ticketId
    if (eventIdToUse && ticketIdToUse) {
      navigate(`/event/${eventIdToUse}/ticket/${ticketIdToUse}`);
    } else if (ticketIdToUse) {
      // Fallback to simpler route if event ID is missing
      navigate(`/ticket/${ticketIdToUse}`);
    } else {
      console.error('Missing ticketId for navigation');
      console.error('Event ID:', eventIdToUse);
      console.error('Ticket ID:', ticketIdToUse);
      alert('Unable to view ticket details. Missing ticket information.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-4">
        <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
          {ticket.status || 'Active'}
        </span>
        <span className="text-sm text-gray-500">
          {ticket.ticketNumber || 'N/A'}
        </span>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {ticket.event?.title || ticket.eventTitle || 'Event Ticket'}
      </h3>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <span className="mr-2">🎫</span>
          {ticket.ticketType || 'Standard'}
        </div>
        
        <div className="flex items-center">
          <span className="mr-2">💰</span>
          ${ticket.price || '0.00'}
        </div>
        
        <div className="flex items-center">
          <span className="mr-2">📅</span>
          {formatDate(ticket.purchaseDate)}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button 
          onClick={handleViewTicket}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          View Ticket
        </button>
      </div>
    </div>
  );
};

export default AttendeeDashboard;