const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { checkJwt, checkUser, authorize } = require('../middleware/auth');

// Test endpoint to verify user routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'User routes are working!', timestamp: new Date() });
});

// Get current user
router.get('/me', checkJwt, checkUser, async (req, res) => {
  try {
    console.log('👤 Getting current user profile');
    console.log('📧 User:', req.dbUser ? req.dbUser.email : 'NOT SET');
    
    if (!req.dbUser) {
      console.log('❌ No user found in request');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('✅ Returning user profile');
    res.json(req.dbUser);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register new user from Auth0
router.post('/register', checkJwt, async (req, res) => {
  try {
    const { name, email, picture, auth0Id, role } = req.body;
    
    // Validate auth0Id matches token subject
    if (auth0Id !== req.auth.sub) {
      return res.status(400).json({ message: 'Auth0 ID mismatch' });
    }
    
    // Check if user already exists
    let user = await User.findOne({ auth0Id });
    
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      picture,
      auth0Id,
      role: role || 'attendee' // Default to attendee if no role provided
    });
    
    await user.save();
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register new user from Auth0 (with Auth0 token)
router.post('/create-from-auth0', checkJwt, async (req, res) => {
  try {
    const { name, email, picture, auth0Id, role } = req.body;
    
    // Validate auth0Id matches token subject (skip in development)
    if (process.env.NODE_ENV !== 'development' && auth0Id !== req.auth.sub) {
      return res.status(400).json({ message: 'Auth0 ID mismatch' });
    }
    
    // Validate role
    const validRoles = ['attendee', 'organizer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role',
        validRoles
      });
    }
    
    // Check if user already exists
    let user = await User.findOne({ auth0Id });
    
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      picture,
      auth0Id,
      role
    });
    
    await user.save();
    console.log('New user created from Auth0:', user);
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user from Auth0:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create dummy user (for development purposes only)
router.post('/dummy', async (req, res) => {
  try {
    const { name, email, picture, auth0Id, role } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ auth0Id });
    
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      picture,
      auth0Id,
      role: role || 'attendee' // Default to attendee if no role provided
    });
    
    await user.save();
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating dummy user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', checkJwt, checkUser, async (req, res) => {
  try {
    console.log('🔧 Profile update request received');
    console.log('📋 Request body:', req.body);
    console.log('👤 Current user:', req.dbUser ? req.dbUser.email : 'NOT SET');
    
    if (!req.dbUser) {
      console.log('❌ No user found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const { name, bio, phone, location, preferences } = req.body;
    
    console.log('🔄 Updating user profile...');
    console.log('📝 Update data:', { name, bio, phone, location, preferences });
    
    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.dbUser._id,
      {
        $set: {
          name: name || req.dbUser.name,
          bio: bio || req.dbUser.bio,
          phone: phone || req.dbUser.phone,
          location: location || req.dbUser.location,
          preferences: preferences || req.dbUser.preferences,
          updatedAt: Date.now()
        }
      },
      { new: true }
    );
    
    console.log('✅ Profile updated successfully');
    console.log('📋 Updated user:', user.email, user.phone);
    
    res.json(user);
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin routes

// Get all users (admin only)
router.get('/', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (admin only)
router.put('/:userId/role', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['attendee', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add event to favorites
router.post('/favorites/:eventId', checkJwt, checkUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.dbUser._id;

    // Check if event is already in favorites
    if (req.dbUser.favoriteEvents.includes(eventId)) {
      return res.status(400).json({ message: 'Event already in favorites' });
    }

    // Add event to favorites
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favoriteEvents: eventId } },
      { new: true }
    );

    res.json({ message: 'Event added to favorites', success: true });
  } catch (error) {
    console.error('Error adding event to favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove event from favorites
router.delete('/favorites/:eventId', checkJwt, checkUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.dbUser._id;

    // Remove event from favorites
    await User.findByIdAndUpdate(
      userId,
      { $pull: { favoriteEvents: eventId } },
      { new: true }
    );

    res.json({ message: 'Event removed from favorites', success: true });
  } catch (error) {
    console.error('Error removing event from favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's favorite events
router.get('/favorites', checkJwt, checkUser, async (req, res) => {
  try {
    const user = await User.findById(req.dbUser._id)
      .populate({
        path: 'favoriteEvents',
        select: 'title description date location ticketPrice ticketTypes category image status',
        match: { status: { $ne: 'cancelled' } } // Only show non-cancelled events
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.favoriteEvents || []);
  } catch (error) {
    console.error('Error fetching favorite events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if event is in user's favorites
router.get('/favorites/:eventId/status', checkJwt, checkUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const isFavorite = req.dbUser.favoriteEvents.includes(eventId);
    
    res.json({ isFavorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get organizer activities
router.get('/organizer/activities', checkJwt, checkUser, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const Ticket = require('../models/Ticket');
    const Event = require('../models/Event');
    
    // Get recent activities for this organizer
    const activities = [];
    
    // Get recent events created by this organizer
    const recentEvents = await Event.find({ organizer: req.dbUser._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2)
      .select('title createdAt status');
    
    recentEvents.forEach(event => {
      activities.push({
        type: 'event_created',
        message: `Event "${event.title}" created`,
        time: event.createdAt,
        relatedEvent: event._id,
        color: 'blue'
      });
      
      if (event.status === 'published') {
        activities.push({
          type: 'event_published',
          message: `Event "${event.title}" published`,
          time: event.updatedAt || event.createdAt,
          relatedEvent: event._id,
          color: 'green'
        });
      }
    });
    
    // Get recent tickets sold for organizer's events
    const organizerEvents = await Event.find({ organizer: req.dbUser._id }).select('_id title');
    const eventIds = organizerEvents.map(e => e._id);
    
    const recentTickets = await Ticket.find({ event: { $in: eventIds } })
      .populate('event', 'title')
      .sort({ purchaseDate: -1 })
      .limit(parseInt(limit) / 2);
    
    recentTickets.forEach(ticket => {
      activities.push({
        type: 'ticket_sold',
        message: `New ticket sold for "${ticket.event.title}"`,
        time: ticket.purchaseDate,
        relatedEvent: ticket.event._id,
        relatedTicket: ticket._id,
        color: 'green'
      });
    });
    
    // Sort activities by time and limit
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivities = activities.slice(0, parseInt(limit));
    
    // Format time for display
    const formattedActivities = limitedActivities.map(activity => ({
      ...activity,
      timeFormatted: formatTimeAgo(activity.time)
    }));
    
    res.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching organizer activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

// Get organizer notifications
router.get('/organizer/notifications', checkJwt, checkUser, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, type, isRead } = req.query;
    const Notification = require('../models/Notification');
    
    // Get notifications for this organizer
    const result = await Notification.getUserNotifications(req.dbUser._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : null
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching organizer notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notifications count for organizer
router.get('/organizer/notifications/unread-count', checkJwt, checkUser, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const count = await Notification.getUnreadCount(req.dbUser._id);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/organizer/notifications/:notificationId/read', checkJwt, checkUser, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notification = await Notification.findById(req.params.notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.recipient.toString() !== req.dbUser._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await notification.markAsRead();
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read for organizer
router.put('/organizer/notifications/mark-all-read', checkJwt, checkUser, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    
    await Notification.updateMany(
      { 
        recipient: req.dbUser._id, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date(),
        status: 'read'
      }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;