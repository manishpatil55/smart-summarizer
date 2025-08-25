#!/usr/bin/env node

/**
 * Setup script for Google Analytics in Smart Summarizer Pro
 * Run with: node setup-analytics.js YOUR_GA_MEASUREMENT_ID
 */

const fs = require('fs');
const path = require('path');

function setupGoogleAnalytics(measurementId) {
    if (!measurementId) {
        console.error('❌ Error: Please provide your Google Analytics Measurement ID');
        console.log('📖 Usage: node setup-analytics.js G-XXXXXXXXXX');
        console.log('🔗 Get your Measurement ID from: https://analytics.google.com');
        process.exit(1);
    }

    // Validate Measurement ID format
    if (!measurementId.match(/^G-[A-Z0-9]{10}$/)) {
        console.error('❌ Error: Invalid Measurement ID format');
        console.log('✅ Expected format: G-XXXXXXXXXX (e.g., G-1234567890)');
        process.exit(1);
    }

    const indexPath = path.join(__dirname, 'public', 'index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ Error: public/index.html not found');
        console.log('🔍 Make sure you are running this script from the project root directory');
        process.exit(1);
    }

    try {
        // Read the current HTML file
        let htmlContent = fs.readFileSync(indexPath, 'utf8');
        
        // Replace the placeholder with actual Measurement ID
        const updatedContent = htmlContent
            .replace(/GA_MEASUREMENT_ID/g, measurementId)
            .replace(/your-measurement-id/g, measurementId);
        
        // Write the updated content back
        fs.writeFileSync(indexPath, updatedContent, 'utf8');
        
        console.log('🎉 Google Analytics setup completed successfully!');
        console.log(`📊 Measurement ID: ${measurementId}`);
        console.log('📝 Updated file: public/index.html');
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Commit your changes: git add . && git commit -m "Add Google Analytics"');
        console.log('2. Deploy to Vercel: git push origin main');
        console.log('3. Test your deployment and check Google Analytics Real-time reports');
        console.log('');
        console.log('🔍 Events being tracked:');
        console.log('   • summarization_started');
        console.log('   • summarization_success');
        console.log('   • summarization_error');
        console.log('   • file_upload_started');
        console.log('   • file_upload_success');
        console.log('   • file_upload_error');
        
    } catch (error) {
        console.error('❌ Error updating HTML file:', error.message);
        process.exit(1);
    }
}

// Get Measurement ID from command line arguments
const measurementId = process.argv[2];
setupGoogleAnalytics(measurementId);
