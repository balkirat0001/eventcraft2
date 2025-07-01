import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../redux/userSlice';
import userService from '../services/userService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  BellIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  ShieldCheckIcon,
  CogIcon
} from '@heroicons/react/24/outline';

// Create fallback notification functions
const createFallbackNotification = () => {
  return {
    success: (message) => console.log('Success:', message),
    error: (message) => console.error('Error:', message)
  };
};

// Safely import useNotification to handle missing provider
let useNotification;
try {
  useNotification = require('../components/NotificationContext').useNotification;
} catch (e) {
  console.warn('NotificationContext not available, using fallback');
  useNotification = () => createFallbackNotification();
}

const Settings = () => {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  
  // Use try-catch to handle potential context error
  let notificationFunctions;
  try {
    notificationFunctions = useNotification();
  } catch (e) {
    console.warn('Error using notification context:', e);
    notificationFunctions = createFallbackNotification();
  }
  
  const { success, error: showError } = notificationFunctions;

  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(false);
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: user?.notificationPrefs?.emailNotifications || true,
    eventReminders: user?.notificationPrefs?.eventReminders || true,
    marketingEmails: user?.notificationPrefs?.marketingEmails || false,
    appNotifications: user?.notificationPrefs?.appNotifications || true,
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    showEmail: user?.privacySettings?.showEmail || false,
    showPhoneNumber: user?.privacySettings?.showPhoneNumber || false,
    publicProfile: user?.privacySettings?.publicProfile || true,
    shareActivity: user?.privacySettings?.shareActivity || false,
  });

  // Account settings
  const [accountSettings, setAccountSettings] = useState({
    twoFactorAuth: user?.accountSettings?.twoFactorAuth || false,
    receiveNewsletters: user?.accountSettings?.receiveNewsletters || true,
    showPastEvents: user?.accountSettings?.showPastEvents || true,
  });
  
  // Theme preference
  const [theme, setTheme] = useState(user?.theme || 'light');
  const [language, setLanguage] = useState(user?.language || 'english');

  // Handle notification preference change
  const handleNotificationPrefChange = (key, value) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle privacy settings change
  const handlePrivacySettingChange = (key, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle account settings change
  const handleAccountSettingChange = (key, value) => {
    setAccountSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const updatedUser = {
        ...user,
        notificationPrefs,
        privacySettings,
        accountSettings,
        theme,
        language
      };
      
      // Update user in backend
      const response = await userService.updateProfile(updatedUser);
      
      // Update user in Redux
      dispatch(setUser(response.data));
      
      success('Settings saved successfully');
    } catch (err) {
      showError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Notification Settings Tab
  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Event Reminders</p>
              <p className="text-sm text-gray-500">Receive reminders for upcoming events</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={notificationPrefs.eventReminders}
                onChange={(e) => handleNotificationPrefChange('eventReminders', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Marketing Emails</p>
              <p className="text-sm text-gray-500">Receive promotional emails and offers</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={notificationPrefs.marketingEmails}
                onChange={(e) => handleNotificationPrefChange('marketingEmails', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive email notifications for all account activities</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={notificationPrefs.emailNotifications}
                onChange={(e) => handleNotificationPrefChange('emailNotifications', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">App Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">App Notifications</p>
              <p className="text-sm text-gray-500">Receive in-app notifications</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={notificationPrefs.appNotifications}
                onChange={(e) => handleNotificationPrefChange('appNotifications', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // Privacy Tab
  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Public Profile</p>
              <p className="text-sm text-gray-500">Make your profile visible to other users</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={privacySettings.publicProfile}
                onChange={(e) => handlePrivacySettingChange('publicProfile', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Show Email</p>
              <p className="text-sm text-gray-500">Display your email on your public profile</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={privacySettings.showEmail}
                onChange={(e) => handlePrivacySettingChange('showEmail', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Show Phone Number</p>
              <p className="text-sm text-gray-500">Display your phone number on your public profile</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={privacySettings.showPhoneNumber}
                onChange={(e) => handlePrivacySettingChange('showPhoneNumber', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Share Activity</p>
              <p className="text-sm text-gray-500">Share your event attendance with other users</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={privacySettings.shareActivity}
                onChange={(e) => handlePrivacySettingChange('shareActivity', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // Account Tab
  const renderAccountTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Enable additional security for your account</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={accountSettings.twoFactorAuth}
                onChange={(e) => handleAccountSettingChange('twoFactorAuth', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Receive Newsletters</p>
              <p className="text-sm text-gray-500">Get the latest news and updates</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={accountSettings.receiveNewsletters}
                onChange={(e) => handleAccountSettingChange('receiveNewsletters', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Show Past Events</p>
              <p className="text-sm text-gray-500">Display past events in your event history</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={accountSettings.showPastEvents}
                onChange={(e) => handleAccountSettingChange('showPastEvents', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Application Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
              <option value="german">German</option>
              <option value="hindi">Hindi</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Delete Account</p>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
            <Button variant="danger" size="sm">Delete Account</Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Debug Info - Remove this in production */}
      {/* <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
        <p className="text-sm text-yellow-700">
          Current User: {user ? `${user.name} (${user.email}) - Role: ${user.role}` : 'No user logged in'}
        </p>
        <p className="text-sm text-yellow-700">
          API URL: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
        </p>
      </div> */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                  activeTab === 'notifications'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BellIcon className="w-5 h-5 mr-2" />
                Notifications
              </button>
              
              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                  activeTab === 'privacy'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <EyeIcon className="w-5 h-5 mr-2" />
                Privacy
              </button>
              
              <button
                onClick={() => setActiveTab('account')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                  activeTab === 'account'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UserIcon className="w-5 h-5 mr-2" />
                Account
              </button>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'privacy' && renderPrivacyTab()}
          {activeTab === 'account' && renderAccountTab()}
          
          <div className="mt-6 flex justify-end">
            <Button 
              variant="primary" 
              onClick={handleSaveSettings}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 