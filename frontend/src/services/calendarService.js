import api from './api';

const calendarService = {
  /**
   * Add event to calendar - generates ICS file
   */
  addToCalendar: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/calendar`);
      return response.data;
    } catch (error) {
      console.error('Error adding event to calendar:', error);
      throw new Error(error.response?.data?.message || 'Failed to add event to calendar');
    }
  },

  /**
   * Generate ICS content for an event
   */
  generateICS: (event) => {
    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // Default 2 hours duration
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EventCraft//EventCraft Calendar//EN
BEGIN:VEVENT
UID:${event._id || event.id}@eventcraft.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  },

  /**
   * Download ICS file for an event
   */
  downloadICS: (event) => {
    const icsContent = calendarService.generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
};

export default calendarService;
