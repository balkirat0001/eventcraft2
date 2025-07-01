import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole } from '../services/adminService';

const UserManagement = () => {
  console.log('UserManagement component loading...');
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set admin role for API requests
  useEffect(() => {
    console.log('UserManagement useEffect triggered');
    try {
      localStorage.setItem('userRole', 'admin');
      fetchUsers();
    } catch (err) {
      console.error('Error in useEffect:', err);
      setError(`Initialization error: ${err.message}`);
      setLoading(false);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      setLoading(true);
      setError(null);
      const response = await getAllUsers();
      console.log('Users response received:', response);
      
      // Handle different response formats
      let usersData = [];
      if (Array.isArray(response)) {
        usersData = response;
      } else if (response && response.users && Array.isArray(response.users)) {
        usersData = response.users;
      } else if (response && response.data && Array.isArray(response.data)) {
        usersData = response.data;
      }
      
      console.log('Processed users data:', usersData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Failed to load users: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId, currentRole) => {
    try {
      // Cycle through roles: attendee -> organizer -> admin -> attendee
      let newRole;
      switch (currentRole) {
        case 'attendee':
          newRole = 'organizer';
          break;
        case 'organizer':
          newRole = 'admin';
          break;
        case 'admin':
          newRole = 'attendee';
          break;
        default:
          newRole = 'attendee';
      }

      await updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, role: newRole }
          : user
      ));
      
      alert(`User role updated to ${newRole} successfully!`);
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  // Fallback UI to prevent white screen
  if (error && !users.length) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-blue-700">👥 User Management</h2>
            <button 
              onClick={fetchUsers}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
          
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <h3 className="font-bold mb-2">Error Loading Users</h3>
            <p>{error}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Users</h3>
            <p className="text-gray-600 mb-4">There was a problem loading the user data.</p>
            <button 
              onClick={fetchUsers}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-blue-700">👥 User Management</h2>
          <button 
            onClick={fetchUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length > 0 ? users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.picture ? (
                            <img className="h-10 w-10 rounded-full" src={user.picture} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'Unknown User'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800'
                          : user.role === 'organizer'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1) || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => changeRole(user._id, user.role)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === 'attendee').length}
            </div>
            <div className="text-sm text-gray-600">Attendees</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.role === 'organizer').length}
            </div>
            <div className="text-sm text-gray-600">Organizers</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-gray-600">Administrators</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

