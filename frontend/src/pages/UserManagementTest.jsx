import React, { useState, useEffect } from 'react';

const UserManagementTest = () => {
  const [message, setMessage] = useState('Component is loading...');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('UserManagementTest mounted');
    setMessage('Component mounted successfully');
    
    // Test API call
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
        setMessage('API call successful');
      } catch (err) {
        console.error('API Error:', err);
        setError(err.message);
      }
    };
    
    testAPI();
  }, []);

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
        
        {users.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Users</h2>
            <div className="space-y-2">
              {users.map((user, index) => (
                <div key={user._id || index} className="p-3 border rounded">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-blue-600">{user.role}</p>
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
