const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');
const smsService = require('./smsService');

class NotificationService {
  
  /**
   * Create and send a notification
   * @param {Object} data - Notification data
   * @param {String} data.user OR data.recipientId - User ID of recipient
   * @param {String} data.title - Notification title
   * @param {String} data.message - Notification message
   * @param {String} data.type - Notification type
   * @param {Object} data.data - Additional data
   * @param {Object} data.channels - Delivery channels configuration
   * @param {Object} options - Additional options
   */
  async createNotification(data, options = {}) {
    try {
      // Support both 'user' and 'recipientId' parameter names
      const recipientId = data.user || data.recipientId;
      if (!recipientId) {
        throw new Error('Recipient ID is required (use "user" or "recipientId" field)');
      }

      // Get recipient user data
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Determine channels based on user preferences
      const channels = await this.determineChannels(recipient, data.channels || {});

      // Create notification in database
      const notification = await Notification.createNotification({
        recipient: recipientId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        channels,
        relatedEvent: data.relatedEvent || data.data?.eventId,
        relatedTicket: data.relatedTicket || data.data?.ticketId,
        action: data.action,
        metadata: data.data || data.metadata || {},
        priority: data.priority || 'normal',
        expiresAt: data.expiresAt,
        scheduledFor: data.scheduledFor || new Date()
      });

      // Send notification immediately if not scheduled for later
      if (!data.scheduledFor || new Date(data.scheduledFor) <= new Date()) {
        await this.sendNotification(notification._id);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send a notification through enabled channels
   * @param {String} notificationId - Notification ID
   */
  async sendNotification(notificationId) {
    try {
      const notification = await Notification.findById(notificationId)
        .populate('recipient')
        .populate('relatedEvent')
        .populate('relatedTicket');

      if (!notification) {
        throw new Error('Notification not found');
      }

      const sendPromises = [];

      // Send via in-app (always enabled by default)
      if (notification.channels.inApp.enabled) {
        sendPromises.push(this.sendInAppNotification(notification));
      }

      // Send via email
      if (notification.channels.email.enabled) {
        sendPromises.push(this.sendEmailNotification(notification));
      }

      // Send via SMS
      if (notification.channels.sms.enabled) {
        sendPromises.push(this.sendSMSNotification(notification));
      }

      // Execute all sending operations
      await Promise.allSettled(sendPromises);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Mark in-app notification as sent
   * @param {Object} notification - Notification document
   */
  async sendInAppNotification(notification) {
    try {
      await notification.markAsSent('inApp');
      console.log(`In-app notification sent to ${notification.recipient.email}`);
      return { success: true, channel: 'inApp' };
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return { success: false, channel: 'inApp', error };
    }
  }

  /**
   * Send email notification
   * @param {Object} notification - Notification document
   */
  async sendEmailNotification(notification) {
    try {
      const emailTemplate = this.generateEmailTemplate(notification);
      
      const result = await emailService.sendEmail({
        to: notification.recipient.email,
        subject: notification.title,
        html: emailTemplate
      });

      if (result.success) {
        await notification.markAsSent('email');
        notification.channels.email.deliveryStatus = 'delivered';
        await notification.save();
        console.log(`Email notification sent to ${notification.recipient.email}`);
      } else {
        notification.channels.email.deliveryStatus = 'failed';
        await notification.save();
        throw new Error(result.error);
      }

      return { success: true, channel: 'email' };
    } catch (error) {
      console.error('Error sending email notification:', error);
      return { success: false, channel: 'email', error };
    }
  }

  /**
   * Send SMS notification
   * @param {Object} notification - Notification document
   */
  async sendSMSNotification(notification) {
    try {
      if (!notification.recipient.phone) {
        throw new Error('No phone number available');
      }

      const smsText = this.generateSMSText(notification);
      
      const result = await smsService.sendSMS({
        to: notification.recipient.phone,
        message: smsText
      });

      if (result.success) {
        await notification.markAsSent('sms');
        notification.channels.sms.deliveryStatus = 'delivered';
        await notification.save();
        console.log(`SMS notification sent to ${notification.recipient.phone}`);
      } else {
        notification.channels.sms.deliveryStatus = 'failed';
        await notification.save();
        throw new Error(result.error);
      }

      return { success: true, channel: 'sms' };
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return { success: false, channel: 'sms', error };
    }
  }

  /**
   * Determine notification channels based on user preferences
   * @param {Object} user - User document
   * @param {Object} requestedChannels - Requested channels
   */
  async determineChannels(user, requestedChannels = {}) {
    const userPrefs = user.preferences?.notifications || {};
    
    return {
      inApp: {
        enabled: requestedChannels.inApp !== false, // Default true unless explicitly disabled
        sent: false
      },
      email: {
        enabled: requestedChannels.email === true && userPrefs.email !== false,
        sent: false
      },
      sms: {
        enabled: requestedChannels.sms === true && userPrefs.sms === true && !!user.phone,
        sent: false
      }
    };
  }

  /**
   * Generate HTML email template
   * @param {Object} notification - Notification document
   */
  generateEmailTemplate(notification) {
    const baseTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; }
          .action-button { 
            display: inline-block; 
            background: #3b82f6; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 10px 0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 EventCraft</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            
            ${notification.relatedEvent ? `
              <div style="border: 1px solid #e5e7eb; padding: 15px; margin: 15px 0; border-radius: 6px;">
                <h3>📅 Event Details</h3>
                <p><strong>Event:</strong> ${notification.relatedEvent.title}</p>
                <p><strong>Date:</strong> ${new Date(notification.relatedEvent.date).toLocaleDateString()}</p>
                <p><strong>Location:</strong> ${notification.relatedEvent.location || 'TBD'}</p>
              </div>
            ` : ''}
            
            ${notification.action ? `
              <p style="text-align: center;">
                <a href="${notification.action.url}" class="action-button">${notification.action.text}</a>
              </p>
            ` : ''}
          </div>
          <div class="footer">
            <p>EventCraft - Your Event Management Platform</p>
            <p>You received this email because you're registered for our platform.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return baseTemplate;
  }

  /**
   * Generate SMS text
   * @param {Object} notification - Notification document
   */
  generateSMSText(notification) {
    let text = `EventCraft: ${notification.title}\n\n${notification.message}`;
    
    if (notification.relatedEvent) {
      text += `\n\nEvent: ${notification.relatedEvent.title}`;
      text += `\nDate: ${new Date(notification.relatedEvent.date).toLocaleDateString()}`;
    }
    
    if (notification.action?.url) {
      text += `\n\nView details: ${notification.action.url}`;
    }
    
    return text;
  }

  /**
   * Get user notifications with pagination
   * @param {String} userId - User ID
   * @param {Object} options - Query options
   */
  async getUserNotifications(userId, options = {}) {
    return await Notification.getUserNotifications(userId, options);
  }

  /**
   * Get unread notification count for user
   * @param {String} userId - User ID
   */
  async getUnreadCount(userId) {
    return await Notification.getUnreadCount(userId);
  }

  /**
   * Mark notification as read
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID (for security)
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    await notification.markAsRead();
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   * @param {String} userId - User ID
   */
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { 
        isRead: true, 
        readAt: new Date(),
        status: 'read'
      }
    );
    
    return result;
  }

  /**
   * Delete notification
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID (for security)
   */
  async deleteNotification(notificationId, userId) {
    const result = await Notification.deleteOne({
      _id: notificationId,
      recipient: userId
    });
    
    return result;
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications() {
    try {
      const scheduledNotifications = await Notification.find({
        status: 'pending',
        scheduledFor: { $lte: new Date() }
      });

      for (const notification of scheduledNotifications) {
        try {
          await this.sendNotification(notification._id);
        } catch (error) {
          console.error(`Error sending scheduled notification ${notification._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  /**
   * Create notifications for multiple users
   * @param {Object} data - Bulk notification data
   * @param {Array} data.users - Array of user IDs
   * @param {String} data.title - Notification title
   * @param {String} data.message - Notification message
   * @param {String} data.type - Notification type
   * @param {Object} data.data - Additional data
   * @param {Object} data.channels - Delivery channels configuration
   * @param {String} data.priority - Notification priority
   */
  async createBulkNotifications(data) {
    try {
      const notifications = [];
      
      for (const userId of data.users) {
        try {
          const notification = await this.createNotification({
            user: userId,
            title: data.title,
            message: data.message,
            type: data.type,
            data: data.data,
            channels: data.channels,
            priority: data.priority,
            scheduledFor: data.scheduledFor
          });
          notifications.push(notification);
        } catch (error) {
          console.error(`Failed to create notification for user ${userId}:`, error);
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Predefined notification templates
  async sendEventRegistrationConfirmation(userId, eventId, ticketId) {
    return await this.createNotification({
      recipientId: userId,
      title: 'Event Registration Confirmed! 🎉',
      message: 'Your event registration has been confirmed. We\'re excited to see you there!',
      type: 'ticket_confirmation',
      relatedEvent: eventId,
      relatedTicket: ticketId,
      channels: { email: true, inApp: true },
      action: {
        text: 'View Ticket',
        url: `/ticket/${ticketId}`,
        type: 'internal'
      },
      priority: 'high'
    });
  }

  async sendEventReminder(userId, eventId, hoursBeforeEvent = 24) {
    return await this.createNotification({
      recipientId: userId,
      title: 'Event Reminder 📅',
      message: `Your event is starting in ${hoursBeforeEvent} hours. Don't forget to attend!`,
      type: 'event_reminder',
      relatedEvent: eventId,
      channels: { email: true, sms: true, inApp: true },
      action: {
        text: 'View Event',
        url: `/event/${eventId}`,
        type: 'internal'
      },
      priority: 'high',
      scheduledFor: new Date(Date.now() + (24 - hoursBeforeEvent) * 60 * 60 * 1000)
    });
  }

  async sendEventCancellation(userId, eventId) {
    return await this.createNotification({
      recipientId: userId,
      title: 'Event Cancelled ❌',
      message: 'Unfortunately, this event has been cancelled. You will receive a full refund.',
      type: 'event_update',
      relatedEvent: eventId,
      channels: { email: true, sms: true, inApp: true },
      priority: 'urgent'
    });
  }

  async sendEventUpdate(userId, eventId, updateType, details) {
    return await this.createNotification({
      recipientId: userId,
      title: `Event Updated: ${updateType} 📝`,
      message: `There has been an update to your event. ${details}`,
      type: 'event_update',
      relatedEvent: eventId,
      channels: { email: true, inApp: true },
      action: {
        text: 'View Event',
        url: `/event/${eventId}`,
        type: 'internal'
      },
      priority: 'normal'
    });
  }
}

module.exports = new NotificationService();
