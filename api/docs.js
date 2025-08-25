// API documentation endpoint for Vercel deployment
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    res.status(200).json({
      title: 'Smart Summarizer Pro API',
      version: '2.0.0',
      description: 'Advanced AI-powered document summarization with multi-format support',
      baseUrl: req.headers.host ? `https://${req.headers.host}` : 'https://your-app.vercel.app',
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
          },
          example: {
            text: 'Your document text here...',
            mode: 'DETAILED',
            length: 60,
            citationStyle: 'NUMERIC',
            focusAreas: 'methodology, conclusions',
            includeKeywords: true,
            includeSentiment: false
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
        },
        '/api/health': {
          method: 'GET',
          description: 'Health check endpoint'
        },
        '/api/docs': {
          method: 'GET',
          description: 'API documentation (this endpoint)'
        }
      },
      rateLimits: {
        windowMs: '15 minutes',
        maxRequests: 100,
        maxRequestsPerIP: 50
      },
      supportedFormats: ['PDF', 'DOCX', 'TXT', 'HTML', 'RTF'],
      maxFileSize: '50MB',
      features: [
        'AI-powered summarization',
        'Multi-format document support',
        'Sentiment analysis',
        'Keyword extraction',
        'Topic detection',
        'Batch processing',
        'Multiple citation styles',
        'Dark/light theme',
        'Responsive design'
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate documentation',
      details: error.message
    });
  }
};
