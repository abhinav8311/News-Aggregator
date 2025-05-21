const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  content: {
    type: String
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String
  },
  publishedAt: {
    type: Date,
    required: true
  },
  sourceName: {
    type: String
  },
  sourceUrl: {
    type: String
  },
  category: {
    type: String,
    default: 'general',
    enum: ['general', 'world', 'business', 'nation', 'technology', 'entertainment', 'sports', 'science', 'health']
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create text index for search functionality
ArticleSchema.index({ title: 'text', description: 'text', content: 'text' });

module.exports = mongoose.model('Article', ArticleSchema); 