# YouTube Uploader & Educational Quiz Video Generator

A comprehensive Next.js application that serves as an automated educational quiz video generation, specifically designed for Indian students and competitive exam aspirants.

![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue.svg)

## 🌟 Features

### Educational Quiz Video Generator
- **NEET-Focused Content**: Specialized quiz generation for Biology (60%), Chemistry (20%), and Physics (20%)
- **Comprehensive Syllabus Coverage**: Chapter-wise breakdown following official NEET curriculum
- **Automated Pipeline**: 4-step process from question generation to YouTube upload
- **Smart Scheduling**: Student-optimized upload timing (6 AM - 11 PM)
- **Multi-format Support**: MCQ, True/False, and assertion-reason type questions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Google Cloud Project with YouTube API enabled
- Cloudinary account for image processing

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd ai-youtuber
   npm install
   ```

2. **Environment Setup**
   Create `.env.local` with:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   DEBUG_MODE=true
   ```

3. **Database Setup**
   ```bash
   node setup-database.js
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to access the application.

## 📁 Project Structure

```
├── app/                          # Next.js 13+ App Router
│   ├── api/                     # API routes
│   │   ├── auth/               # NextAuth.js authentication
│   │   ├── jobs/               # Quiz generation pipeline
│   │   ├── youtube/            # YouTube API integration
│   │   └── dashboard/     # Dashboard data
│   ├── dashboard/         # Quiz management UI
│   └── page.tsx               # Main uploader interface
├── lib/                        # Core utilities and services
│   ├── auth.ts                # NextAuth configuration
│   ├── database.ts            # PostgreSQL utilities
│   ├── deepseek.ts           # AI content generation
│   ├── personas.ts           # Educational content structure
│   ├── schedule.ts           # Generation scheduling
│   └── visuals/              # Video frame generation
│       ├── layouts/          # Question layout templates
│       └── themes.ts         # Visual themes
├── database/                  # Database schema and setup
├── public/                   # Static assets
│   ├── audio/               # Background music
│   └── fonts/               # Custom fonts
└── generated-videos/         # Local video storage (debug mode)
```

## 🎯 Core Functionality

### Educational Quiz Generator

**Academic Focus Areas:**
- **NEET Biology**: 128+ chapter topics from Class XI & XII
- **NEET Chemistry**: 83+ topics covering organic, inorganic, and physical chemistry
- **NEET Physics**: 46+ topics from mechanics to modern physics

**Generation Pipeline:**
1. **Question Generation**: AI-powered question creation using DeepSeek API
2. **Frame Creation**: Visual frame generation with themes and layouts
3. **Video Assembly**: FFmpeg-based video compilation with audio
4. **YouTube Upload**: Automated upload with optimized metadata

**Scheduling System:**
- **Daily Generation**: 6 batches producing 18 questions (16 uploads + 2 extras)
- **Content Distribution**: Biology-heavy schedule matching NEET exam weightage
- **Upload Optimization**: Student-focused timing throughout the day

## 🛠️ API Routes

### Authentication
- `GET/POST /api/auth/*` - NextAuth.js authentication endpoints

### Quiz Generation Pipeline
- `POST /api/jobs/generate-quiz` - Create quiz questions
- `POST /api/jobs/create-frames` - Generate video frames
- `POST /api/jobs/assemble-video` - Compile video with FFmpeg
- `POST /api/jobs/upload-quiz-videos` - Upload generated quizzes

### Dashboard & Monitoring
- `GET /api/dashboard` - Quiz generation statistics
- `GET /api/test-db` - Database connectivity test

## 🎨 Educational Content System

### Persona Structure
The system uses a comprehensive persona-based approach with detailed curriculum mapping:

- **NEET Biology**: Complete syllabus with chapter-wise breakdown
- **NEET Chemistry**: Organic, inorganic, and physical chemistry topics
- **NEET Physics**: Mechanics, thermodynamics, optics, and modern physics

### Visual Themes
Multiple visual themes optimized for educational content:
- Clean, minimalist designs for better readability
- Color-coded subject identification
- Consistent branding across all generated content

## 🔧 Configuration

### Essential Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production (required before commits)
npm run start        # Start production server
npm run lint         # Run ESLint
node setup-database.js  # Initialize database
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | Authentication secret | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `DEBUG_MODE` | Save videos locally (true/false) | No |

## 📊 Database Schema

**Primary Tables:**
- `quiz_jobs` - Quiz generation job tracking
- `uploaded_videos` - Video upload history and metadata

**PostgreSQL Database:** Hosted on Neon (Project ID: `crimson-haze-61309062`)

## 🚀 Production Deployment

**Live URL:** [https://aiyoutuber.vercel.app/](https://aiyoutuber.vercel.app/)

**Deployment Platform:** Vercel with automatic deployments from main branch

## 🤝 Development Workflow

1. Make your changes
2. Test locally with `npm run dev`
3. Run `npm run build` to ensure production builds successfully
4. Commit changes only if build succeeds
5. Push to trigger automatic deployment

## 📈 Monitoring & Analytics

- **Quiz Dashboard**: `/` - Real-time generation statistics
- **Upload Tracking**: Built-in progress monitoring with detailed status
- **Cache Management**: Intelligent caching for playlists and video data
- **Error Handling**: Comprehensive error tracking and recovery

## 🔒 Security & Privacy

- **OAuth 2.0**: Secure Google authentication with YouTube scopes
- **Data Protection**: No video content stored permanently on servers
- **API Security**: Rate limiting and proper error handling
- **Privacy Compliance**: COPPA-compliant settings for educational content

## 🎓 Educational Impact

This system is designed to support Indian students preparing for competitive exams by providing:
- **Consistent Content**: Daily quiz videos following official syllabi
- **Optimized Timing**: Upload schedule aligned with student study patterns
- **Comprehensive Coverage**: Complete curriculum coverage across all major subjects
- **Engaging Format**: Visual quiz formats optimized for mobile consumption

## 📝 License

This project is designed for educational purposes and competitive exam preparation in India.

---

**Made for Indian Students • Powered by AI • Built with Next.js**