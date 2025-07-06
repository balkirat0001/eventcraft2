import api from './api';
import authService from './authService';
// Import ticketService differently to avoid circular dependency
let ticketService;
setTimeout(() => {
  ticketService = require('./ticketService').default;
}, 0);

// Debug function to check event IDs
const debugEvents = () => {
  console.log('Debugging event IDs:');
  mockEvents.forEach(event => {
    console.log(`Event: ${event.title} - id: ${event.id}, _id: ${event._id}`);
    // Ensure both id and _id exist
    if (!event._id) event._id = event.id;
    if (!event.id) event.id = event._id;
  });
};

// Mock events data
export const mockEvents = [
  {
    id: '1',
    _id: '1',
    title: 'Tech Conference 2024',
    description: 'Annual tech conference with industry leaders',
    date: '2024-11-15T09:00:00',
    endDate: '2024-11-17T18:00:00',
    location: 'Convention Center, New York',
    price: 299.99,
    organizer: 'u002',
    status: 'approved',
    capacity: 500,
    attendees: [],
    categories: ['technology', 'networking'],
    image: 'https://picsum.photos/800/400',
  },
  {
    id: 'e002',
    _id: 'e002',
    title: 'Music Festival',
    description: 'Three-day music festival featuring top artists',
    date: '2024-08-20T14:00:00',
    endDate: '2024-08-22T23:00:00',
    location: 'Central Park, New York',
    price: 150,
    organizer: 'u002',
    status: 'approved',
    capacity: 10000,
    attendees: [],
    categories: ['music', 'entertainment'],
    image: 'https://picsum.photos/800/401',
  },
  {
    id: 'e003',
    _id: 'e003',
    title: 'Startup Pitch Night',
    description: 'Pitch your startup idea to investors',
    date: '2024-07-10T18:00:00',
    endDate: '2024-07-10T21:00:00',
    location: 'Innovation Hub, San Francisco',
    price: 0,
    organizer: 'u002',
    status: 'pending',
    capacity: 100,
    attendees: [],
    categories: ['business', 'networking'],
    image: 'https://picsum.photos/800/402',
  },
  {
    id: 'e004',
    _id: 'e004',
    title: 'Art Exhibition: Modern Perspectives',
    description: 'Showcasing contemporary art from emerging artists',
    date: '2024-09-05T10:00:00',
    endDate: '2024-09-25T18:00:00',
    location: 'Metropolitan Gallery, Chicago',
    price: 25,
    organizer: 'u003',
    status: 'approved',
    capacity: 300,
    attendees: [],
    categories: ['arts', 'culture'],
    image: 'https://picsum.photos/800/403',
  },
  {
    id: 'e005',
    _id: 'e005',
    title: 'Wellness Retreat Weekend',
    description: 'Rejuvenate with yoga, meditation, and healthy living workshops',
    date: '2024-10-12T09:00:00',
    endDate: '2024-10-14T17:00:00',
    location: 'Serenity Resort, Colorado',
    price: 450,
    organizer: 'u004',
    status: 'approved',
    capacity: 75,
    attendees: [],
    categories: ['health', 'wellness', 'lifestyle'],
    image: 'https://picsum.photos/800/404',
  },
  {
    id: 'e006',
    _id: 'e006',
    title: 'Culinary Festival',
    description: 'Taste dishes from top chefs and local restaurants',
    date: '2024-08-05T11:00:00',
    endDate: '2024-08-07T22:00:00',
    location: 'Riverfront Park, Portland',
    price: 65,
    organizer: 'u005',
    status: 'approved',
    capacity: 2000,
    attendees: [],
    categories: ['food', 'entertainment'],
    image: 'https://picsum.photos/800/405',
  },
  {
    id: 'e007',
    _id: 'e007',
    title: 'Science Fair 2024',
    description: 'Annual showcase of scientific innovation and discovery',
    date: '2024-09-15T09:00:00',
    endDate: '2024-09-17T18:00:00',
    location: 'Science Center, Boston',
    price: 15,
    organizer: 'u006',
    status: 'approved',
    capacity: 500,
    attendees: [],
    categories: ['science', 'education'],
    image: 'https://picsum.photos/800/406',
  },
  {
    id: 'e008',
    _id: 'e008',
    title: 'Charity Run for Education',
    description: 'Annual 5K run to raise funds for underprivileged students',
    date: '2024-07-20T08:00:00',
    endDate: '2024-07-20T12:00:00',
    location: 'City Park, Austin',
    price: 35,
    organizer: 'u007',
    status: 'approved',
    capacity: 1000,
    attendees: [],
    categories: ['charity', 'sports', 'community'],
    image: 'https://picsum.photos/800/407',
  },
  {
    id: 'e009',
    _id: 'e009',
    title: 'Fashion Week Preview',
    description: 'Exclusive preview of upcoming fashion trends',
    date: '2024-10-01T19:00:00',
    endDate: '2024-10-01T22:00:00',
    location: 'Grand Hotel Ballroom, Miami',
    price: 120,
    organizer: 'u008',
    status: 'approved',
    capacity: 300,
    attendees: [],
    categories: ['fashion', 'lifestyle'],
    image: 'https://picsum.photos/800/408',
  },
  {
    id: 'e010',
    _id: 'e010',
    title: 'Outdoor Adventure Weekend',
    description: 'Hiking, camping, and outdoor activities for nature enthusiasts',
    date: '2024-08-25T08:00:00',
    endDate: '2024-08-27T16:00:00',
    location: 'Mountain Ridge Park, Denver',
    price: 85,
    organizer: 'u009',
    status: 'approved',
    capacity: 150,
    attendees: [],
    categories: ['outdoor', 'recreation'],
    image: 'https://picsum.photos/800/409',
  },
  {
    id: 'e011',
    _id: 'e011',
    title: 'Travel Expo 2024',
    description: 'Discover destinations, travel deals, and tourism opportunities',
    date: '2024-09-08T10:00:00',
    endDate: '2024-09-10T18:00:00',
    location: 'Convention Center, Las Vegas',
    price: 20,
    organizer: 'u010',
    status: 'approved',
    capacity: 5000,
    attendees: [],
    categories: ['travel', 'tourism'],
    image: 'https://picsum.photos/800/410',
  },
  {
    id: 'e012',
    _id: 'e012',
    title: 'Community Garden Workshop',
    description: 'Learn sustainable gardening practices for urban environments',
    date: '2024-07-15T14:00:00',
    endDate: '2024-07-15T17:00:00',
    location: 'Community Center, Seattle',
    price: 0,
    organizer: 'u011',
    status: 'approved',
    capacity: 50,
    attendees: [],
    categories: ['community', 'education'],
    image: 'https://picsum.photos/800/411',
  }
];

