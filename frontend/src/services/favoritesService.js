import api from './api';

const favoritesService = {
  /**
   * Add event to favorites
   */
  addToFavorites: async (eventId) => {
    try {
      const response = await api.post(`/users/favorites/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error adding event to favorites:', error);
      throw new Error(error.response?.data?.message || 'Failed to add event to favorites');
    }
  },

  /**
   * Remove event from favorites
   */
  removeFromFavorites: async (eventId) => {
    try {
      const response = await api.delete(`/users/favorites/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing event from favorites:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove event from favorites');
    }
  },

  /**
   * Get user's favorite events
   */
  getFavorites: async () => {
    try {
      const response = await api.get('/users/favorites');
      return response.data;
    } catch (error) {
      console.error('Error fetching favorite events:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch favorite events');
    }
  },

  /**
   * Check if event is in favorites
   */
  checkFavoriteStatus: async (eventId) => {
    try {
      const response = await api.get(`/users/favorites/${eventId}/status`);
      return response.data.isFavorite;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  },

  /**
   * Toggle favorite status
   */
  toggleFavorite: async (eventId, currentStatus) => {
    try {
      if (currentStatus) {
        return await favoritesService.removeFromFavorites(eventId);
      } else {
        return await favoritesService.addToFavorites(eventId);
      }
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      throw error;
    }
  }
};

export default favoritesService;
