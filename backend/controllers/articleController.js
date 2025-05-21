const axios = require('axios');
const Article = require('../models/Article');
const User = require('../models/User');

// Fetch news from GNews API and save to MongoDB
const fetchAndSaveNews = async (req, res) => {
  try {
    // Get category from query params, default to 'general' if not provided
    const { category } = req.query;
    const newsCategory = category || 'general';
    
    // Map our app categories to GNews API categories if needed
    const categoryMapping = {
      'general': 'general',
      'world': 'world',
      'business': 'business',
      'nation': 'nation',
      'technology': 'technology',
      'entertainment': 'entertainment',
      'sports': 'sports',
      'science': 'science',
      'health': 'health'
    };
    
    // Get the GNews API category
    const apiCategory = categoryMapping[newsCategory] || 'general';
    
    // Build the API URL with category parameter
    const apiUrl = apiCategory === 'general' 
      ? `https://gnews.io/api/v4/top-headlines?token=${process.env.GNEWS_API_KEY}&lang=en`
      : `https://gnews.io/api/v4/top-headlines?category=${apiCategory}&token=${process.env.GNEWS_API_KEY}&lang=en`;
    
    // Fetch news from GNews API with category parameter
    const response = await axios.get(apiUrl);

    if (!response.data || !response.data.articles) {
      return res.status(404).json({ 
        message: 'No articles found in the API response' 
      });
    }

    // Process and save each article
    const articles = response.data.articles;
    const savedArticles = [];

    for (const article of articles) {
      // Format the article data according to our model
      const articleData = {
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        image: article.image,
        publishedAt: new Date(article.publishedAt),
        sourceName: article.source?.name,
        sourceUrl: article.source?.url,
        category: newsCategory
      };

      // Check if article already exists (by URL)
      const existingArticle = await Article.findOne({ url: articleData.url });
      
      if (!existingArticle) {
        // Create and save new article
        const newArticle = new Article(articleData);
        const savedArticle = await newArticle.save();
        savedArticles.push(savedArticle);
      }
    }

    // Get all articles for the requested category
    const allArticles = await Article.find({ category: newsCategory }).sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      message: `${savedArticles.length} new ${newsCategory} articles saved`,
      data: allArticles
    });
  } catch (error) {
    console.error('Error fetching or saving news:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching or saving news',
      error: error.message
    });
  }
};

// Get all articles from the database
const getAllArticles = async (req, res) => {
  try {
    const { source, limit, category } = req.query;
    
    // Create query filter
    const filter = {};
    if (source) {
      filter.sourceName = source;
    }
    if (category) {
      filter.category = category;
    }
    
    // Set query options
    const options = { sort: { publishedAt: -1 } };
    if (limit) {
      options.limit = parseInt(limit, 10);
    }
    
    // Execute query
    const articles = await Article.find(filter, null, options);
    
    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    console.error('Error fetching articles from database:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles from database',
      error: error.message
    });
  }
};

// Like an article
const likeArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId;

    // Find the article
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Try to find the user
    let user = await User.findById(userId).catch(err => null);
    
    // Update the article likes count
    article.likes += 1;
    await article.save();
    
    // Update article stats if module is available
    try {
      const ArticleStats = require('../models/ArticleStats');
      // Find or create stats record
      let stats = await ArticleStats.findOne({ articleId: id });
      
      if (stats) {
        stats.likes = article.likes;
        stats.calculateTrendingScore();
        await stats.save();
      } else {
        // Create new stats record if it doesn't exist
        const newStats = new ArticleStats({
          articleId: id,
          likes: article.likes,
          views: 0,
          lastViewed: new Date(),
          trendingScore: 0
        });
        newStats.calculateTrendingScore();
        await newStats.save();
      }
    } catch (statsError) {
      // Log error but continue with the operation
      console.error('Error updating article stats:', statsError);
    }
    
    // For mock frontend users, just return the updated article
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Article liked successfully',
        article
      });
    }

    // Check if user already liked this article
    if (user.likedArticles.includes(id)) {
      return res.status(200).json({
        success: true,
        message: 'Article already liked by this user',
        article
      });
    }

    // Add the article to user's liked articles
    user.likedArticles.push(id);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Article liked successfully',
      article
    });
  } catch (error) {
    console.error('Error liking article:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking article',
      error: error.message
    });
  }
};