// Normalize event IDs and properties
mockEvents.forEach(event => {
  if (!event._id) event._id = event.id;
  if (!event.id) event.id = event._id;
  if (!event.attendees) event.attendees = [];
  if (!event.capacity) event.capacity = 100;
  if (event.price === undefined) event.price = 0;
});

// Helper function to simulate API delays - reduced delay time for better performance
const mockDelay = (data, ms = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data }), ms);
  });
};

// Direct function to get event 1
const getEvent1 = () => {
  return {
    id: '1',
    _id: '1',
    title: 'Tech Conference 2024',
    description: 'Annual tech conference with industry leaders',
    date: '2024-11-15T09:00:00',
    endDate: '2024-11-17T18:00:00',
    location: 'Convention Center, New York',
    price: 299.99,
    organizer: 'u002',
    status: 'approved',
    capacity: 500,
    attendees: [],
    categories: ['technology', 'networking'],
    image: 'https://picsum.photos/800/400',
  };
};

// Helper function to ensure we can get an event by ID
export const getEventById = (eventId) => {
  console.log('Getting event by ID:', eventId);
  
  // Handle special case for event ID 1
  if (eventId === '1' || eventId === 1) {
    return getEvent1();
  }
  
  // Try to find by exact match first
  let event = mockEvents.find(e => e.id === eventId || e._id === eventId);
  
  // If not found, try string comparison
  if (!event) {
    event = mockEvents.find(e => 
      (e.id && e.id.toString() === eventId.toString()) || 
      (e._id && e._id.toString() === eventId.toString())
    );
  }
  
  // If still not found, create a fallback event
  if (!event) {
    console.log('Event not found, creating fallback event');
    event = {
      id: eventId,
      _id: eventId,
      title: `Event ${eventId}`,
      description: 'Event details not available',
      date: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(), // Next day
      location: 'Location TBD',
      price: 0,
      organizer: 'u001',
      status: 'approved',
      capacity: 100,
      attendees: [],
      categories: ['general'],
      image: 'https://picsum.photos/800/400'
    };
    
    // Add to mock events for future reference
    mockEvents.push(event);
  }
  
  console.log('Found/created event:', event);
  return event;
};

