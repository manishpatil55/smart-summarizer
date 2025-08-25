// Smart Summarizer Pro - Main Application JavaScript

class SmartSummarizer {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.summaryHistory = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupEventListeners();
        this.setupPDFWorker();
        this.loadSummaryHistory();
    }

    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Tab switching
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // File upload
        const fileInput = document.getElementById('file-input');
        const dropZone = document.getElementById('drop-zone');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        if (dropZone) {
            dropZone.addEventListener('click', () => fileInput?.click());
            dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        }

        // Form submissions
        const summarizeBtn = document.getElementById('summarize-btn');
        if (summarizeBtn) {
            summarizeBtn.addEventListener('click', () => this.generateSummary());
        }

        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeText());
        }

        // Mode selection
        const modeSelect = document.getElementById('summary-mode');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => this.handleModeChange(e));
        }

        // Length slider
        const lengthSlider = document.getElementById('summary-length');
        if (lengthSlider) {
            lengthSlider.addEventListener('input', (e) => {
                const display = document.getElementById('length-display');
                if (display) display.textContent = e.target.value + '%';
            });
        }

        // Action buttons
        const copyBtn = document.getElementById('copy-btn');
        const downloadBtn = document.getElementById('download-btn');
        const newSummaryBtn = document.getElementById('new-summary-btn');

        if (copyBtn) copyBtn.addEventListener('click', () => this.copyToClipboard());
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadSummary());
        if (newSummaryBtn) newSummaryBtn.addEventListener('click', () => this.resetForm());
    }

    switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    handleModeChange(e) {
        const customLengthGroup = document.getElementById('custom-length-group');
        if (customLengthGroup) {
            customLengthGroup.style.display = e.target.value === 'CUSTOM' ? 'block' : 'none';
        }
    }

    setupPDFWorker() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 5000);
    }

    async handleFileSelect(event) {
        const files = event.target.files;
        if (files.length === 0) return;

        const file = files[0];
        this.showNotification(`Processing file: ${file.name}`, 'info');

        // Track file upload attempt
        if (typeof trackEvent === 'function') {
            trackEvent('file_upload_started', {
                event_category: 'File Processing',
                event_label: file.type || 'unknown',
                custom_parameters: {
                    file_name: file.name,
                    file_size: file.size,
                    file_type: file.type
                }
            });
        }

        try {
            let text = '';

            if (file.type === 'application/pdf') {
                text = await this.extractTextFromPDF(file);
            } else if (file.type === 'text/plain') {
                text = await this.readTextFile(file);
            } else if (file.type.includes('wordprocessingml') || file.name.endsWith('.docx')) {
                text = await this.extractTextFromDocx(file);
            } else {
                throw new Error('Unsupported file format');
            }

            const textArea = document.getElementById('document-text');
            if (textArea) {
                textArea.value = text;
                this.showNotification('File processed successfully!', 'success');

                // Track successful file processing
                if (typeof trackEvent === 'function') {
                    trackEvent('file_upload_success', {
                        event_category: 'File Processing',
                        event_label: file.type || 'unknown',
                        value: text.length,
                        custom_parameters: {
                            file_name: file.name,
                            file_size: file.size,
                            extracted_text_length: text.length
                        }
                    });
                }
            }
        } catch (error) {
            console.error('File processing error:', error);
            this.showNotification(`Error processing file: ${error.message}`, 'error');

            // Track file processing error
            if (typeof trackEvent === 'function') {
                trackEvent('file_upload_error', {
                    event_category: 'File Processing',
                    event_label: error.message,
                    custom_parameters: {
                        file_name: file.name,
                        file_size: file.size,
                        file_type: file.type,
                        error_type: error.name || 'Unknown'
                    }
                });
            }
        }
    }

    async extractTextFromPDF(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            
            fileReader.onload = async function() {
                try {
                    const typedArray = new Uint8Array(this.result);
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;
                    const numPages = pdf.numPages;
                    let extractedText = '';
                    
                    for (let i = 1; i <= numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        extractedText += pageText + '\n\n';
                    }
                    
                    resolve(extractedText);
                } catch (error) {
                    reject(error);
                }
            };
            
            fileReader.onerror = () => reject(new Error('Failed to read file'));
            fileReader.readAsArrayBuffer(file);
        });
    }

    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read text file'));
            reader.readAsText(file);
        });
    }

    async extractTextFromDocx(file) {
        if (typeof mammoth === 'undefined') {
            throw new Error('DOCX processing not available');
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            throw new Error('Failed to extract text from DOCX file');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
                fileInput.files = files;
                this.handleFileSelect({ target: { files } });
            }
        }
    }

    async generateSummary() {
        console.log('Generate Summary clicked!');

        // Track analytics event
        if (typeof trackEvent === 'function') {
            trackEvent('summarization_started', {
                event_category: 'AI Processing',
                event_label: 'Generate Summary Button'
            });
        }

        const textArea = document.getElementById('document-text');
        const text = textArea?.value?.trim();

        console.log('Text length:', text ? text.length : 0);

        if (!text) {
            this.showNotification('Please enter text or upload a file', 'error');
            if (typeof trackEvent === 'function') {
                trackEvent('summarization_error', {
                    event_category: 'User Error',
                    event_label: 'No text provided'
                });
            }
            return;
        }

        if (text.length < 50) {
            this.showNotification('Text must be at least 50 characters long', 'error');
            if (typeof trackEvent === 'function') {
                trackEvent('summarization_error', {
                    event_category: 'User Error',
                    event_label: 'Text too short'
                });
            }
            return;
        }

        const options = this.getFormOptions();
        console.log('Options:', options);

        // Track summarization attempt with options
        if (typeof trackEvent === 'function') {
            trackEvent('summarization_attempt', {
                event_category: 'AI Processing',
                event_label: options.mode,
                custom_parameters: {
                    text_length: text.length,
                    citation_style: options.citationStyle,
                    include_keywords: options.includeKeywords,
                    include_sentiment: options.includeSentiment
                }
            });
        }

        this.showLoading(true);

        try {
            console.log('Sending request to /api/summarize...');

            const requestBody = { text, ...options };
            console.log('Request body:', requestBody);

            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (!data.success) {
                throw new Error(data.error || data.details || 'Failed to generate summary');
            }

            this.displayResults(data, 'summary');
            this.saveSummaryToHistory(data, text, options);
            this.showNotification('Summary generated successfully!', 'success');

            // Track successful summarization
            if (typeof trackEvent === 'function') {
                trackEvent('summarization_success', {
                    event_category: 'AI Processing',
                    event_label: options.mode,
                    value: data.metadata?.processingTime || 0,
                    custom_parameters: {
                        original_length: data.metadata?.originalLength || 0,
                        summary_length: data.metadata?.summaryLength || 0,
                        compression_ratio: data.metadata?.compressionRatio || 0
                    }
                });
            }

        } catch (error) {
            console.error('Summary error:', error);
            this.showNotification(`Error: ${error.message}`, 'error');

            // Track summarization error
            if (typeof trackEvent === 'function') {
                trackEvent('summarization_error', {
                    event_category: 'API Error',
                    event_label: error.message,
                    custom_parameters: {
                        error_type: error.name || 'Unknown',
                        text_length: text.length
                    }
                });
            }
        } finally {
            this.showLoading(false);
        }
    }

    async analyzeText() {
        const textArea = document.getElementById('document-text');
        const text = textArea?.value?.trim();
        
        if (!text) {
            this.showNotification('Please enter text or upload a file', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text,
                    includeKeywords: true,
                    includeSentiment: true,
                    includeTopics: true
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to analyze text');
            }

            this.displayResults(data, 'analysis');
            this.showNotification('Text analysis completed!', 'success');

        } catch (error) {
            console.error('Analysis error:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    getFormOptions() {
        const mode = document.getElementById('summary-mode')?.value || 'DETAILED';
        let length = 50; // default

        // Get length based on mode
        if (mode === 'CUSTOM') {
            length = parseInt(document.getElementById('summary-length')?.value || '50');
        } else {
            // Use predefined lengths for each mode
            const modeLengths = {
                'QUICK': 30,
                'DETAILED': 60,
                'ACADEMIC': 80,
                'BUSINESS': 40
            };
            length = modeLengths[mode] || 50;
        }

        const options = {
            mode: mode,
            length: length,
            citationStyle: document.getElementById('citation-style')?.value || 'NUMERIC',
            focusAreas: document.getElementById('focus-areas')?.value?.trim() || '',
            language: 'en',
            includeKeywords: document.getElementById('include-keywords')?.checked || false,
            includeSentiment: document.getElementById('include-sentiment')?.checked || false
        };

        console.log('Form options:', options);
        return options;
    }

    displayResults(data, type) {
        const resultsSection = document.getElementById('results-section');
        const resultsContent = document.getElementById('results-content');
        
        if (!resultsSection || !resultsContent) return;

        if (type === 'summary') {
            resultsContent.innerHTML = this.formatSummaryResults(data);
        } else if (type === 'analysis') {
            resultsContent.innerHTML = this.formatAnalysisResults(data);
        }

        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    formatSummaryResults(data) {
        const { summary, metadata } = data;
        
        return `
            <div class="result-content">
                <div class="summary-text">${this.formatText(summary)}</div>
                ${metadata ? this.formatMetadata(metadata) : ''}
            </div>
        `;
    }

    formatAnalysisResults(data) {
        const { analysis } = data;
        let html = '<div class="analysis-results">';

        if (analysis.keywords) {
            html += this.formatKeywords(analysis.keywords);
        }

        if (analysis.sentiment) {
            html += this.formatSentiment(analysis.sentiment);
        }

        if (analysis.topics) {
            html += this.formatTopics(analysis.topics);
        }

        if (analysis.statistics) {
            html += this.formatStatistics(analysis.statistics);
        }

        html += '</div>';
        return html;
    }

    formatKeywords(keywords) {
        return `
            <div class="keywords-section">
                <h4><i class="fas fa-tags"></i> Keywords</h4>
                <div class="keywords-list">
                    ${keywords.map(kw => `<span class="keyword-tag">${kw.word} (${kw.count})</span>`).join('')}
                </div>
            </div>
        `;
    }

    formatSentiment(sentiment) {
        const icon = sentiment.label === 'positive' ? 'smile' : sentiment.label === 'negative' ? 'frown' : 'meh';
        return `
            <div class="sentiment-section">
                <h4><i class="fas fa-${icon}"></i> Sentiment Analysis</h4>
                <div class="sentiment-result">
                    <span class="sentiment-label sentiment-${sentiment.label}">${sentiment.label.toUpperCase()}</span>
                    <span class="sentiment-confidence">${Math.round(sentiment.confidence * 100)}% confidence</span>
                    <p class="sentiment-explanation">${sentiment.explanation}</p>
                </div>
            </div>
        `;
    }

    formatTopics(topics) {
        return `
            <div class="topics-section">
                <h4><i class="fas fa-list"></i> Main Topics</h4>
                <div class="topics-list">
                    ${topics.map(topic => `
                        <div class="topic-item">
                            <span class="topic-name">${topic.topic}</span>
                            <span class="topic-relevance">${Math.round(topic.relevance * 100)}%</span>
                            <p class="topic-description">${topic.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    formatStatistics(stats) {
        return `
            <div class="statistics-section">
                <h4><i class="fas fa-chart-bar"></i> Text Statistics</h4>
                <div class="stats-grid">
                    <div class="stat">
                        <span class="stat-label">Characters:</span>
                        <span class="stat-value">${stats.characterCount.toLocaleString()}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Words:</span>
                        <span class="stat-value">${stats.wordCount.toLocaleString()}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Sentences:</span>
                        <span class="stat-value">${stats.sentenceCount}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Reading Time:</span>
                        <span class="stat-value">${stats.readingTimeMinutes} min</span>
                    </div>
                </div>
            </div>
        `;
    }

    formatText(text) {
        return text.replace(/\n/g, '<br>').replace(/\[(\d+)\]/g, '<span class="citation">[$1]</span>');
    }

    formatMetadata(metadata) {
        return `
            <div class="metadata">
                <h4>Summary Statistics</h4>
                <div class="stats-grid">
                    <div class="stat">
                        <span class="stat-label">Original Length:</span>
                        <span class="stat-value">${metadata.originalLength.toLocaleString()} chars</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Summary Length:</span>
                        <span class="stat-value">${metadata.summaryLength.toLocaleString()} chars</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Compression:</span>
                        <span class="stat-value">${metadata.compressionRatio}%</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Processing Time:</span>
                        <span class="stat-value">${metadata.processingTime}ms</span>
                    </div>
                </div>
            </div>
        `;
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        const summarizeBtn = document.getElementById('summarize-btn');
        const analyzeBtn = document.getElementById('analyze-btn');
        
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
        
        if (summarizeBtn) {
            summarizeBtn.disabled = show;
            summarizeBtn.innerHTML = show ? 
                '<i class="fas fa-spinner fa-spin"></i> Processing...' : 
                '<i class="fas fa-robot"></i> Generate Summary';
        }
        
        if (analyzeBtn) {
            analyzeBtn.disabled = show;
            analyzeBtn.innerHTML = show ? 
                '<i class="fas fa-spinner fa-spin"></i> Analyzing...' : 
                '<i class="fas fa-chart-line"></i> Analyze Text';
        }
    }

    saveSummaryToHistory(data, originalText, options) {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            originalText: originalText.substring(0, 200) + '...',
            summary: data.summary,
            metadata: data.metadata,
            options
        };

        this.summaryHistory.unshift(historyItem);
        this.summaryHistory = this.summaryHistory.slice(0, 50); // Keep last 50
        localStorage.setItem('summaryHistory', JSON.stringify(this.summaryHistory));
    }

    loadSummaryHistory() {
        // Implementation for loading and displaying history
        // This would populate a history sidebar or modal
    }

    copyToClipboard() {
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent) return;

        const text = resultsContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy text', 'error');
        });
    }

    downloadSummary() {
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent) return;

        const text = resultsContent.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `summary-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Summary downloaded!', 'success');
    }

    resetForm() {
        const textArea = document.getElementById('document-text');
        const fileInput = document.getElementById('file-input');
        const resultsSection = document.getElementById('results-section');
        
        if (textArea) textArea.value = '';
        if (fileInput) fileInput.value = '';
        if (resultsSection) resultsSection.style.display = 'none';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SmartSummarizer();
});
