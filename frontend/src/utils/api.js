import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Skip token check for authentication-related endpoints
    const isAuthEndpoint = config.url.includes('/login') || 
                           config.url.includes('/register') || 
                           config.url.includes('/users/validate');
    
    if (isAuthEndpoint) {
      // Don't check for token on auth endpoints
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }
    
    // For all other endpoints, require token
    if (!token) {
      console.warn('No authentication token found for protected endpoint');
      // Don't automatically redirect here - let the component handle it
      // This prevents infinite redirect loops
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle global error responses
    if (error.response && error.response.status === 401) {
      // Clear token and user data on auth failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page if needed
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

// Article Stats Helper Methods
const articleStats = {
  // Record an article view
  viewArticle: async (articleId, userId = null) => {
    try {
      const response = await api.post(`/api/articles/${articleId}/view`, { userId });
      return response.data;
    } catch (error) {
      console.error('Error recording article view:', error);
      throw error;
    }
  },
  
  // Get stats for a specific article
  getArticleStats: async (articleId) => {
    try {
      const response = await api.get(`/api/articles/${articleId}/stats`);
      return response.data.stats;
    } catch (error) {
      console.error('Error fetching article stats:', error);
      throw error;
    }
  },
  
  // Get trending articles
  getTrendingArticles: async (limit = 10) => {
    try {
      const response = await api.get(`/api/trending?limit=${limit}`);
      return response.data.articles;
    } catch (error) {
      console.error('Error fetching trending articles:', error);
      throw error;
    }
  }
};

// Attach helper methods to the api object
api.articleStats = articleStats;

export default api; 