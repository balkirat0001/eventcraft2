import React, { useState, useEffect, useMemo } from 'react';
import eventService from '../services/eventService';
import calendarService from '../services/calendarService';
import { useNotification } from '../components/NotificationContext';
import Button from '../components/ui/Button';

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const notification = useNotification();

  // Fetch events only once when component mounts
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const eventsResponse = await eventService.getEvents({ 
        status: 'published',
        limit: 100 
      });
      
      const eventsData = Array.isArray(eventsResponse) 
        ? eventsResponse 
        : eventsResponse.events || eventsResponse.data || [];
      
      setEvents(eventsData);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add event to calendar - optimized to prevent UI blocking
  const handleAddToCalendar = async (event) => {
    try {
      if (!event || (!event.id && !event._id)) {
        notification.error('Invalid event data. Cannot add to calendar.');
        console.error('Invalid event data:', event);
        return;
      }

      const eventId = event.id || event._id;
      notification.info(`Adding ${event.title} to calendar...`);
      const result = await calendarService.addToCalendar(eventId);
      notification.success('Event added to calendar successfully!');
      
      // Trigger download of ICS file
      const blob = new Blob([result.icsFile], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.title}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error adding event to calendar:', error);
      notification.error(error.message || 'Failed to add event to calendar');
    }
  };

  // Add custom reminder - optimized to prevent UI blocking
  const handleAddReminder = async (event, minutesBefore) => {
    try {
      if (!event || (!event.id && !event._id)) {
        notification.error('Invalid event data. Cannot set reminder.');
        console.error('Invalid event data:', event);
        return;
      }

      const eventId = event.id || event._id;
      notification.info(`Setting reminder for ${event.title}...`);
      await calendarService.addReminder(eventId, {
        minutesBefore,
        message: `Reminder: ${event.title} starts in ${minutesBefore} minutes`
      });
      notification.success('Reminder set successfully!');
    } catch (error) {
      console.error('Error setting reminder:', error);
      notification.error(error.message || 'Failed to set reminder');
    }
  };

  // Memoize filtered events to prevent recalculation on every render
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
    });
  }, [events, selectedMonth, selectedYear]);

  // Memoize events grouped by date
  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce((acc, event) => {
      const dateKey = new Date(event.date).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {});
  }, [filteredEvents]);

  // Generate calendar grid - memoized to prevent recalculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const totalDays = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();
    
    // Create weeks array (6 rows maximum for a month)
    const weeks = [];
    let dayCount = 1;
    
    // Loop through weeks (max 6 weeks per month)
    for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
    const days = [];
    
      // Loop through days of the week
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        // Skip days before the first day of the month
        if (weekIndex === 0 && dayIndex < firstDayOfWeek) {
          days.push(null);
          continue;
        }
        
        // Stop after we've added all days of the month
        if (dayCount > totalDays) {
          days.push(null);
          continue;
        }
        
        // Add the day
        days.push(dayCount);
        dayCount++;
      }
      
      weeks.push(days);
      
      // Break if we've added all days
      if (dayCount > totalDays) {
        break;
      }
    }
    
    return weeks;
  }, [selectedMonth, selectedYear]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="text-3xl mr-3">📅</div>
          <h2 className="text-3xl font-bold text-blue-600">Event Calendar</h2>
          <div className="ml-auto">
          <button 
            onClick={fetchEvents}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-6 px-4">
            <button
              onClick={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear(selectedYear - 1);
                } else {
                  setSelectedMonth(selectedMonth - 1);
                }
              }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              ← Prev
            </button>
            
          <h3 className="text-2xl font-semibold text-gray-900">
              {monthNames[selectedMonth]} {selectedYear}
            </h3>
            
            <button
              onClick={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear(selectedYear + 1);
                } else {
                  setSelectedMonth(selectedMonth + 1);
                }
              }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              Next →
            </button>
        </div>

        {/* Calendar Table */}
        <table className="w-full border-collapse mb-8">
          <thead>
            <tr>
            {dayNames.map(day => (
                <th key={day} className="p-2 bg-blue-50 border text-gray-700">
                {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendarDays.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((day, dayIndex) => {
                  if (day === null) {
                    return <td key={dayIndex} className="border p-2"></td>;
                  }
                  
                  const date = new Date(selectedYear, selectedMonth, day).toDateString();
                  const dayEvents = eventsByDate[date] || [];
                  const isToday = new Date().toDateString() === date;
                  
                  return (
                    <td key={dayIndex} className={`border p-2 align-top ${isToday ? 'bg-blue-50' : ''}`}>
                      <div className="font-medium">{day}</div>
                      {dayEvents.length > 0 && (
                        <div className="mt-1">
                          <div className="text-blue-600 text-sm">
                            {dayEvents.length === 1 ? '1 event' : `${dayEvents.length} events`}
              </div>
                          <div className="text-blue-800 text-sm font-medium">
                            {dayEvents[0].title}
          </div>
                          <div className="mt-1 flex flex-col space-y-1">
                            <button
                              onClick={() => {
                                console.log('Event data:', dayEvents[0]);
                                handleAddToCalendar(dayEvents[0]);
                              }}
                              className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
                            >
                              Add to Calendar
                            </button>
                            <button
                              onClick={() => {
                                console.log('Event data:', dayEvents[0]);
                                handleAddReminder(dayEvents[0], 60);
                              }}
                              className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
                            >
                              Remind
                            </button>
          </div>
        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Upcoming Events List */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Events ({filteredEvents.length})
          </h3>
          
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 6)
                .map((event) => (
                  <div
                    key={event._id || event.id}
                    className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-600 hover:shadow-lg transition-shadow"
                  >
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">
                      {event.title}
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>📅 {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      <p>📍 {event.location || 'Location TBD'}</p>
                      <p>🎫 {event.price ? `$${event.price}` : 'Free'}</p>
                      {event.category && (
                        <p>🏷️ {event.category}</p>
                      )}
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <Button
                        onClick={() => handleAddToCalendar(event)}
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Add to Calendar
                      </Button>
                      <Button
                        onClick={() => handleAddReminder(event, 60)}
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Set Reminder
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No events scheduled for {monthNames[selectedMonth]} {selectedYear}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
