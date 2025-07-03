import authService from './authService';
import { getEventById, mockEvents } from './eventService';

// Helper function to simulate API delays - reduced delay time for better performance
const mockDelay = (data, ms = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data }), ms);
  });
};

// Mock user calendar events
const mockCalendarEvents = [
  {
    id: 'cal001',
    userId: 'u001',
    eventId: 'e001',
    eventTitle: 'Tech Conference 2024',
    startDate: '2024-11-15T09:00:00',
    endDate: '2024-11-17T18:00:00',
    location: 'Convention Center, New York',
    addedOn: '2024-06-01T10:20:00',
    reminders: [
      { id: 'rem001', time: 1440, sent: false }, // 1 day before
      { id: 'rem002', time: 120, sent: false }   // 2 hours before
    ]
  }
];

// Mock user reminders
const mockReminders = [
  {
    id: 'rem001',
    userId: 'u001',
    eventId: 'e001',
    eventTitle: 'Tech Conference 2024',
    reminderTime: '2024-11-14T09:00:00', // 1 day before
    message: 'Reminder: Tech Conference 2024 starts tomorrow at 9:00 AM',
    status: 'pending',
    createdAt: '2024-06-01T10:20:00'
  },
  {
    id: 'rem002',
    userId: 'u001',
    eventId: 'e001',
    eventTitle: 'Tech Conference 2024',
    reminderTime: '2024-11-15T07:00:00', // 2 hours before
    message: 'Reminder: Tech Conference 2024 starts in 2 hours',
    status: 'pending',
    createdAt: '2024-06-01T10:20:00'
  }
];

