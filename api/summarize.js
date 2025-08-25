const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('./config');
const { validateApiKey, validateText, createPrompt, formatResponse, logRequest } = require('./utils');

module.exports = async (req, res) => {
  const startTime = Date.now();

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and validate request data
    const {
      text,
      length = 50,
      citationStyle = 'NUMERIC',
      focusAreas = '',
      mode = 'DETAILED',
      language = 'en',
      includeKeywords = false,
      includeSentiment = false
    } = req.body;

    // Log request
    logRequest(req, {
      textLength: text ? text.length : 0,
      mode,
      citationStyle,
      includeKeywords,
      includeSentiment
    });

    // Validate text input
    const textValidation = validateText(text);
    if (!textValidation.valid) {
      return res.status(400).json({
        success: false,
        error: textValidation.error,
        code: 'INVALID_INPUT'
      });
    }

    // Validate API key
    const apiKeyValidation = validateApiKey(process.env.GEMINI_API_KEY);
    if (!apiKeyValidation.valid) {
      console.error('API Key validation failed:', apiKeyValidation.error);
      return res.status(500).json({
        success: false,
        error: config.ERRORS.INVALID_API_KEY,
        details: apiKeyValidation.error,
        code: 'INVALID_API_KEY'
      });
    }

    const apiKey = apiKeyValidation.key;
    const cleanText = textValidation.text;

    console.log('=== PROCESSING SUMMARIZATION ===');
    console.log('Mode:', mode);
    console.log('Text length:', cleanText.length);
    console.log('API Key validated successfully');

    // Initialize Google Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: config.GEMINI.MODEL,
      generationConfig: {
        temperature: config.GEMINI.TEMPERATURE,
        topP: config.GEMINI.TOP_P,
        topK: config.GEMINI.TOP_K,
        maxOutputTokens: 2048,
      }
    });

    // Create enhanced prompt
    const prompt = createPrompt(cleanText, {
      mode,
      length,
      citationStyle,
      focusAreas,
      language,
      includeKeywords,
      includeSentiment
    });

    console.log('Sending request to Gemini API...');
    console.log('Prompt length:', prompt.length);

    // Generate summary
    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response) {
      throw new Error('No response received from Gemini API');
    }

    const summary = response.text();

    if (!summary || summary.trim().length === 0) {
      throw new Error('Empty summary received from Gemini API');
    }

    const processingTime = Date.now() - startTime;
    console.log(`Summary generated successfully in ${processingTime}ms`);

    // Format and return response
    const formattedResponse = formatResponse(summary, cleanText, {
      mode,
      citationStyle,
      includeKeywords,
      includeSentiment,
      processingTime
    });

    return res.status(200).json(formattedResponse);

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