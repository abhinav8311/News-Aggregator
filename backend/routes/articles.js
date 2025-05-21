const express = require('express');
const router = express.Router();
const { fetchAndSaveNews, getAllArticles, likeArticle, unlikeArticle, followSource, unfollowSource, getRecommendedArticles, getUserData, checkCategoryArticles, searchNews, saveArticle, searchLocalArticles } = require('../controllers/articleController');
const { viewArticle, getTrendingArticles, syncArticleLikes, getArticleStats } = require('../controllers/articleStatsController');
const { authMiddleware } = require('../middleware/authMiddleware');

// @route   GET /api/fetch-news
// @desc    Fetch news from GNews API and save to MongoDB
// @access  Public
router.get('/fetch-news', fetchAndSaveNews);

// Article Stats Routes
// ==========================================

// @route   POST /api/articles/:id/view
// @desc    Record an article view
// @access  Public
router.post('/articles/:id/view', viewArticle);

// @route   GET /api/articles/:id/stats
// @desc    Get stats for a specific article
// @access  Public
router.get('/articles/:id/stats', getArticleStats);

// @route   GET /api/trending
// @desc    Get trending articles
// @access  Public
router.get('/trending', getTrendingArticles);

// @route   GET /api/sync-likes
// @desc    Sync article likes between collections
// @access  Private/Admin (should be protected in production)
router.get('/sync-likes', syncArticleLikes);

// Existing Routes
// ==========================================

// @route   GET /api/articles
// @desc    Get all articles from the database
// @access  Public
router.get('/articles', getAllArticles);

// @route   POST /api/articles/:id/like
// @desc    Like an article
// @access  Public
router.post('/articles/:id/like', likeArticle);

// @route   POST /api/articles/:id/unlike
// @desc    Unlike an article
// @access  Public
router.post('/articles/:id/unlike', unlikeArticle);

// @route   POST /api/sources/:name/follow
// @desc    Follow a news source
// @access  Public
router.post('/sources/:name/follow', followSource);

// @route   POST /api/sources/:name/unfollow
// @desc    Unfollow a news source
// @access  Public
router.post('/sources/:name/unfollow', unfollowSource);

// @route   GET /api/recommended-articles
// @desc    Get recommended articles based on user preferences
// @access  Public
router.get('/recommended-articles', getRecommendedArticles);

// @route   GET /api/users/:id
// @desc    Get user data including liked articles and followed sources
// @access  Public
router.get('/users/:id', getUserData);

// @route   GET /api/check-category
// @desc    Check if articles exist for a category
// @access  Public
router.get('/check-category', checkCategoryArticles);

// @route   GET /api/search-news
// @desc    Search for news using GNews API
// @access  Public
router.get('/search-news', searchNews);

// @route   GET /api/search-local
// @desc    Search for articles in MongoDB database
// @access  Public
router.get('/search-local', searchLocalArticles);

// @route   POST /api/save-article
// @desc    Save an external article to database
// @access  Public
router.post('/save-article', saveArticle);

module.exports = router; 