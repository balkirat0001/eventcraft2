const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MongoDB URI not found in environment variables');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample users (essential users only)
const sampleUsers = [
  {
    auth0Id: 'auth0|admin123',
    name: 'Admin User',
    email: 'admin@eventcraft.com',
    role: 'admin',
    picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    auth0Id: 'auth0|organizer1',
    name: 'Sarah Johnson',
    email: 'sarah@techconf.com',
    role: 'organizer',
    picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    auth0Id: 'auth0|organizer2',
    name: 'Mike Chen',
    email: 'mike@musicfest.com',
    role: 'organizer',
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    auth0Id: 'auth0|organizer3',
    name: 'Jessica Rodriguez',
    email: 'jessica@artevents.com',
    role: 'organizer',
    picture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face'
  }
];

// Sample events (18 events total)
const sampleEvents = [
  // Technology Events
  {
    title: 'AI & Machine Learning Summit 2025',
    description: 'The premier conference for AI professionals, researchers, and enthusiasts. Deep dive into the latest ML algorithms, neural networks, and AI applications across industries.',
    date: new Date('2025-03-15T09:00:00Z'),
    endDate: new Date('2025-03-15T18:00:00Z'),
    location: 'Silicon Valley Convention Center, San Jose',
    isVirtual: false,
    capacity: 800,
    ticketPrice: 350,
    ticketTypes: [
      { name: 'Early Bird', price: 299, description: 'Limited time offer', quantity: 200, quantitySold: 180 },
      { name: 'Regular', price: 350, description: 'Standard admission', quantity: 400, quantitySold: 320 },
      { name: 'VIP', price: 599, description: 'Premium access + networking dinner', quantity: 200, quantitySold: 150 }
    ],
    category: 'Technology',
    tags: ['AI', 'Machine Learning', 'Neural Networks', 'Deep Learning'],
    status: 'published',
    isPublic: true
  },
  {
    title: 'Web Development Bootcamp',
    description: 'Intensive 3-day hands-on workshop covering React, Node.js, and modern web development practices. Perfect for beginners and intermediate developers.',
    date: new Date('2025-02-20T09:00:00Z'),
    endDate: new Date('2025-02-22T17:00:00Z'),
    location: 'Tech Hub, Austin',
    isVirtual: true,
    capacity: 150,
    ticketPrice: 199,
    ticketTypes: [
      { name: 'Online Access', price: 199, description: 'Full workshop access', quantity: 150, quantitySold: 45 }
    ],
    category: 'Technology',
    tags: ['Web Development', 'React', 'Node.js', 'JavaScript'],
    status: 'draft',
    isPublic: true
  },
  {
    title: 'Blockchain & Crypto Expo',
    description: 'Explore the future of finance with blockchain technology, cryptocurrencies, and DeFi. Network with industry leaders and discover investment opportunities.',
    date: new Date('2025-04-10T10:00:00Z'),
    endDate: new Date('2025-04-10T19:00:00Z'),
    location: 'Financial District, New York',
    isVirtual: false,
    capacity: 600,
    ticketPrice: 275,
    ticketTypes: [
      { name: 'General', price: 275, description: 'Full expo access', quantity: 400, quantitySold: 380 },
      { name: 'Investor Pass', price: 450, description: 'VIP networking + exclusive sessions', quantity: 200, quantitySold: 190 }
    ],
    category: 'Technology',
    tags: ['Blockchain', 'Cryptocurrency', 'DeFi', 'Investment'],
    status: 'published',
    isPublic: true
  },

  // Music & Entertainment Events
  {
    title: 'Summer Music Festival 2025',
    description: 'Three days of incredible music featuring top artists across multiple genres. Food trucks, art installations, and unforgettable performances under the stars.',
    date: new Date('2025-07-18T16:00:00Z'),
    endDate: new Date('2025-07-20T23:00:00Z'),
    location: 'Golden Gate Park, San Francisco',
    isVirtual: false,
    capacity: 5000,
    ticketPrice: 180,
    ticketTypes: [
      { name: 'Single Day', price: 85, description: 'One day access', quantity: 2000, quantitySold: 1850 },
      { name: 'Weekend Pass', price: 180, description: 'All three days', quantity: 2500, quantitySold: 2400 },
      { name: 'VIP Experience', price: 350, description: 'Premium viewing + backstage access', quantity: 500, quantitySold: 480 }
    ],
    category: 'Music',
    tags: ['Festival', 'Live Music', 'Food', 'Art', 'Outdoor'],
    status: 'published',
    isPublic: true
  },
  {
    title: 'Jazz Night at Blue Note',
    description: 'An intimate evening of smooth jazz featuring local and international artists. Premium cocktails and fine dining available.',
    date: new Date('2025-02-14T20:00:00Z'),
    endDate: new Date('2025-02-14T23:30:00Z'),
    location: 'Blue Note Jazz Club, New York',
    isVirtual: false,
    capacity: 120,
    ticketPrice: 65,
    ticketTypes: [
      { name: 'General Seating', price: 65, description: 'Standard table seating', quantity: 80, quantitySold: 75 },
      { name: 'Premium Table', price: 95, description: 'Front row tables', quantity: 40, quantitySold: 38 }
    ],
    category: 'Music',
    tags: ['Jazz', 'Live Music', 'Intimate', 'Fine Dining'],
    status: 'published',
    isPublic: true
  },
  {
    title: 'Electronic Dance Music Rave',
    description: 'All-night electronic music party featuring top DJs and producers. Laser shows, incredible sound system, and non-stop dancing.',
    date: new Date('2025-03-08T22:00:00Z'),
    endDate: new Date('2025-03-09T06:00:00Z'),
    location: 'Warehouse District, Chicago',
    isVirtual: false,
    capacity: 1200,
    ticketPrice: 55,
    ticketTypes: [
      { name: 'General Admission', price: 55, description: 'Dance floor access', quantity: 1200, quantitySold: 25 }
    ],
    category: 'Music',
    tags: ['EDM', 'Rave', 'Electronic', 'Dancing', 'Nightlife'],
    status: 'draft',
    isPublic: true
  },

  // Food & Drink Events
  {
    title: 'International Food & Wine Festival',
    description: 'Taste cuisines from around the world paired with exceptional wines. Celebrity chef demonstrations and cooking workshops included.',
    date: new Date('2025-05-12T12:00:00Z'),
    endDate: new Date('2025-05-12T21:00:00Z'),
    location: 'Millennium Park, Chicago',
    isVirtual: false,
    capacity: 800,
    ticketPrice: 125,
    ticketTypes: [
      { name: 'Tasting Pass', price: 95, description: 'Food and wine tastings', quantity: 500, quantitySold: 470 },
      { name: 'Chef Experience', price: 125, description: 'Tastings + chef demonstrations', quantity: 200, quantitySold: 185 },
      { name: 'VIP Culinary', price: 195, description: 'All access + private chef dinner', quantity: 100, quantitySold: 95 }
    ],
    category: 'Food & Drink',
    tags: ['Food', 'Wine', 'International', 'Chefs', 'Culinary'],
    status: 'published',
    isPublic: true
  },
  {
    title: 'Craft Beer & BBQ Festival',
    description: 'The ultimate combination of craft beers and authentic BBQ from local breweries and pitmasters. Live country music and games.',
    date: new Date('2025-06-07T14:00:00Z'),
    endDate: new Date('2025-06-07T22:00:00Z'),
    location: 'Riverfront Park, Nashville',
    isVirtual: false,
    capacity: 1500,
    ticketPrice: 45,
    ticketTypes: [
      { name: 'General Admission', price: 45, description: 'Festival access + 5 tastings', quantity: 1500, quantitySold: 35 }
    ],
    category: 'Food & Drink',
    tags: ['Craft Beer', 'BBQ', 'Festival', 'Country Music'],
    status: 'draft',
    isPublic: true
  },

  // Business & Professional Events
  {
    title: 'Startup Pitch Competition',
    description: 'Watch emerging startups pitch to top VCs and angel investors. Network with entrepreneurs and industry leaders.',
    date: new Date('2025-03-25T18:00:00Z'),
    endDate: new Date('2025-03-25T22:00:00Z'),
    location: 'Innovation Hub, Austin',
    isVirtual: false,
    capacity: 300,
    ticketPrice: 85,
    ticketTypes: [
      { name: 'General Admission', price: 85, description: 'Event access + networking', quantity: 250, quantitySold: 95 },
      { name: 'Investor Pass', price: 150, description: 'VIP access + private mixer', quantity: 50, quantitySold: 48 }
    ],
    category: 'Business',
    tags: ['Startups', 'Venture Capital', 'Pitching', 'Networking', 'Investment'],
    status: 'draft',
    isPublic: true
  },
  {
    title: 'Digital Marketing Summit',
    description: 'Learn the latest digital marketing strategies, SEO techniques, and social media trends from industry experts.',
    date: new Date('2025-04-18T09:00:00Z'),
    endDate: new Date('2025-04-18T17:00:00Z'),
    location: 'Convention Center, Las Vegas',
    isVirtual: true,
    capacity: 500,
    ticketPrice: 195,
    ticketTypes: [
      { name: 'Virtual Access', price: 195, description: 'Live streaming + recordings', quantity: 300, quantitySold: 280 },
      { name: 'In-Person', price: 295, description: 'Physical attendance + networking', quantity: 200, quantitySold: 175 }
    ],
    category: 'Business',
    tags: ['Digital Marketing', 'SEO', 'Social Media', 'Analytics'],
    status: 'published',
    isPublic: true
  },

  // Arts & Culture Events
  {
    title: 'Contemporary Art Exhibition: Future Visions',
    description: 'Explore cutting-edge contemporary art from emerging artists worldwide. Interactive installations and virtual reality experiences.',
    date: new Date('2025-02-28T11:00:00Z'),
    endDate: new Date('2025-02-28T19:00:00Z'),
    location: 'Museum of Modern Art, Los Angeles',
    isVirtual: false,
    capacity: 400,
    ticketPrice: 35,
    ticketTypes: [
      { name: 'General Admission', price: 35, description: 'Exhibition access', quantity: 300, quantitySold: 285 },
      { name: 'Artist Meet & Greet', price: 65, description: 'Exhibition + artist talks', quantity: 100, quantitySold: 90 }
    ],
    category: 'Arts & Culture',
    tags: ['Contemporary Art', 'Exhibition', 'VR', 'Interactive'],
    status: 'published',
    isPublic: true
  },
  {
    title: 'Theater Workshop: Acting Masterclass',
    description: 'Learn from Broadway professionals in this intensive acting workshop. Scene work, character development, and performance techniques.',
    date: new Date('2025-03-30T10:00:00Z'),
    endDate: new Date('2025-03-30T16:00:00Z'),
    location: 'Drama Studio, New York',
    isVirtual: false,
    capacity: 25,
    ticketPrice: 150,
    ticketTypes: [
      { name: 'Workshop Pass', price: 150, description: 'Full day workshop', quantity: 25, quantitySold: 8 }
    ],
    category: 'Arts & Culture',
    tags: ['Theater', 'Acting', 'Workshop', 'Broadway'],
    status: 'draft',
    isPublic: true
  },

  // Sports & Fitness Events
  {
    title: 'Marathon Training Camp',
    description: 'Intensive 3-day training camp for marathon runners. Expert coaching, nutrition guidance, and performance analysis.',
    date: new Date('2025-04-05T06:00:00Z'),
    endDate: new Date('2025-04-07T18:00:00Z'),
    location: 'Mountain Training Center, Colorado',
    isVirtual: false,
    capacity: 100,
    ticketPrice: 395,
    ticketTypes: [
      { name: 'Training Camp', price: 395, description: 'Full 3-day program', quantity: 80, quantitySold: 65 },
      { name: 'Elite Package', price: 595, description: 'Training + accommodation + meals', quantity: 20, quantitySold: 18 }
    ],
    category: 'Sports',
    tags: ['Marathon', 'Running', 'Training', 'Fitness', 'Coaching'],
    status: 'published',
    isPublic: true
  },
  {
    title: 'Yoga & Wellness Retreat',
    description: 'Rejuvenate your mind and body with daily yoga sessions, meditation, healthy meals, and spa treatments in a serene setting.',
    date: new Date('2025-05-20T15:00:00Z'),
    endDate: new Date('2025-05-22T12:00:00Z'),
    location: 'Zen Retreat Center, Sedona',
    isVirtual: false,
    capacity: 50,
    ticketPrice: 450,
    ticketTypes: [
      { name: 'Retreat Package', price: 450, description: 'All sessions + accommodation', quantity: 50, quantitySold: 12 }
    ],
    category: 'Health & Fitness',
    tags: ['Yoga', 'Wellness', 'Meditation', 'Retreat', 'Spa'],
    status: 'draft',
    isPublic: true
  },

  // Education & Learning Events
  {
    title: 'Science Fair & Innovation Expo',
    description: 'Showcase of student innovations and scientific discoveries. Interactive exhibits, demonstrations, and STEM workshops for all ages.',
    date: new Date('2025-03-12T10:00:00Z'),
    endDate: new Date('2025-03-12T16:00:00Z'),
    location: 'Science Museum, Boston',
    isVirtual: false,
    capacity: 1000,
    ticketPrice: 15,
    ticketTypes: [
      { name: 'General Admission', price: 15, description: 'Full expo access', quantity: 800, quantitySold: 650 },
      { name: 'Family Pass', price: 45, description: 'Admission for family of 4', quantity: 200, quantitySold: 180 }
    ],
    category: 'Education',
    tags: ['Science', 'Innovation', 'STEM', 'Education', 'Family'],
    status: 'published',
    isPublic: true
  },
  {
    title: 'Language Learning Conference',
    description: 'Explore innovative language learning methods, cultural immersion techniques, and technology-assisted learning tools.',
    date: new Date('2025-04-22T09:00:00Z'),
    endDate: new Date('2025-04-22T17:00:00Z'),
    location: 'International Center, Washington DC',
    isVirtual: true,
    capacity: 200,
    ticketPrice: 125,
    ticketTypes: [
      { name: 'Virtual Access', price: 125, description: 'Online conference access', quantity: 200, quantitySold: 25 }
    ],
    category: 'Education',
    tags: ['Language Learning', 'Education', 'Technology', 'Culture'],
    status: 'draft',
    isPublic: true
  },

  // Community & Social Events
  {
    title: 'Environmental Awareness Fair',
    description: 'Learn about sustainability, climate action, and environmental protection. Green technology demos and eco-friendly vendors.',
    date: new Date('2025-04-22T11:00:00Z'),
    endDate: new Date('2025-04-22T18:00:00Z'),
    location: 'Central Park, New York',
    isVirtual: false,
    capacity: 2000,
    ticketPrice: 0,
    ticketTypes: [
      { name: 'Free Admission', price: 0, description: 'Open to all', quantity: 2000, quantitySold: 450 }
    ],
    category: 'Community',
    tags: ['Environment', 'Sustainability', 'Climate', 'Green Technology'],
    status: 'published',
    isPublic: true
  },
  {
    title: 'Local Farmers Market & Community Festival',
    description: 'Support local farmers and artisans. Fresh produce, handmade crafts, live music, and fun activities for the whole family.',
    date: new Date('2025-06-14T09:00:00Z'),
    endDate: new Date('2025-06-14T15:00:00Z'),
    location: 'Town Square, Portland',
    isVirtual: false,
    capacity: 1500,
    ticketPrice: 0,
    ticketTypes: [
      { name: 'Free Entry', price: 0, description: 'Community event', quantity: 1500, quantitySold: 300 }
    ],
    category: 'Community',
    tags: ['Farmers Market', 'Local', 'Community', 'Family', 'Crafts'],
    status: 'published',
    isPublic: true
  }
];

