const Article = require('../models/Article');
const ArticleStats = require('../models/ArticleStats');

// Calculate trending scores for all articles
const updateTrendingScores = async () => {
  try {
    console.log('Running scheduled task: updateTrendingScores');
    
    // Get all article stats
    const allStats = await ArticleStats.find();
    
    // Track the number of updated scores
    let updatedCount = 0;
    
    // Update each article's trending score
    for (const stats of allStats) {
      stats.calculateTrendingScore();
      await stats.save();
      updatedCount++;
    }
    
    console.log(`Successfully updated trending scores for ${updatedCount} articles`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error('Error updating trending scores:', error);
    return { success: false, error: error.message };
  }
};

// Sync likes between Articles and ArticleStats 
const syncArticleLikes = async () => {
  try {
    console.log('Running scheduled task: syncArticleLikes');
    
    // Get all articles with their likes
    const articles = await Article.find({}, '_id likes');
    
    // Update each article's stats
    let syncedCount = 0;
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
      syncedCount++;
    }
    
    console.log(`Successfully synced likes for ${syncedCount} articles`);
    return { success: true, syncedCount };
  } catch (error) {
    console.error('Error syncing article likes:', error);
    return { success: false, error: error.message };
  }
};

// Clean up old or unused article stats
const cleanupOldStats = async () => {
  try {
    console.log('Running scheduled task: cleanupOldStats');
    
    // Find stats for articles that no longer exist
    const allStats = await ArticleStats.find();
    let deletedCount = 0;
    
    for (const stat of allStats) {
      const article = await Article.findById(stat.articleId);
      if (!article) {
        await ArticleStats.findByIdAndDelete(stat._id);
        deletedCount++;
      }
    }
    
    console.log(`Successfully cleaned up ${deletedCount} orphaned stats entries`);
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error cleaning up old stats:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  updateTrendingScores,
  syncArticleLikes,
  cleanupOldStats
}; 