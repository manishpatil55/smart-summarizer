# Smart Summarizer Pro 🤖

**Advanced AI-powered document summarization with multi-format support, sentiment analysis, and intelligent citation tracking.**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-username/smart-summarizer-pro)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18+-brightgreen.svg)](https://nodejs.org/)

## ✨ Features

### 🧠 **AI-Powered Summarization**
- **Multiple Modes**: Quick (30%), Detailed (60%), Academic (80%), Business (40%), Custom
- **Advanced Prompting**: Context-aware summarization with intelligent prompt engineering
- **Citation Preservation**: Maintains important references and sources

### 📄 **Multi-Format Support**
- **PDF**: Advanced text extraction with progress indicators
- **DOCX**: Microsoft Word document processing
- **TXT**: Plain text files
- **HTML**: Web content processing
- **RTF**: Rich Text Format support
- **Drag & Drop**: Intuitive file upload interface

### 📊 **Advanced Text Analysis**
- **Sentiment Analysis**: Positive/Negative/Neutral detection with confidence scores
- **Keyword Extraction**: Automatic identification of key terms and phrases
- **Topic Detection**: AI-powered topic and theme identification
- **Text Statistics**: Word count, reading time, complexity analysis

### 🎨 **Modern Interface**
- **Dark/Light Theme**: Toggle between themes with system preference detection
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Processing**: Live progress indicators and status updates
- **Accessibility**: WCAG compliant with keyboard navigation support

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ installed
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/smart-summarizer-pro.git
   cd smart-summarizer-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file with your actual Gemini API key
   echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📖 **Usage Guide**

### Basic Summarization
1. **Input Method**: Choose between text input or file upload
2. **Select Mode**: Pick from Quick, Detailed, Academic, Business, or Custom
3. **Configure Options**: Set citation style, focus areas, and advanced features
4. **Generate**: Click "Generate Summary" and wait for AI processing
5. **Review & Export**: Copy, download, or create a new summary

### Advanced Features
- **Batch Processing**: Upload multiple files for simultaneous processing
- **Text Analysis**: Enable keyword extraction and sentiment analysis
- **Custom Prompts**: Specify focus areas for targeted summarization
- **Citation Styles**: Choose from Numeric, APA, MLA, Chicago, Harvard, IEEE

## 🔧 **API Documentation**

### Available Endpoints

#### `POST /api/summarize`
Generate AI-powered document summaries.

**Request:**
```json
{
  "text": "Document text to summarize...",
  "mode": "DETAILED",
  "length": 60,
  "citationStyle": "NUMERIC",
  "focusAreas": "methodology, conclusions",
  "includeKeywords": true,
  "includeSentiment": false
}
```

#### `POST /api/analyze`
Advanced text analysis with sentiment and topic detection.

#### `POST /api/batch`
Batch processing for multiple documents.

#### `GET /api/health`
Health check endpoint.

#### `GET /api/docs`
Interactive API documentation.

## 🛠️ **Technology Stack**

### Frontend
- **HTML5/CSS3**: Modern semantic markup and styling
- **Vanilla JavaScript**: ES6+ with modern browser APIs
- **CSS Grid/Flexbox**: Responsive layout system
- **Font Awesome**: Professional icon library

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **Google Gemini API**: Advanced AI language model
- **PDF.js**: Client-side PDF processing
- **Mammoth.js**: DOCX document processing

## 🔒 **Security & Privacy**

- **API Key Protection**: Environment variables with validation
- **Rate Limiting**: Prevents API abuse and ensures fair usage
- **Input Sanitization**: Protects against malicious content
- **CORS Configuration**: Secure cross-origin requests
- **No Data Storage**: Documents are processed in memory only

## 🚀 **Deployment**

### Vercel (Recommended)
```bash
npm run deploy
```

### Manual Deployment
1. Set environment variables on your hosting platform
2. Install dependencies: `npm install --production`
3. Start the server: `npm start`

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License.

## 🙏 **Acknowledgments**

- Google Gemini API for advanced AI capabilities
- PDF.js team for excellent PDF processing
- Font Awesome for beautiful icons
- The open-source community for inspiration and tools

---

**Made with ❤️ for the AI community**