export const eventService = {
  // Get upcoming events
  getUpcomingEvents: async () => {
    const response = await api.get('/events/upcoming');
    return response.data;
  },

  // Get organizer's events
  getOrganizerEvents: async () => {
    try {
      const response = await api.get('/events/organizer');
      return response.data;
    } catch (error) {
      console.error('Error fetching organizer events:', error);
      throw error; // Don't use fallback, let the caller handle the error
    }
  },

  // Get event analytics
  getEventAnalytics: async () => {
    try {
      const response = await api.get('/events/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching event analytics:', error);
      throw error; // Don't use fallback, let the caller handle the error
    }
  },

  // Get all events
  getEvents: async (filters = {}) => {
    try {
      const response = await api.get('/events', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      // Fallback to mock data if API fails
      debugEvents(); // Debug event IDs
      let filteredEvents = [...mockEvents];
      
      // Apply filters
      if (filters.organizer) {
        filteredEvents = filteredEvents.filter(e => e.organizer === filters.organizer);
      }
      
      if (filters.status) {
        filteredEvents = filteredEvents.filter(e => e.status === filters.status);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredEvents = filteredEvents.filter(e => 
          e.title.toLowerCase().includes(searchTerm) || 
          e.description.toLowerCase().includes(searchTerm)
        );
      }
      
      return mockDelay(filteredEvents);
    }
  },
  
  // Get single event
  getEvent: async (eventId) => {
    try {
      console.log('===== GET EVENT DEBUG =====');
      console.log('Event ID received:', eventId);
      console.log('Event ID type:', typeof eventId);
      
      try {
        const response = await api.get(`/events/${eventId}`);
        return response.data;
      } catch (apiError) {
        console.log('API call failed, falling back to mock data');
        
        // Use the helper function to ensure we always get an event
        const event = getEventById(eventId);
        return mockDelay(event);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      
      // Final fallback - always return something
      const fallbackEvent = getEventById(eventId);
      return mockDelay(fallbackEvent);
    }
  },
  
  // Create new event
  createEvent: async (eventData) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Fallback to mock data
      const newEventId = 'e' + Math.floor(Math.random() * 10000);
      const newEvent = {
        id: newEventId,
        _id: newEventId,
        ...eventData,
        status: 'pending',
        attendees: [],
        capacity: eventData.capacity || 100,
        price: eventData.price || 0,
        createdAt: new Date().toISOString()
      };
      
      mockEvents.push(newEvent);
      return mockDelay(newEvent);
    }
  },
  
  // Update event
  updateEvent: async (eventId, eventData) => {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  },
  
  // Delete event
  deleteEvent: async (eventId) => {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },
  
  // Register for event
  registerForEvent: async (eventId) => {
    try {
      console.log('🎫 Registering for event:', eventId);
      
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to register for events');
      }
      
      console.log('👤 Current user:', user.email);
      
      // Make real API call to backend
      const response = await api.post(`/events/${eventId}/register`, {
        ticketType: 'General Admission',
        quantity: 1
      });
      
      console.log('✅ Registration successful:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  },
  
  // Cancel registration
  cancelRegistration: async (eventId) => {
    try {
      // In a real app: const response = await api.delete(`/events/${eventId}/register`);
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('You must be logged in to cancel registration');
      }
      
      // Debug event IDs
      debugEvents();
      console.log('Attempting to cancel registration for event with ID:', eventId);
      
      // Special case for event "1" - use the first event
      if (eventId === "1" || eventId === 1) {
        console.log('Special case: Using first event for cancellation');
        const firstEvent = mockEvents[0];
        
        // Check if user is registered
        if (!firstEvent.attendees.includes(user.id)) {
          throw new Error('You are not registered for this event');
        }
        
        // Remove user from attendees
        firstEvent.attendees = firstEvent.attendees.filter(id => id !== user.id);
        
        return mockDelay({
          message: 'Registration cancelled successfully',
          event: firstEvent
        });
      }
      
      // Convert eventId to string for comparison if it's a number
      const eventIdStr = eventId.toString();
      
      // Look for event with any matching ID format
      const eventIndex = mockEvents.findIndex(e => 
        e.id === eventId || 
        e._id === eventId || 
        e.id === eventIdStr || 
        e._id === eventIdStr
      );
      
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }
      
      const event = mockEvents[eventIndex];
      
      // Check if user is registered
      if (!event.attendees.includes(user.id)) {
        throw new Error('You are not registered for this event');
      }
      
      // Remove user from attendees
      mockEvents[eventIndex].attendees = event.attendees.filter(id => id !== user.id);
      
      return mockDelay({
        message: 'Registration cancelled successfully',
        event: mockEvents[eventIndex]
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to cancel registration');
    }
  },
  
  // Approve event (admin only)
  approveEvent: async (eventId) => {
    try {
      const response = await api.put(`/events/${eventId}/approve`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to approve event');
    }
  },
  
  // Reject event (admin only)
  rejectEvent: async (eventId, reason) => {
    try {
      const response = await api.put(`/events/${eventId}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reject event');
    }
  },

  // Get pending events for admin
  getPendingEvents: async () => {
    try {
      const response = await api.get('/events/admin/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending events:', error);
      // Fallback to mock data
      const pendingEvents = mockEvents.filter(e => e.status === 'pending');
      return mockDelay(pendingEvents);
    }
  }
};

export default eventService; 