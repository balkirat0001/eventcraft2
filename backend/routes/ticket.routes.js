const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { checkJwt, checkUser, authorize } = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const notificationService = require('../services/notificationService');

// Get user's tickets
router.get('/', checkJwt, checkUser, async (req, res) => {
  try {
    console.log(`🎫 === BASIC TICKETS ENDPOINT CALLED ===`);
    console.log(`👤 User: ${req.dbUser.email} (${req.dbUser._id})`);
    
    const tickets = await Ticket.find({ user: req.dbUser._id })
      .populate('event', 'title date location status')
      .sort({ purchaseDate: -1 });
    
    console.log(`✅ Found ${tickets.length} tickets (basic endpoint)`);
    console.log(`📤 Sending raw tickets to frontend`);
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's tickets (alternative endpoint for compatibility)
router.get('/my-tickets', checkJwt, checkUser, async (req, res) => {
  try {
    console.log(`🎫 === MY TICKETS ENDPOINT CALLED ===`);
    console.log(`👤 User: ${req.dbUser.email} (${req.dbUser._id})`);
    console.log(`🔍 Auth info:`, req.auth?.sub);
    
    const tickets = await Ticket.find({ user: req.dbUser._id })
      .populate('event', 'title date location status organizer')
      .sort({ purchaseDate: -1 });
    
    console.log(`✅ Found ${tickets.length} tickets for user ${req.dbUser.email}`);
    
    // Add detailed ticket info for debugging
    tickets.forEach((ticket, index) => {
      console.log(`  📋 Ticket ${index + 1}:`);
      console.log(`     ID: ${ticket._id}`);
      console.log(`     Event: ${ticket.event?.title || 'No event'}`);
      console.log(`     Status: ${ticket.status}`);
      console.log(`     Type: ${ticket.ticketType}`);
      console.log(`     Purchase Date: ${ticket.purchaseDate}`);
    });
    
    // Format response to match frontend expectations
    const formattedTickets = tickets.map(ticket => ({
      _id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      event: ticket.event ? {
        _id: ticket.event._id,
        title: ticket.event.title,
        date: ticket.event.date,
        location: ticket.event.location
      } : null,
      ticketType: ticket.ticketType,
      price: ticket.price,
      quantity: ticket.quantity,
      status: ticket.status,
      purchaseDate: ticket.purchaseDate,
      paymentMethod: ticket.paymentMethod,
      paymentStatus: ticket.paymentStatus,
      qrCode: ticket.qrCode
    }));
    
    console.log(`📤 Sending ${formattedTickets.length} formatted tickets to frontend`);
    res.json(formattedTickets);
  } catch (error) {
    console.error('❌ Error fetching user tickets:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific ticket
router.get('/:id', checkJwt, checkUser, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('event', 'title date location organizer')
      .populate('user', 'name email');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if user owns this ticket, is the event organizer, or is an admin
    const isOwner = ticket.user._id.toString() === req.dbUser._id.toString();
    const isEventOrganizer = ticket.event.organizer && ticket.event.organizer.toString() === req.dbUser._id.toString();
    const isAdmin = req.dbUser.role === 'admin';
    
    if (!isOwner && !isEventOrganizer && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel ticket
router.put('/:id/cancel', checkJwt, checkUser, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('event');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if user owns this ticket
    if (ticket.user.toString() !== req.dbUser._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this ticket' });
    }
    
    // Check if event hasn't started yet
    if (new Date() >= new Date(ticket.event.date)) {
      return res.status(400).json({ message: 'Cannot cancel ticket for events that have already started' });
    }
    
    ticket.status = 'cancelled';
    await ticket.save();
    
    // Remove user from event attendees
    const event = await Event.findById(ticket.event._id);
    event.attendees = event.attendees.filter(
      attendee => attendee.user.toString() !== req.dbUser._id.toString()
    );
    await event.save();
    
    // Send ticket cancellation notification
    await notificationService.createNotification({
      user: req.dbUser._id,
      type: 'ticket_cancelled',
      title: 'Ticket Cancelled',
      message: `Your ticket for "${ticket.event.title}" has been cancelled.`,
      data: {
        ticketId: ticket._id,
        eventId: ticket.event._id,
        ticketNumber: ticket.ticketNumber
      },
      priority: 'medium'
    });
    
    res.json({ message: 'Ticket cancelled successfully', ticket });
  } catch (error) {
    console.error('Error cancelling ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check-in ticket (for organizers)
router.put('/:id/checkin', checkJwt, checkUser, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('event');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if user is the event organizer or admin
    if (
      req.dbUser.role !== 'admin' &&
      ticket.event.organizer.toString() !== req.dbUser._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to check-in this ticket' });
    }
    
    ticket.status = 'used';
    ticket.checkInDate = new Date();
    await ticket.save();
    
    // Update attendee check-in status in event
    const event = await Event.findById(ticket.event._id);
    const attendee = event.attendees.find(
      att => att.user.toString() === ticket.user.toString()
    );
    if (attendee) {
      attendee.checkedIn = true;
    }
    await event.save();
    
    // Send check-in notification to attendee
    await notificationService.createNotification({
      user: ticket.user,
      type: 'ticket_checkin',
      title: 'Successfully Checked In',
      message: `You have been checked in to "${ticket.event.title}". Enjoy the event!`,
      data: {
        ticketId: ticket._id,
        eventId: ticket.event._id,
        checkInDate: ticket.checkInDate
      },
      priority: 'low'
    });
    
    res.json({ message: 'Ticket checked in successfully', ticket });
  } catch (error) {
    console.error('Error checking in ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tickets for a specific event (organizer only)
router.get('/event/:eventId', checkJwt, checkUser, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the event organizer or admin
    if (
      req.dbUser.role !== 'admin' &&
      event.organizer.toString() !== req.dbUser._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view tickets for this event' });
    }
    
    const tickets = await Ticket.find({ event: req.params.eventId })
      .populate('user', 'name email phone')
      .sort({ purchaseDate: -1 });
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching event tickets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate QR code for ticket
router.post('/:id/generate-qr', checkJwt, checkUser, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('event', 'title date location')
      .populate('user', 'name email');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if user owns this ticket
    if (ticket.user._id.toString() !== req.dbUser._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to generate QR code for this ticket' });
    }
    
    // Generate QR code data if not already exists
    if (!ticket.qrCode) {
      // Create QR code data with ticket information
      const qrData = {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        eventId: ticket.event._id,
        userId: ticket.user._id,
        timestamp: Date.now()
      };
      
      // In a real application, you would encrypt this data
      const qrString = Buffer.from(JSON.stringify(qrData)).toString('base64');
      
      // Generate QR code URL (using a QR code service or library)
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;
      
      // Update ticket with QR code
      ticket.qrCode = qrCodeUrl;
      await ticket.save();
    }
    
    res.json({
      success: true,
      qrCode: ticket.qrCode,
      ticketNumber: ticket.ticketNumber,
      eventTitle: ticket.event.title
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get QR code for ticket
router.get('/:id/qr', checkJwt, checkUser, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('event', 'title date location')
      .populate('user', 'name email');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if user owns this ticket
    if (ticket.user._id.toString() !== req.dbUser._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view QR code for this ticket' });
    }
    
    // Generate QR code if it doesn't exist
    if (!ticket.qrCode) {
      const qrData = {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        eventId: ticket.event._id,
        userId: ticket.user._id,
        timestamp: Date.now()
      };
      
      const qrString = Buffer.from(JSON.stringify(qrData)).toString('base64');
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;
      
      ticket.qrCode = qrCodeUrl;
      await ticket.save();
    }
    
    res.json({
      qrCodeUrl: ticket.qrCode,
      ticketNumber: ticket.ticketNumber,
      eventTitle: ticket.event.title
    });
  } catch (error) {
    console.error('Error fetching QR code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify ticket by QR code or ticket number
router.post('/verify', checkJwt, checkUser, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const { ticketCode, eventId } = req.body;
    
    let ticket;
    
    // Try to find ticket by ticket number first
    ticket = await Ticket.findOne({ ticketNumber: ticketCode })
      .populate('event', 'title date location organizer')
      .populate('user', 'name email');
    
    // If not found by ticket number, try by QR code
    if (!ticket) {
      ticket = await Ticket.findOne({ qrCode: { $regex: ticketCode } })
        .populate('event', 'title date location organizer')
        .populate('user', 'name email');
    }
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if the ticket belongs to the specified event
    if (eventId && ticket.event._id.toString() !== eventId) {
      return res.status(400).json({ message: 'Ticket does not belong to this event' });
    }
    
    // Check if user is authorized to verify tickets for this event
    if (
      req.dbUser.role !== 'admin' &&
      ticket.event.organizer.toString() !== req.dbUser._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to verify tickets for this event' });
    }
    
    // Return ticket verification details
    res.json({
      success: true,
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        ticketType: ticket.ticketType,
        checkInDate: ticket.checkInDate,
        purchaseDate: ticket.purchaseDate
      },
      event: {
        id: ticket.event._id,
        title: ticket.event.title,
        date: ticket.event.date,
        location: ticket.event.location
      },
      user: {
        name: ticket.user.name,
        email: ticket.user.email
      },
      isValid: ticket.status === 'confirmed',
      isUsed: ticket.status === 'used',
      message: ticket.status === 'confirmed' ? 'Valid ticket' : 
               ticket.status === 'used' ? 'Ticket already used' :
               ticket.status === 'cancelled' ? 'Ticket cancelled' : 'Invalid ticket'
    });
  } catch (error) {
    console.error('Error verifying ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ticket statistics for an event
router.get('/event/:eventId/stats', checkJwt, checkUser, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is authorized
    if (
      req.dbUser.role !== 'admin' &&
      event.organizer.toString() !== req.dbUser._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view ticket statistics for this event' });
    }
    
    const stats = await Ticket.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(req.params.eventId) } },
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
      { $match: { event: new mongoose.Types.ObjectId(req.params.eventId) } },
      {
        $group: {
          _id: '$ticketType',
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      }
    ]);
    
    res.json({
      overall: stats[0] || {
        totalTickets: 0,
        totalRevenue: 0,
        confirmedTickets: 0,
        usedTickets: 0,
        cancelledTickets: 0
      },
      byTicketType: ticketTypeStats,
      event: {
        title: event.title,
        capacity: event.capacity,
        attendeesCount: event.attendees.length
      }
    });
  } catch (error) {
    console.error('Error fetching ticket statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tickets for organizer's events
router.get('/organizer/event-tickets', checkJwt, checkUser, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const { eventId, page = 1, limit = 20, status } = req.query;
    
    // Get organizer's events
    let query = { organizer: req.dbUser._id };
    if (eventId) {
      query._id = eventId;
    }
    
    const organizerEvents = await Event.find(query).select('_id title');
    const eventIds = organizerEvents.map(e => e._id);
    
    if (eventIds.length === 0) {
      return res.json({ tickets: [], total: 0, page: 1, totalPages: 0 });
    }
    
    // Build ticket query
    let ticketQuery = { event: { $in: eventIds } };
    if (status) {
      ticketQuery.status = status;
    }
    
    // Get tickets for organizer's events
    const tickets = await Ticket.find(ticketQuery)
      .populate('event', 'title date location')
      .populate('user', 'name email')
      .sort({ purchaseDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Ticket.countDocuments(ticketQuery);
    
    res.json({
      tickets,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      events: organizerEvents
    });
  } catch (error) {
    console.error('Error fetching organizer event tickets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;