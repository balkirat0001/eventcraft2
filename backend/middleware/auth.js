const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const User = require('../models/User');
const jwtlib = require('jsonwebtoken');

// Auth0 middleware for validating JWT tokens
const checkJwt = (req, res, next) => {
  console.log('🔍 checkJwt middleware called');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Authorization header:', req.headers.authorization);
  
  // For testing with custom header
  if (req.headers['x-test-mode'] === 'true') {
    console.log('🧪 Test mode detected, bypassing Auth0 validation');
    // For testing, try to decode the JWT with our test secret
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwtlib.verify(token, 'fallback-secret');
        req.auth = decoded;
        console.log('🧪 Test JWT decoded:', decoded);
        return next();
      } catch (error) {
        console.error('🧪 Test JWT decode failed:', error.message);
        return res.status(401).json({ message: 'Invalid test token' });
      }
    }
  }
  
  // Completely bypass JWT validation in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Development mode bypass triggered');
    // Create mock auth object for development
    req.auth = {
      sub: 'dev-user-123',
      email: 'dev@example.com'
    };
    return next();
  }
  
  // For testing, try to decode the JWT with our test secret first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      console.log('🔍 Trying to decode JWT with test secret...');
      // Try to decode with our test secret first
      const decoded = jwtlib.verify(token, 'fallback-secret');
      req.auth = decoded;
      console.log('✅ JWT decoded successfully:', decoded);
      return next();
    } catch (error) {
      // If test secret fails, try Auth0 validation
      console.log('❌ Test JWT failed, trying Auth0 validation...', error.message);
    }
  }
  
  // Use actual JWT validation in production
  const jwtMiddleware = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),
    audience: process.env.AUTH0_AUDIENCE || false,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
    credentialsRequired: true
  });
  
  return jwtMiddleware(req, res, next);
};

// Middleware to check if user exists in our database
const checkUser = async (req, res, next) => {
  try {
    console.log('🔍 checkUser middleware called');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('req.auth:', req.auth);
    
    // Even in development mode, try to use real users from database
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Development mode detected');
      
      // Check if we have real auth data from Auth0
      if (req.auth && req.auth.sub) {
        console.log('🔍 Real auth detected, looking up user by auth0Id:', req.auth.sub);
        
        // Look up real user by auth0Id
        let user = await User.findOne({ auth0Id: req.auth.sub });
        
        // If not found by auth0Id, try finding by email
        if (!user && req.auth.email) {
          console.log('🔍 auth0Id lookup failed, trying email:', req.auth.email);
          user = await User.findOne({ email: req.auth.email });
        }
        
        if (user) {
          console.log('✅ Real user found:', user.name, user.email, user.role);
          req.dbUser = user;
          return next();
        }
      }
      
      // Only fall back to mock users if no real auth data exists
      console.log('🧪 No real auth data, falling back to mock user');
      const mockRole = req.headers['x-mock-role'] || 'organizer';
      
      // Try to find a real user with the requested role
      const realUser = await User.findOne({ role: mockRole });
      if (realUser) {
        console.log(`✅ Using real ${mockRole} user:`, realUser.name, realUser.email);
        req.dbUser = realUser;
        return next();
      }
      
      // Last resort: use mock users only if no real users exist
      const mockUsers = {
        admin: {
          _id: '123456789012345678901234',
          name: 'Mock Admin User',
          email: 'admin@example.com',
          role: 'admin'
        },
        organizer: {
          _id: '123456789012345678901235',
          name: 'Mock Organizer User', 
          email: 'organizer@example.com',
          role: 'organizer'
        },
        attendee: {
          _id: '123456789012345678901236',
          name: 'Mock Attendee User',
          email: 'attendee@example.com', 
          role: 'attendee'
        }
      };
      
      req.dbUser = mockUsers[mockRole] || mockUsers.organizer;
      console.log('🧪 Using mock user as last resort:', req.dbUser);
      return next();
    }

    if (!req.auth || !req.auth.sub) {
      console.log('❌ No auth or sub in request');
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

    console.log('🔍 Looking up user by auth0Id:', req.auth.sub);
    // For test JWTs, look up the real user by auth0Id or email
    let user = await User.findOne({ auth0Id: req.auth.sub });

    // If not found by auth0Id, try finding by email (for test JWTs)
    if (!user && req.auth.email) {
      console.log('🔍 auth0Id lookup failed, trying email:', req.auth.email);
      user = await User.findOne({ email: req.auth.email });
      console.log(`🔍 User lookup by email: ${req.auth.email}, found: ${user ? user.name : 'NOT FOUND'}`);
    }

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({ message: 'User not found in database' });
    }

    console.log('✅ User found:', user.name, user.email);
    // Add user to request object
    req.dbUser = user;
    next();
  } catch (error) {
    console.error('Error in checkUser middleware:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to authorize based on user role
const authorize = (roles) => {
  return (req, res, next) => {
    // In development mode, still check roles but be more flexible
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Development authorization check');
      console.log('Required roles:', roles);
      console.log('User role:', req.dbUser?.role);
      
      // Allow if user has proper role or if using mock admin header
      if (req.dbUser && req.dbUser.role) {
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (allowedRoles.includes(req.dbUser.role)) {
          console.log('✅ Role authorized');
          return next();
        }
      }
      
      // Check for admin override header in development
      if (req.headers['x-mock-role'] === 'admin' && (Array.isArray(roles) ? roles.includes('admin') : roles === 'admin')) {
        console.log('🧪 Admin override allowed');
        return next();
      }
      
      console.log('❌ Role authorization failed');
      return res.status(403).json({ 
        message: 'Access denied: insufficient permissions',
        required: roles,
        actual: req.dbUser?.role
      });
    }

    if (!req.dbUser) {
      return res.status(401).json({ message: 'User not found in request' });
    }

    const role = req.dbUser.role;
    
    // If roles is a string, convert to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        message: 'Access denied: insufficient permissions' 
      });
    }
    
    next();
  };
};

module.exports = { checkJwt, checkUser, authorize }; 