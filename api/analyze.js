const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('./config');
const { validateApiKey, validateText, extractKeywords, logRequest } = require('./utils');

/**
 * Advanced text analysis endpoint
 * Provides keyword extraction, sentiment analysis, and topic detection
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { text, includeKeywords = true, includeSentiment = true, includeTopics = true } = req.body;
    
    logRequest(req, { 
      textLength: text ? text.length : 0,
      includeKeywords,
      includeSentiment,
      includeTopics
    });
    
    // Validate inputs
    const textValidation = validateText(text);
    if (!textValidation.valid) {
      return res.status(400).json({ 
        success: false,
        error: textValidation.error,
        code: 'INVALID_INPUT'
      });
    }
    
    const apiKeyValidation = validateApiKey(process.env.GEMINI_API_KEY);
    if (!apiKeyValidation.valid) {
      return res.status(500).json({ 
        success: false,
        error: config.ERRORS.INVALID_API_KEY,
        details: apiKeyValidation.error,
        code: 'INVALID_API_KEY'
      });
    }
    
    const cleanText = textValidation.text;
    const analysis = {};
    
    // Extract keywords using simple frequency analysis
    if (includeKeywords) {
      analysis.keywords = extractKeywords(cleanText, 15);
    }
    
    // Use Gemini for sentiment and topic analysis
    if (includeSentiment || includeTopics) {
      const genAI = new GoogleGenerativeAI(apiKeyValidation.key);
      const model = genAI.getGenerativeModel({ model: config.GEMINI.MODEL });
      
      let analysisPrompt = "Analyze the following text and provide:\n";
      
      if (includeSentiment) {
        analysisPrompt += "1. Sentiment analysis (positive/negative/neutral with confidence score)\n";
      }
      
      if (includeTopics) {
        analysisPrompt += "2. Main topics and themes (list of 5-10 key topics)\n";
      }
      
      analysisPrompt += "\nFormat your response as JSON with the following structure:\n";
      analysisPrompt += "{\n";
      
      if (includeSentiment) {
        analysisPrompt += '  "sentiment": {"label": "positive|negative|neutral", "confidence": 0.85, "explanation": "brief explanation"},\n';
      }
      
      if (includeTopics) {
        analysisPrompt += '  "topics": [{"topic": "topic name", "relevance": 0.9, "description": "brief description"}]\n';
      }
      
      analysisPrompt += "}\n\nText to analyze:\n" + cleanText;
      
      console.log('Sending analysis request to Gemini API...');
      const result = await model.generateContent(analysisPrompt);
      const response = result.response.text();
      
      try {
        // Try to parse JSON response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const aiAnalysis = JSON.parse(jsonMatch[0]);
          
          if (includeSentiment && aiAnalysis.sentiment) {
            analysis.sentiment = aiAnalysis.sentiment;
          }
          
          if (includeTopics && aiAnalysis.topics) {
            analysis.topics = aiAnalysis.topics;
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse AI analysis response:', parseError.message);
        // Fallback to basic analysis
        if (includeSentiment) {
          analysis.sentiment = {
            label: "neutral",
            confidence: 0.5,
            explanation: "Unable to determine sentiment automatically"
          };
        }
        
        if (includeTopics) {
          analysis.topics = [
            { topic: "General Content", relevance: 0.5, description: "Unable to extract specific topics" }
          ];
        }
      }
    }
    
    // Add text statistics
    analysis.statistics = {
      characterCount: cleanText.length,
      wordCount: cleanText.split(/\s+/).length,
      sentenceCount: cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
      paragraphCount: cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
      averageWordsPerSentence: Math.round(cleanText.split(/\s+/).length / cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0).length),
      readingTimeMinutes: Math.ceil(cleanText.split(/\s+/).length / 200) // Average reading speed
    };
    
    console.log('Text analysis completed successfully');
    
    return res.status(200).json({
      success: true,
      analysis,
      metadata: {
        timestamp: new Date().toISOString(),
        textLength: cleanText.length,
        analysisTypes: {
          keywords: includeKeywords,
          sentiment: includeSentiment,
          topics: includeTopics
        }
      }
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      success: false,
      error: config.ERRORS.PROCESSING_ERROR,
      details: error.message,
      code: 'ANALYSIS_ERROR'
    });
  }
};
