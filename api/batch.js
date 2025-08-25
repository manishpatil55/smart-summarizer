const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('./config');
const { validateApiKey, validateText, createPrompt, formatResponse, logRequest } = require('./utils');

/**
 * Batch processing endpoint for multiple texts
 * Allows processing multiple documents in a single request
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
    const { 
      texts = [], 
      options = {},
      combineResults = false 
    } = req.body;
    
    const {
      mode = 'DETAILED',
      length = 50,
      citationStyle = 'NUMERIC',
      focusAreas = '',
      language = 'en',
      includeKeywords = false,
      includeSentiment = false
    } = options;
    
    logRequest(req, { 
      textCount: texts.length,
      combineResults,
      mode,
      totalLength: texts.reduce((sum, text) => sum + (text?.length || 0), 0)
    });
    
    // Validate inputs
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Texts array is required and cannot be empty',
        code: 'INVALID_INPUT'
      });
    }
    
    if (texts.length > config.FILE_LIMITS.MAX_FILES) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${config.FILE_LIMITS.MAX_FILES} texts allowed per batch`,
        code: 'TOO_MANY_FILES'
      });
    }
    
    // Validate API key
    const apiKeyValidation = validateApiKey(process.env.GEMINI_API_KEY);
    if (!apiKeyValidation.valid) {
      return res.status(500).json({ 
        success: false,
        error: config.ERRORS.INVALID_API_KEY,
        details: apiKeyValidation.error,
        code: 'INVALID_API_KEY'
      });
    }
    
    // Validate each text
    const validatedTexts = [];
    const errors = [];
    
    for (let i = 0; i < texts.length; i++) {
      const textValidation = validateText(texts[i]);
      if (textValidation.valid) {
        validatedTexts.push({
          index: i,
          text: textValidation.text,
          originalLength: texts[i].length
        });
      } else {
        errors.push({
          index: i,
          error: textValidation.error
        });
      }
    }
    
    if (validatedTexts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid texts found',
        details: errors,
        code: 'NO_VALID_TEXTS'
      });
    }
    
    console.log(`Processing ${validatedTexts.length} texts in batch mode`);
    
    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKeyValidation.key);
    const model = genAI.getGenerativeModel({ 
      model: config.GEMINI.MODEL,
      generationConfig: {
        temperature: config.GEMINI.TEMPERATURE,
        topP: config.GEMINI.TOP_P,
        topK: config.GEMINI.TOP_K,
        maxOutputTokens: 2048,
      }
    });
    
    const results = [];
    const startTime = Date.now();
    
    if (combineResults) {
      // Combine all texts and process as one
      const combinedText = validatedTexts.map(item => item.text).join('\n\n---\n\n');
      
      const prompt = createPrompt(combinedText, {
        mode,
        length,
        citationStyle,
        focusAreas: focusAreas + ' (analyzing multiple documents)',
        language,
        includeKeywords,
        includeSentiment
      });
      
      console.log('Processing combined texts...');
      const result = await model.generateContent(prompt);
      const summary = result.response.text();
      
      const processingTime = Date.now() - startTime;
      const formattedResponse = formatResponse(summary, combinedText, {
        mode,
        citationStyle,
        includeKeywords,
        includeSentiment,
        processingTime
      });
      
      return res.status(200).json({
        success: true,
        type: 'combined',
        result: formattedResponse,
        processedTexts: validatedTexts.length,
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          totalProcessingTime: processingTime,
          timestamp: new Date().toISOString()
        }
      });
      
    } else {
      // Process each text individually
      for (const textItem of validatedTexts) {
        try {
          const prompt = createPrompt(textItem.text, {
            mode,
            length,
            citationStyle,
            focusAreas,
            language,
            includeKeywords,
            includeSentiment
          });
          
          console.log(`Processing text ${textItem.index + 1}/${validatedTexts.length}...`);
          const result = await model.generateContent(prompt);
          const summary = result.response.text();
          
          const itemProcessingTime = Date.now() - startTime;
          const formattedResponse = formatResponse(summary, textItem.text, {
            mode,
            citationStyle,
            includeKeywords,
            includeSentiment,
            processingTime: itemProcessingTime
          });
          
          results.push({
            index: textItem.index,
            success: true,
            ...formattedResponse
          });
          
        } catch (error) {
          console.error(`Error processing text ${textItem.index}:`, error.message);
          results.push({
            index: textItem.index,
            success: false,
            error: error.message,
            code: 'PROCESSING_ERROR'
          });
        }
      }
      
      const totalProcessingTime = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;
      
      console.log(`Batch processing completed: ${successCount}/${validatedTexts.length} successful`);
      
      return res.status(200).json({
        success: true,
        type: 'individual',
        results,
        summary: {
          total: texts.length,
          processed: validatedTexts.length,
          successful: successCount,
          failed: results.length - successCount,
          errors: errors.length
        },
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          totalProcessingTime,
          averageProcessingTime: Math.round(totalProcessingTime / validatedTexts.length),
          timestamp: new Date().toISOString()
        }
      });
    }
    
  } catch (error) {
    console.error('Batch processing error:', error);
    return res.status(500).json({
      success: false,
      error: config.ERRORS.PROCESSING_ERROR,
      details: error.message,
      code: 'BATCH_ERROR'
    });
  }
};
