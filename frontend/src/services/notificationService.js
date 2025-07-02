import api from './api';
import authService from './authService';

// Helper function to simulate API delays
const mockDelay = (data, ms = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data }), ms);
  });
};

// Mock notifications data
const mockNotifications = [
  {
    id: 'n001',
    userId: 'u001',
    title: 'Event Reminder',
    message: 'Your event "Tech Conference 2024" is starting tomorrow!',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
    type: 'reminder',
    relatedId: 'e001',
    url: '/event/e001'
  },
  {
    id: 'n002',
    userId: 'u001',
    title: 'Registration Confirmation',
    message: 'You have successfully registered for "Music Festival"',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    read: true,
    type: 'confirmation',
    relatedId: 'e002',
    url: '/event/e002'
  }
];

// Socket.io-like mock implementation
class MockSocketConnection {
  constructor() {
    this.connected = false;
    this.listeners = {};
    this.userId = null;
  }
  
  connect() {
    const user = authService.getCurrentUser();
    if (user) {
      this.userId = user.id;
      this.connected = true;
      
      // Trigger connect event
      if (this.listeners['connect']) {
        this.listeners['connect']();
      }
      
      // Setup mock message receiver
      this.messageInterval = setInterval(() => {
        // Randomly decide if we should send a notification
        if (Math.random() < 0.1 && this.connected) { // 10% chance every 5 seconds
          this.createRandomNotification();
        }
      }, 5000);
      
      return true;
    }
    return false;
  }
  
  disconnect() {
    this.connected = false;
    this.userId = null;
    
    // Clear interval
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
    }
    
    // Trigger disconnect event
    if (this.listeners['disconnect']) {
      this.listeners['disconnect']();
    }
  }
  
  on(event, callback) {
    this.listeners[event] = callback;
  }
  
  off(event) {
    delete this.listeners[event];
  }
  
  emit(event, data) {
    // For a real socket.io implementation, this would send to the server
    console.log(`Mock Socket emit: ${event}`, data);
  }
  
  // Helper to create random notifications for testing
  createRandomNotification() {
    if (!this.userId) return;
    
    const types = ['reminder', 'update', 'announcement'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const newNotification = {
      id: 'n' + Math.floor(Math.random() * 10000),
      userId: this.userId,
      title: `Random ${type} notification`,
      message: `This is a random ${type} notification for testing purposes.`,
      date: new Date().toISOString(),
      read: false,
      type,
      relatedId: 'e001',
      url: '/event/e001'
    };
    
    // Add to mock notifications
    mockNotifications.push(newNotification);
    
    // Trigger notification event
    if (this.listeners['notification']) {
      this.listeners['notification'](newNotification);
    }
  }
}

// Create singleton instance
const socketInstance = new MockSocketConnection();

const notificationService = {
  /**
   * Get user notification preferences
   */
  getPreferences: async () => {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notification preferences');
    }
  },

  /**
   * Update user notification preferences
   * 
   * @param {Object} preferences - The notification preferences
   * @param {boolean} preferences.email - Whether to receive email notifications
   * @param {boolean} preferences.sms - Whether to receive SMS notifications
   * @param {Array<string>} preferences.eventTypes - Types of events to receive notifications for
   * @param {boolean} preferences.showEmail - Whether to show email to other users
   * @param {boolean} preferences.showPhone - Whether to show phone number to other users
   */
  updatePreferences: async (preferences) => {
    try {
      const response = await api.put('/notifications/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw new Error(error.response?.data?.message || 'Failed to update notification preferences');
    }
  },

  /**
   * Send notification to event attendees
   * 
   * @param {Object} notification - The notification to send
   * @param {string} notification.eventId - The ID of the event
   * @param {string} notification.title - The notification title
   * @param {string} notification.message - The notification message
   * @param {string} notification.notificationType - The type of notification (email, sms, or both)
   * @param {boolean} notification.sendToAll - Whether to send to all attendees or only those matching preferences
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
   * 
   * @param {string} type - The type of notification to test (email, sms, or both)
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

  // Get user notifications
  getNotifications: async () => {
    try {
      // In a real app: const response = await api.get('/notifications');
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Filter notifications for current user
      const userNotifications = mockNotifications
        .filter(n => n.userId === user.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first
      
      return mockDelay(userNotifications);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
    }
  },
  
  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      // In a real app: const response = await api.put(`/notifications/${notificationId}/read`);
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Find notification
      const notificationIndex = mockNotifications.findIndex(n => 
        n.id === notificationId && n.userId === user.id
      );
      
      if (notificationIndex === -1) {
        throw new Error('Notification not found');
      }
      
      // Mark as read
      mockNotifications[notificationIndex].read = true;
      
      return mockDelay({
        success: true,
        notification: mockNotifications[notificationIndex]
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      // In a real app: const response = await api.put('/notifications/read-all');
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Mark all user's notifications as read
      mockNotifications.forEach(notification => {
        if (notification.userId === user.id) {
          notification.read = true;
        }
      });
      
      return mockDelay({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  },
  
  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      // In a real app: const response = await api.delete(`/notifications/${notificationId}`);
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Find notification
      const notificationIndex = mockNotifications.findIndex(n => 
        n.id === notificationId && n.userId === user.id
      );
      
      if (notificationIndex === -1) {
        throw new Error('Notification not found');
      }
      
      // Delete notification
      const deleted = mockNotifications.splice(notificationIndex, 1)[0];
      
      return mockDelay({
        success: true,
        message: 'Notification deleted',
        notification: deleted
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete notification');
    }
  },
  
  // Connect to socket for real-time notifications
  connectToSocket: () => {
    return socketInstance.connect();
  },
  
  // Disconnect from socket
  disconnectFromSocket: () => {
    socketInstance.disconnect();
  },
  
  // Get socket instance
  getSocketInstance: () => {
    return socketInstance;
  },
  
  // Create a new notification (for testing)
  createTestNotification: async (data) => {
    try {
      // In a real app: const response = await api.post('/notifications/test', data);
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Create a new notification
      const newNotification = {
        id: 'n' + Math.floor(Math.random() * 10000),
        userId: user.id,
        title: data.title || 'Test Notification',
        message: data.message || 'This is a test notification',
        date: new Date().toISOString(),
        read: false,
        type: data.type || 'test',
        relatedId: data.relatedId,
        url: data.url || '/'
      };
      
      // Add to mock notifications
      mockNotifications.push(newNotification);
      
      // If socket is connected, trigger notification event
      if (socketInstance.connected && socketInstance.listeners['notification']) {
        setTimeout(() => {
          socketInstance.listeners['notification'](newNotification);
        }, 1000);
      }
      
      return mockDelay({
        success: true,
        notification: newNotification
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create test notification');
    }
  }
};

export default notificationService;
export { mockNotifications }; 