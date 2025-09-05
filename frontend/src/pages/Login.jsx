import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Send login data to the backend
  // Use shared api instance for correct baseURL
  const response = await api.post('/api/users/login', {
        email: formData.email,
        password: formData.password
      });
      
      if (response.data.success) {
        // Create user data from response
        const userData = {
          id: response.data.user._id,
          email: response.data.user.email,
          name: response.data.user.username
        };
        
        // Get token from response
        const token = response.data.token;
        
        // Login the user with both userData and token
        login(userData, token);
        
        // Redirect to home page
        navigate('/');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Sign In</h2>
            <p>Access your news feed</p>
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="auth-form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              className="auth-submit-btn" 
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner-small"></span>
              ) : 'Sign In'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register" className="auth-link">Sign Up</Link></p>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="auth-decoration-circle circle-1"></div>
      <div className="auth-decoration-circle circle-2"></div>
      <div className="auth-decoration-circle circle-3"></div>
    </div>
  );
}

export default Login; 