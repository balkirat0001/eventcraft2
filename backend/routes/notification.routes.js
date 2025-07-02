const express = require('express');
const router = express.Router();
const { checkJwt, checkUser, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Event = require('../models/Event');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

// Update notification preferences
router.put('/preferences', checkJwt, checkUser, async (req, res) => {
  try {
    const { email, sms, eventTypes, showEmail, showPhone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.dbUser._id,
      {
        'preferences.notifications.email': email,
        'preferences.notifications.sms': sms,
        'preferences.eventTypes': eventTypes || [],
        'preferences.privacy.showEmail': showEmail,
        'preferences.privacy.showPhone': showPhone
      },
      { new: true }
    );
    
    res.json({
      message: 'Notification preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notification preferences
router.get('/preferences', checkJwt, checkUser, async (req, res) => {
  try {
    const user = await User.findById(req.dbUser._id);
    
    res.json({
      preferences: user.preferences || {
        notifications: {
          email: true,
          sms: true
        },
        eventTypes: [],
        privacy: {
          showEmail: false,
          showPhone: false
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send event notification (admin or organizer only)
router.post('/send', checkJwt, checkUser, authorize(['admin', 'organizer']), async (req, res) => {
  try {
    const { eventId, title, message, notificationType, sendToAll } = req.body;
    
    // Validate inputs
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    // Get event
    const event = await Event.findById(eventId).populate('attendees.user').populate('organizer');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the organizer or admin
    if (
      req.dbUser.role !== 'admin' && 
      event.organizer._id.toString() !== req.dbUser._id.toString()
    ) {
      return res.status(403).json({ message: 'You do not have permission to send notifications for this event' });
    }
    
    // Track notifications sent
    let emailCount = 0;
    let smsCount = 0;
    
    // Function to send notifications to a user
    const notifyUser = async (user) => {
      // Send email notification
      if (
        (notificationType === 'email' || notificationType === 'both') && 
        user.preferences?.notifications?.email
      ) {
        await emailService.sendEmail({
          to: user.email,
          subject: `${title} - ${event.title}`,
          html: `
            <h1>${title}</h1>
            <p>Event: ${event.title}</p>
            <p>${message}</p>
            <p>Date: ${new Date(event.date).toLocaleDateString()}</p>
            <p>Time: ${new Date(event.date).toLocaleTimeString()}</p>
            <p>Location: ${event.location}</p>
          `
        });
        emailCount++;
      }
      
      // Send SMS notification
      if (
        (notificationType === 'sms' || notificationType === 'both') && 
        user.preferences?.notifications?.sms && 
        user.phone
      ) {
        await smsService.sendSMS({
          to: user.phone,
          body: `${title} - ${event.title}: ${message}`
        });
        smsCount++;
      }
    };
    
    if (sendToAll) {
      // Send to all attendees
      for (const attendee of event.attendees) {
        await notifyUser(attendee.user);
      }
    } else {
      // Send only to users who match event types preference
      for (const attendee of event.attendees) {
        const user = attendee.user;
        
        // Skip if user has no preferences
        if (!user.preferences) continue;
        
        // Check if user is interested in this event category
        const userEventTypes = user.preferences.eventTypes || [];
        if (
          userEventTypes.length === 0 || // No preferences means receive all
          userEventTypes.includes(event.category)
        ) {
          await notifyUser(user);
        }
      }
    }
    
    res.json({ 
      message: 'Notifications sent successfully',
      stats: {
        emailCount,
        smsCount,
        totalRecipients: emailCount + smsCount
      }
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test notification (dev only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test', checkJwt, checkUser, async (req, res) => {
    try {
      const { type } = req.body;
      const user = req.dbUser;
      
      if (type === 'email' || type === 'both') {
        await emailService.sendEmail({
          to: user.email,
          subject: 'Test Notification from EventCraft',
          html: `
            <h1>This is a test notification</h1>
            <p>Hello ${user.name},</p>
            <p>This is a test email notification from EventCraft.</p>
            <p>If you received this, email notifications are working correctly!</p>
          `
        });
      }
      
      if ((type === 'sms' || type === 'both') && user.phone) {
        await smsService.sendSMS({
          to: user.phone,
          body: `EventCraft Test: Hello ${user.name}, this is a test SMS notification.`
        });
      }
      
      res.json({ message: 'Test notification sent successfully' });
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
}

module.exports = router; 