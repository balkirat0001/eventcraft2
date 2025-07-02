const cron = require('node-cron');
const Event = require('../models/Event');
const User = require('../models/User');
const emailService = require('./emailService');
const smsService = require('./smsService');

// Run every day at midnight
const scheduleEventReminders = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running daily event reminder check...');
      
      // Find events happening tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      
      const events = await Event.find({
        date: { 
          $gte: tomorrow,
          $lt: dayAfter
        },
        status: 'published'
      }).populate('attendees.user');
      
      console.log(`Found ${events.length} events happening tomorrow`);
      
      // Send notifications to all attendees
      for (const event of events) {
        for (const attendee of event.attendees) {
          const user = attendee.user;
          
          // Send email notification
          if (user.preferences?.notifications?.email) {
            await emailService.sendEventReminder(user, event);
          }
          
          // Send SMS notification
          if (user.preferences?.notifications?.sms && user.phone) {
            await smsService.sendEventReminderSMS(user, event);
          }
        }
      }
      
      console.log('Event reminders sent successfully');
    } catch (error) {
      console.error('Error sending event reminders:', error);
    }
  });
};

// Run once per hour to check for events about to start
const scheduleImmediateReminders = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running hourly immediate reminder check...');
      
      // Find events happening in the next hour
      const now = new Date();
      const oneHourFromNow = new Date(now);
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
      
      const events = await Event.find({
        date: { 
          $gte: now,
          $lt: oneHourFromNow
        },
        status: 'published'
      }).populate('attendees.user');
      
      console.log(`Found ${events.length} events starting within the next hour`);
      
      // Send immediate reminders
      for (const event of events) {
        // Skip events that have already been reminded
        if (event.hourReminderSent) continue;
        
        for (const attendee of event.attendees) {
          const user = attendee.user;
          
          // Prioritize SMS for immediate notifications
          if (user.phone && user.preferences?.notifications?.sms) {
            await smsService.sendSMS({
              to: user.phone,
              body: `${event.title} is starting in about an hour! Location: ${event.location}`
            });
          } 
          // Fall back to email if no phone or SMS preference is off
          else if (user.preferences?.notifications?.email) {
            await emailService.sendEmail({
              to: user.email,
              subject: `${event.title} Starting Soon!`,
              html: `
                <h2>Your event is starting soon!</h2>
                <p>Hello ${user.name},</p>
                <p><strong>${event.title}</strong> is starting in about an hour at ${event.location}.</p>
                <p>We're looking forward to seeing you there!</p>
              `
            });
          }
        }
        
        // Mark this event as having sent the hour reminder
        await Event.findByIdAndUpdate(event._id, { hourReminderSent: true });
      }
      
    } catch (error) {
      console.error('Error sending immediate reminders:', error);
    }
  });
};

// Initialize all schedulers
const initializeSchedulers = () => {
  scheduleEventReminders();
  scheduleImmediateReminders();
  console.log('Notification schedulers initialized');
};

module.exports = {
  initializeSchedulers
}; 