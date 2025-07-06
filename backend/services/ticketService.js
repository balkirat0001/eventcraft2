const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');

class TicketService {
  // Create a new ticket
  async createTicket(ticketData) {
    try {
      const ticket = new Ticket(ticketData);
      await ticket.save();
      
      // Populate the ticket with event and user data
      await ticket.populate('event', 'title date location');
      await ticket.populate('user', 'name email');
      
      return ticket;
    } catch (error) {
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  // Generate QR code for a ticket
  async generateQRCode(ticketId) {
    try {
      const ticket = await Ticket.findById(ticketId);
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.qrCode) {
        return ticket.qrCode;
      }

      // Create QR code data
      const qrData = {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        eventId: ticket.event,
        userId: ticket.user,
        timestamp: Date.now()
      };

      // Encode the data (in production, you should encrypt this)
      const qrString = Buffer.from(JSON.stringify(qrData)).toString('base64');
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;

      // Update ticket with QR code
      ticket.qrCode = qrCodeUrl;
      await ticket.save();

      return qrCodeUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  // Verify a ticket
  async verifyTicket(ticketCode, eventId = null) {
    try {
      let ticket = await Ticket.findOne({ ticketNumber: ticketCode })
        .populate('event', 'title date location organizer')
        .populate('user', 'name email');

      if (!ticket && typeof ticketCode === 'string') {
        // Try to find by QR code pattern if it's a string
        ticket = await Ticket.findOne({ qrCode: { $regex: ticketCode, $options: 'i' } })
          .populate('event', 'title date location organizer')
          .populate('user', 'name email');
      }

      if (!ticket) {
        return {
          isValid: false,
          message: 'Ticket not found'
        };
      }

      // Check if ticket belongs to specified event
      if (eventId && ticket.event._id.toString() !== eventId) {
        return {
          isValid: false,
          message: 'Ticket does not belong to this event'
        };
      }

      const isValid = ticket.status === 'confirmed';
      const isUsed = ticket.status === 'used';

      return {
        isValid,
        isUsed,
        ticket,
        message: isValid ? 'Valid ticket' : 
                isUsed ? 'Ticket already used' :
                ticket.status === 'cancelled' ? 'Ticket cancelled' : 'Invalid ticket'
      };
    } catch (error) {
      throw new Error(`Failed to verify ticket: ${error.message}`);
    }
  }

  // Check in a ticket
  async checkInTicket(ticketId, userId) {
    try {
      const ticket = await Ticket.findById(ticketId);
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.status !== 'confirmed') {
        throw new Error('Ticket cannot be checked in');
      }

      // Update ticket status
      ticket.status = 'used';
      ticket.checkInDate = new Date();
      await ticket.save();

      // Update event attendee status
      const event = await Event.findById(ticket.event);
      const attendee = event.attendees.find(
        att => att.user.toString() === ticket.user.toString()
      );
      
      if (attendee) {
        attendee.checkedIn = true;
        attendee.checkInDate = new Date();
        await event.save();
      }

      return ticket;
    } catch (error) {
      throw new Error(`Failed to check in ticket: ${error.message}`);
    }
  }

  // Cancel a ticket
  async cancelTicket(ticketId, reason = '') {
    try {
      const ticket = await Ticket.findById(ticketId);
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.status === 'used') {
        throw new Error('Cannot cancel a used ticket');
      }

      // Update ticket status
      ticket.status = 'cancelled';
      ticket.notes = reason;
      await ticket.save();

      // Remove user from event attendees
      const event = await Event.findById(ticket.event);
      event.attendees = event.attendees.filter(
        att => att.user.toString() !== ticket.user.toString()
      );
      await event.save();

      return ticket;
    } catch (error) {
      throw new Error(`Failed to cancel ticket: ${error.message}`);
    }
  }

  // Get ticket statistics for an event
  async getEventTicketStats(eventId) {
    try {
      const stats = await Ticket.aggregate([
        { $match: { event: new mongoose.Types.ObjectId(eventId) } },
        {
          $group: {
            _id: null,
            totalTickets: { $sum: 1 },
            totalRevenue: { $sum: '$price' },
            confirmedTickets: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
            },
            usedTickets: {
              $sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] }
            },
            cancelledTickets: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ]);

      const ticketTypeStats = await Ticket.aggregate([
        { $match: { event: new mongoose.Types.ObjectId(eventId) } },
        {
          $group: {
            _id: '$ticketType',
            count: { $sum: 1 },
            revenue: { $sum: '$price' }
          }
        }
      ]);

      return {
        overall: stats[0] || {
          totalTickets: 0,
          totalRevenue: 0,
          confirmedTickets: 0,
          usedTickets: 0,
          cancelledTickets: 0
        },
        byTicketType: ticketTypeStats
      };
    } catch (error) {
      throw new Error(`Failed to get ticket statistics: ${error.message}`);
    }
  }

  // Get user's tickets
  async getUserTickets(userId) {
    try {
      const tickets = await Ticket.find({ user: userId })
        .populate('event', 'title date location status')
        .sort({ purchaseDate: -1 });

      return tickets;
    } catch (error) {
      throw new Error(`Failed to get user tickets: ${error.message}`);
    }
  }

  // Get tickets for an event
  async getEventTickets(eventId) {
    try {
      const tickets = await Ticket.find({ event: eventId })
        .populate('user', 'name email phone')
        .populate('event', 'title date location')
        .sort({ purchaseDate: -1 });

      return tickets;
    } catch (error) {
      throw new Error(`Failed to get event tickets: ${error.message}`);
    }
  }

  // Bulk operations
  async bulkCheckIn(ticketIds, userId) {
    try {
      const result = await Ticket.updateMany(
        { 
          _id: { $in: ticketIds },
          status: 'confirmed'
        },
        { 
          status: 'used',
          checkInDate: new Date()
        }
      );

      return result;
    } catch (error) {
      throw new Error(`Failed to bulk check in tickets: ${error.message}`);
    }
  }

  // Validate ticket data
  validateTicketData(ticketData) {
    const required = ['event', 'user', 'ticketType'];
    const missing = required.filter(field => !ticketData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (ticketData.price < 0) {
      throw new Error('Ticket price cannot be negative');
    }

    if (ticketData.quantity && ticketData.quantity < 1) {
      throw new Error('Ticket quantity must be at least 1');
    }

    return true;
  }
}

module.exports = new TicketService();
