
-----

# YouTube Shorts English Vocabulary Quiz Generator

A comprehensive Next.js application that serves as an automated English vocabulary quiz video generator, specifically designed for a global audience of English language learners.

## 🌟 Features

### Automated Vocabulary Quiz Generator

  - **Targeted Vocabulary Content**: Specialized quiz generation for a wide range of topics, including Synonyms, Antonyms, Idioms, Phrasal Verbs, and more.
  - **Global Audience Focus**: Designed for English learners of all levels, worldwide.
  - **Automated Pipeline**: 4-step process from AI question generation to final YouTube upload.
  - **Smart Scheduling**: Global time-zone optimized with 8 daily uploads for consistent engagement.
  - **Multi-format Support**: Generates both Multiple-Choice (MCQ) and True/False questions.

## 🚀 Quick Start

### Prerequisites

  - Node.js 18+
  - PostgreSQL database (Neon recommended)
  - Google Cloud Project with YouTube Data API v3 enabled
  - Cloudinary account for media processing
  - DeepSeek AI API key

### Installation

1.  **Clone and Install**

    ```bash
    git clone <repository-url>
    cd ai-youtuber
    npm install
    ```

2.  **Environment Setup**
    Create a `.env.local` file with the following:

    ```env
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your-secret-key
    GOOGLE_CLIENT_ID=your-google-client-id
    GOOGLE_CLIENT_SECRET=your-google-client-secret
    CLOUDINARY_CLOUD_NAME=your-cloudinary-name
    CLOUDINARY_API_KEY=your-cloudinary-key
    CLOUDINARY_API_SECRET=your-cloudinary-secret
    DEEPSEEK_API_KEY=your-deepseek-api-key
    CRON_SECRET=your-cron-job-secret
    DEBUG_MODE=true
    ```

3.  **Database Setup**

    ```bash
    node setup-database.js
    ```

4.  **Start Development**

    ```bash
    npm run dev
    ```

Visit `http://localhost:3000` to access the application dashboard.

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── auth/               # NextAuth.js authentication
│   │   └── jobs/               # English Vocabulary Quiz generation pipeline
│   └── page.tsx               # Monitoring Dashboard UI
├── lib/                        # Core utilities and services
│   ├── auth.ts                # NextAuth configuration
│   ├── database.ts            # PostgreSQL utilities
│   ├── generationService.ts   # AI quiz generation service
│   ├── personas.ts           # Defines the 'english_vocab_builder' persona
│   ├── schedule.ts           # Defines daily generation & upload schedules
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

### Automated Vocabulary Quiz Generator

**Content Focus Area:**

  - **`english_vocab_builder`**: A single, comprehensive persona covering practical English vocabulary, including Synonyms, Antonyms, Idioms, Phrasal Verbs, Commonly Confused Words, and Thematic Vocabulary.

**Generation Pipeline:**

1.  **Question Generation**: AI-powered vocabulary question creation using DeepSeek API.
2.  **Frame Creation**: Visual frame generation with clean, engaging themes and layouts.
3.  **Video Assembly**: FFmpeg-based video compilation with background audio.
4.  **YouTube Upload**: Automated upload to YouTube Shorts with SEO-optimized metadata.

**Scheduling System:**

  - **Daily Generation**: 3 batches producing 9 quizzes to maintain a content buffer.
  - **Content Distribution**: 8 daily uploads spread throughout the day for global reach.
  - **Upload Optimization**: Targeted upload times to engage learners in different time zones.

## 🛠️ API Routes

### Authentication

  - `GET/POST /api/auth/*` - NextAuth.js authentication endpoints

### Quiz Generation Pipeline

  - `POST /api/jobs/generate-quiz` - Create vocabulary quiz questions
  - `POST /api/jobs/create-frames` - Generate video frames
  - `POST /api/jobs/assemble-video` - Compile video with FFmpeg
  - `POST /api/jobs/upload-quiz-videos` - Upload generated quizzes to YouTube

### Dashboard & Monitoring

  - `GET /api/quiz-dashboard` - Quiz generation statistics for the dashboard
  - `GET /api/test-db` - Database connectivity test

## 🎨 Content & Visual System

### Persona Structure

The system uses a single-persona approach for deep and consistent content:

  - **English Vocabulary Shots**: A comprehensive persona covering all key aspects of practical vocabulary needed for fluency and exams like IELTS and TOEFL.

### Visual Themes

Multiple visual themes optimized for short-form video quizzes:

  - Clean, minimalist designs for high readability on mobile devices.
  - Engaging animations and consistent branding.

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
| --- | --- | --- |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | Authentication secret | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET`| Google OAuth secret | Yes |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET`| Cloudinary API secret | Yes |
| `DEEPSEEK_API_KEY` | DeepSeek AI API Key | Yes |
| `CRON_SECRET` | Secret to authorize cron jobs | Yes |
| `DEBUG_MODE` | Save videos locally (true/false)| No |

## 📊 Database Schema

**Primary Tables:**

  - `quiz_jobs` - Tracks the state of each job in the quiz generation pipeline.
  - `uploaded_videos` - Stores a history of all videos uploaded to YouTube, with metadata.

**PostgreSQL Database:** Hosted on Neon.

## 🚀 Production Deployment

**Live URL:** [https://aiyoutuber.vercel.app/](https://aiyoutuber.vercel.app/)

**Deployment Platform:** Vercel with automatic deployments from the main branch.

## 🤝 Development Workflow

1.  Make your changes.
2.  Test locally with `npm run dev`.
3.  Run `npm run build` to ensure production builds successfully.
4.  Commit changes only if the build succeeds.
5.  Push to trigger automatic deployment.

## 📈 Monitoring & Analytics

  - **Real-time Dashboard**: `/` - Monitor quiz generation and upload statistics in real-time.
  - **Upload Tracking**: Built-in progress monitoring with detailed job status.
  - **Cache Management**: Intelligent caching for YouTube playlist data.
  - **Error Handling**: Comprehensive error tracking and automated job retry mechanism.

## 🔒 Security & Privacy

  - **OAuth 2.0**: Secure Google authentication with specific YouTube scopes.
  - **Data Protection**: No video content is stored permanently on the server after upload.
  - **API Security**: Cron job endpoints are secured with a secret key.
  - **Content Policy**: All generated content is designed to be educational and family-friendly.

## 🎓 Learning Impact

This system is designed to support English learners worldwide by providing:

  - **Consistent Content**: Daily vocabulary quiz videos to encourage regular practice.
  - **Global Scheduling**: An upload schedule designed to reach learners in different time zones.
  - **Practical Vocabulary**: A wide range of topics relevant for both conversational English and standardized tests.
  - **Engaging Format**: A visual quiz format optimized for learning on mobile devices.

-----

**For English Learners Worldwide • Powered by AI • Built with Next.js**