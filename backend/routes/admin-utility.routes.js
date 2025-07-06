const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

// Admin utility endpoint to create missing tickets
router.post('/admin/create-missing-tickets', async (req, res) => {
  try {
    console.log('🔄 Creating missing tickets for existing attendees...');
    
    // Find all events with attendees
    const events = await Event.find({ 'attendees.0': { $exists: true } }).populate('attendees.user');
    
    console.log(`📊 Found ${events.length} events with attendees`);
    
    let totalTicketsCreated = 0;
    const results = [];
    
    for (const event of events) {
      console.log(`\n🎪 Processing event: "${event.title}" (${event._id})`);
      console.log(`👥 Attendees count: ${event.attendees.length}`);
      
      // Check if tickets already exist for this event
      const existingTickets = await Ticket.find({ event: event._id });
      console.log(`🎫 Existing tickets: ${existingTickets.length}`);
      
      const attendeesToMigrate = [];
      
      for (const attendee of event.attendees) {
        // Check if this attendee already has a ticket
        const hasTicket = existingTickets.some(ticket => 
          ticket.user.toString() === attendee.user._id.toString()
        );
        
        if (!hasTicket) {
          attendeesToMigrate.push(attendee);
        }
      }
      
      console.log(`➡️  Attendees to migrate: ${attendeesToMigrate.length}`);
      
      if (attendeesToMigrate.length === 0) {
        console.log('✅ All attendees already have tickets');
        continue;
      }
      
      const tickets = [];
      
      for (const attendee of attendeesToMigrate) {
        // Generate unique ticket number
        const year = new Date().getFullYear();
        const randomNum = Math.random().toString(36).substr(2, 8).toUpperCase();
        const ticketNumber = `TCK-${year}-${randomNum}`;
        
        // Generate QR code
        const qrData = {
          eventId: event._id,
          userId: attendee.user._id,
          ticketType: attendee.ticketType || 'General Admission',
          timestamp: attendee.purchaseDate || Date.now()
        };
        
        const qrString = Buffer.from(JSON.stringify(qrData)).toString('base64');
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;
        
        // Find the correct ticket price
        let ticketPrice = 0;
        const selectedTicketType = attendee.ticketType || 'General Admission';
        
        if (event.ticketTypes && event.ticketTypes.length > 0) {
          const foundTicketType = event.ticketTypes.find(tt => tt.name === selectedTicketType);
          if (foundTicketType) {
            ticketPrice = foundTicketType.price || 0;
          } else {
            ticketPrice = event.ticketTypes[0].price || 0;
          }
        } else {
          ticketPrice = event.ticketPrice || 0;
        }
        
        const ticket = {
          event: event._id,
          user: attendee.user._id,
          ticketNumber: ticketNumber,
          ticketType: attendee.ticketType || 'General Admission',
          price: ticketPrice, // Use correct price
          quantity: 1,
          status: attendee.checkedIn ? 'used' : 'confirmed',
          purchaseDate: attendee.purchaseDate || new Date(),
          paymentMethod: 'free', // Use valid enum value
          paymentStatus: 'completed',
          qrCode: qrCodeUrl,
          metadata: {
            migrated: true,
            migratedAt: new Date(),
            originalAttendeeId: attendee._id
          }
        };
        
        tickets.push(ticket);
      }
      
      if (tickets.length > 0) {
        const savedTickets = await Ticket.insertMany(tickets);
        console.log(`✅ Created ${savedTickets.length} tickets for event "${event.title}"`);
        totalTicketsCreated += savedTickets.length;
        
        results.push({
          eventId: event._id,
          eventTitle: event.title,
          ticketsCreated: savedTickets.length,
          tickets: savedTickets.map(t => ({
            id: t._id,
            ticketNumber: t.ticketNumber,
            user: t.user
          }))
        });
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Total tickets created: ${totalTicketsCreated}`);
    
    // Verify migration
    const totalTickets = await Ticket.countDocuments();
    console.log(`🔍 Total tickets in database: ${totalTickets}`);
    
    res.json({
      success: true,
      message: 'Missing tickets created successfully',
      totalTicketsCreated,
      totalTicketsInDb: totalTickets,
      results
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Admin utility endpoint to fix existing ticket prices
router.post('/admin/fix-ticket-prices', async (req, res) => {
  try {
    console.log('🔄 Fixing existing ticket prices...');
    
    // Get all tickets with their events
    const tickets = await Ticket.find().populate('event');
    
    console.log(`📊 Found ${tickets.length} tickets to check`);
    
    let updatedCount = 0;
    const results = [];
    
    for (const ticket of tickets) {
      if (!ticket.event) {
        console.log(`⚠️ Ticket ${ticket._id} has no event - skipping`);
        continue;
      }
      
      const event = ticket.event;
      let correctPrice = 0;
      
      // Find the correct price based on ticket type
      if (event.ticketTypes && event.ticketTypes.length > 0) {
        const foundTicketType = event.ticketTypes.find(tt => tt.name === ticket.ticketType);
        if (foundTicketType) {
          correctPrice = foundTicketType.price || 0;
        } else {
          correctPrice = event.ticketTypes[0].price || 0;
        }
      } else {
        correctPrice = event.ticketPrice || 0;
      }
      
      // Update ticket if price is different
      if (ticket.price !== correctPrice) {
        console.log(`💰 Updating ticket ${ticket.ticketNumber}: $${ticket.price} → $${correctPrice}`);
        
        await Ticket.findByIdAndUpdate(ticket._id, { 
          price: correctPrice,
          paymentMethod: correctPrice > 0 ? 'card' : 'free'
        });
        
        updatedCount++;
        results.push({
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          eventTitle: event.title,
          oldPrice: ticket.price,
          newPrice: correctPrice
        });
      }
    }
    
    console.log(`✅ Fixed ${updatedCount} ticket prices`);
    
    res.json({
      success: true,
      message: `Fixed ${updatedCount} ticket prices`,
      updatedCount,
      results
    });
    
  } catch (error) {
    console.error('❌ Failed to fix ticket prices:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
