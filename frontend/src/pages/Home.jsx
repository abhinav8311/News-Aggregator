import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';

function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchingNews, setFetchingNews] = useState(false);
  const [userLikes, setUserLikes] = useState([]);
  const [followedSources, setFollowedSources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchLocal, setSearchLocal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Reset component state when user changes
  useEffect(() => {
    if (user) {
      // Reset user-specific state
      setArticles([]);
      setUserLikes([]);
      setFollowedSources([]);
      setSearchResults([]);
      setSearchPerformed(false);
      setSearchQuery('');
      setCurrentPage(1);
      
      // Restore any saved category preference
      const savedCategory = localStorage.getItem(`category_${user.id}`);
      if (savedCategory) {
        // Handle any saved category navigation if needed
      }
      
      // Force fresh data load
      setLoading(true);
    }
  }, [user?.id]); // Dependency on user ID ensures this runs when user changes

  // Get category from URL query parameter
  const getCategory = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('category') || 'all';
  };

  const [currentCategory, setCurrentCategory] = useState(getCategory());

  // Update category when URL changes and save user preference
  useEffect(() => {
    const newCategory = getCategory();
    setCurrentCategory(newCategory);
    
    // Save user's category preference if logged in
    if (user && user.id) {
      localStorage.setItem(`category_${user.id}`, newCategory);
    }
  }, [location.search, user]);

  // Function to check if articles exist for current category
  const checkCategoryArticles = async () => {
    try {
      setLoading(true);
      
      // Only check for non-all categories
      if (currentCategory && currentCategory !== 'all') {
        const response = await api.get(`/api/check-category?category=${currentCategory}`);
        
        if (response.data.success && !response.data.hasArticles) {
          // No articles found in this category, fetch from API
          await fetchNewsForCategory();
        } else {
          // Articles exist, fetch them from database
          await fetchArticlesFromDB();
        }
      } else {
        // For 'all' category, just fetch from database
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
      // Build query parameters
      let queryParams = '';
      if (currentCategory && currentCategory !== 'all') {
        queryParams = `?category=${currentCategory}`;
      }
      
      const response = await api.get(`/api/articles${queryParams}`);
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

  // Function to fetch news from GNews API and save to database
  const fetchNews = async () => {
    try {
      setFetchingNews(true);
      
      // Include category in the fetch request if it's not 'all'
      let endpoint = '/api/fetch-news';
      if (currentCategory && currentCategory !== 'all') {
        endpoint = `/api/fetch-news?category=${currentCategory}`;
      }
      
      const response = await api.get(endpoint);
      setArticles(response.data.data);
      setFetchingNews(false);
    } catch (err) {
      setError('Failed to fetch news from API');
      setFetchingNews(false);
      console.error(err);
    }
  };

  // Function to fetch news specifically for the current category
  const fetchNewsForCategory = async () => {
    try {
      setFetchingNews(true);
      const endpoint = `/api/fetch-news?category=${currentCategory}`;
      const response = await api.get(endpoint);
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
  }, [isAuthenticated, user, currentCategory]);

  // Add a function to fetch trending articles
  const fetchTrendingArticles = async () => {
    try {
      setLoadingTrending(true);
      const trendingData = await api.articleStats.getTrendingArticles(5); // Fetch top 5 trending
      setTrendingArticles(trendingData);
      setLoadingTrending(false);
    } catch (err) {
      console.error('Error fetching trending articles:', err);
      setLoadingTrending(false);
    }
  };

  // Update useEffect to also load trending articles when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await checkCategoryArticles();
        await fetchUserData();
        await fetchTrendingArticles();
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
        console.error(err);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, currentPage, currentCategory]);

  if (!isAuthenticated) {
    return null;
  }

  // Check if user has liked an article
  const isLiked = (articleId) => userLikes.includes(articleId);
  
  // Check if user follows a source
  const isFollowed = (sourceName) => followedSources.includes(sourceName);
  
  // Get page title based on category
  const getCategoryTitle = () => {
    if (!currentCategory || currentCategory === 'all') {
      return 'Latest News';
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
    
    return categoryTitles[currentCategory] || `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} News`;
  };

  // Function to handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    try {
      setSearching(true);
      setSearchPerformed(true);
      setError('');
      setCurrentPage(1); // Reset to first page when performing new search
      
      // Choose endpoint based on search type (API or local MongoDB)
      const endpoint = searchLocal 
        ? `/api/search-local?q=${encodeURIComponent(searchQuery)}&limit=${itemsPerPage}&page=${currentPage}${currentCategory !== 'all' ? `&category=${currentCategory}` : ''}`
        : `/api/search-news?q=${encodeURIComponent(searchQuery)}&max=${itemsPerPage}`;
      
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        setSearchResults(response.data.data);
        // If totalArticles is available from API, use it to set total pages
        if (response.data.totalArticles) {
          setTotalPages(Math.ceil(response.data.totalArticles / itemsPerPage));
        } else {
          setTotalPages(Math.ceil(response.data.data.length / itemsPerPage));
        }
      } else {
        setError('Failed to search for news');
      }
      
      setSearching(false);
    } catch (err) {
      setError('Failed to search for news');
      setSearching(false);
      console.error('Search error:', err);
    }
  };

  // Handle pagination
  const paginate = (articles) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return articles.slice(startIndex, endIndex);
  };

  // Update total pages when articles or search results change
  useEffect(() => {
    const articlesToCount = searchPerformed ? searchResults : articles;
    setTotalPages(Math.ceil(articlesToCount.length / itemsPerPage));
    
    // Reset to page 1 when changing categories or performing a new search
    setCurrentPage(1);
  }, [articles, searchResults, searchPerformed, itemsPerPage]);

  // Handle page change for pagination
  const handlePageChange = async (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      
      // Save page preference for the user
      if (user && user.id) {
        localStorage.setItem(`lastPage_${user.id}`, newPage);
      }
      
      // If this is a local search and we need to load more results
      if (searchPerformed && searchLocal) {
        try {
          setSearching(true);
          const response = await api.get(
            `/api/search-local?q=${encodeURIComponent(searchQuery)}&limit=${itemsPerPage}&page=${newPage}${currentCategory !== 'all' ? `&category=${currentCategory}` : ''}`
          );
          
          if (response.data.success) {
            setSearchResults(response.data.data);
          }
          setSearching(false);
        } catch (err) {
          console.error('Error loading more search results:', err);
          setSearching(false);
        }
      }
      
      // Scroll to top of articles
      window.scrollTo({
        top: document.querySelector('.articles-grid')?.offsetTop - 100 || 0,
        behavior: 'smooth'
      });
    }
  };

  // Determine which articles to display with pagination
  const allArticles = searchPerformed ? searchResults : articles;
  const displayArticles = paginate(allArticles);

  // Function to save a search result to the database
  const handleSaveArticle = async (article) => {
    try {
      const response = await api.post('/api/save-article', article);
      
      if (response.data.success) {
        // Show feedback to user
        alert('Article saved successfully! You can now like and follow it.');
        
        // Refresh search results to show the saved article
        const searchResponse = await api.get(`/api/search-news?q=${encodeURIComponent(searchQuery)}&max=${itemsPerPage}&page=${currentPage}`);
        
        if (searchResponse.data.success) {
          setSearchResults(searchResponse.data.data);
        }
      }
    } catch (err) {
      console.error('Error saving article:', err);
    }
  };

  // Add function to handle article clicks and record views
  const handleArticleClick = async (articleId) => {
    try {
      // Record the view
      await api.articleStats.viewArticle(articleId, user?.id);
      
      // You could also update local state to reflect the new view count
      // But for simplicity, we're just recording the view on the server
    } catch (err) {
      console.error('Error recording article view:', err);
    }
  };

  return (
    <div className="home-container">
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-options">
            <label className="search-toggle">
              <input
                type="checkbox"
                checked={searchLocal}
                onChange={() => setSearchLocal(!searchLocal)}
              />
              <span className="search-toggle-slider"></span>
              <span className="search-toggle-label">
                {searchLocal ? 'Search From Latest' : 'Search Web News (GNews)'}
              </span>
            </label>
          </div>
          <div className="search-input-container">
            <input
              type="text"
              placeholder={searchLocal ? "Search from latest articles..." : "Search for news..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn" disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </button>
            {searchPerformed && (
              <button type="button" className="clear-search-btn" onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setSearchPerformed(false);
              }}>
                Clear
              </button>
            )}
          </div>
        </form>
      </div>
      
      <h1>
        {searchPerformed 
          ? `${searchLocal ? 'Latest' : ''} Search Results for "${searchQuery}"` 
          : getCategoryTitle()
        }
      </h1>
      
      {searchPerformed && !searchLocal && (
        <p className="search-results-note">
          Note: Search results are external articles. Save functionality is limited to articles in your database.
        </p>
      )}
      
      {!searchPerformed && (
        <div className="news-actions">
          <button 
            onClick={fetchNews} 
            disabled={fetchingNews}
            className="fetch-news-btn"
          >
            {fetchingNews ? 'Fetching News...' : 'Fetch Latest News'}
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      
      {(loading || searching) ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading articles...</p>
        </div>
      ) : displayArticles.length === 0 ? (
        <p className="no-results">
          {searchPerformed 
            ? `No results found for "${searchQuery}". Try a different search term.` 
            : 'No articles found. Click "Fetch Latest News" to refresh.'
          }
        </p>
      ) : (
        <div className="articles-grid">
          {displayArticles.map(article => (
            <div key={article._id || article.url} className="article-card">
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
                  {searchPerformed ? (
                    // For search results - only save button
                    <button 
                      className="save-btn"
                      onClick={() => handleSaveArticle(article)}
                    >
                      Save to Library
                    </button>
                  ) : (
                    // For regular articles - like button
                    isLiked(article._id) ? (
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
                    )
                  )}
                  
                  {/* Only show follow button for regular articles */}
                  {!searchPerformed && (article.sourceName || article.source?.name) && (
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
                    onClick={() => handleArticleClick(article._id)}
                  >
                    Read More
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* End of results message */}
      {!hasMore && displayArticles.length > 0 && (
        <div className="end-of-results">
          <p>No more articles to display</p>
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

      {/* Trending Articles Section */}
      {!searchPerformed && trendingArticles.length > 0 && (
        <div className="trending-articles">
          <h2 className="section-heading">Trending Now</h2>
          <div className="articles-grid">
            {trendingArticles.map((article) => (
              <div 
                key={article._id} 
                className="article-card"
              >
                <div className="article-image">
                  <img 
                    src={article.image || 'https://placehold.co/600x400?text=No+Image'} 
                    alt={article.title} 
                  />
                </div>
                <div className="article-content">
                  <div className="article-meta">
                    <span className="article-source">{article.sourceName}</span>
                    <span className="article-date">
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2>{article.title}</h2>
                  <p className="article-description">{article.description}</p>
                  <div className="article-stats">
                    <span className="views-count">{article.views || 0} views</span>
                    <span className="likes-count">{article.likes || 0} likes</span>
                  </div>
                  <div className="article-actions">
                    {userLikes.includes(article._id) ? (
                      <button 
                        className="like-btn liked" 
                        onClick={() => handleUnlike(article._id)}
                      >
                        ❤️ Liked
                      </button>
                    ) : (
                      <button 
                        className="like-btn" 
                        onClick={() => handleLike(article._id)}
                      >
                        🤍 Like
                      </button>
                    )}
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="read-more-btn"
                      onClick={() => handleArticleClick(article._id)}
                    >
                      Read More
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home; 