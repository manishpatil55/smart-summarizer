const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, length, citationStyle, focusAreas } = req.body;

    console.log('=== SUMMARIZATION REQUEST ===');
    console.log('Request received at:', new Date().toISOString());
    console.log('Text length:', text ? text.length : 0);
    console.log('Summary length:', length);
    console.log('Citation style:', citationStyle);
    console.log('Focus areas:', focusAreas);

    // Validate input
    if (!text || text.trim().length === 0) {
      console.log('ERROR: No text provided');
      return res.status(400).json({ error: 'Text is required and cannot be empty' });
    }

    if (text.length < 50) {
      console.log('ERROR: Text too short');
      return res.status(400).json({ error: 'Text must be at least 50 characters long for meaningful summarization' });
    }

    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error('ERROR: GEMINI_API_KEY environment variable is not set');
      return res.status(500).json({
        error: 'API key not configured',
        details: 'Please set the GEMINI_API_KEY environment variable'
      });
    }

    // Validate API key format
    const apiKey = process.env.GEMINI_API_KEY.trim();
    if (!apiKey.startsWith('AIzaSy')) {
      console.error('ERROR: Invalid API key format - does not start with AIzaSy');
      return res.status(500).json({
        error: 'Invalid API key format',
        details: 'Gemini API key should start with "AIzaSy"',
        code: 'INVALID_API_KEY'
      });
    }

    if (apiKey.length !== 39) {
      console.error('ERROR: Invalid API key length:', apiKey.length, 'expected: 39');
      return res.status(500).json({
        error: 'Invalid API key length',
        details: `Gemini API key should be exactly 39 characters long. Your key is ${apiKey.length} characters. Please get a new API key from Google AI Studio.`,
        code: 'INVALID_API_KEY'
      });
    }

    console.log('API Key validation passed (length:', apiKey.length, ')');
    console.log('API Key prefix:', apiKey.substring(0, 10) + '...');

    // Initialize Google Gemini API
    console.log('Initializing Gemini API...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using correct model name

    // Create simplified prompt for summarization
    const maxTextLength = 8000; // Reduced to avoid token limits
    const truncatedText = text.length > maxTextLength ? text.substring(0, maxTextLength) + '...' : text;

    let prompt = `Please summarize the following text at approximately ${length}% of the original length.`;

    if (focusAreas) {
      prompt += ` Focus on: ${focusAreas}.`;
    }

    prompt += ` Use ${citationStyle} citation style and preserve important references.

Text to summarize:
${truncatedText}

Summary:`;

    console.log('Prompt created (length:', prompt.length, ')');
    console.log('Sending request to Gemini API...');
    console.log('Using model: gemini-1.5-flash');
    console.log('API Key being used (first 20 chars):', apiKey.substring(0, 20) + '...');
    console.log('Full prompt:', prompt.substring(0, 200) + '...');

    const result = await model.generateContent(prompt);
    console.log('Got result from generateContent');
    const response = result.response;

    if (!response) {
      throw new Error('No response received from Gemini API');
    }

    const summary = response.text();

    if (!summary || summary.trim().length === 0) {
      throw new Error('Empty summary received from Gemini API');
    }

    console.log('Summary generated successfully (length:', summary.length, ')');
    console.log('=== REQUEST COMPLETED ===');

    return res.status(200).json({
      summary,
      metadata: {
        originalLength: text.length,
        summaryLength: summary.length,
        compressionRatio: Math.round((summary.length / text.length) * 100),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('=== ERROR OCCURRED ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Enhanced error handling for different types of errors
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid API key') ||
        error.message.includes('string did not match the expected pattern') ||
        error.message.includes('pattern')) {
      console.error('API Key Error: Invalid or malformed API key');
      return res.status(401).json({
        error: 'Invalid API key',
        details: 'The provided Gemini API key is invalid, malformed, or expired. Please get a new API key from Google AI Studio (https://makersuite.google.com/app/apikey).',
        code: 'INVALID_API_KEY'
      });
    }

    if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
      console.error('Quota Error: API quota exceeded');
      return res.status(429).json({
        error: 'API quota exceeded',
        details: 'You have exceeded your Gemini API quota. Please check your usage limits.',
        code: 'QUOTA_EXCEEDED'
      });
    }

    if (error.message.includes('SAFETY') || error.message.includes('blocked')) {
      console.error('Safety Error: Content blocked by safety filters');
      return res.status(400).json({
        error: 'Content blocked',
        details: 'The content was blocked by Gemini\'s safety filters. Please try with different text.',
        code: 'CONTENT_BLOCKED'
      });
    }

    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      console.error('Timeout Error: Request timed out');
      return res.status(408).json({
        error: 'Request timeout',
        details: 'The request to Gemini API timed out. Please try again.',
        code: 'TIMEOUT'
      });
    }

    // Generic error handling
    console.error('Generic Error: Unexpected error occurred');
    return res.status(500).json({
      error: 'An unexpected error occurred while generating the summary',
      details: error.message,
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};