# YouTube Uploader & Educational Quiz Video Generator

This Next.js application combines a universal YouTube uploader with automated educational quiz video generation for Indian students and competitive exam aspirants.

## Project Overview

**Main Components:**
- Universal YouTube Uploader: Upload multiple videos with intelligent playlists and descriptions
- Educational Quiz Generator: Automated Class 10-12 and competitive exam quiz video creation system targeting NEET, JEE, SSC, Banking, UPSC, and other Indian entrance exams

## Quick Setup

```bash
npm install
node setup-database.js
npm run dev
```

## Essential Commands

- `npm run build` - Build project (required before committing)
- `npm run dev` - Start development server
- `node setup-database.js` - Initialize database

## Environment Variables (.env.local)

- `NEXTAUTH_URL` - App URL (http://localhost:3000 for dev)
- `NEXTAUTH_SECRET` - Token hashing secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name for frame storage
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `DEBUG_MODE` - Set to 'true' to save videos locally in generated-videos/ folder

## Architecture

**Auth:** NextAuth.js with Google OAuth (YouTube scopes)  
**Database:** PostgreSQL (Neon Project ID: `crimson-haze-61309062`)  
**Tables:** `quiz_jobs`, `uploaded_videos`

## API Routes

- `/api/auth/` - NextAuth authentication
- `/api/jobs/` - Educational quiz generation pipeline:
  - `generate-quiz` - Create educational quiz questions (DeepSeek API)
  - `create-frames` - Generate video frames (Canvas)
  - `assemble-video` - Compile video (FFmpeg)
  - `upload-quiz-videos` - Upload to YouTube
- `/api/youtube/` - YouTube API integration:
  - `upload`, `upload-optimized` - Video uploads
  - `analyze-playlist`, `analyze-video` - Content analysis
  - `playlist` - Create and list user playlists
  - `playlist-videos` - List videos within a specific playlist
  - `suggest-category` - Category suggestions
- `/api/quiz-dashboard/` - Dashboard data

## Educational Content System

**10 Academic Personas (50 daily videos):**
- Class 10-12: Mathematics, Physics, Chemistry, Biology
- Competitive Exams: NEET, JEE, SSC/Banking, UPSC
- Foundation: English Grammar, General Knowledge

**4-step automated process (orchestrated by external cron jobs):**
1. Generate educational questions → 2. Create frames → 3. Assemble video → 4. Upload to YouTube

Monitor via `/quiz-dashboard`

**Content Schedule:**
- Generation: 2-11 AM (50 questions daily)
- Upload: 6 AM-11 PM (student-optimized timing)

## Key Files

- `lib/auth.ts` - NextAuth configuration
- `lib/database.ts` - Database utilities
- `lib/deepseek.ts` - DeepSeek API integration
- `lib/curriculum.ts` - Educational content structure (10 academic personas)
- `lib/generationService.ts` - Academic content generation with exam-specific prompts
- `lib/schedule.ts` - Generation schedule (50 daily questions)
- `lib/uploadSchedule.ts` - Student-optimized upload timing
- `lib/playlistManager.ts` - Academic playlist organization
- `database/schema.sql` - Database schema

## Development Workflow

1. Make changes
2. Run `npm run build` (required before commits)
3. Commit if build succeeds

## Production

URL: https://youtube-playlist-uploader.vercel.app/