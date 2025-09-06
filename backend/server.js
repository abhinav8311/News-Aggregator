const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Import scheduled tasks
const { updateTrendingScores, syncArticleLikes, cleanupOldStats } = require('./utils/scheduledTasks');

// Schedule periodic tasks
// Run trending score updates every hour
setInterval(async () => {
  await updateTrendingScores();
}, 60 * 60 * 1000); // 1 hour

// Run like syncing every 12 hours
setInterval(async () => {
  await syncArticleLikes();
}, 12 * 60 * 60 * 1000); // 12 hours

// Run cleanup once a day
setInterval(async () => {
  await cleanupOldStats();
}, 24 * 60 * 60 * 1000); // 24 hours

// Also run tasks once at startup
(async () => {
  try {
    // Wait a few seconds after server start for any DB migrations/connections to settle
    setTimeout(async () => {
      await syncArticleLikes();
      await updateTrendingScores();
    }, 5000);
  } catch (error) {
    console.error('Error running startup tasks:', error);
  }
})();

// Initialize Express
const app = express();

const allowedOrigins = [
  "http://localhost:5173",        // local dev
  "https://news-aggregator-8ne4.vercel.app", // deployed frontend (no trailing slash)
  "https://newsaggregatormern.vercel.app", // current deployed frontend
  // Add more domains if you use Vercel preview URLs or custom domains
];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true   // 👈 required if using cookies
}));
app.use(express.json());

// Routes
app.use('/api', require('./routes/api'));
app.use('/api', require('./routes/articles'));
app.use('/api', require('./routes/users'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 