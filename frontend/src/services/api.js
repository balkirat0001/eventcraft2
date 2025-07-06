import axios from 'axios';

// Create axios instance
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add mock role header for development mode
    // Get user role from the user object in localStorage
    let userRole = 'attendee'; // Default to attendee instead of organizer
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role) {
        userRole = user.role;
      } else {
        // Fallback to separate userRole item if user object doesn't have role
        userRole = localStorage.getItem('userRole') || 'attendee';
      }
    } catch (e) {
      // If parsing fails, use the separate userRole item
      userRole = localStorage.getItem('userRole') || 'attendee';
    }
    
    config.headers['x-mock-role'] = userRole;
    
    console.log('🔧 API Request:', config.url);
    console.log('👤 Using role:', userRole);
    console.log('🔑 Has token:', !!token);
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration and other common errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', response.config?.url, response.status);
    return response;
  },
  (error) => {
    // Enhanced error logging for debugging
    console.error('❌ API Error Details:');
    console.error('🔗 URL:', error.config?.url || 'unknown endpoint');
    console.error('📊 Status:', error.response?.status);
    console.error('📄 Response Data:', error.response?.data);
    console.error('🔧 Request Headers:', error.config?.headers);
    console.error('📝 Full Error:', error);

    // Handle 401 errors (unauthorized)
    if (error.response && error.response.status === 401) {
      console.error('🚫 Unauthorized access - redirecting to login');
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle 404 errors (not found)
    if (error.response && error.response.status === 404) {
      console.error(`Endpoint not found: ${error.config?.url || 'unknown endpoint'}`);
    }

    // Handle 403 errors (forbidden)
    if (error.response && error.response.status === 403) {
      console.error(`Access forbidden: ${error.config?.url || 'unknown endpoint'}`);
    }

    // Handle 500 errors (server error)
    if (error.response && error.response.status >= 500) {
      console.error(`Server error: ${error.config?.url || 'unknown endpoint'}`);
    }

    return Promise.reject(error);
  }
);

// Mock service for events
const mockEvents = [
  {
    id: 'e001',
    title: 'Tech Conference 2024',
    description: 'Annual tech conference with industry leaders',
    date: '2024-11-15T09:00:00',
    endDate: '2024-11-17T18:00:00',
    location: 'Convention Center, New York',
    price: 299.99,
    organizer: 'u002',
    status: 'approved',
    capacity: 500,
    attendees: ['u001'],
    categories: ['technology', 'networking'],
    image: 'https://picsum.photos/800/400',
  },
  {
    id: 'e002',
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
    title: 'Startup Pitch Night',
    description: 'Pitch your startup idea to investors',
    date: '2024-07-10T18:00:00',
    endDate: '2024-07-10T21:00:00',
    location: 'Innovation Hub, San Francisco',
    price: 0,
    organizer: 'u002',
    status: 'pending',
    capacity: 100,
    attendees: ['u001'],
    categories: ['business', 'networking'],
    image: 'https://picsum.photos/800/402',
  }
];

// Mock vendors
const mockVendors = [
  {
    id: 'v001',
    name: 'Food Delights',
    description: 'Catering services for all types of events',
    contactEmail: 'food@example.com',
    contactPhone: '555-123-4567',
    services: ['catering', 'food trucks'],
    rating: 4.8,
  },
  {
    id: 'v002',
    name: 'Sound Systems Pro',
    description: 'Professional audio and lighting equipment',
    contactEmail: 'sound@example.com',
    contactPhone: '555-987-6543',
    services: ['audio equipment', 'lighting', 'stage setup'],
    rating: 4.5,
  }
];

// Helper function to simulate API delays
const mockDelay = (data, ms = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data }), ms);
  });
};

