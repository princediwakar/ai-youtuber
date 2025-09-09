# Credentials Setup Guide

This guide walks you through obtaining the required credentials to create accounts for your AI YouTuber channels.

## 📋 Required Credentials

For each account/channel, you'll need:
- **Google OAuth Credentials** (Client ID, Client Secret, Refresh Token)
- **Cloudinary Credentials** (Cloud Name, API Key, API Secret)

## 🔑 Google OAuth Setup (YouTube API Access)

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create New Project**:
   - Click "Select a project" → "New Project"
   - Enter project name (e.g., "YouTube Content Generator")
   - Click "Create"

### Step 2: Enable YouTube Data API

1. **Navigate to APIs & Services** → **Library**
2. **Search for "YouTube Data API v3"**
3. **Click on it** and press **"Enable"**

### Step 3: Create OAuth 2.0 Credentials

1. **Go to APIs & Services** → **Credentials**
2. **Click "Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. **Configure OAuth Consent Screen** (if not done):
   - Choose "External" user type
   - Fill in required fields:
     - App name: "AI YouTuber"
     - User support email: your email
     - Developer contact: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube`
     - `https://www.googleapis.com/auth/youtube.readonly`
4. **Create OAuth Client**:
   - Application type: "Web application"
   - Name: "YouTube Channel Bot"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)
   - Click "Create"
5. **Save the Client ID and Client Secret**

### Step 4: Get Refresh Token

You need to authorize your application to access your YouTube channel:

#### Option A: Using OAuth Playground

1. **Go to**: https://developers.google.com/oauthplayground/
2. **Settings** (gear icon):
   - Check "Use your own OAuth credentials"
   - Enter your OAuth 2.0 Client ID and Client Secret
3. **Step 1**: Select YouTube Data API v3 scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube`
4. **Click "Authorize APIs"**
5. **Sign in** with the Google account that owns your YouTube channel
6. **Step 2**: Click "Exchange authorization code for tokens"
7. **Copy the Refresh Token** (starts with `1//`)

#### Option B: Using the Application

1. **Start your application**: `npm run dev`
2. **Visit**: `http://localhost:3000/api/auth/signin`
3. **Sign in** with your YouTube channel's Google account
4. **Check your database** for the refresh token in the accounts table

### Step 5: Verify Channel Access

Ensure the Google account has:
- **YouTube Channel**: Must have an active YouTube channel
- **Channel Permissions**: Account must be the owner or have upload permissions

## ☁️ Cloudinary Setup (Media Storage)

### Step 1: Create Cloudinary Account

1. **Go to**: https://cloudinary.com/
2. **Click "Sign Up"** or **"Get Started for Free"**
3. **Choose the free plan** (1000 transformations/month)

### Step 2: Get Credentials

1. **Go to Dashboard**: https://cloudinary.com/console
2. **Find your credentials** in the "Product Environment Credentials" section:
   - **Cloud name**: Your unique cloud identifier
   - **API Key**: Public key for API access
   - **API Secret**: Private key (keep secure!)

### Step 3: Configure Upload Settings (Optional)

1. **Go to Settings** → **Upload**
2. **Configure upload presets** if needed (default settings work fine)

## 🚀 Creating an Account via API

Once you have all credentials, create an account using the API:

### Example Request

```bash
curl -X POST http://localhost:3000/api/accounts/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my_channel",
    "name": "My Educational Channel",
    "googleClientId": "your-google-client-id",
    "googleClientSecret": "your-google-client-secret", 
    "refreshToken": "1//your-refresh-token",
    "cloudinaryCloudName": "your-cloud-name",
    "cloudinaryApiKey": "your-api-key",
    "cloudinaryApiSecret": "your-api-secret",
    "personas": ["english_vocab_builder"],
    "branding": {
      "theme": "education",
      "audience": "students", 
      "tone": "friendly",
      "primaryColor": "#3B82F6",
      "secondaryColor": "#10B981"
    }
  }'
```

### Available Personas

Choose from these content personas:
- `english_vocab_builder` - English vocabulary quizzes
- `brain_health_tips` - Brain health and cognitive tips
- `eye_health_tips` - Eye care and vision health
- `ssc_shots` - SSC exam preparation content
- `space_facts_quiz` - Astronomy and space facts

### Response

```json
{
  "success": true,
  "message": "Account created successfully",
  "account": {
    "id": "my_channel",
    "name": "My Educational Channel", 
    "status": "active",
    "personas": ["english_vocab_builder"],
    "branding": {...},
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔒 Security Notes

- **Keep credentials secure**: Never commit credentials to version control
- **Use environment variables**: For sensitive configuration
- **Database encryption**: All credentials are encrypted before storage
- **Limited scopes**: Only request necessary YouTube permissions
- **Regular rotation**: Consider rotating credentials periodically

## 🧪 Testing Your Setup

### Test Google OAuth
```bash
# Test if credentials work
curl -X POST "https://www.googleapis.com/oauth2/v4/token" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "refresh_token=YOUR_REFRESH_TOKEN" \
  -d "grant_type=refresh_token"
```

### Test Cloudinary
```bash
# Test image upload
curl -X POST "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload" \
  -F "upload_preset=ml_default" \
  -F "file=@test-image.jpg"
```

### Test Account Creation
```bash
# Test account creation endpoint
curl -X GET http://localhost:3000/api/accounts/create
```

## 🆘 Troubleshooting

### Common Issues

**"Invalid refresh token"**
- Token may have expired or been revoked
- Re-authorize the application through OAuth flow

**"Access forbidden"**
- Check YouTube channel ownership
- Verify API scopes include upload permissions

**"Cloudinary authentication failed"**
- Verify cloud name, API key, and secret
- Check for typos in credentials

**"Account ID already exists"**
- Choose a different account ID
- Check existing accounts: `GET /api/accounts/create`

### Getting Help

- **Documentation**: Check project README and CLAUDE.md
- **Issues**: Report problems via GitHub Issues
- **Community**: Join discussions for help and support

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [YouTube Data API Reference](https://developers.google.com/youtube/v3)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**⚠️ Remember**: Keep your credentials secure and never share them publicly!