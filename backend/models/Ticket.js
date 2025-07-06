const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketNumber: {
    type: String,
    unique: true
  },
  ticketType: {
    type: String,
    default: 'General Admission'
  },
  price: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'used', 'refunded'],
    default: 'confirmed'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  checkInDate: {
    type: Date
  },
  qrCode: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'cash', 'free'],
    default: 'free'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  transactionId: {
    type: String
  },
  notes: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Generate ticket number before saving
TicketSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    // Generate unique ticket number: TCK-YYYY-XXXXXXXX
    const year = new Date().getFullYear();
    const randomNum = Math.random().toString(36).substr(2, 8).toUpperCase();
    this.ticketNumber = `TCK-${year}-${randomNum}`;
  }
  next();
});

// Index for ticket number lookup (must be unique)
TicketSchema.index({ ticketNumber: 1 }, { unique: true });

// Index for QR code lookup
TicketSchema.index({ qrCode: 1 });

// Index for event and user lookup (but not unique - users can have multiple tickets)
TicketSchema.index({ event: 1, user: 1 });

module.exports = mongoose.model('Ticket', TicketSchema);