const calendarService = {
  // Add event to user's calendar
  addToCalendar: async (eventId) => {
    try {
      // In a real app: const response = await api.post(`/calendar/events/${eventId}`);
      console.log('Adding event to calendar, ID:', eventId);
      
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('You must be logged in to add events to your calendar');
      }
      
      // Use the helper function from eventService to get the event
      const event = getEventById(eventId);
      
      if (!event) {
        throw new Error(`Event not found with ID: ${eventId}`);
      }
      
      console.log('Found event to add to calendar:', event);
      
      // Check if event is already in calendar
      const existingCalendarEvent = mockCalendarEvents.find(
        ce => (ce.eventId === eventId || ce.eventId === event.id || ce.eventId === event._id) && 
              ce.userId === user.id
      );
      
      if (existingCalendarEvent) {
        throw new Error('Event already added to your calendar');
      }
      
      // Create new calendar event
      const newCalendarEvent = {
        id: 'cal' + Math.floor(Math.random() * 10000),
        userId: user.id,
        eventId: event.id || event._id,
        eventTitle: event.title,
        startDate: event.date,
        endDate: event.endDate,
        location: event.location,
        addedOn: new Date().toISOString(),
        reminders: [
          { id: 'rem' + Math.floor(Math.random() * 10000), time: 1440, sent: false }, // 1 day before
          { id: 'rem' + Math.floor(Math.random() * 10000), time: 120, sent: false }   // 2 hours before
        ]
      };
      
      // Add to mock calendar events
      mockCalendarEvents.push(newCalendarEvent);
      
      // Create reminders
      const startDate = new Date(event.date);
      
      // 1 day before
      const oneDayBefore = new Date(startDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      
      // 2 hours before
      const twoHoursBefore = new Date(startDate);
      twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
      
      const newReminders = [
        {
          id: newCalendarEvent.reminders[0].id,
          userId: user.id,
          eventId: event.id || event._id,
          eventTitle: event.title,
          reminderTime: oneDayBefore.toISOString(),
          message: `Reminder: ${event.title} starts tomorrow at ${startDate.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}`,
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        {
          id: newCalendarEvent.reminders[1].id,
          userId: user.id,
          eventId: event.id || event._id,
          eventTitle: event.title,
          reminderTime: twoHoursBefore.toISOString(),
          message: `Reminder: ${event.title} starts in 2 hours`,
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ];
      
      // Add to mock reminders
      mockReminders.push(...newReminders);
      
      // Generate ICS file content
      const icsContent = generateICSFile(event);
      
      return mockDelay({
        message: 'Event added to calendar',
        calendarEvent: newCalendarEvent,
        icsFile: icsContent
      });
    } catch (error) {
      console.error('Error in addToCalendar:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to add event to calendar');
    }
  },
  
  // Remove event from user's calendar
  removeFromCalendar: async (eventId) => {
    try {
      // In a real app: const response = await api.delete(`/calendar/events/${eventId}`);
      
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('You must be logged in to manage your calendar');
      }
      
      // Find calendar event
      const calendarEventIndex = mockCalendarEvents.findIndex(
        ce => ce.eventId === eventId && ce.userId === user.id
      );
      
      if (calendarEventIndex === -1) {
        throw new Error('Event not found in your calendar');
      }
      
      // Get calendar event to return
      const calendarEvent = mockCalendarEvents[calendarEventIndex];
      
      // Remove from mock calendar events
      mockCalendarEvents.splice(calendarEventIndex, 1);
      
      // Remove associated reminders
      const reminderIds = calendarEvent.reminders.map(r => r.id);
      
      for (let i = mockReminders.length - 1; i >= 0; i--) {
        if (reminderIds.includes(mockReminders[i].id)) {
          mockReminders.splice(i, 1);
        }
      }
      
      return mockDelay({
        message: 'Event removed from calendar',
        calendarEvent
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to remove event from calendar');
    }
  },
  
  // Get user's calendar events
  getCalendarEvents: async (options = {}) => {
    try {
      // In a real app: const response = await api.get('/calendar/events', { params: options });
      
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('You must be logged in to view your calendar');
      }
      
      // Filter events for the current user
      let userEvents = mockCalendarEvents.filter(ce => ce.userId === user.id);
      
      // Apply additional filters
      if (options.startDate) {
        userEvents = userEvents.filter(ce => new Date(ce.startDate) >= new Date(options.startDate));
      }
      
      if (options.endDate) {
        userEvents = userEvents.filter(ce => new Date(ce.startDate) <= new Date(options.endDate));
      }
      
      // Sort by start date
      userEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      
      return mockDelay(userEvents);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch calendar events');
    }
  },
  
  // Add custom reminder for an event
  addReminder: async (eventId, reminderData) => {
    try {
      // In a real app: const response = await api.post(`/calendar/events/${eventId}/reminders`, reminderData);
      console.log('Adding reminder for event, ID:', eventId);
      
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      if (!reminderData || !reminderData.minutesBefore) {
        throw new Error('Reminder data is required with minutesBefore specified');
      }
      
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('You must be logged in to set reminders');
      }
      
      // Find event using helper function
      const event = getEventById(eventId);
      
      if (!event) {
        throw new Error(`Event not found with ID: ${eventId}`);
      }
      
      console.log('Found event for reminder:', event);
      
      // Find calendar event
      let calendarEvent = mockCalendarEvents.find(
        ce => (ce.eventId === eventId || ce.eventId === event.id || ce.eventId === event._id) && 
              ce.userId === user.id
      );
      
      // If event is not in calendar yet, add it first
      if (!calendarEvent) {
        try {
          // Create a new calendar event directly instead of calling another method
          calendarEvent = {
            id: 'cal' + Math.floor(Math.random() * 10000),
            userId: user.id,
            eventId: event.id || event._id,
            eventTitle: event.title,
            startDate: event.date,
            endDate: event.endDate || (event.date ? new Date(new Date(event.date).getTime() + 3600000).toISOString() : new Date(Date.now() + 3600000).toISOString()),
            location: event.location || 'Location TBD',
            addedOn: new Date().toISOString(),
            reminders: []
          };
          
          // Add to mock calendar events
          mockCalendarEvents.push(calendarEvent);
          
          console.log('Created new calendar event:', calendarEvent);
        } catch (error) {
          console.error('Failed to create calendar event:', error);
          
          // Create a minimal calendar event as fallback
          calendarEvent = {
            id: 'cal' + Math.floor(Math.random() * 10000),
            userId: user.id,
            eventId: eventId,
            eventTitle: event ? event.title : 'Event',
            startDate: event && event.date ? event.date : new Date().toISOString(),
            addedOn: new Date().toISOString(),
            reminders: []
          };
          
          // Add to mock calendar events
          mockCalendarEvents.push(calendarEvent);
        }
      }
      
      // Create new reminder
      const reminderId = 'rem' + Math.floor(Math.random() * 10000);
      
      // Calculate reminder time based on minutes before event
      const startDate = new Date(calendarEvent.startDate);
      const reminderDate = new Date(startDate);
      reminderDate.setMinutes(reminderDate.getMinutes() - reminderData.minutesBefore);
      
      // Add to calendar event reminders
      calendarEvent.reminders.push({
        id: reminderId,
        time: reminderData.minutesBefore,
        sent: false
      });
      
      // Create reminder
      const newReminder = {
        id: reminderId,
        userId: user.id,
        eventId: calendarEvent.eventId,
        eventTitle: calendarEvent.eventTitle,
        reminderTime: reminderDate.toISOString(),
        message: reminderData.message || `Reminder: ${calendarEvent.eventTitle} starts in ${reminderData.minutesBefore} minutes`,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      // Add to mock reminders
      mockReminders.push(newReminder);
      
      return mockDelay({
        message: 'Reminder added successfully',
        reminder: newReminder
      });
    } catch (error) {
      console.error('Error in addReminder:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to add reminder');
    }
  },
  
  // Remove reminder
  removeReminder: async (reminderId) => {
    try {
      // In a real app: const response = await api.delete(`/calendar/reminders/${reminderId}`);
      
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('You must be logged in to manage reminders');
      }
      
      // Find reminder
      const reminderIndex = mockReminders.findIndex(
        r => r.id === reminderId && r.userId === user.id
      );
      
      if (reminderIndex === -1) {
        throw new Error('Reminder not found');
      }
      
      // Get reminder to return
      const reminder = mockReminders[reminderIndex];
      
      // Remove from mock reminders
      mockReminders.splice(reminderIndex, 1);
      
      // Find and remove from calendar event reminders
      const calendarEvent = mockCalendarEvents.find(
        ce => ce.eventId === reminder.eventId && ce.userId === user.id
      );
      
      if (calendarEvent) {
        const reminderIndex = calendarEvent.reminders.findIndex(r => r.id === reminderId);
        
        if (reminderIndex !== -1) {
          calendarEvent.reminders.splice(reminderIndex, 1);
        }
      }
      
      return mockDelay({
        message: 'Reminder removed successfully',
        reminder
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to remove reminder');
    }
  },
  
  // Get upcoming reminders
  getUpcomingReminders: async () => {
    try {
      // In a real app: const response = await api.get('/calendar/reminders');
      
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('You must be logged in to view reminders');
      }
      
      // Get current date
      const now = new Date();
      
      // Filter upcoming reminders for the current user
      const upcomingReminders = mockReminders.filter(
        r => r.userId === user.id && 
        new Date(r.reminderTime) > now && 
        r.status === 'pending'
      );
      
      // Sort by reminder time
      upcomingReminders.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));
      
      return mockDelay(upcomingReminders);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch upcoming reminders');
    }
  },
  
  // Export calendar as ICS file
  exportCalendar: async () => {
    try {
      // In a real app: const response = await api.get('/calendar/export');
      
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('You must be logged in to export your calendar');
      }
      
      // Get user's calendar events
      const userEvents = mockCalendarEvents.filter(ce => ce.userId === user.id);
      
      // Generate ICS file content
      let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EventCraft//EventCraftF//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:EventCraft Events
X-WR-TIMEZONE:UTC
`;
      
      // Add each event
      userEvents.forEach(calendarEvent => {
        const startDate = new Date(calendarEvent.startDate);
        const endDate = new Date(calendarEvent.endDate);
        
        icsContent += `BEGIN:VEVENT
UID:${calendarEvent.id}@eventcraft.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${calendarEvent.eventTitle}
LOCATION:${calendarEvent.location || ''}
END:VEVENT
`;
      });
      
      icsContent += 'END:VCALENDAR';
      
      return mockDelay({
        icsContent,
        filename: `eventcraft-calendar-${new Date().getTime()}.ics`
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to export calendar');
    }
  }
};

// Helper function to format date for ICS file
const formatDateForICS = (date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

// Helper function to generate ICS file for a single event
const generateICSFile = (event) => {
  if (!event) {
    console.error('Cannot generate ICS file: Event is undefined');
    return '';
  }
  
  if (!event.date) {
    console.error('Cannot generate ICS file: Event date is missing', event);
    // Use current date as fallback
    event.date = new Date().toISOString();
  }
  
  const startDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 3600000); // Default to 1 hour
  
  const eventId = event.id || event._id || `event-${Date.now()}`;
  const eventTitle = event.title || 'Untitled Event';
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EventCraft//EventCraftF//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${eventId}@eventcraft.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${eventTitle}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`;
};

export default calendarService;