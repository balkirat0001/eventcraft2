import api from './api';

const ticketService = {
  // Get available ticket types for an event
  getTicketTypes: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/ticket-types`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch ticket types');
    }
  },
  
  // Purchase tickets
  purchaseTickets: async (eventId, ticketTypeId, quantity = 1) => {
    try {
      const response = await api.post(`/events/${eventId}/tickets`, { ticketTypeId, quantity });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to purchase tickets');
    }
  },
  
  // Get user's tickets (deprecated - use getMyTickets instead)
  getUserTickets: async (options = {}) => {
    try {
      const response = await api.get('/tickets', { params: options });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tickets');
    }
  },
  
  // Get a single ticket
  getTicket: async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch ticket');
    }
  },
  
  // Cancel a ticket
  cancelTicket: async (ticketId) => {
    try {
      const response = await api.put(`/tickets/${ticketId}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel ticket');
    }
  },
  
  // Generate QR code for a ticket
  generateTicketQR: async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}/qr`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate QR code');
    }
  },
  
  // Verify ticket (for organizers/staff)
  verifyTicket: async (ticketCode) => {
    try {
      const response = await api.post('/tickets/verify', { ticketCode });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to verify ticket');
    }
  },
  
  // Get event check-in stats (for organizers)
  getEventCheckInStats: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/check-in-stats`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch check-in stats');
    }
  },

  // Get user's tickets
  getMyTickets: async () => {
    try {
      console.log('🎫 getMyTickets: Making API call to /tickets/my-tickets');
      const response = await api.get('/tickets/my-tickets');
      console.log('✅ getMyTickets: API call successful');
      console.log('📊 getMyTickets: Response status:', response.status);
      console.log('📋 getMyTickets: Number of tickets:', response.data.length);
      console.log('🎫 getMyTickets: Raw response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getMyTickets: API call failed');
      console.error('📊 getMyTickets: Error status:', error.response?.status);
      console.error('📄 getMyTickets: Error data:', error.response?.data);
      console.error('🚨 getMyTickets: Full error:', error);
      throw error;
    }
  },

  // Purchase ticket
  purchaseTicket: async (eventId, quantity = 1) => {
    const response = await api.post('/tickets/purchase', { eventId, quantity });
    return response.data;
  },

  // Get event tickets (for organizers) - updated version
  getEventTickets: async (eventId) => {
    try {
      const response = await api.get(`/tickets/organizer/event-tickets?eventId=${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch event tickets');
    }
  },

  // Get all tickets for organizer's events
  getOrganizerEventTickets: async (options = {}) => {
    try {
      const params = new URLSearchParams(options).toString();
      const response = await api.get(`/tickets/organizer/event-tickets?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch organizer tickets');
    }
  },
};

export { ticketService };
export default ticketService;