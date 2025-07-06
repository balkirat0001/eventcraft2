const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide a date'],
    },
    endDate: {
      type: Date,
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
    },
    isVirtual: {
      type: Boolean,
      default: false,
    },
    virtualLink: {
      type: String,
    },
    image: {
      type: String,
      default: '',
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide a capacity'],
    },
    ticketPrice: {
      type: Number,
      default: 0,
    },
    ticketTypes: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        description: String,
        quantity: {
          type: Number,
          required: true,
        },
        quantitySold: {
          type: Number,
          default: 0,
        },
      },
    ],
    category: {
      type: String,
      required: [true, 'Please provide a category'],
    },
    tags: [String],
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        ticketType: String,
        purchaseDate: Date,
        checkedIn: {
          type: Boolean,
          default: false,
        },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'published', 'rejected', 'cancelled', 'completed'],
      default: 'draft',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    submittedForApproval: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    feedback: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create index for search
EventSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Event', EventSchema);