// Unlike an article
const unlikeArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId;

    // Find the article
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Try to find the user
    let user = await User.findById(userId).catch(err => null);
    
    // Update the article likes count
    if (article.likes > 0) {
      article.likes -= 1;
      await article.save();
      
      // Update article stats if module is available
      try {
        const ArticleStats = require('../models/ArticleStats');
        // Find or create stats record
        let stats = await ArticleStats.findOne({ articleId: id });
        
        if (stats) {
          stats.likes = article.likes;
          stats.calculateTrendingScore();
          await stats.save();
        }
      } catch (statsError) {
        // Log error but continue with the operation
        console.error('Error updating article stats:', statsError);
      }
    }
    
    // For mock frontend users, just return the updated article
    if (!user) {      
      return res.status(200).json({
        success: true,
        message: 'Article unliked successfully',
        article
      });
    }

    // Check if user has liked this article
    if (!user.likedArticles.includes(id)) {
      return res.status(200).json({
        success: true,
        message: 'Article not liked by this user',
        article
      });
    }

    // Remove the article from user's liked articles
    user.likedArticles = user.likedArticles.filter(
      (articleId) => articleId.toString() !== id
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Article unliked successfully',
      article
    });
  } catch (error) {
    console.error('Error unliking article:', error);
    res.status(500).json({
      success: false,
      message: 'Error unliking article',
      error: error.message
    });
  }
};

// Follow a news source
const followSource = async (req, res) => {
  try {
    const { name } = req.params;
    const userId = req.body.userId;

    // Try to find the user
    let user = await User.findById(userId).catch(err => null);
    
    // For mock frontend users, just return success
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Source followed successfully',
        followedSources: [name]
      });
    }

    // Check if user already follows this source
    if (user.followedSources.includes(name)) {
      return res.status(200).json({
        success: true,
        message: 'Source already followed by this user',
        followedSources: user.followedSources
      });
    }

    // Add the source to user's followed sources
    user.followedSources.push(name);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Source followed successfully',
      followedSources: user.followedSources
    });
  } catch (error) {
    console.error('Error following source:', error);
    res.status(500).json({
      success: false,
      message: 'Error following source',
      error: error.message
    });
  }
};

// Unfollow a news source
const unfollowSource = async (req, res) => {
  try {
    const { name } = req.params;
    const userId = req.body.userId;

    // Try to find the user
    let user = await User.findById(userId).catch(err => null);
    
    // For mock frontend users, just return success
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Source unfollowed successfully',
        followedSources: []
      });
    }

    // Check if user follows this source
    if (!user.followedSources.includes(name)) {
      return res.status(200).json({
        success: true,
        message: 'Source not followed by this user',
        followedSources: user.followedSources
      });
    }

    // Remove the source from user's followed sources
    user.followedSources = user.followedSources.filter(
      (source) => source !== name
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Source unfollowed successfully',
      followedSources: user.followedSources
    });
  } catch (error) {
    console.error('Error unfollowing source:', error);
    res.status(500).json({
      success: false,
      message: 'Error unfollowing source',
      error: error.message
    });
  }
};

// Get recommended articles based on user preferences
const getRecommendedArticles = async (req, res) => {
  try {
    const userId = req.query.userId;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let recommendedArticles = [];
    let likedArticles = [];
    let followedSourceArticles = [];
    let relatedArticles = [];

    // Get the articles the user has already liked
    if (user.likedArticles.length > 0) {
      likedArticles = await Article.find({
        _id: { $in: user.likedArticles }
      }).sort({ publishedAt: -1 });
      
      // Find the sources of liked articles
      const likedSources = likedArticles.map(article => article.sourceName)
        .filter(Boolean);
      
      // Find related articles from same sources (excluding already liked)
      relatedArticles = await Article.find({
        sourceName: { $in: likedSources },
        _id: { $nin: user.likedArticles } // Exclude already liked articles
      }).sort({ publishedAt: -1 });
    }

    // Get articles from sources user follows
    if (user.followedSources.length > 0) {
      followedSourceArticles = await Article.find({
        sourceName: { $in: user.followedSources },
        _id: { $nin: user.likedArticles } // Exclude already liked articles
      }).sort({ publishedAt: -1 });
    }

    // Combine all articles and remove duplicates
    // First add liked articles so they show first
    recommendedArticles = [...likedArticles];
    
    // Then add articles from followed sources
    const combinedArticles = [...recommendedArticles, ...followedSourceArticles];
    let uniqueArticles = Array.from(new Map(
      combinedArticles.map(article => [article._id.toString(), article])
    ).values());
    
    // Then add related articles from sources of liked articles
    const finalCombined = [...uniqueArticles, ...relatedArticles];
    recommendedArticles = Array.from(new Map(
      finalCombined.map(article => [article._id.toString(), article])
    ).values());

    // If no recommendations based on likes or follows, return newest articles
    if (recommendedArticles.length === 0) {
      recommendedArticles = await Article.find()
        .sort({ publishedAt: -1 })
        .limit(10);
    }

    // Add categories to each article to show why it's recommended
    const categorizedArticles = recommendedArticles.map(article => {
      const isLiked = user.likedArticles.includes(article._id);
      const isFromFollowedSource = user.followedSources.includes(article.sourceName);
      const isRelated = !isLiked && !isFromFollowedSource;
      
      return {
        ...article.toObject(),
        isLiked,
        isFromFollowedSource,
        isRelated
      };
    });

    res.status(200).json({
      success: true,
      count: categorizedArticles.length,
      data: categorizedArticles,
      categories: {
        liked: user.likedArticles.length,
        followedSources: user.followedSources.length,
        related: relatedArticles.length
      }
    });
  } catch (error) {
    console.error('Error getting recommended articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting recommended articles',
      error: error.message
    });
  }
};

