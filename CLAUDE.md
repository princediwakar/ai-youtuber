# YouTube Uploader & Educational Quiz Video Generator

This Next.js application combines a universal YouTube uploader with automated educational quiz video generation for Indian students and competitive exam aspirants.

## Project Overview

**Main Components:**
- Universal YouTube Uploader: Upload multiple videos with intelligent playlists and descriptions, AI-powered content enhancement, and YouTube Shorts detection
- Educational Quiz Generator: NEET-focused automated quiz video creation system with chapter-wise curriculum coverage (Biology: 60%, Chemistry: 20%, Physics: 20%)

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

**Frontend:** Next.js 14 with App Router, TypeScript, TailwindCSS  
**Auth:** NextAuth.js with Google OAuth (YouTube scopes)  
**Database:** PostgreSQL (Neon Project ID: `crimson-haze-61309062`)  
**Tables:** `quiz_jobs`, `uploaded_videos`  
**AI Services:** DeepSeek API for content generation  
**Media Processing:** Canvas API, FFmpeg, Cloudinary  

## API Routes

- `/api/auth/` - NextAuth authentication
- `/api/jobs/` - Educational quiz generation pipeline:
  - `generate-quiz` - Create educational quiz questions (DeepSeek API)
  - `create-frames` - Generate video frames (Canvas)
  - `assemble-video` - Compile video (FFmpeg)
  - `upload-quiz-videos` - Upload to YouTube
- `/api/youtube/` - YouTube API integration:
  - `upload`, `upload-optimized` - Video uploads with AI enhancement
  - `analyze-playlist`, `analyze-video` - AI-powered content analysis
  - `playlist` - Create and list user playlists with caching
  - `playlist-videos` - List videos within specific playlist with duplicate detection
  - `suggest-category` - AI category suggestions
  - `add-navigation` - Add playlist navigation links
- `/api/quiz-dashboard/` - Dashboard data and statistics
- `/api/test-db/` - Database connectivity testing
- `/api/test-pipeline/` - Pipeline testing utilities

## Educational Content System (NEET-Focused)

**Current Focus: NEET Preparation**
- **Biology (60%)**: 128+ chapter topics covering Class XI & XII complete syllabus
- **Chemistry (20%)**: 83+ topics (organic, inorganic, physical chemistry)  
- **Physics (20%)**: 46+ topics (mechanics, thermodynamics, optics, modern physics)

**6 Daily Generation Batches (18 total questions = 16 uploads + 2 extras):**
- Morning (2 AM): Biology batch - 3 questions
- Mid-morning (3 AM): Chemistry batch - 3 questions  
- Afternoon (4 PM): Physics batch - 3 questions
- Evening (5 PM): Biology batch - 3 questions
- Prime time (6 PM): Biology batch - 3 questions
- Night (7 PM): Biology batch - 3 questions

**4-step automated process:**
1. Generate educational questions → 2. Create visual frames → 3. Assemble video → 4. Upload to YouTube

Monitor via `/`

**Upload Schedule:** Student-optimized timing (6:30 AM - 10:00 PM) with 16 daily uploads

## Key Files

**Core Application:**
- `app/page.tsx` - Main uploader interface with advanced settings
- `app/page.tsx` - Quiz generation monitoring
- `app/layout.tsx` - Root layout with providers

**Authentication & Database:**
- `lib/auth.ts` - NextAuth configuration with Google OAuth
- `lib/database.ts` - PostgreSQL utilities and connection management

**AI & Content Generation:**
- `lib/deepseek.ts` - DeepSeek API integration for content generation
- `lib/generationService.ts` - Academic content generation with exam-specific prompts
- `lib/contentSource.ts` - Content source management

**Educational System:**
- `lib/personas.ts` - NEET-focused persona structure (Biology, Chemistry, Physics)
- `lib/schedule.ts` - NEET-optimized generation schedule (6 daily batches)
- `lib/uploadSchedule.ts` - Student-optimized upload timing (16 daily uploads)

**Visual & Media Processing:**
- `lib/frameService.ts` - Video frame generation service
- `lib/visuals/` - Visual theme and layout system:
  - `themes.ts` - Visual themes for different subjects
  - `themeMap.ts` - Theme mapping utilities
  - `drawingUtils.ts` - Canvas drawing utilities
  - `layouts/mcqLayout.ts` - MCQ question layout
  - `layouts/trueFalseLayout.ts` - True/False question layout

**YouTube Integration:**
- `lib/playlistManager.ts` - Academic playlist organization
- `lib/googleAuth.ts` - Google API authentication
- `lib/cloudinary.ts` - Cloudinary integration for image processing

**Configuration:**
- `lib/config.ts` - Application configuration
- `lib/types.ts` - TypeScript type definitions
- `database/schema.sql` - Database schema

**Setup & Utilities:**
- `setup-database.js` - Database initialization script
- `scripts/test.js` - Testing utilities

## Current System Status

**Primary Focus:** NEET exam preparation with comprehensive syllabus coverage
**Content Distribution:** Biology-heavy (60%) matching NEET exam weightage  
**Generation Capacity:** 18 questions daily across 6 scheduled batches
**Upload Optimization:** 16 daily uploads during student active hours
**AI Enhancement:** Full AI integration for content generation and YouTube optimization

## Development Workflow

1. Make changes
2. Test with `npm run dev`
3. Run `npm run build` (required before commits)
4. Commit if build succeeds
5. Auto-deploy via Vercel

## Production

**URL:** https://aiyoutuber.vercel.app/  
**Platform:** Vercel with automatic deployments  
**Database:** Neon PostgreSQL with connection pooling  
**Media Storage:** Cloudinary for generated frame storage  
**Local Debug:** Videos saved to `generated-videos/` when DEBUG_MODE=true