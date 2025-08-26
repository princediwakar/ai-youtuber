# YouTube Uploader & Quiz Video Generator

This Next.js application combines a universal YouTube uploader with automated quiz video generation for test preparation content.

## Project Overview

**Main Components:**
- Universal YouTube Uploader: Upload multiple videos with intelligent playlists and descriptions
- Quiz Video Generator: Automated SAT/GMAT/GRE quiz video creation and upload system

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

## Architecture

**Auth:** NextAuth.js with Google OAuth (YouTube scopes)  
**Database:** PostgreSQL (Neon Project ID: `crimson-haze-61309062`)  
**Tables:** `quiz_jobs`, `uploaded_videos`

## API Routes

- `/api/auth/` - NextAuth authentication
- `/api/jobs/` - Quiz generation pipeline:
  - `generate-quiz` - Create quiz questions (DeepSeek API)
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

## Quiz Pipeline

4-step automated process (orchestrated by external cron jobs):
1. Generate questions → 2. Create frames → 3. Assemble video → 4. Upload to YouTube

Monitor via `/quiz-dashboard`

## Key Files

- `lib/auth.ts` - NextAuth configuration
- `lib/database.ts` - Database utilities
- `lib/deepseek.ts` - DeepSeek API integration
- `database/schema.sql` - Database schema

## Development Workflow

1. Make changes
2. Run `npm run build` (required before commits)
3. Commit if build succeeds

## Production

URL: https://youtube-playlist-uploader.vercel.app/