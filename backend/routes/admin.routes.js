const express = require('express');
const router = express.Router();
const { checkJwt, checkUser, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

// Test route - no authentication required
router.get('/test', (req, res) => {
  res.json({ message: 'Admin API is working!' });
});

// Get admin statistics
router.get('/stats', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get users by role
    const attendees = await User.countDocuments({ role: 'attendee' });
    const organizers = await User.countDocuments({ role: 'organizer' });
    const admins = await User.countDocuments({ role: 'admin' });
    
    // Get total events
    const totalEvents = await Event.countDocuments();
    
    // Get events by status
    const publishedEvents = await Event.countDocuments({ status: 'published' });
    const pendingReviews = await Event.countDocuments({ status: 'draft' });
    const cancelledEvents = await Event.countDocuments({ status: 'cancelled' });
    
    // Get total tickets sold
    const totalTickets = await Ticket.countDocuments();
    
    // Calculate platform revenue (assuming 10% commission)
    const tickets = await Ticket.find();
    const platformRevenue = tickets.reduce((total, ticket) => total + (ticket.price * 0.1), 0);
    
    // Get user growth (new users in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    
    res.json({
      totalUsers,
      attendees,
      organizers,
      admins,
      totalEvents,
      publishedEvents,
      pendingReviews,
      cancelledEvents,
      totalTickets,
      platformRevenue: Math.round(platformRevenue * 100) / 100,
      newUsers
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent users
router.get('/recent-users', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-__v');
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending events
router.get('/pending-events', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    const events = await Event.find({ status: 'draft' })
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching pending events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with pagination
router.get('/users', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    
    let query = {};
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by role
    if (role) {
      query.role = role;
    }
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v');
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role
router.put('/users/:userId/role', checkJwt, checkUser, authorize('admin'), async (req, res) => {
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

// Approve event
router.put('/events/:eventId/approve', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      { status: 'published' },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error approving event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject event
router.put('/events/:eventId/reject', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      { 
        status: 'cancelled',
        rejectionReason: reason
      },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error rejecting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get platform analytics
router.get('/analytics', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const attendees = await User.countDocuments({ role: 'attendee' });
    const organizers = await User.countDocuments({ role: 'organizer' });
    const admins = await User.countDocuments({ role: 'admin' });
    
    // Get event statistics
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ status: 'published' });
    const pendingEvents = await Event.countDocuments({ status: 'draft' });
    
    // Get revenue statistics
    const tickets = await Ticket.find();
    const totalRevenue = tickets.reduce((total, ticket) => total + ticket.price, 0);
    const platformRevenue = totalRevenue * 0.1; // 10% commission
    
    // Get recent activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const newEvents = await Event.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const newTickets = await Ticket.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    
    res.json({
      users: {
        total: totalUsers,
        attendees,
        organizers,
        admins,
        newUsers
      },
      events: {
        total: totalEvents,
        active: activeEvents,
        pending: pendingEvents,
        newEvents
      },
      revenue: {
        total: totalRevenue,
        platform: platformRevenue,
        newTickets
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard specific endpoints
router.get('/dashboard/stats', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ 
      status: 'published',
      date: { $gte: new Date() }
    });
    
    // Count pending events for approval
    const pendingEvents = await Event.countDocuments({
      $or: [
        { status: 'pending_approval' },
        { approvalStatus: 'pending', submittedForApproval: true }
      ]
    });
    
    // Calculate total revenue from tickets
    const tickets = await Ticket.find().populate('event');
    const totalRevenue = tickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0);
    
    // Get users registered this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thisMonth }
    });
    
    res.json({
      totalUsers,
      totalEvents,
      totalRevenue,
      activeEvents,
      pendingEvents,
      newUsersThisMonth
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/dashboard/activity', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    // Get recent events (last 10)
    const recentEvents = await Event.find()
      .populate('organizer', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get recent users (last 10)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role createdAt');
    
    // Format activity feed
    const activity = [];
    
    recentEvents.forEach(event => {
      activity.push({
        id: `event_${event._id}`,
        type: 'event_created',
        message: `New event "${event.title}" created by ${event.organizer?.name || 'Unknown'}`,
        time: event.createdAt,
        relativeTime: getRelativeTime(event.createdAt)
      });
    });
    
    recentUsers.forEach(user => {
      activity.push({
        id: `user_${user._id}`,
        type: 'user_registered',
        message: `User ${user.name} registered as ${user.role}`,
        time: user.createdAt,
        relativeTime: getRelativeTime(user.createdAt)
      });
    });
    
    // Sort by time and return latest 20
    activity.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    res.json(activity.slice(0, 20));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/dashboard/revenue', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    // Get monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const tickets = await Ticket.find({
      createdAt: { $gte: sixMonthsAgo }
    }).populate('event');
    
    // Group by month
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    tickets.forEach(ticket => {
      const date = new Date(ticket.createdAt);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += ticket.price || 0;
    });
    
    // Convert to array format
    const revenueData = Object.entries(monthlyData).map(([month, revenue]) => ({
      month: month.split(' ')[0], // Just the month name
      revenue
    }));
    
    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:userId', checkJwt, checkUser, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get relative time
function getRelativeTime(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    return `${diffInDays} days ago`;
  }
}

module.exports = router;