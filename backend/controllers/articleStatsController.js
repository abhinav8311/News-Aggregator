const ArticleStats = require('../models/ArticleStats');
const Article = require('../models/Article');

// Record an article view and update its stats
const viewArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.ip; // Use user ID if logged in or IP address

    // Find or create stats for this article
    let stats = await ArticleStats.findOne({ articleId: id });
    
    if (!stats) {
      stats = new ArticleStats({
        articleId: id,
        views: 0,
        likes: 0,
        lastViewed: new Date(),
        trendingScore: 0,
        viewHistory: [],
        uniqueVisitors: []
      });
    }
    
    // Increment views and update trending score
    stats.incrementViews(userId);
    await stats.save();
    
    res.status(200).json({
      success: true,
      message: 'Article view recorded',
      stats: {
        views: stats.views,
        likes: stats.likes,
        trendingScore: stats.trendingScore
      }
    });
  } catch (error) {
    console.error('Error recording article view:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording article view',
      error: error.message
    });
  }
};

// Get trending articles based on trending score
const getTrendingArticles = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get top trending articles by score
    const trendingStats = await ArticleStats
      .find()
      .sort({ trendingScore: -1 })
      .limit(parseInt(limit));
      
    // Extract article IDs
    const articleIds = trendingStats.map(stat => stat.articleId);
    
    // Fetch the actual articles
    const trendingArticles = await Article.find({
      _id: { $in: articleIds }
    });
    
    // Sort the articles in the same order as the stats
    const sortedArticles = articleIds.map(id => 
      trendingArticles.find(article => article._id.toString() === id.toString())
    ).filter(Boolean);
    
    // Add stat information to each article
    const articlesWithStats = sortedArticles.map(article => {
      const stats = trendingStats.find(
        stat => stat.articleId.toString() === article._id.toString()
      );
      
      return {
        ...article.toObject(),
        views: stats?.views || 0,
        trendingScore: stats?.trendingScore || 0
      };
    });
    
    res.status(200).json({
      success: true,
      articles: articlesWithStats
    });
  } catch (error) {
    console.error('Error fetching trending articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending articles',
      error: error.message
    });
  }
};

// Sync likes between Article and ArticleStats
const syncArticleLikes = async (req, res) => {
  try {
    // Get all articles with their likes
    const articles = await Article.find({}, '_id likes');
    
    // Update each article's stats
    for (const article of articles) {
      await ArticleStats.findOneAndUpdate(
        { articleId: article._id },
        { 
          $set: { likes: article.likes },
          $setOnInsert: {
            views: 0,
            lastViewed: new Date(),
            trendingScore: 0
          }
        },
        { upsert: true, new: true }
      );
    }
    
    // Recalculate trending scores
    const stats = await ArticleStats.find();
    for (const stat of stats) {
      stat.calculateTrendingScore();
      await stat.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Article likes synchronized',
      count: articles.length
    });
  } catch (error) {
    console.error('Error syncing article likes:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing article likes',
      error: error.message
    });
  }
};

// Get stats for a specific article
const getArticleStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const stats = await ArticleStats.findOne({ articleId: id });
    
    if (!stats) {
      return res.status(200).json({
        success: true,
        stats: {
          views: 0,
          likes: 0,
          trendingScore: 0,
          lastViewed: null
        }
      });
    }
    
    res.status(200).json({
      success: true,
      stats: {
        views: stats.views,
        likes: stats.likes,
        trendingScore: stats.trendingScore,
        lastViewed: stats.lastViewed
      }
    });
  } catch (error) {
    console.error('Error fetching article stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching article stats',
      error: error.message
    });
  }
};

module.exports = {
  viewArticle,
  getTrendingArticles,
  syncArticleLikes,
  getArticleStats
}; //new comment