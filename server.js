const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Import the summarize function
const summarizeHandler = require('./api/summarize.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// API route
app.post('/api/summarize', (req, res) => {
  console.log('API route hit: /api/summarize');
  summarizeHandler(req, res);
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('API endpoint available at: http://localhost:' + PORT + '/api/summarize');
  console.log('Environment variables loaded:', {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Found' : 'Not found'
  });
});
