import api from './api';
import { jwtDecode } from 'jwt-decode';

// Register a new user
const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

// Login user
const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

// Logout user
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Get current user from local storage
const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  console.log('User from localStorage:', user);
  
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      console.log('Current user from localStorage:', parsedUser);
      return parsedUser;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
  }
  
  // Return mock user for development
  console.log('Using mock user for development');
  return {
    id: 'u001',
    _id: 'u001',
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'attendee'
  };
};

// Check if token is expired
const isTokenExpired = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return true;
  }
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Forgot password
const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to process request' };
  }
};

// Reset password
const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to reset password' };
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  isTokenExpired,
  forgotPassword,
  resetPassword
};

export default authService; 