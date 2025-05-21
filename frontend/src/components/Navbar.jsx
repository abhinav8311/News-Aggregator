import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  
  const handleLogout = () => {
    // Clear any user-specific UI state before logging out
    logout();
    // The redirect happens in the AuthContext logout function
  };

  // Determine which auth link to show based on the current path
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  
  // Function to determine if a link is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
  };

  // Check for saved theme preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  // Apply dark mode to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  // Reset navigation if user changes
  useEffect(() => {
    if (!isAuthenticated && !isLoginPage && !isRegisterPage) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, isLoginPage, isRegisterPage]);

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">News Aggregator</Link>
      </div>
      <ul className="nav-links">
        {isAuthenticated ? (
          <>
            <li>
              <Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link>
            </li>
            <li>
              <Link to="/news" className={isActive('/news') ? 'active' : ''}>For You</Link>
            </li>
            <li>
              <Link to="/following" className={isActive('/following') ? 'active' : ''}>Following</Link>
            </li>
            <li>
              <Link to="/category/technology" className={isActive('/category') ? 'active' : ''}>Categories</Link>
            </li>
            <li>
              <span className="welcome-text">Welcome, {user?.name || 'User'}</span>
            </li>
            <li className="theme-toggle">
              <label className="theme-toggle-switch">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                />
                <span className="theme-toggle-slider"></span>
              </label>
            </li>
            <li>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </li>
          </>
        ) : (
          <>
            {/* Show Register link only if not on register page */}
            {!isRegisterPage && (
              <li>
                <Link to="/register" className={isLoginPage ? 'auth-nav-link' : ''}>
                  Register
                </Link>
              </li>
            )}
            
            {/* Show Login link only if not on login page */}
            {!isLoginPage && (
              <li>
                <Link to="/login" className={isRegisterPage ? 'auth-nav-link' : ''}>
                  Login
                </Link>
              </li>
            )}
            <li className="theme-toggle">
              <label className="theme-toggle-switch">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                />
                <span className="theme-toggle-slider"></span>
              </label>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar; 