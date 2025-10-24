// Configuration and constants for the Smart Summarizer API
module.exports = {
  // Gemini API Configuration
  GEMINI: {
    MODEL: "gemini-2.0-flash",
    MAX_TOKENS: 30000,
    TEMPERATURE: 0.7,
    TOP_P: 0.8,
    TOP_K: 40
  },

  // Summarization Modes
  SUMMARY_MODES: {
    QUICK: {
      name: "Quick Summary",
      description: "Fast, concise overview",
      maxLength: 0.3,
      temperature: 0.5
    },
    DETAILED: {
      name: "Detailed Summary",
      description: "Comprehensive analysis with key points",
      maxLength: 0.6,
      temperature: 0.7
    },
    ACADEMIC: {
      name: "Academic Summary",
      description: "Scholarly format with citations",
      maxLength: 0.8,
      temperature: 0.6
    },
    BUSINESS: {
      name: "Business Summary",
      description: "Executive summary format",
      maxLength: 0.4,
      temperature: 0.5
    },
    CUSTOM: {
      name: "Custom Length",
      description: "User-defined length",
      maxLength: null,
      temperature: 0.7
    }
  },

  // Citation Styles
  CITATION_STYLES: {
    NUMERIC: "numeric",
    APA: "apa",
    MLA: "mla",
    CHICAGO: "chicago",
    HARVARD: "harvard",
    IEEE: "ieee"
  },

  // File Processing
  FILE_LIMITS: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_FILES: 10,
    SUPPORTED_TYPES: [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/html',
      'application/rtf'
    ]
  },

  // Rate Limiting
  RATE_LIMITS: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    MAX_REQUESTS_PER_IP: 50
  },

  // Error Messages
  ERRORS: {
    INVALID_API_KEY: "Invalid or missing Gemini API key",
    TEXT_TOO_SHORT: "Text must be at least 50 characters long",
    TEXT_TOO_LONG: "Text exceeds maximum length limit",
    FILE_TOO_LARGE: "File size exceeds 50MB limit",
    UNSUPPORTED_FILE: "Unsupported file format",
    RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please try again later",
    PROCESSING_ERROR: "Error processing your request",
    NETWORK_ERROR: "Network error. Please check your connection"
  },

  // Processing Options
  PROCESSING: {
    CHUNK_SIZE: 8000,
    OVERLAP_SIZE: 200,
    MIN_CHUNK_SIZE: 500
  }
};
