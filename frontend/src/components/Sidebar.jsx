import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar({ isOpen, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get category from URL path
  const getActiveCategoryFromPath = () => {
    const path = location.pathname;
    if (path.startsWith('/category/')) {
      return path.split('/category/')[1];
    }
    return 'all';
  };

  // Update active category based on current location
  useEffect(() => {
    const currentCategory = getActiveCategoryFromPath();
    setActiveCategory(currentCategory);
  }, [location.pathname]);

  // Handle isOpen prop changes
  useEffect(() => {
    setIsCollapsed(!isOpen);
  }, [isOpen]);

  const categories = [
    { id: 'all', name: 'All News', icon: '📰' },
    { id: 'general', name: 'General', icon: '📰' },
    { id: 'world', name: 'World', icon: '🌎' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'nation', name: 'Nation', icon: '🏛️' },
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'health', name: 'Health', icon: '🏥' }
  ];

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    if (categoryId === 'all') {
      navigate('/');
    } else {
      navigate(`/category/${categoryId}`);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (onToggle) {
      onToggle();
    }
  };

  // Don't show sidebar on login/register pages or on News (For You) and Following pages
  const hiddenPages = ['/login', '/register', '/news', '/following'];
  if (hiddenPages.includes(location.pathname)) {
    return null;
  }

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h3 className="sidebar-title">Categories</h3>
        <button 
          className="toggle-sidebar-btn"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      <ul className="category-list">
        {categories.map((category) => (
          <li 
            key={category.id}
            className={`category-item ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            {!isCollapsed && <span className="category-name">{category.name}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar; 