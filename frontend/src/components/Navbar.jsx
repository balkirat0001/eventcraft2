import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';
import useAuth from '../hooks/useAuth';
import NotificationDropdown from './NotificationDropdown';
import { 
  Calendar, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Home,
  PlusCircle,
  Users,
  BarChart3,
  Bell,
  Shield
} from 'lucide-react';

const Navbar = () => {
  const user = useSelector((state) => state.user.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Use custom auth hook for Auth0
  const { login, logout, isLoading } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  const handleLogin = () => {
    // Prevent login if already in a login flow
    if (!location.pathname.includes('/login') && !location.search.includes('code=')) {
      login();
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Determine dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'organizer':
        return '/organizer/dashboard';
      case 'attendee':
      default:
        return '/attendee/dashboard';
    }
  };

  // Navigation items based on user role
  const getNavItems = () => {
    if (!user) return [];
    
    const baseItems = [
      { name: 'Dashboard', href: getDashboardLink(), icon: Home },
      { name: 'Calendar', href: '/attendee/calendar', icon: Calendar }
    ];

    switch (user.role) {
      case 'admin':
        return [
          ...baseItems,
          { name: 'Users', href: '/admin/users', icon: Users },
          { name: 'Moderation', href: '/admin/moderation', icon: Shield },
          { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
          { name: 'Settings', href: '/admin/settings', icon: Settings }
        ];
      case 'organizer':
        return [
          ...baseItems,
          { name: 'Create Event', href: '/organizer/create-event', icon: PlusCircle },
          { name: 'Manage Events', href: '/organizer/manage-events', icon: Settings }
        ];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  return (
    <>
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-secondary-200' 
            : 'bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div 
              className="flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-lg ${scrolled ? 'bg-gradient-to-r from-primary-600 to-primary-700' : 'bg-white/20'} flex items-center justify-center`}>
                  <Calendar className={`w-5 h-5 ${scrolled ? 'text-white' : 'text-white'}`} />
                </div>
                <span className={`text-xl font-bold ${scrolled ? 'text-primary-900' : 'text-white'}`}>
                  EventCraft
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/' 
                    ? (scrolled ? 'bg-primary-100 text-primary-800' : 'bg-white/20 text-white')
                    : (scrolled ? 'text-secondary-600 hover:text-primary-700 hover:bg-secondary-100' : 'text-white/80 hover:text-white hover:bg-white/10')
                }`}
              >
                Home
              </Link>
              
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
                    location.pathname === item.href
                      ? (scrolled ? 'bg-primary-100 text-primary-800' : 'bg-white/20 text-white')
                      : (scrolled ? 'text-secondary-600 hover:text-primary-700 hover:bg-secondary-100' : 'text-white/80 hover:text-white hover:bg-white/10')
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {!user ? (
                <div className="flex items-center space-x-3">
                  <Button
                    variant={scrolled ? "primary" : "secondary"}
                    size="sm"
                    onClick={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In with Auth0'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* Notifications */}
                  <NotificationDropdown scrolled={scrolled} />

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <motion.button
                      onClick={toggleProfile}
                      className="flex items-center space-x-2 p-1 rounded-lg transition-all duration-200 hover:bg-white/10"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        {user.picture ? (
                          <img 
                            src={user.picture} 
                            alt={user.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${scrolled ? 'text-secondary-700' : 'text-white'}`}>
                        {user.name}
                      </span>
                    </motion.button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-secondary-200 py-2"
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                          <div className="px-4 py-2 border-b border-secondary-200">
                            <p className="text-sm font-medium text-secondary-900">{user.name}</p>
                            <p className="text-xs text-secondary-500">{user.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded-full font-medium">
                              {user.role}
                            </span>
                          </div>
                          
                          <Link
                            to="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors duration-200"
                          >
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                          
                          <Link
                            to="/settings"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors duration-200"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                          
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors duration-200"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMenu}
                className={`p-2 rounded-lg ${
                  scrolled 
                    ? 'text-secondary-600 hover:text-primary-700 hover:bg-secondary-100' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="fixed inset-0 z-40 md:hidden bg-white pt-16"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-4">
              <Link
                to="/"
                className="block px-4 py-2 text-base font-medium text-secondary-900 hover:bg-secondary-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-2 px-4 py-2 text-base font-medium text-secondary-900 hover:bg-secondary-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 text-secondary-600" />
                  <span>{item.name}</span>
                </Link>
              ))}
              
              <div className="pt-4 border-t border-secondary-200">
                {!user ? (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      handleLogin();
                      setIsMenuOpen(false);
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In with Auth0'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center px-4 py-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                        {user.picture ? (
                          <img 
                            src={user.picture} 
                            alt={user.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-900">{user.name}</p>
                        <p className="text-xs text-secondary-500">{user.email}</p>
                      </div>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    
                    <Link
                      to="/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