// Get user data including liked articles and followed sources
const getUserData = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find the user in the database
    let user = await User.findById(id).catch(err => null);
    
    // If user doesn't exist, return error
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        likedArticles: user.likedArticles || [],
        followedSources: user.followedSources || []
      }
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

// Check if articles exist for a category
const checkCategoryArticles = async (req, res) => {
  try {
    const { category } = req.query;
    
    if (!category) {
      return res.status(400).json({ 
        success: false,
        message: 'Category parameter is required' 
      });
    }
    
    // Count articles in this category
    const count = await Article.countDocuments({ category });
    
    res.status(200).json({
      success: true,
      hasArticles: count > 0,
      count
    });
  } catch (error) {
    console.error('Error checking category articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking category articles',
      error: error.message
    });
  }
};

// Search for news using GNews API
const searchNews = async (req, res) => {
  try {
    const { q, max = 10, page = 1 } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false,
        message: 'Search query is required' 
      });
    }
    
    // Build the GNews search API URL with pagination parameters
    const apiUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&token=${process.env.GNEWS_API_KEY}&lang=en&max=${max}&page=${page}`;
    
    // Fetch news from GNews API with search query
    const response = await axios.get(apiUrl);

    if (!response.data || !response.data.articles) {
      return res.status(404).json({ 
        success: false,
        message: 'No search results found' 
      });
    }

    // Return the search results with pagination info
    res.status(200).json({
      success: true,
      totalArticles: response.data.totalArticles || response.data.articles.length,
      count: response.data.articles.length,
      data: response.data.articles
    });
  } catch (error) {
    console.error('Error searching for news:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching for news',
      error: error.message
    });
  }
};

// Save an external article to the database
const saveArticle = async (req, res) => {
  try {
    const articleData = req.body;
    
    if (!articleData || !articleData.title || !articleData.url) {
      return res.status(400).json({
        success: false,
        message: 'Article data is incomplete'
      });
    }
    
    // Check if article already exists (by URL)
    const existingArticle = await Article.findOne({ url: articleData.url });
    
    if (existingArticle) {
      return res.status(200).json({
        success: true,
        message: 'Article already exists in database',
        article: existingArticle
      });
    }
    
    // Format the article data according to our model
    const formattedArticle = {
      title: articleData.title,
      description: articleData.description || '',
      content: articleData.content || '',
      url: articleData.url,
      image: articleData.image || '',
      publishedAt: new Date(articleData.publishedAt) || new Date(),
      sourceName: articleData.source?.name || articleData.sourceName || 'Unknown',
      sourceUrl: articleData.source?.url || articleData.sourceUrl || '',
      category: articleData.category || 'general',
      likes: 0
    };
    
    // Create and save new article
    const newArticle = new Article(formattedArticle);
    const savedArticle = await newArticle.save();
    
    res.status(201).json({
      success: true,
      message: 'Article saved successfully',
      article: savedArticle
    });
  } catch (error) {
    console.error('Error saving article:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving article',
      error: error.message
    });
  }
};

// Search articles in MongoDB using text search
const searchLocalArticles = async (req, res) => {
  try {
    const { q, page = 1, limit = 10, category } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false,
        message: 'Search query is required' 
      });
    }
    
    // Build the search query
    const searchQuery = { $text: { $search: q } };
    
    // Add category filter if provided
    if (category && category !== 'all') {
      searchQuery.category = category;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute the search with pagination
    const articles = await Article.find(
      searchQuery,
      { score: { $meta: "textScore" } }  // Add textScore to results
    )
    .sort({ score: { $meta: "textScore" } })  // Sort by relevance
    .skip(skip)
    .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalArticles = await Article.countDocuments(searchQuery);
    
    if (articles.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'No matching articles found',
        count: 0,
        data: [],
        totalArticles: 0,
        totalPages: 0
      });
    }

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles,
      totalArticles,
      totalPages: Math.ceil(totalArticles / parseInt(limit))
    });
  } catch (error) {
    console.error('Error searching local articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching articles in database',
      error: error.message
    });
  }
};

module.exports = {
  fetchAndSaveNews,
  getAllArticles,
  likeArticle,
  unlikeArticle,
  followSource,
  unfollowSource,
  getRecommendedArticles,
  getUserData,
  checkCategoryArticles,
  searchNews,
  saveArticle,
  searchLocalArticles
}; 