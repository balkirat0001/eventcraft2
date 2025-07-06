import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useNotification } from '../components/NotificationContext';
import ticketService from '../services/ticketService';
import calendarService from '../services/calendarService';
import eventService from '../services/eventService';

const TicketDetail = () => {
  // Get ticketId from URL params - this will work for both route patterns
  const params = useParams();
  const ticketId = params.ticketId;
  const eventId = params.eventId; // Will be undefined for /ticket/:ticketId route
  
  const user = useSelector(state => state.user.user);
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [event, setEvent] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  
  // Load ticket details
  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching ticket details for ID:', ticketId);
        console.log('Ticket ID type:', typeof ticketId);
        
        if (!ticketId) {
          console.error('No ticket ID provided');
          showError('No ticket ID provided');
          setLoading(false);
          return;
        }
        
        // Fetch ticket data
        let ticketData;
        try {
          const ticketResponse = await ticketService.getTicket(ticketId);
          ticketData = ticketResponse.data || ticketResponse;
          console.log('Ticket data retrieved from API:', ticketData);
        } catch (ticketError) {
          console.error('Error fetching ticket from API:', ticketError);
          showError('Ticket not found');
          setLoading(false);
          return;
        }
        
        setTicket(ticketData);
        console.log('Ticket set in state:', ticketData);
        
        // Check if ticket already has populated event data
        if (ticketData.event && typeof ticketData.event === 'object') {
          console.log('Ticket has populated event data:', ticketData.event);
          setEvent(ticketData.event);
          
          // If we have a QR code already, use it
          if (ticketData.qrCode) {
            setQrCode({ qrCodeUrl: ticketData.qrCode });
          }
          
          setLoading(false);
          return;
        }
         // Fetch event data using the eventId from the ticket
        let eventId = ticketData.event?._id || ticketData.event || ticketData.eventId;
        console.log('Event ID from ticket:', eventId);
        
        // If no eventId, show error
        if (!eventId) {
          console.error('No event ID found in ticket data');
          showError('Unable to load event details');
          setLoading(false);
          return;
        }

        try {
          console.log('Calling eventService.getEvent with ID:', eventId);
          const eventResponse = await eventService.getEvent(eventId);
          console.log('Raw event response:', eventResponse);
          const eventData = eventResponse.data || eventResponse;
          console.log('Event data retrieved:', eventData);
          setEvent(eventData);
        } catch (eventError) {
          console.error('Error fetching event:', eventError);
          showError('Unable to load event details');
          setLoading(false);
          return;
        }
        
        // Fetch QR code
        if (ticketData.status === 'confirmed') {
          try {
            // If ticket already has QR code, use it
            if (ticketData.qrCode) {
              setQrCode({ qrCodeUrl: ticketData.qrCode });
            } else {
              const qrResponse = await ticketService.generateTicketQR(ticketId);
              setQrCode(qrResponse.data || qrResponse);
            }
          } catch (qrError) {
            console.error('Error generating QR code:', qrError);
            // Don't fail if QR code generation fails
          }
        }
      } catch (err) {
        console.error('Error in fetchTicketDetails:', err);
        showError(err.message || 'Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicketDetails();
  }, [ticketId, showError]);
  
  // Handle adding to calendar
  const handleAddToCalendar = async () => {
    if (!event) {
      showError('Event details not available');
      return;
    }
    
    try {
      const response = await calendarService.addToCalendar(event.id || event._id);
      
      // Create a download link for the ICS file
      const element = document.createElement('a');
      const file = new Blob([response.data.icsFile], {type: 'text/calendar'});
      element.href = URL.createObjectURL(file);
      element.download = `${event.title.replace(/\s+/g, '-')}.ics`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      success('Event added to calendar');
    } catch (err) {
      showError(err.message || 'Failed to add event to calendar');
    }
  };
  
  // Handle ticket cancellation
  const handleCancelTicket = async () => {
    if (!window.confirm('Are you sure you want to cancel this ticket? This action cannot be undone.')) {
      return;
    }
    
    try {
      await ticketService.cancelTicket(ticketId);
      
      // Update ticket status locally
      setTicket(prev => ({
        ...prev,
        status: 'canceled'
      }));
      
      success('Ticket canceled successfully');
    } catch (err) {
      showError(err.message || 'Failed to cancel ticket');
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigate('/attendee/dashboard');
  };
  
  // Handle sharing ticket
  const handleShareTicket = () => {
    if (navigator.share) {
      navigator.share({
        title: `Ticket for ${event?.title || 'Event'}`,
        text: `Check out my ticket for ${event?.title || 'this event'}!`,
        url: window.location.href
      }).catch((error) => {
        showError('Error sharing ticket');
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      success('Ticket link copied to clipboard');
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center">
        <div className="bg-white w-full max-w-xl p-6 rounded shadow text-center">
          <p>Loading ticket details...</p>
        </div>
      </div>
    );
  }
  
  // No ticket found
  if (!ticket || !event) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center">
        <div className="bg-white w-full max-w-xl p-6 rounded shadow text-center">
          <p className="text-red-500">Ticket not found</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleBack}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <div className="bg-white w-full max-w-xl rounded-lg shadow overflow-hidden">
        {/* Event Banner */}
        <div className="relative">
          <img 
            src={event.image || 'https://picsum.photos/800/400'} 
            alt={event.title} 
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-4 text-white">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-sm opacity-90">
              {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        </div>
        
        {/* Ticket Status */}
        <div className={`px-4 py-2 text-sm font-medium text-center text-white ${
          ticket.status === 'confirmed' 
            ? 'bg-green-600' 
            : ticket.status === 'used' 
              ? 'bg-gray-600' 
              : 'bg-red-600'
        }`}>
          {ticket.status === 'confirmed' 
            ? 'Valid Ticket' 
            : ticket.status === 'used' 
              ? 'This ticket has been used' 
              : 'This ticket has been canceled'}
        </div>
        
        {/* Ticket Content */}
        <div className="p-6">
          {/* QR Code (if ticket is valid) */}
          {ticket.status === 'confirmed' && (
            <div className="flex flex-col items-center mb-6">
              <img 
                src={qrCode?.qrCodeUrl || ticket.qrCode || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DEMO-TICKET'} 
                alt="Ticket QR Code" 
                className="w-48 h-48"
              />
              <p className="mt-2 text-sm text-gray-500">Ticket #{ticket.ticketNumber}</p>
            </div>
          )}
          
          {/* Ticket Info */}
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h2 className="text-lg font-medium text-gray-900">Ticket Information</h2>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="text-gray-500">Ticket Type</div>
                <div className="text-gray-900">{ticket.ticketType}</div>
                
                <div className="text-gray-500">Price</div>
                <div className="text-gray-900">${typeof ticket.price === 'number' ? ticket.price.toFixed(2) : ticket.price}</div>
                
                <div className="text-gray-500">Purchase Date</div>
                <div className="text-gray-900">{new Date(ticket.purchaseDate).toLocaleDateString()}</div>
                
                <div className="text-gray-500">Status</div>
                <div className={`${
                  ticket.status === 'confirmed' 
                    ? 'text-green-600' 
                    : ticket.status === 'used' 
                      ? 'text-gray-600' 
                      : 'text-red-600'
                } font-medium`}>
                  {ticket.status === 'confirmed' 
                    ? 'Active' 
                    : ticket.status === 'used' 
                      ? 'Used' 
                      : 'Canceled'}
                </div>
              </div>
            </div>
            
            {/* Event Info */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-medium text-gray-900">Event Information</h2>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex items-start">
                  <span className="text-gray-500 w-24 flex-shrink-0">Location:</span>
                  <span className="text-gray-900">{event.location}</span>
                </div>
                
                <div className="flex items-start">
                  <span className="text-gray-500 w-24 flex-shrink-0">Date:</span>
                  <span className="text-gray-900">{new Date(event.date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-start">
                  <span className="text-gray-500 w-24 flex-shrink-0">Time:</span>
                  <span className="text-gray-900">{new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleBack}
                className="w-full py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                Back to Dashboard
              </button>
              
              {ticket.status === 'confirmed' && (
                <>
                  <button
                    onClick={handleAddToCalendar}
                    className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Add to Calendar
                  </button>
                  
                  <button
                    onClick={handleShareTicket}
                    className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                  >
                    Share Ticket
                  </button>
                  
                  <button
                    onClick={handleCancelTicket}
                    className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Cancel Ticket
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;