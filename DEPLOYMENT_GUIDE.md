# 🚀 Smart Summarizer Pro - Vercel Deployment Guide

## 📋 **Prerequisites**

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **Google Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. **Google Analytics 4**: Set up at [Google Analytics](https://analytics.google.com)

## 🔧 **Step 1: Prepare Your Repository**

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy Smart Summarizer Pro v2.0.0"
   git push origin main
   ```

2. **Verify all files are included**:
   - ✅ `vercel.json` (updated configuration)
   - ✅ `api/` folder with all endpoints
   - ✅ `public/` folder with frontend files
   - ✅ `package.json` with dependencies
   - ✅ `.env` (for local development only)

## 🌐 **Step 2: Deploy to Vercel**

### Option A: Vercel Dashboard (Recommended)

1. **Go to [vercel.com/dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure project settings**:
   - Framework Preset: `Other`
   - Root Directory: `./` (leave empty)
   - Build Command: `npm run build` (or leave empty)
   - Output Directory: `public`
   - Install Command: `npm install`

### Option B: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## 🔐 **Step 3: Set Environment Variables**

### In Vercel Dashboard:

1. **Go to your project settings**
2. **Navigate to "Environment Variables"**
3. **Add the following variables**:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `GEMINI_API_KEY` | `your_actual_gemini_api_key` | Production, Preview, Development |

### Using Vercel CLI:

```bash
# Add environment variable
vercel env add GEMINI_API_KEY

# List environment variables
vercel env ls

# Remove environment variable (if needed)
vercel env rm GEMINI_API_KEY
```

## 📊 **Step 4: Set Up Google Analytics**

### 1. Create Google Analytics 4 Property

1. **Go to [Google Analytics](https://analytics.google.com)**
2. **Create a new GA4 property**
3. **Set up a web data stream**
4. **Copy your Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Update Your Code

1. **Replace `GA_MEASUREMENT_ID` in `public/index.html`**:
   ```html
   <!-- Replace this line -->
   gtag('config', 'GA_MEASUREMENT_ID', {
   
   <!-- With your actual Measurement ID -->
   gtag('config', 'G-XXXXXXXXXX', {
   ```

2. **Update both instances** in the HTML file:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   ```

3. **Commit and redeploy**:
   ```bash
   git add public/index.html
   git commit -m "Add Google Analytics tracking"
   git push origin main
   ```

## 🔍 **Step 5: Verify Deployment**

### 1. Check API Endpoints

Visit these URLs (replace `your-app.vercel.app` with your actual domain):

- **Health Check**: `https://your-app.vercel.app/api/health`
- **API Docs**: `https://your-app.vercel.app/api/docs`
- **Main App**: `https://your-app.vercel.app`

### 2. Test Functionality

1. **Upload a file** or **enter text**
2. **Generate a summary**
3. **Check browser console** for any errors
4. **Verify Google Analytics** is receiving events

### 3. Monitor Analytics

1. **Go to Google Analytics**
2. **Check Real-time reports**
3. **Verify events are being tracked**:
   - `summarization_started`
   - `summarization_success`
   - `file_upload_started`
   - `file_upload_success`

## 🛠️ **Step 6: Custom Domain (Optional)**

### 1. Add Custom Domain in Vercel

1. **Go to project settings**
2. **Navigate to "Domains"**
3. **Add your custom domain**
4. **Follow DNS configuration instructions**

### 2. Update Analytics

1. **Update Google Analytics property settings**
2. **Add your custom domain to allowed origins**

## 🔧 **Troubleshooting**

### Common Issues:

1. **API Key Not Working**:
   - Verify the API key is exactly 39 characters
   - Check it starts with `AIzaSy`
   - Ensure it's set in Vercel environment variables

2. **CORS Errors**:
   - Check `vercel.json` headers configuration
   - Verify API endpoints are returning proper CORS headers

3. **File Upload Issues**:
   - Check file size limits (50MB max)
   - Verify supported file types in browser console

4. **Analytics Not Tracking**:
   - Check browser console for GA errors
   - Verify Measurement ID is correct
   - Check if ad blockers are interfering

### Debug Commands:

```bash
# Check deployment logs
vercel logs your-deployment-url

# Check environment variables
vercel env ls

# Redeploy
vercel --prod --force
```

## 📈 **Step 7: Monitor Performance**

### Vercel Analytics

1. **Enable Vercel Analytics** in project settings
2. **Monitor page load times**
3. **Track API response times**

### Google Analytics Events

Track these custom events:
- `summarization_started`
- `summarization_success`
- `summarization_error`
- `file_upload_started`
- `file_upload_success`
- `file_upload_error`

## 🎉 **Congratulations!**

Your Smart Summarizer Pro is now live on Vercel with Google Analytics tracking!

**Next Steps**:
- Share your app URL
- Monitor usage analytics
- Collect user feedback
- Plan future enhancements

**Your app is now accessible at**: `https://your-app.vercel.app`
