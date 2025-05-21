import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function CategoryNews() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchingNews, setFetchingNews] = useState(false);
  const [userLikes, setUserLikes] = useState([]);
  const [followedSources, setFollowedSources] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Function to check if articles exist for this category
  const checkCategoryArticles = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/check-category?category=${category}`);
      
      if (response.data.success && !response.data.hasArticles) {
        // No articles found in this category, fetch from API
        await fetchNewsFromAPI();
      } else {
        // Articles exist, fetch them from database
        await fetchArticlesFromDB();
      }
    } catch (err) {
      console.error('Error checking category articles:', err);
      // Fall back to normal fetch
      fetchArticlesFromDB();
    }
  };

  // Function to fetch articles from the database
  const fetchArticlesFromDB = async () => {
    try {
      const response = await api.get(`/api/articles?category=${category}`);
      setArticles(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch articles');
      setLoading(false);
      console.error(err);
    }
  };

  // Function to fetch user data (likes and follows)
  const fetchUserData = async () => {
    try {
      if (user && user.id) {
        const response = await api.get(`/api/users/${user.id}`);
        if (response.data.success) {
          const userData = response.data.data;
          setUserLikes(userData.likedArticles || []);
          setFollowedSources(userData.followedSources || []);
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  // Function to fetch news from GNews API for this category
  const fetchNewsFromAPI = async () => {
    try {
      setFetchingNews(true);
      const response = await api.get(`/api/fetch-news?category=${category}`);
      setArticles(response.data.data);
      setFetchingNews(false);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch news from API');
      setFetchingNews(false);
      setLoading(false);
      console.error(err);
    }
  };

  // Function to like an article
  const handleLike = async (articleId) => {
    try {
      const response = await api.post(`/api/articles/${articleId}/like`, {
        userId: user.id
      });
      
      if (response.data.success) {
        // Update the articles state with the updated article
        setArticles(prevArticles => 
          prevArticles.map(article => 
            article._id === articleId 
              ? { ...article, likes: response.data.article.likes } 
              : article
          )
        );
        
        // Add to user's liked articles if not already there
        if (!userLikes.includes(articleId)) {
          setUserLikes(prev => [...prev, articleId]);
        }
      }
    } catch (err) {
      console.error('Error liking article:', err);
    }
  };

  // Function to unlike an article
  const handleUnlike = async (articleId) => {
    try {
      const response = await api.post(`/api/articles/${articleId}/unlike`, {
        userId: user.id
      });
      
      if (response.data.success) {
        // Update the articles state with the updated article
        setArticles(prevArticles => 
          prevArticles.map(article => 
            article._id === articleId 
              ? { ...article, likes: response.data.article.likes } 
              : article
          )
        );
        
        // Remove from user's liked articles
        setUserLikes(prev => prev.filter(id => id !== articleId));
      }
    } catch (err) {
      console.error('Error unliking article:', err);
    }
  };

  // Function to follow a news source
  const handleFollow = async (sourceName) => {
    try {
      const response = await api.post(`/api/sources/${sourceName}/follow`, {
        userId: user.id
      });
      
      if (response.data.success) {
        // Add to user's followed sources if not already there
        if (!followedSources.includes(sourceName)) {
          setFollowedSources(prev => [...prev, sourceName]);
        }
      }
    } catch (err) {
      console.error('Error following source:', err);
    }
  };

  // Function to unfollow a news source
  const handleUnfollow = async (sourceName) => {
    try {
      const response = await api.post(`/api/sources/${sourceName}/unfollow`, {
        userId: user.id
      });
      
      if (response.data.success) {
        // Remove from user's followed sources
        setFollowedSources(prev => prev.filter(source => source !== sourceName));
      }
    } catch (err) {
      console.error('Error unfollowing source:', err);
    }
  };

  // Fetch articles and user data when component mounts or category changes
  useEffect(() => {
    if (isAuthenticated && user) {
      checkCategoryArticles();
      fetchUserData();
    }
  }, [isAuthenticated, user, category]);

  // Handle pagination - add these functions for numbered pagination
  // Handle pagination
  const paginate = (articles) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return articles.slice(startIndex, endIndex);
  };

  // Update total pages when articles change
  useEffect(() => {
    setTotalPages(Math.ceil(articles.length / itemsPerPage));
    
    // Reset to page 1 when changing categories
    setCurrentPage(1);
  }, [articles, itemsPerPage, category]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top of articles
      window.scrollTo({
        top: document.querySelector('.articles-grid')?.offsetTop - 100 || 0,
        behavior: 'smooth'
      });
    }
  };

  // Reset pagination state when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [category]);

  if (!isAuthenticated) {
    return null;
  }

  // Check if user has liked an article
  const isLiked = (articleId) => userLikes.includes(articleId);
  
  // Check if user follows a source
  const isFollowed = (sourceName) => followedSources.includes(sourceName);
  
  // Get page title based on category
  const getCategoryTitle = () => {
    if (!category) {
      return 'News';
    }
    
    // Map of category IDs to user-friendly titles
    const categoryTitles = {
      'general': 'General News',
      'world': 'World News',
      'business': 'Business News',
      'nation': 'National News',
      'technology': 'Technology News',
      'entertainment': 'Entertainment News',
      'sports': 'Sports News',
      'science': 'Science News',
      'health': 'Health News'
    };
    
    return categoryTitles[category] || `${category.charAt(0).toUpperCase() + category.slice(1)} News`;
  };

  // Replace getDisplayArticles() with paginate(articles)
  const displayArticles = paginate(articles);

  return (
    <div className="category-news-container">
      <h1>{getCategoryTitle()}</h1>
      
      <div className="news-actions">
        <button 
          onClick={fetchNewsFromAPI} 
          disabled={fetchingNews}
          className="fetch-news-btn"
        >
          {fetchingNews ? 'Fetching News...' : 'Fetch Latest News'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading articles...</p>
        </div>
      ) : displayArticles.length === 0 ? (
        <p className="no-results">
          No articles found for this category. Click "Fetch Latest News" to refresh.
        </p>
      ) : (
        <div className="articles-grid">
          {displayArticles.map(article => (
            <div key={article._id} className="article-card">
              {article.image && (
                <div className="article-image">
                  <img src={article.image} alt={article.title} />
                </div>
              )}
              <div className="article-content">
                <h2>{article.title}</h2>
                <p className="article-description">{article.description}</p>
                <div className="article-meta">
                  <span>Source: {article.sourceName || article.source?.name || 'Unknown'}</span>
                  <span>Published: {new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>
                <div className="article-actions">
                  {isLiked(article._id) ? (
                    <button 
                      className="unlike-btn"
                      onClick={() => handleUnlike(article._id)}
                    >
                      ❤️ {article.likes || 0}
                    </button>
                  ) : (
                    <button 
                      className="like-btn"
                      onClick={() => handleLike(article._id)}
                    >
                      🤍 {article.likes || 0}
                    </button>
                  )}
                  
                  {(article.sourceName || article.source?.name) && (
                    isFollowed(article.sourceName || article.source?.name) ? (
                      <button 
                        className="unfollow-btn"
                        onClick={() => handleUnfollow(article.sourceName || article.source?.name)}
                      >
                        Following
                      </button>
                    ) : (
                      <button 
                        className="follow-btn"
                        onClick={() => handleFollow(article.sourceName || article.source?.name)}
                      >
                        Follow
                      </button>
                    )
                  )}
                  
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="read-more-btn"
                  >
                    Read More
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            &laquo;
          </button>
          
          {/* Page number buttons */}
          <div className="pagination-numbers">
            {[...Array(totalPages)].map((_, idx) => {
              const pageNum = idx + 1;
              // Show current page, first and last pages, and 1 page before and after current
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    className={`pagination-number ${pageNum === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              }
              
              // Show ellipsis for skipped pages
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <span key={pageNum} className="pagination-ellipsis">...</span>;
              }
              
              return null;
            })}
          </div>
          
          <button 
            className="pagination-btn"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            &raquo;
          </button>
        </div>
      )}
    </div>
  );
}

export default CategoryNews; 