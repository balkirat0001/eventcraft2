import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import favoritesService from '../services/favoritesService';
import { useNotification } from './NotificationContext';
import { useSelector } from 'react-redux';

const FavoriteButton = ({ eventId, size = 'md', className = '', showText = false, onUpdate }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { success, error: showError } = useNotification();
  const user = useSelector((state) => state.user.user);

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'p-1.5',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      button: 'p-2',
      icon: 'w-5 h-5',
      text: 'text-sm'
    },
    lg: {
      button: 'p-3',
      icon: 'w-6 h-6',
      text: 'text-base'
    }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  // Check favorite status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (!user || !eventId) {
        setChecking(false);
        return;
      }

      try {
        const status = await favoritesService.checkFavoriteStatus(eventId);
        setIsFavorite(status);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
  }, [eventId, user]);

  // Handle toggle favorite
  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showError('Please sign in to add favorites');
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      await favoritesService.toggleFavorite(eventId, isFavorite);
      setIsFavorite(!isFavorite);
      
      if (!isFavorite) {
        success('Event added to favorites!');
      } else {
        success('Event removed from favorites');
      }

      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showError(error.message || 'Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <motion.button
      onClick={handleToggleFavorite}
      disabled={loading || checking}
      className={`
        ${config.button}
        ${className}
        ${isFavorite 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-red-500'
        }
        ${(loading || checking) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-200 rounded-full hover:bg-gray-100
        flex items-center space-x-1
      `}
      whileHover={{ scale: loading ? 1 : 1.1 }}
      whileTap={{ scale: loading ? 1 : 0.95 }}
      title={
        checking ? 'Checking...' :
        loading ? 'Updating...' :
        isFavorite ? 'Remove from favorites' : 'Add to favorites'
      }
    >
      <Heart 
        className={`
          ${config.icon} 
          ${isFavorite ? 'fill-current' : ''}
          ${loading || checking ? 'animate-pulse' : ''}
        `} 
      />
      {showText && (
        <span className={`${config.text} font-medium`}>
          {checking ? 'Checking...' :
           loading ? 'Updating...' :
           isFavorite ? 'Favorited' : 'Add to Favorites'}
        </span>
      )}
    </motion.button>
  );
};

export default FavoriteButton;
