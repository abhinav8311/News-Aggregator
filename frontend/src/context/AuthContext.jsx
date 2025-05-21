import { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if both token and user are stored in localStorage
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          // Token exists, set user data
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          
          // Optional: Validate token with a backend call
          // Uncomment if you have a token validation endpoint
          // try {
          //   await api.get('/api/users/validate-token');
          // } catch (error) {
          //   // Token invalid, log the user out
          //   clearUserState();
          //   setUser(null);
          //   setIsAuthenticated(false);
          // }
        } else {
          // If either token or user is missing, clear auth state
          clearUserState();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearUserState();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, token) => {
    // Important: Only clear previous state after confirming new login is valid
    // Don't call clearUserState here as it removes the token we just received
    
    // Set the new user data
    setUser(userData);
    setIsAuthenticated(true);
    
    // Save user data and token to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Only set token if provided and not already in localStorage
    if (token) {
      localStorage.setItem('token', token);
    }
    
    console.log('User authenticated successfully:', userData);
  };
  
  // Helper function to clear user-specific state
  const clearUserState = () => {
    // Clear user-specific cached data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Clear application state data that might be user-specific
    localStorage.removeItem('lastCategory');
    localStorage.removeItem('lastPage');
    localStorage.removeItem('lastSearchQuery');
    
    // Keep settings like dark mode that are user preference
    // const darkMode = localStorage.getItem('darkMode');
    
    // Clear session storage as well
    sessionStorage.clear();
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear all user data
    clearUserState();
    
    // Force a page reload to clear any in-memory state
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext; 