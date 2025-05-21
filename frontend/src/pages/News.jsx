import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function News() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState({ liked: 0, followedSources: 0, related: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLikes, setUserLikes] = useState([]);
  const [followedSources, setFollowedSources] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const { isAuthenticated, user } = useAuth();

  // Function to fetch recommended articles
  const fetchRecommendedArticles = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/recommended-articles?userId=${user.id}`);
      setArticles(response.data.data);
      setCategories(response.data.categories || { liked: 0, followedSources: 0, related: 0 });
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch recommended articles');
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
              ? { ...article, likes: response.data.article.likes, isLiked: true } 
              : article
          )
        );
        
        // Add to user's liked articles if not already there
        if (!userLikes.includes(articleId)) {
          setUserLikes(prev => [...prev, articleId]);
        }
        
        // Refresh recommended articles to update categories
        fetchRecommendedArticles();
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
              ? { ...article, likes: response.data.article.likes, isLiked: false } 
              : article
          )
        );
        
        // Remove from user's liked articles
        setUserLikes(prev => prev.filter(id => id !== articleId));
        
        // Refresh recommended articles to update categories
        fetchRecommendedArticles();
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
        
        // Update articles from this source
        setArticles(prevArticles => 
          prevArticles.map(article => 
            article.sourceName === sourceName 
              ? { ...article, isFromFollowedSource: true } 
              : article
          )
        );
        
        // Refresh recommended articles to update categories
        fetchRecommendedArticles();
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
        
        // Update articles from this source
        setArticles(prevArticles => 
          prevArticles.map(article => 
            article.sourceName === sourceName 
              ? { ...article, isFromFollowedSource: false } 
              : article
          )
        );
        
        // Refresh recommended articles to update categories
        fetchRecommendedArticles();
      }
    } catch (err) {
      console.error('Error unfollowing source:', err);
    }
  };

  // Fetch recommended articles and user data when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchRecommendedArticles();
      fetchUserData();
    }
  }, [isAuthenticated, user]);

  // Add pagination function
  const paginate = (articlesList) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return articlesList.slice(startIndex, endIndex);
  };

  // Update total pages calculation for each category
  useEffect(() => {
    const likedArticlesCount = articles.filter(article => article.isLiked).length;
    const followedSourcesArticlesCount = articles.filter(article => article.isFromFollowedSource && !article.isLiked).length;
    const relatedArticlesCount = articles.filter(article => article.isRelated).length;
    
    setTotalPages(Math.ceil(Math.max(likedArticlesCount, followedSourcesArticlesCount, relatedArticlesCount) / itemsPerPage));
  }, [articles, itemsPerPage]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top of page
      window.scrollTo({
        top: document.querySelector('.for-you-content')?.offsetTop - 100 || 0,
        behavior: 'smooth'
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Check if user has liked an article
  const isLiked = (articleId) => userLikes.includes(articleId);
  
  // Check if user follows a source
  const isFollowed = (sourceName) => followedSources.includes(sourceName);

  // Get articles by category (with pagination)
  const likedArticles = paginate(articles.filter(article => article.isLiked));
  const followedSourceArticles = paginate(articles.filter(article => article.isFromFollowedSource && !article.isLiked));
  const relatedArticles = paginate(articles.filter(article => article.isRelated));

  // Article card component for DRY rendering
  const ArticleCard = ({ article }) => (
    <div className={`article-card ${article.isLiked ? 'liked-article' : ''} ${article.isFromFollowedSource && !article.isLiked ? 'followed-article' : ''}`}>
      {article.image && (
        <div className="article-image">
          <img src={article.image} alt={article.title} />
        </div>
      )}
      <div className="article-content">
        <h2>{article.title}</h2>
        <p className="article-description">{article.description}</p>
        <div className="article-meta">
          <span>Source: {article.sourceName || 'Unknown'}</span>
          <span>Published: {new Date(article.publishedAt).toLocaleDateString()}</span>
        </div>
        <div className="article-actions">
          {article.isLiked || isLiked(article._id) ? (
            <button 
              onClick={() => handleUnlike(article._id)}
              className="like-btn liked"
            >
              ❤️ {article.likes || 0}
            </button>
          ) : (
            <button 
              onClick={() => handleLike(article._id)}
              className="like-btn"
            >
              🤍 {article.likes || 0}
            </button>
          )}
          
          {article.sourceName && (
            article.isFromFollowedSource || isFollowed(article.sourceName) ? (
              <button 
                onClick={() => handleUnfollow(article.sourceName)}
                className="follow-btn followed"
              >
                ✓ Following
              </button>
            ) : (
              <button 
                onClick={() => handleFollow(article.sourceName)}
                className="follow-btn"
              >
                Follow {article.sourceName}
              </button>
            )
          )}
          
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="read-more"
          >
            Read Full Article
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="news-container for-you-page">
      <h1>For You</h1>
      <p className="subtitle">News articles tailored to your interests</p>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading personalized recommendations...</p>
        </div>
      ) : error ? (
        <p className="error">{error}</p>
      ) : articles.length === 0 ? (
        <div className="no-recommendations">
          <h2>We don't have enough data to make recommendations yet</h2>
          <p>Try liking some articles or following news sources to get personalized recommendations.</p>
        </div>
      ) : (
        <div className="for-you-content">
          {/* Based on what you've liked */}
          {likedArticles.length > 0 && (
            <div className="article-section">
              <h2 className="section-heading">Based on Articles You Liked ({categories.liked})</h2>
              <div className="articles-grid">
                {likedArticles.map(article => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
            </div>
          )}
          
          {/* From sources you follow */}
          {followedSourceArticles.length > 0 && (
            <div className="article-section">
              <h2 className="section-heading">From Sources You Follow ({categories.followedSources})</h2>
              <div className="articles-grid">
                {followedSourceArticles.map(article => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
            </div>
          )}
          
          {/* Related to your interests */}
          {relatedArticles.length > 0 && (
            <div className="article-section">
              <h2 className="section-heading">Related to Your Interests ({categories.related})</h2>
              <div className="articles-grid">
                {relatedArticles.map(article => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
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
      )}
    </div>
  );
}

export default News; 