// Seed function
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    await Ticket.deleteMany({});

    console.log('Cleared existing data');

    // Insert users
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`Created ${createdUsers.length} users`);

    // Get user references
    const adminUser = createdUsers.find(u => u.role === 'admin');
    const organizers = createdUsers.filter(u => u.role === 'organizer');
    const attendees = createdUsers.filter(u => u.role === 'attendee');

    // Assign organizers to events randomly
    const eventsWithOrganizers = sampleEvents.map((event, index) => ({
      ...event,
      organizer: organizers[index % organizers.length]._id
    }));

    // Insert events
    const createdEvents = await Event.insertMany(eventsWithOrganizers);
    console.log(`Created ${createdEvents.length} events`);

    // Create tickets for published events
    const publishedEvents = createdEvents.filter(e => e.status === 'published');
    const tickets = [];

    publishedEvents.forEach(event => {
      // Create tickets for each event based on ticket types
      event.ticketTypes.forEach(ticketType => {
        const numTickets = ticketType.quantitySold;
        
        for (let i = 0; i < numTickets; i++) {
          const attendee = attendees[Math.floor(Math.random() * attendees.length)];
          const status = Math.random() > 0.05 ? 'active' : 'cancelled'; // 95% active
          
          tickets.push({
            event: event._id,
            user: attendee._id,
            ticketType: ticketType.name,
            price: ticketType.price,
            status: status,
            purchaseDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Random date in last 60 days
            checkedIn: Math.random() > 0.6, // 40% chance of being checked in
            checkedInTime: Math.random() > 0.6 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : null
          });
        }
      });
    });

    // Insert tickets
    const createdTickets = await Ticket.insertMany(tickets);
    console.log(`Created ${createdTickets.length} tickets`);

    // Update event attendees and revenue
    for (const event of publishedEvents) {
      const eventTickets = createdTickets.filter(t => 
        t.event.toString() === event._id.toString() && t.status === 'active'
      );
      
      const uniqueAttendees = [...new Set(eventTickets.map(t => t.user.toString()))];
      
      // Create attendees array with the correct structure
      const attendees = uniqueAttendees.map(attendeeId => {
        const attendeeTickets = eventTickets.filter(t => t.user.toString() === attendeeId);
        return {
          user: attendeeId,
          ticketType: attendeeTickets[0].ticketType,
          purchaseDate: attendeeTickets[0].purchaseDate,
          checkedIn: attendeeTickets.some(t => t.checkedIn)
        };
      });
      
      await Event.findByIdAndUpdate(event._id, {
        attendees: attendees
      });
    }

    console.log('Database seeding completed successfully!');
    console.log('\n🎉 Sample data summary:');
    console.log(`📊 Users: ${createdUsers.length} (1 admin, ${organizers.length} organizers, ${attendees.length} attendees)`);
    console.log(`🎪 Events: ${createdEvents.length} (${publishedEvents.length} published, ${createdEvents.length - publishedEvents.length} draft)`);
    console.log(`🎫 Tickets: ${createdTickets.length}`);
    
    console.log('\n🔑 Login credentials:');
    console.log('👑 Admin: admin@eventcraft.com');
    console.log('🎯 Organizers:');
    organizers.forEach(org => console.log(`   • ${org.email}`));
    console.log('👥 Sample Attendees:');
    attendees.slice(0, 3).forEach(att => console.log(`   • ${att.email}`));

    console.log('\n📅 Event distribution by category:');
    const eventsByCategory = createdEvents.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {});
    Object.entries(eventsByCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} events`);
    });

    console.log('\n🎯 Event status distribution:');
    const eventsByStatus = createdEvents.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(eventsByStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} events`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seed function
seedDatabase(); 