// Event Services
export const eventService = {
  // Get all events
  getEvents: async (filters = {}) => {
    try {
      // In a real app: const response = await api.get('/events', { params: filters });
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
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch events');
    }
  },
  
  // Get event by ID
  getEvent: async (id) => {
    try {
      // In a real app: const response = await api.get(`/events/${id}`);
      const event = mockEvents.find(e => e.id === id);
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      return mockDelay(event);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch event');
    }
  },
  
  // Create new event
  createEvent: async (eventData) => {
    try {
      // In a real app: const response = await api.post('/events', eventData);
      const newEvent = {
        id: 'e' + Math.floor(Math.random() * 10000),
        ...eventData,
        status: 'pending',
        attendees: [],
        createdAt: new Date().toISOString()
      };
      
      mockEvents.push(newEvent);
      return mockDelay(newEvent);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create event');
    }
  },
  
  // Update event
  updateEvent: async (id, eventData) => {
    try {
      // In a real app: const response = await api.put(`/events/${id}`, eventData);
      const index = mockEvents.findIndex(e => e.id === id);
      
      if (index === -1) {
        throw new Error('Event not found');
      }
      
      // Update event
      mockEvents[index] = { ...mockEvents[index], ...eventData };
      return mockDelay(mockEvents[index]);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update event');
    }
  },
  
  // Delete event
  deleteEvent: async (id) => {
    try {
      // In a real app: const response = await api.delete(`/events/${id}`);
      const index = mockEvents.findIndex(e => e.id === id);
      
      if (index === -1) {
        throw new Error('Event not found');
      }
      
      const deleted = mockEvents.splice(index, 1)[0];
      return mockDelay({ message: 'Event deleted successfully', event: deleted });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete event');
    }
  },
  
  // Register for event
  registerForEvent: async (eventId) => {
    try {
      // In a real app: const response = await api.post(`/events/${eventId}/register`);
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('You must be logged in to register for events');
      }
      
      const eventIndex = mockEvents.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }
      
      const event = mockEvents[eventIndex];
      
      // Check if user is already registered
      if (event.attendees.includes(user.id)) {
        throw new Error('You are already registered for this event');
      }
      
      // Check if event is at capacity
      if (event.attendees.length >= event.capacity) {
        throw new Error('This event is at full capacity');
      }
      
      // Register user
      mockEvents[eventIndex].attendees.push(user.id);
      
      return mockDelay({
        message: 'Registration successful',
        event: mockEvents[eventIndex]
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to register for event');
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
      
      const eventIndex = mockEvents.findIndex(e => e.id === eventId);
      
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
      throw new Error(error.response?.data?.message || 'Failed to cancel registration');
    }
  },
  
  // Approve event (admin only)
  approveEvent: async (eventId) => {
    try {
      // In a real app: const response = await api.put(`/admin/events/${eventId}/approve`);
      const user = authService.getCurrentUser();
      
      if (!user || user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const eventIndex = mockEvents.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }
      
      // Approve event
      mockEvents[eventIndex].status = 'approved';
      
      return mockDelay({
        message: 'Event approved successfully',
        event: mockEvents[eventIndex]
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to approve event');
    }
  },
  
  // Reject event (admin only)
  rejectEvent: async (eventId, reason) => {
    try {
      // In a real app: const response = await api.put(`/admin/events/${eventId}/reject`, { reason });
      const user = authService.getCurrentUser();
      
      if (!user || user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const eventIndex = mockEvents.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }
      
      // Reject event
      mockEvents[eventIndex].status = 'rejected';
      mockEvents[eventIndex].rejectionReason = reason;
      
      return mockDelay({
        message: 'Event rejected',
        event: mockEvents[eventIndex]
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reject event');
    }
  }
};

// Vendor Services
export const vendorService = {
  // Get all vendors
  getVendors: async () => {
    try {
      // In a real app: const response = await api.get('/vendors');
      return mockDelay(mockVendors);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch vendors');
    }
  },
  
  // Get vendor by ID
  getVendor: async (id) => {
    try {
      // In a real app: const response = await api.get(`/vendors/${id}`);
      const vendor = mockVendors.find(v => v.id === id);
      
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      
      return mockDelay(vendor);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch vendor');
    }
  },
  
  // Create new vendor
  createVendor: async (vendorData) => {
    try {
      // In a real app: const response = await api.post('/vendors', vendorData);
      const newVendor = {
        id: 'v' + Math.floor(Math.random() * 10000),
        ...vendorData,
        rating: 0,
        createdAt: new Date().toISOString()
      };
      
      mockVendors.push(newVendor);
      return mockDelay(newVendor);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create vendor');
    }
  },
  
  // Update vendor
  updateVendor: async (id, vendorData) => {
    try {
      // In a real app: const response = await api.put(`/vendors/${id}`, vendorData);
      const index = mockVendors.findIndex(v => v.id === id);
      
      if (index === -1) {
        throw new Error('Vendor not found');
      }
      
      // Update vendor
      mockVendors[index] = { ...mockVendors[index], ...vendorData };
      return mockDelay(mockVendors[index]);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update vendor');
    }
  },
  
  // Delete vendor
  deleteVendor: async (id) => {
    try {
      // In a real app: const response = await api.delete(`/vendors/${id}`);
      const index = mockVendors.findIndex(v => v.id === id);
      
      if (index === -1) {
        throw new Error('Vendor not found');
      }
      
      const deleted = mockVendors.splice(index, 1)[0];
      return mockDelay({ message: 'Vendor deleted successfully', vendor: deleted });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete vendor');
    }
  }
};

// User services
export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      // In a real app: const response = await api.get('/user/profile');
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      return mockDelay(user);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    try {
      // In a real app: const response = await api.put('/user/profile', userData);
      return authService.updateProfile(userData);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },
  
  // Get user events
  getUserEvents: async () => {
    try {
      // In a real app: const response = await api.get('/user/events');
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Get events user is attending
      const attendingEvents = mockEvents.filter(e => e.attendees.includes(user.id));
      
      // If user is an organizer, also get events they're organizing
      let organizingEvents = [];
      if (user.role === 'organizer' || user.role === 'admin') {
        organizingEvents = mockEvents.filter(e => e.organizer === user.id);
      }
      
      return mockDelay({
        attending: attendingEvents,
        organizing: organizingEvents
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user events');
    }
  }
};

// Admin services
export const adminService = {
  // Get all users (admin only)
  getUsers: async () => {
    try {
      // In a real app: const response = await api.get('/admin/users');
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      // Return all users without passwords
      const users = MOCK_USERS.map(({ password, ...user }) => user);
      return mockDelay(users);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },
  
  // Update user (admin only)
  updateUser: async (userId, userData) => {
    try {
      // In a real app: const response = await api.put(`/admin/users/${userId}`, userData);
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      // Update user
      MOCK_USERS[userIndex] = { 
        ...MOCK_USERS[userIndex], 
        ...userData,
        // Don't update password unless specifically provided
        password: userData.password || MOCK_USERS[userIndex].password
      };
      
      // Don't return password
      const { password, ...updatedUser } = MOCK_USERS[userIndex];
      
      return mockDelay(updatedUser);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },
  
  // Delete user (admin only)
  deleteUser: async (userId) => {
    try {
      // In a real app: const response = await api.delete(`/admin/users/${userId}`);
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      // Delete user
      const deleted = MOCK_USERS.splice(userIndex, 1)[0];
      
      // Don't return password
      const { password, ...deletedUser } = deleted;
      
      return mockDelay({ message: 'User deleted successfully', user: deletedUser });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },
  
  // Get dashboard stats (admin only)
  getDashboardStats: async () => {
    try {
      // In a real app: const response = await api.get('/admin/stats');
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      // Calculate stats
      const stats = {
        totalUsers: MOCK_USERS.length,
        totalEvents: mockEvents.length,
        pendingEvents: mockEvents.filter(e => e.status === 'pending').length,
        approvedEvents: mockEvents.filter(e => e.status === 'approved').length,
        rejectedEvents: mockEvents.filter(e => e.status === 'rejected').length,
        totalVendors: mockVendors.length,
        usersByRole: {
          admin: MOCK_USERS.filter(u => u.role === 'admin').length,
          organizer: MOCK_USERS.filter(u => u.role === 'organizer').length,
          attendee: MOCK_USERS.filter(u => u.role === 'attendee').length,
        }
      };
      
      return mockDelay(stats);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }
};

// Payment service (mock)
export const paymentService = {
  // Process payment
  processPayment: async (paymentData) => {
    try {
      // In a real app: const response = await api.post('/payments/process', paymentData);
      
      // Simulate payment processing
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Randomly succeed or fail to simulate real payment processing
          const isSuccessful = Math.random() > 0.2; // 80% success rate
          
          if (isSuccessful) {
            resolve({
              data: {
                success: true,
                transactionId: 'txn_' + Math.random().toString(36).substring(2, 15),
                amount: paymentData.amount,
                date: new Date().toISOString()
              }
            });
          } else {
            reject(new Error('Payment processing failed. Please try again.'));
          }
        }, 1500); // Longer delay to simulate payment processing
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Payment failed');
    }
  },
  
  // Get payment history
  getPaymentHistory: async () => {
    try {
      // In a real app: const response = await api.get('/payments/history');
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Mock payment history
      const mockPayments = [
        {
          id: 'pmt001',
          eventId: 'e001',
          eventTitle: 'Tech Conference 2024',
          amount: 299.99,
          date: '2024-06-15T10:30:00',
          status: 'completed'
        }
      ];
      
      return mockDelay(mockPayments);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
    }
  }
};

// Calendar integration service
export const calendarService = {
  // Add event to calendar
  addToCalendar: async (eventId) => {
    try {
      // In a real app: const response = await api.post(`/calendar/add/${eventId}`);
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const event = mockEvents.find(e => e.id === eventId);
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Create a downloadable ICS file
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EventCraft//EventCraftF//EN
BEGIN:VEVENT
UID:${event.id}@eventcraft.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${new Date(event.date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(event.endDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;
      
      // In a real app, you would return a link to download this file
      
      return mockDelay({
        message: 'Event added to calendar',
        icsData,
        event
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add event to calendar');
    }
  }
};

// QR Code service
export const qrCodeService = {
  // Generate QR code for ticket
  generateTicketQR: async (eventId) => {
    try {
      // In a real app: const response = await api.get(`/tickets/${eventId}/qr`);
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const event = mockEvents.find(e => e.id === eventId);
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Check if user is registered
      if (!event.attendees.includes(user.id)) {
        throw new Error('You are not registered for this event');
      }
      
      // In a real app, you would generate a real QR code with a unique ticket ID
      const ticketId = `TKT-${event.id}-${user.id}-${Date.now()}`;
      
      // Mock QR code data (in a real app, this would be a base64 image)
      const qrCodeData = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketId}`;
      
      return mockDelay({
        ticketId,
        qrCodeUrl: qrCodeData,
        eventTitle: event.title,
        eventDate: event.date,
        attendeeName: user.name
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate ticket QR code');
    }
  }
};

// Notification service
export const notificationService = {
  // Get user notifications
  getNotifications: async () => {
    try {
      // In a real app: const response = await api.get('/notifications');
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Mock notifications
      const mockNotifications = [
        {
          id: 'n001',
          title: 'Event Reminder',
          message: 'Your event "Tech Conference 2024" is starting tomorrow!',
          date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          read: false,
          type: 'reminder'
        },
        {
          id: 'n002',
          title: 'Registration Confirmation',
          message: 'You have successfully registered for "Music Festival"',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          read: true,
          type: 'confirmation'
        }
      ];
      
      return mockDelay(mockNotifications);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
    }
  },
  
  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      // In a real app: const response = await api.put(`/notifications/${notificationId}/read`);
      
      // Mock implementation
      return mockDelay({ success: true, notificationId });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
};

export default api;
