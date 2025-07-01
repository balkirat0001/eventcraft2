import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleSelectionModal from './components/RoleSelectionModal';
/*Chatbot import start*/
import { useEffect, useRef, useState } from "react";
import useAuth from './hooks/useAuth';
import ChatbotIcon from "./components/ChatbotIcon";
import ChatForm from "./components/ChatForm";
import ChatMessage from "./components/ChatMessage";
import { companyInfo } from "./companyInfo";
/*Chatbot import End*/


// Common Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import EventDetails from './pages/EventDetails';
import TicketDetail from './pages/TicketDetail';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import AuthHandler from './pages/AuthHandler';
import DummyUsers from './pages/DummyUsers';

// Attendee Pages
import AttendeeDashboard from './pages/AttendeeDashboard';
import EventRegistration from './pages/EventRegistration';
import CalendarView from './pages/CalendarView';

// Organizer Pages
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import EventManagement from './pages/EventManagement';
import VendorManagement from './pages/VendorManagement';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import UserManagementTest from './pages/UserManagementTest';
import EventModeration from './pages/EventModeration';
import ReportsFeedback from './pages/ReportsFeedback';

const App = () => {
  const user = useSelector((state) => state.user.user);
  const { showRoleSelection, setShowRoleSelection, initialUser, isLoading } = useAuth();

  // Simple dashboard redirect
  const DashboardRedirect = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'organizer':
        return <Navigate to="/organizer/dashboard" replace />;
      case 'attendee':
        return <Navigate to="/attendee/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  };

/*Chatbot code starts*/
  const chatBodyRef = useRef();
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      hideInChat: true,
      role: "model",
      text: companyInfo,
    },
  ]);
  const generateBotResponse = async (history) => {
    // Helper function to update chat history
    const updateHistory = (text, isError = false) => {
      setChatHistory((prev) => [...prev.filter((msg) => msg.text != "Thinking..."), { role: "model", text, isError }]);
    };

    // Format chat history for API request
    history = history.map(({ role, text }) => ({ role, parts: [{ text }] }));
    
    // Build the correct API URL
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;
    
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: history }),
    };

    try {
      // Make the API call to get the bot's response
      const response = await fetch(GEMINI_API_URL, requestOptions);
      
      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      // Check if the response has the expected structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Invalid response structure from API");
      }
      
      // Clean and update chat history with bot's response
      const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
      updateHistory(apiResponseText);
    } catch (error) {
      console.error('Chatbot Error:', error);
      // Update chat history with the error message
      updateHistory("Sorry, I'm having trouble connecting right now. Please try again later.", true);
    }
  };
  useEffect(() => {
    // Auto-scroll whenever chat history updates
    chatBodyRef.current.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: "smooth" });
  }, [chatHistory]);
  /*Chatbot code ends */

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Role Selection Modal */}
        <RoleSelectionModal 
          isOpen={showRoleSelection} 
          onClose={() => setShowRoleSelection(false)} 
          user={initialUser} 
        />

        {/* Main content with padding to prevent navbar overlap */}
        <div className="pt-16"> {/* Add padding-top to account for navbar height */}
          <Routes>
            {/* Common Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<AuthHandler />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/dummy-users" element={<DummyUsers />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/event/:id" element={
              <ProtectedRoute>
                <EventDetails />
              </ProtectedRoute>
            } />
            <Route path="/event/:eventId/ticket/:ticketId" element={
              <ProtectedRoute>
                <TicketDetail />
              </ProtectedRoute>
            } />

            {/* Attendee Routes */}
            <Route path="/attendee/dashboard" element={
              <ProtectedRoute requiredRoles={['attendee', 'organizer', 'admin']}>
                <AttendeeDashboard />
              </ProtectedRoute>
            } />
            <Route path="/attendee/register/:eventId" element={
              <ProtectedRoute requiredRoles={['attendee', 'organizer', 'admin']}>
                <EventRegistration />
              </ProtectedRoute>
            } />
            <Route path="/attendee/calendar" element={
              <ProtectedRoute requiredRoles={['attendee', 'organizer', 'admin']}>
                <CalendarView />
              </ProtectedRoute>
            } />

            {/* Organizer Routes */}
            <Route path="/organizer/dashboard" element={
              <ProtectedRoute requiredRoles={['organizer', 'admin']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/organizer/create-event" element={
              <ProtectedRoute requiredRoles={['organizer', 'admin']}>
                <CreateEvent />
              </ProtectedRoute>
            } />
            <Route path="/organizer/manage-events" element={
              <ProtectedRoute requiredRoles={['organizer', 'admin']}>
                <EventManagement />
              </ProtectedRoute>
            } />
            <Route path="/organizer/vendors" element={
              <ProtectedRoute requiredRoles={['organizer', 'admin']}>
                <VendorManagement />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <UserManagementTest />
              </ProtectedRoute>
            } />
            <Route path="/admin/moderation" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <EventModeration />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <ReportsFeedback />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

      {/* Chatbot code starts */}
      <div className={`container ${showChatbot ? "show-chatbot" : ""}`}>
        <button onClick={() => setShowChatbot((prev) => !prev)} id="chatbot-toggler">
          <span className="material-symbols-rounded">mode_comment</span>
          <span className="material-symbols-rounded">close</span>
        </button>
        <div className="chatbot-popup">
          {/* Chatbot Header */}
          <div className="chat-header">
            <div className="header-info">
              <ChatbotIcon />
              <h2 className="logo-text">Chatbot</h2>
            </div>
            <button onClick={() => setShowChatbot((prev) => !prev)} className="material-symbols-rounded">
              keyboard_arrow_down
            </button>
          </div>
          {/* Chatbot Body */}
          <div ref={chatBodyRef} className="chat-body">
            <div className="message bot-message">
              <ChatbotIcon />
              <p className="message-text">
                Hey there  <br /> How can I help you today?
              </p>
            </div>
            {/* Render the chat history dynamically */}
            {chatHistory.map((chat, index) => (
              <ChatMessage key={index} chat={chat} />
            ))}
          </div>
          {/* Chatbot Footer */}
          <div className="chat-footer">
            <ChatForm chatHistory={chatHistory} setChatHistory={setChatHistory} generateBotResponse={generateBotResponse} />
          </div>
        </div>
      </div>
      {/* Chatbot code ends */}
    </>
  );

};

export default App;