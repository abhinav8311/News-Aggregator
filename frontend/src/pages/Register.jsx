import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      // Send registration data to the backend
  const response = await api.post('/api/users/register', {
        username: formData.username,
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
        
        // Login the user automatically after registration with token
        login(userData, token);
        
        // Redirect to home page
        navigate('/');
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Join our news community</p>
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
              />
            </div>
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
                  placeholder="Create a password"
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
            <div className="auth-form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
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
              ) : 'Sign Up'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Sign In</Link></p>
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

export default Register; 