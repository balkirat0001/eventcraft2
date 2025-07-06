import React, { useState, useEffect, useMemo } from 'react';
import eventService from '../services/eventService';
import calendarService from '../services/calendarService';
import { useNotification } from '../components/NotificationContext';
import Button from '../components/ui/Button';
import '../components/Calendar.css';

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="mt-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Calendar</h3>
            <p className="text-gray-600">Fetching your events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center mb-3 sm:mb-0">
              <div className="text-2xl mr-2">📅</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Event Calendar</h1>
                <p className="text-gray-600 text-sm">Discover and manage your upcoming events</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex bg-white rounded-lg shadow-sm border text-sm">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-l-lg transition-colors ${
                    viewMode === 'month' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-r-lg transition-colors ${
                    viewMode === 'week' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Week
                </button>
              </div>
              <button 
                onClick={fetchEvents}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
              >
                🔄
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 shadow-sm text-sm">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                {error}
              </div>
            </div>
          )}

          {/* Month Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white rounded-lg shadow-sm border p-3 space-y-3 sm:space-y-0">
            <button
              onClick={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear(selectedYear - 1);
                } else {
                  setSelectedMonth(selectedMonth - 1);
                }
              }}
              className="flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm text-sm"
            >
              <span>←</span>
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>
            
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {monthNames[selectedMonth]} {selectedYear}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {filteredEvents.length} events
              </p>
              <button
                onClick={() => {
                  const today = new Date();
                  setSelectedMonth(today.getMonth());
                  setSelectedYear(today.getFullYear());
                  setSelectedDate(null);
                }}
                className="mt-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full hover:bg-gray-200 transition-colors"
              >
                Today
              </button>
            </div>
            
            <button
              onClick={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear(selectedYear + 1);
                } else {
                  setSelectedMonth(selectedMonth + 1);
                }
              }}
              className="flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-md border overflow-hidden mb-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center">
                <span className="text-xs font-semibold text-gray-700 hidden sm:block">{day}</span>
                <span className="text-xs font-semibold text-gray-700 sm:hidden">{day.slice(0, 1)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((week, weekIndex) => (
              week.map((day, dayIndex) => {
                if (day === null) {
                  return (
                    <div 
                      key={`${weekIndex}-${dayIndex}`} 
                      className="calendar-day border-r border-b border-gray-100 bg-gray-25"
                    />
                  );
                }
                
                const date = new Date(selectedYear, selectedMonth, day);
                const dateKey = date.toDateString();
                const dayEvents = eventsByDate[dateKey] || [];
                const isToday = new Date().toDateString() === dateKey;
                const isSelected = selectedDate === dateKey;
                
                return (
                  <div 
                    key={`${weekIndex}-${dayIndex}`}
                    onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                    className={`calendar-day border-r border-b border-gray-100 p-2 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                      isToday 
                        ? 'bg-blue-50 calendar-day-today' 
                        : isSelected 
                        ? 'bg-purple-50 calendar-day-selected'
                        : ''
                    }`}
                  >
                    <div className="h-full flex flex-col">
                      <div className={`text-xs font-medium mb-1 ${
                        isToday 
                          ? 'text-blue-700 font-bold' 
                          : isSelected 
                          ? 'text-purple-700 font-bold'
                          : 'text-gray-900'
                      }`}>
                        {day}
                      </div>
                      
                      <div className="flex-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map((event, index) => {
                          // Determine event color based on category
                          const getEventColor = (category) => {
                            switch(category?.toLowerCase()) {
                              case 'technology': return 'bg-blue-100 text-blue-800';
                              case 'business': return 'bg-green-100 text-green-800';
                              case 'arts': return 'bg-purple-100 text-purple-800';
                              case 'sports': return 'bg-orange-100 text-orange-800';
                              case 'education': return 'bg-indigo-100 text-indigo-800';
                              case 'entertainment': return 'bg-pink-100 text-pink-800';
                              default: return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800';
                            }
                          };
                          
                          return (
                            <div
                              key={event._id || event.id}
                              className={`calendar-event cursor-pointer hover:shadow-sm transition-all duration-200 ${getEventColor(event.category)}`}
                              title={`${event.title} - ${new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(dateKey);
                              }}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 font-medium px-1 py-0.5 bg-gray-100 rounded text-center">
                            +{dayEvents.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ))}
          </div>
        </div>

        {/* Selected Date Events */}
        {selectedDate && eventsByDate[selectedDate] && (
          <div className="mb-6 bg-white rounded-lg shadow-md border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Events on {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {eventsByDate[selectedDate].map((event) => (
                <div
                  key={event._id || event.id}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">{event.title}</h4>
                  <div className="space-y-1 text-xs text-gray-600 mb-2">
                    <p className="flex items-center">
                      <span className="mr-1">🕒</span>
                      {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <p className="flex items-center">
                      <span className="mr-1">📍</span>
                      <span className="truncate">{event.location || 'Location TBD'}</span>
                    </p>
                    <p className="flex items-center">
                      <span className="mr-1">💰</span>
                      {event.price ? `$${event.price}` : 'Free'}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => handleAddToCalendar(event)}
                      size="sm"
                      className="flex-1 bg-blue-600 text-white hover:bg-blue-700 text-xs py-1"
                    >
                      📅 Add
                    </Button>
                    <Button
                      onClick={() => handleAddReminder(event, 60)}
                      size="sm"
                      className="flex-1 bg-purple-600 text-white hover:bg-purple-700 text-xs py-1"
                    >
                      🔔 Remind
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events List */}
        <div className="bg-white rounded-lg shadow-md border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Upcoming Events
            </h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {filteredEvents.length}
            </span>
          </div>
          
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 6)
                .map((event) => (
                  <div
                    key={event._id || event.id}
                    className="group bg-gradient-to-br from-white to-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                        {event.title}
                      </h4>
                      {event.category && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded-full ml-1 whitespace-nowrap">
                          {event.category}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      <div className="flex items-center">
                        <span className="w-3 h-3 mr-2 text-blue-500">📅</span>
                        <span>{new Date(event.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 mr-2 text-green-500">📍</span>
                        <span className="truncate">{event.location || 'Location TBD'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 mr-2 text-yellow-500">💰</span>
                        <span className="font-medium">{event.price ? `$${event.price}` : 'Free'}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => handleAddToCalendar(event)}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 text-xs font-medium py-1"
                      >
                        📅 Add
                      </Button>
                      <Button
                        onClick={() => handleAddReminder(event, 60)}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 text-xs font-medium py-1"
                      >
                        🔔 Remind
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-md font-medium text-gray-900 mb-1">
                No Events This Month
              </h3>
              <p className="text-gray-500 mb-4 text-sm">
                No events scheduled for {monthNames[selectedMonth]} {selectedYear}
              </p>
              <Button
                onClick={() => {
                  const today = new Date();
                  setSelectedMonth(today.getMonth());
                  setSelectedYear(today.getFullYear());
                }}
                className="bg-blue-600 text-white hover:bg-blue-700 text-sm"
              >
                Go to Current Month
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
