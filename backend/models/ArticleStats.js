const mongoose = require('mongoose');

const ArticleStatsSchema = new mongoose.Schema({
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true,
    unique: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  lastViewed: {
    type: Date,
    default: Date.now
  },
  trendingScore: {
    type: Number,
    default: 0
  },
  // Track view history to calculate trend
  viewHistory: [{
    count: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // Track unique visitors to prevent abuse
  uniqueVisitors: [{
    type: String // Store user IDs or hashed IPs
  }]
});

// Method to recalculate trending score
// Formula: (views * 1) + (likes * 3) + recency factor
ArticleStatsSchema.methods.calculateTrendingScore = function() {
  const now = new Date();
  const lastViewedDate = this.lastViewed || now;
  
  // Calculate recency factor (higher if viewed recently)
  // Will decrease as time passes since last view
  const hoursSinceLastView = Math.max(0, (now - lastViewedDate) / (1000 * 60 * 60));
  const recencyFactor = Math.max(0, 10 - hoursSinceLastView); // 0-10 scale based on recency
  
  // Calculate trending score
  this.trendingScore = (this.views * 1) + (this.likes * 3) + recencyFactor;
  
  return this.trendingScore;
};

// Method to increment views and update trending score
ArticleStatsSchema.methods.incrementViews = function(userId = null) {
  // Check if this user/visitor has already been counted
  if (userId && !this.uniqueVisitors.includes(userId)) {
    this.uniqueVisitors.push(userId);
    this.views += 1;
    
    // Add to view history for trend analysis
    this.viewHistory.push({
      count: 1,
      date: new Date()
    });
  } else if (!userId) {
    // If no user ID provided, just increment views
    this.views += 1;
  }
  
  this.lastViewed = new Date();
  this.calculateTrendingScore();
};

module.exports = mongoose.model('ArticleStats', ArticleStatsSchema); 