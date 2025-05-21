import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function Following() {
  const [followedSources, setFollowedSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Add pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8); // Show more sources per page
  const { isAuthenticated, user } = useAuth();

  // Function to fetch user data and extract followed sources
  const fetchFollowedSources = async () => {
    try {
      setLoading(true);
      if (user && user.id) {
        // Get user data
        const userResponse = await api.get(`/api/users/${user.id}`);
        
        if (userResponse.data.success) {
          const userData = userResponse.data.data;
          const sources = userData.followedSources || [];
          
          // For each source, get some articles to display the source details
          const sourcesWithDetails = await Promise.all(
            sources.map(async (sourceName) => {
              try {
                // Get a sample article from this source to get details
                const articlesResponse = await api.get(`/api/articles?source=${sourceName}&limit=1`);
                const article = articlesResponse.data.data[0];
                
                return {
                  name: sourceName,
                  url: article?.sourceUrl || null,
                  // Try to find a representative image
                  image: article?.image || null,
                  // Count articles from this source
                  articleCount: articlesResponse.data.count || 0
                };
              } catch (err) {
                console.error(`Error fetching details for source ${sourceName}:`, err);
                return {
                  name: sourceName,
                  url: null,
                  image: null,
                  articleCount: 0
                };
              }
            })
          );
          
          setFollowedSources(sourcesWithDetails);
        }
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch followed sources');
      setLoading(false);
      console.error(err);
    }
  };

  // Function to unfollow a news source
  const handleUnfollow = async (sourceName) => {
    try {
      const response = await api.post(`/api/sources/${sourceName}/unfollow`, {
        userId: user.id
      });
      
      if (response.data.success) {
        // Remove from followed sources list
        setFollowedSources(prev => prev.filter(source => source.name !== sourceName));
      }
    } catch (err) {
      console.error('Error unfollowing source:', err);
    }
  };

  // Fetch followed sources when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchFollowedSources();
    }
  }, [isAuthenticated, user]);

  // Add pagination function
  const paginate = (sourcesList) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sourcesList.slice(startIndex, endIndex);
  };

  // Update total pages when followed sources change
  useEffect(() => {
    setTotalPages(Math.ceil(followedSources.length / itemsPerPage));
  }, [followedSources, itemsPerPage]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top of sources grid
      window.scrollTo({
        top: document.querySelector('.sources-grid')?.offsetTop - 100 || 0,
        behavior: 'smooth'
      });
    }
  };

  // Get displayed sources with pagination
  const displayedSources = paginate(followedSources);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="following-container">
      <h1>Followed Sources</h1>
      <p className="subtitle">News sources you're currently following</p>

      {error && <p className="error">{error}</p>}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading followed sources...</p>
        </div>
      ) : followedSources.length === 0 ? (
        <div className="no-followed-sources">
          <p>You're not following any news sources yet.</p>
          <p>Start following sources from the Home or For You pages to see them here!</p>
        </div>
      ) : (
        <>
          <div className="sources-grid">
            {displayedSources.map(source => (
              <div key={source.name} className="source-card">
                <div className="source-header">
                  {source.image ? (
                    <div className="source-image">
                      <img src={source.image} alt={source.name} />
                    </div>
                  ) : (
                    <div className="source-image source-placeholder">
                      <div className="source-initial">{source.name[0]}</div>
                    </div>
                  )}
                  <h2 className="source-name">{source.name}</h2>
                </div>
                
                <div className="source-details">
                  <p>{source.articleCount} articles in your feed</p>
                </div>
                
                <div className="source-actions">
                  {source.url && (
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                      Visit Source
                    </a>
                  )}
                  <button 
                    onClick={() => handleUnfollow(source.name)}
                    className="unfollow-btn"
                  >
                    Unfollow
                  </button>
                </div>
              </div>
            ))}
          </div>
          
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
        </>
      )}
    </div>
  );
}

export default Following; 