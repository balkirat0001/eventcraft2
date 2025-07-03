import React, { useState, useEffect } from 'react';
import { deleteUser } from '../services/adminService';

const UserManagementTest = () => {
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/users', {
          headers: {
            'x-mock-role': 'admin',
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        console.log('API Response:', data);
        setUsers(data.users || []);
      } catch (err) {
        console.error('API Error:', err);
        setError(err.message);
      }
    };
    
    testAPI();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!userId) {
      setError('Invalid user ID');
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'x-mock-role': 'admin',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove the user from the local state
      setUsers(users.filter(user => user._id !== userId));
      setMessage('User deleted successfully');
      setError(null);
    } catch (err) {
      console.error('Delete Error:', err);
      setError('Failed to delete user: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">User Management Test</h1>
        
        {/* <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <p className="mb-2">Status: {message}</p>
          <p className="mb-2">Users Count: {users.length}</p>
          {error && <p className="text-red-600">Error: {error}</p>}
        </div> */}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}
        
        {users.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Users</h2>
            <div className="space-y-2">
              {users.map((user, index) => (
                <div 
                  key={user._id || index} 
                  className="p-4 border rounded flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-blue-600">{user.role}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementTest;
