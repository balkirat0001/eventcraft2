import axios from 'axios';

const API_URL = '/api';

// Create axios instance with interceptors for auth
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const activityService = {
  // Get recent activities for organizer
  getRecentActivities: async () => {
    try {
      const response = await apiClient.get('/organizer/activities');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  },

  // Get activity feed for organizer
  getActivityFeed: async (limit = 10) => {
    try {
      const response = await apiClient.get(`/organizer/activity-feed?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      throw error;
    }
  },

  // Get event-specific activities
  getEventActivities: async (eventId) => {
    try {
      const response = await apiClient.get(`/events/${eventId}/activities`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event activities:', error);
      throw error;
    }
  }
};

export default activityService;
