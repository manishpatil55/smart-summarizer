const config = require('./config');

/**
 * Utility functions for the Smart Summarizer API
 */

/**
 * Validate API key format and structure
 */
function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, error: 'API key is required' };
  }

  const trimmedKey = apiKey.trim();
  
  if (!trimmedKey.startsWith('AIzaSy')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  if (trimmedKey.length !== 39) {
    return { valid: false, error: `Invalid API key length: ${trimmedKey.length} (expected 39)` };
  }

  return { valid: true, key: trimmedKey };
}

/**
 * Validate input text
 */
function validateText(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Text is required' };
  }

  const trimmedText = text.trim();
  
  if (trimmedText.length < 50) {
    return { valid: false, error: config.ERRORS.TEXT_TOO_SHORT };
  }

  if (trimmedText.length > config.GEMINI.MAX_TOKENS * 4) { // Rough token estimation
    return { valid: false, error: config.ERRORS.TEXT_TOO_LONG };
  }

  return { valid: true, text: trimmedText };
}

/**
 * Split text into chunks for processing
 */
function chunkText(text, chunkSize = config.PROCESSING.CHUNK_SIZE, overlap = config.PROCESSING.OVERLAP_SIZE) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    
    // If this isn't the last chunk, try to break at a sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > start + config.PROCESSING.MIN_CHUNK_SIZE) {
        end = breakPoint + 1;
      }
    }

    chunks.push({
      text: text.slice(start, end),
      start,
      end: Math.min(end, text.length),
      index: chunks.length
    });

    start = end - overlap;
  }

  return chunks;
}

/**
 * Create enhanced prompt based on mode and options
 */
function createPrompt(text, options = {}) {
  const {
    mode = 'DETAILED',
    length = 50,
    citationStyle = 'NUMERIC',
    focusAreas = '',
    language = 'en',
    includeKeywords = false,
    includeSentiment = false
  } = options;

  const modeConfig = config.SUMMARY_MODES[mode] || config.SUMMARY_MODES.DETAILED;
  const targetLength = mode === 'CUSTOM' ? length : (modeConfig.maxLength * 100);

  let prompt = `You are an expert document analyzer and summarizer. Please analyze the following text and provide a comprehensive summary.

**Instructions:**
- Summary Type: ${modeConfig.name} - ${modeConfig.description}
- Target Length: Approximately ${targetLength}% of the original text
- Citation Style: ${citationStyle.toLowerCase()}
- Language: ${language}`;

  if (focusAreas) {
    prompt += `\n- Focus Areas: ${focusAreas}`;
  }

  if (includeKeywords) {
    prompt += `\n- Include key terms and concepts`;
  }

  if (includeSentiment) {
    prompt += `\n- Include sentiment analysis`;
  }

  prompt += `\n\n**Requirements:**
- Maintain factual accuracy
- Preserve important citations and references
- Use clear, professional language
- Structure with proper paragraphs
- Highlight key insights and conclusions`;

  if (citationStyle !== 'NUMERIC') {
    prompt += `\n- Format citations in ${citationStyle} style`;
  }

  prompt += `\n\n**Text to Analyze:**\n${text}\n\n**Summary:**`;

  return prompt;
}

/**
 * Extract keywords from text using simple frequency analysis
 */
function extractKeywords(text, limit = 10) {
  // Simple keyword extraction - in production, you might use more sophisticated NLP
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !isStopWord(word));

  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

/**
 * Simple stop words list
 */
function isStopWord(word) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is',
    'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'
  ]);
  return stopWords.has(word);
}

/**
 * Format response with metadata
 */
function formatResponse(summary, originalText, options = {}) {
  const metadata = {
    originalLength: originalText.length,
    summaryLength: summary.length,
    compressionRatio: Math.round((summary.length / originalText.length) * 100),
    timestamp: new Date().toISOString(),
    mode: options.mode || 'DETAILED',
    citationStyle: options.citationStyle || 'NUMERIC',
    processingTime: options.processingTime || 0
  };

  if (options.includeKeywords) {
    metadata.keywords = extractKeywords(originalText);
  }

  return {
    success: true,
    summary,
    metadata
  };
}

/**
 * Log request details
 */
function logRequest(req, additionalInfo = {}) {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`[${timestamp}] ${req.method} ${req.path}`, {
    ip,
    userAgent: userAgent.substring(0, 100),
    contentLength: req.get('Content-Length') || 0,
    ...additionalInfo
  });
}

module.exports = {
  validateApiKey,
  validateText,
  chunkText,
  createPrompt,
  extractKeywords,
  formatResponse,
  logRequest
};
