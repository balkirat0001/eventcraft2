import api from './api';

const notificationService = {
  /**
   * Get all notifications for the current user
   */
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
    }
  },

  /**
   * Mark all organizer notifications as read
   */
  markAllAsRead: async () => {
    try {
      const response = await api.put('/users/organizer/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete notification');
    }
  },

  /**
   * Create a notification (admin feature)
   */
  createNotification: async (notificationData) => {
    try {
      const response = await api.post('/notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error(error.response?.data?.message || 'Failed to create notification');
    }
  },

  /**
   * Get user notification preferences
   */
  getPreferences: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data.preferences?.notifications || {};
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notification preferences');
    }
  },

  /**
   * Update user notification preferences
   */
  updatePreferences: async (preferences) => {
    try {
      const response = await api.patch('/user/profile', {
        preferences: {
          notifications: preferences
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw new Error(error.response?.data?.message || 'Failed to update notification preferences');
    }
  },

  /**
   * Send notification to event attendees (admin/organizer feature)
   */
  sendEventNotification: async (notification) => {
    try {
      const response = await api.post('/notifications/send', notification);
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error(error.response?.data?.message || 'Failed to send notification');
    }
  },

  /**
   * Send test notification (development only)
   */
  sendTestNotification: async (type) => {
    try {
      const response = await api.post('/notifications/test', { type });
      return response.data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw new Error(error.response?.data?.message || 'Failed to send test notification');
    }
  },

  /**
   * Get organizer notifications
   */
  getOrganizerNotifications: async (options = {}) => {
    try {
      const params = new URLSearchParams(options).toString();
      const response = await api.get(`/users/organizer/notifications?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching organizer notifications:', error);
      throw error;
    }
  },

  /**
   * Get unread notifications count
   */
  getUnreadNotificationsCount: async () => {
    try {
      const response = await api.get('/users/organizer/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      return 0;
    }
  },

  /**
   * Mark notification as read
   */
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/users/organizer/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
};

export default notificationService;