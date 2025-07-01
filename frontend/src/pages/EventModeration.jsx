import React, { useState, useEffect } from 'react';
import { getPendingEvents, approveEvent, rejectEvent, getApprovalStats } from '../services/adminService';

const EventModeration = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load pending events and stats
      const [eventsResponse, statsResponse] = await Promise.all([
        getPendingEvents(),
        getApprovalStats()
      ]);
      
      setEvents(eventsResponse.events || []);
      setStats(statsResponse);
    } catch (err) {
      console.error('Error loading moderation data:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId) => {
    try {
      setActionLoading(true);
      await approveEvent(eventId);
      
      // Remove approved event from list
      setEvents(events.filter(event => event._id !== eventId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1
      }));
      
      alert('Event approved successfully!');
    } catch (err) {
      console.error('Error approving event:', err);
      alert('Failed to approve event. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEvent || !rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    try {
      setActionLoading(true);
      await rejectEvent(selectedEvent._id, rejectionReason);
      
      // Remove rejected event from list
      setEvents(events.filter(event => event._id !== selectedEvent._id));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        rejected: prev.rejected + 1
      }));
      
      setShowRejectModal(false);
      setSelectedEvent(null);
      setRejectionReason('');
      alert('Event rejected successfully!');
    } catch (err) {
      console.error('Error rejecting event:', err);
      alert('Failed to reject event. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading events for moderation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-700 mb-2">🧐 Event Moderation</h2>
          <p className="text-gray-600">Review and approve events submitted by organizers</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button 
              onClick={loadData}
              className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <span className="text-2xl">❌</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reviewed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No events pending moderation at the moment.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Pending Approval
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <p><strong>Organizer:</strong> {event.organizer?.name} ({event.organizer?.email})</p>
                        <p><strong>Submitted:</strong> {formatDate(event.submittedAt)}</p>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{event.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center">
                          <span className="mr-2">📅</span>
                          <span>{formatDate(event.date)}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="mr-2">📍</span>
                          <span>{event.location}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="mr-2">🎫</span>
                          <span>{formatPrice(event.ticketPrice)}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="mr-2">👥</span>
                          <span>{event.capacity} capacity</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="mr-2">🏷️</span>
                          <span className="capitalize">{event.category}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="mr-2">🌐</span>
                          <span>{event.isVirtual ? 'Virtual' : 'In-Person'}</span>
                        </div>
                      </div>

                      {event.tags && event.tags.length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm font-medium text-gray-600 mr-2">Tags:</span>
                          {event.tags.map((tag, index) => (
                            <span key={index} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApprove(event._id)}
                      disabled={actionLoading}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✅ Approve
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowRejectModal(true);
                      }}
                      disabled={actionLoading}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ❌ Reject
                    </button>
                    
                    <button
                      onClick={() => window.open(`/event/${event._id}`, '_blank')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      👁️ Preview
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reject Event: {selectedEvent?.title}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (required)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                  placeholder="Please provide a clear reason for rejection..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Event'}
                </button>
                
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedEvent(null);
                    setRejectionReason('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventModeration;
