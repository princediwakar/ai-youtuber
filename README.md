# AI YouTuber - Multi-Channel Educational Content Generator

> **Automated YouTube Shorts generation system for educational content across multiple specialized channels**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue)](https://www.postgresql.org/)

## 🌟 Overview

AI YouTuber is a complete automation system for generating and uploading educational YouTube Shorts content. It supports multiple specialized channels with account-specific branding, personas, and content strategies.

### 🎯 Key Features

- **Multi-Channel Support**: Manage multiple YouTube channels with isolated content and branding
- **AI-Powered Content**: DeepSeek API integration for intelligent content generation
- **Automated Pipeline**: 4-step process from content generation to YouTube upload
- **Visual Variety**: Multiple layout formats (MCQ, tips, demonstrations, challenges)
- **Analytics Integration**: Performance tracking and content optimization
- **Secure Credential Management**: Database-encrypted account credentials

### 🏗 Architecture

- **Frontend**: Next.js 14 with App Router, TypeScript, TailwindCSS
- **Authentication**: NextAuth.js with Google OAuth (YouTube scopes)
- **Database**: PostgreSQL with Neon hosting
- **AI Services**: DeepSeek API for content generation
- **Media Processing**: Canvas API, FFmpeg, Cloudinary
- **Deployment**: Vercel with automatic CI/CD

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and npm
- **PostgreSQL database** (Neon recommended for cloud hosting)
- **Google Cloud Project** with YouTube Data API v3 enabled
- **Cloudinary account** for media storage
- **DeepSeek API key** for AI content generation

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-youtuber.git
cd ai-youtuber

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Application URLs
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-secret-key-here

# AI Content Generation
DEEPSEEK_API_KEY=your-deepseek-api-key

# Security
CRON_SECRET=your-cron-job-secret

# Development
DEBUG_MODE=true
```

**Important**: Account-specific credentials (Google OAuth, Cloudinary) are stored in the database, not environment variables.

### 3. Database Setup

```bash
# Initialize database schema
node setup-database.js
```

### 4. Account Configuration

Add your YouTube channels and credentials to the database:

```bash
# Use the populate-accounts.js script or add via dashboard
node populate-accounts.js
```

### 5. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000` to access the dashboard.

## 📁 Project Structure

```
ai-youtuber/
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints
│   │   ├── auth/                 # NextAuth authentication
│   │   ├── jobs/                 # Content generation pipeline
│   │   └── analytics/            # Performance analytics
│   ├── page.tsx                  # Main dashboard
│   └── layout.tsx                # Root layout
├── lib/                          # Core business logic
│   ├── generation/               # AI content generation system
│   │   ├── core/                 # Core generation logic
│   │   ├── personas/             # Account-specific personas
│   │   ├── routing/              # Content routing
│   │   └── shared/               # Shared utilities
│   ├── visuals/                  # Video frame generation
│   │   ├── layouts/              # Frame layout systems
│   │   └── themes.ts             # Visual themes
│   ├── accounts.ts               # Account management
│   ├── database.ts               # Database utilities
│   └── config.ts                 # Configuration
├── database/                     # Database schema and migrations
│   ├── schema.sql                # Complete database schema
│   └── migrations/               # Schema updates
└── public/                       # Static assets
    ├── audio/                    # Background music
    └── fonts/                    # Custom fonts
```

## 🎨 Content System

### Supported Channel Types

1. **English Vocabulary**: Educational quizzes for language learners
2. **Health & Wellness**: Brain health tips, eye care, wellness advice
3. **Academic**: SSC exam preparation, competitive exam content
4. **Science**: Astronomy facts, space education content

### Content Formats

- **MCQ (Multiple Choice)**: Interactive quiz questions
- **Quick Tips**: Short, actionable advice
- **Common Mistakes**: Error correction content
- **Usage Demos**: Practical demonstrations
- **Challenges**: Engaging challenge content
- **Before/After**: Comparison-based content

### Visual Themes

Each account can have customized visual themes:
- Color schemes and branding
- Typography and layouts
- Account-specific overlays
- Themed backgrounds and graphics

## 🔧 API Reference

### Content Generation Pipeline

```bash
# Generate AI content
POST /api/jobs/generate-quiz
Body: { "accountId": "english_shots" }

# Create video frames
POST /api/jobs/create-frames
Body: { "accountId": "english_shots" }

# Assemble final video
POST /api/jobs/assemble-video
Body: { "accountId": "english_shots" }

# Upload to YouTube
POST /api/jobs/upload-quiz-videos
Body: { "accountId": "english_shots" }
```

### Analytics & Monitoring

```bash
# Get dashboard data
GET /api/dashboard

# Analytics collection
POST /api/analytics/collect

# Performance insights
GET /api/analytics/summary
```

## 📊 Database Schema

### Core Tables

- **`accounts`**: Account configurations and encrypted credentials
- **`quiz_jobs`**: Content generation pipeline tracking
- **`uploaded_videos`**: YouTube upload records
- **`video_analytics`**: Performance metrics and insights

### Account Management

All sensitive credentials are encrypted and stored in the database:
- Google OAuth tokens (client ID, secret, refresh token)
- Cloudinary API credentials
- Account-specific configurations and branding

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add required environment variables in Vercel dashboard
3. **Database**: Set up Neon PostgreSQL and add connection string
4. **Deploy**: Automatic deployments on every push to main branch

### Production Checklist

- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Account credentials added
- [ ] Google OAuth configured with production URLs
- [ ] Cloudinary accounts set up
- [ ] YouTube API quotas verified

## 🔒 Security Features

- **Credential Encryption**: All sensitive data encrypted in database
- **OAuth 2.0 Flow**: Secure Google authentication
- **API Route Protection**: Secured with secret keys
- **Content Validation**: AI-generated content validation
- **Error Handling**: Comprehensive error tracking and recovery

## 📈 Analytics & Optimization

### Performance Tracking

- **Upload Success Rates**: Monitor pipeline performance
- **Content Engagement**: Track YouTube video performance
- **AI Content Quality**: Validation and feedback loops
- **System Health**: Real-time monitoring dashboard

### Content Optimization

- **A/B Testing**: Test different content formats
- **Engagement Analysis**: Optimize based on performance data
- **Schedule Optimization**: Adjust upload timing for better reach
- **Quality Improvements**: Continuous refinement of AI prompts

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Test** your changes (`npm run build`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add comments for complex logic
- Write tests for new features
- Ensure `npm run build` passes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **DeepSeek AI** for content generation capabilities
- **Cloudinary** for media processing and storage
- **Neon** for PostgreSQL hosting
- **Vercel** for deployment and hosting
- **YouTube Data API** for upload functionality

## 📞 Support

- **Documentation**: Check the [CLAUDE.md](CLAUDE.md) for detailed project information
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join our community discussions for help and ideas

---

**Built with ❤️ for content creators and educators worldwide**
