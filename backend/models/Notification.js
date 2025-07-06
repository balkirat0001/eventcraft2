const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Recipient information
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notification content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'info', 
      'success', 
      'warning', 
      'error', 
      'event_reminder', 
      'event_update', 
      'event_registered',
      'event_approved',
      'event_rejected',
      'event_updated',
      'event_cancelled',
      'ticket_confirmation',
      'ticket_cancelled',
      'ticket_checkin',
      'system',
      'system_announcement'
    ],
    default: 'info'
  },
  
  // Notification status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  
  // Delivery channels
  channels: {
    inApp: {
      enabled: { type: Boolean, default: true },
      sent: { type: Boolean, default: false },
      sentAt: { type: Date }
    },
    email: {
      enabled: { type: Boolean, default: false },
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      deliveryStatus: { type: String } // delivered, bounced, failed
    },
    sms: {
      enabled: { type: Boolean, default: false },
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      deliveryStatus: { type: String }
    }
  },
  
  // Related entities
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  relatedTicket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  
  // Action button (optional)
  action: {
    text: { type: String },
    url: { type: String },
    type: { type: String } // 'link', 'button', 'internal'
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'normal', 'medium', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Expiration
  expiresAt: {
    type: Date
  },
  
  // Scheduling
  scheduledFor: {
    type: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, scheduledFor: 1 });
NotificationSchema.index({ isRead: 1, recipient: 1 });
NotificationSchema.index({ type: 1, recipient: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update the updatedAt field before saving
NotificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Mark as read
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.status = 'read';
  return this.save();
};

// Mark as sent for a specific channel
NotificationSchema.methods.markAsSent = function(channel) {
  if (this.channels[channel]) {
    this.channels[channel].sent = true;
    this.channels[channel].sentAt = new Date();
    
    // Update overall status if all enabled channels are sent
    const enabledChannels = Object.keys(this.channels).filter(ch => this.channels[ch].enabled);
    const sentChannels = enabledChannels.filter(ch => this.channels[ch].sent);
    
    if (enabledChannels.length === sentChannels.length) {
      this.status = 'sent';
    }
  }
  return this.save();
};

// Static method to create notification
NotificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // Auto-schedule for immediate delivery if not scheduled
  if (!data.scheduledFor) {
    notification.scheduledFor = new Date();
    await notification.save();
  }
  
  return notification;
};

// Static method to get user's unread count
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    status: { $in: ['pending', 'sent', 'delivered'] }
  });
};

// Static method to get user's notifications with pagination
NotificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    isRead = null,
    priority = null
  } = options;
  
  const query = { recipient: userId };
  
  if (type) query.type = type;
  if (isRead !== null) query.isRead = isRead;
  if (priority) query.priority = priority;
  
  const notifications = await this.find(query)
    .populate('relatedEvent', 'title date location')
    .populate('relatedTicket', 'ticketNumber')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
  const total = await this.countDocuments(query);
  
  return {
    notifications,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

module.exports = mongoose.model('Notification', NotificationSchema);
