const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import API handlers
const summarizeHandler = require('./api/summarize.js');
const analyzeHandler = require('./api/analyze.js');
const batchHandler = require('./api/batch.js');
const config = require('./api/config.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMITS.WINDOW_MS,
  max: config.RATE_LIMITS.MAX_REQUESTS,
  message: {
    success: false,
    error: config.ERRORS.RATE_LIMIT_EXCEEDED,
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(limiter);
app.use(express.static('public'));

// API Routes
app.post('/api/summarize', (req, res) => {
  console.log('API route hit: /api/summarize');
  summarizeHandler(req, res);
});

app.post('/api/analyze', (req, res) => {
  console.log('API route hit: /api/analyze');
  analyzeHandler(req, res);
});

app.post('/api/batch', (req, res) => {
  console.log('API route hit: /api/batch');
  batchHandler(req, res);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      summarization: true,
      analysis: true,
      batchProcessing: true,
      multipleFormats: true
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Smart Summarizer API',
    version: '2.0.0',
    endpoints: {
      '/api/summarize': {
        method: 'POST',
        description: 'Generate AI-powered summaries',
        parameters: {
          text: 'string (required) - Text to summarize',
          mode: 'string - QUICK|DETAILED|ACADEMIC|BUSINESS|CUSTOM',
          length: 'number - Summary length percentage (1-100)',
          citationStyle: 'string - NUMERIC|APA|MLA|CHICAGO|HARVARD|IEEE',
          focusAreas: 'string - Specific topics to focus on',
          language: 'string - Language code (default: en)',
          includeKeywords: 'boolean - Extract keywords',
          includeSentiment: 'boolean - Include sentiment analysis'
        }
      },
      '/api/analyze': {
        method: 'POST',
        description: 'Advanced text analysis',
        parameters: {
          text: 'string (required) - Text to analyze',
          includeKeywords: 'boolean - Extract keywords',
          includeSentiment: 'boolean - Sentiment analysis',
          includeTopics: 'boolean - Topic detection'
        }
      },
      '/api/batch': {
        method: 'POST',
        description: 'Batch process multiple texts',
        parameters: {
          texts: 'array (required) - Array of texts to process',
          options: 'object - Processing options',
          combineResults: 'boolean - Combine all texts into one summary'
        }
      }
    }
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Smart Summarizer Server v2.0.0`);
  console.log(`📍 Server running at http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log('\n🔗 Available Endpoints:');
  console.log(`   POST /api/summarize - AI-powered summarization`);
  console.log(`   POST /api/analyze   - Advanced text analysis`);
  console.log(`   POST /api/batch     - Batch processing`);
  console.log('\n⚙️  Environment:');
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Not found'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});
