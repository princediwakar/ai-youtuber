
# YouTube Shorts English Vocabulary Quiz Generator

This Next.js application is an automated system for generating and uploading English vocabulary quiz videos as YouTube Shorts.

## Project Overview

**Main Component:**

  * **Automated English Vocabulary Quiz Generator:** A full-stack system that creates engaging, short-form quiz videos for English language learners worldwide. It handles everything from AI-powered question generation to final YouTube upload, including intelligent playlist management.

## Quick Setup

```bash
npm install
node setup-database.js
npm run dev
```

## Essential Commands

  * `npm run build` - Build project (required before committing)
  * `npm run dev` - Start development server
  * `node setup-database.js` - Initialize database

## Environment Variables (.env.local)

  * `NEXTAUTH_URL` - App URL (e.g., http://localhost:3000)
  * `NEXTAUTH_SECRET` - Token hashing secret
  * `GOOGLE_CLIENT_ID` - Google OAuth client ID
  * `GOOGLE_CLIENT_SECRET` - Google OAuth secret
  * `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name for frame storage
  * `CLOUDINARY_API_KEY` - Cloudinary API key
  * `CLOUDINARY_API_SECRET` - Cloudinary API secret
  * `DEEPSEEK_API_KEY` - DeepSeek API key for question generation
  * `CRON_SECRET` - Secret for securing cron job API routes
  * `DEBUG_MODE` - Set to 'true' to save videos locally in `generated-videos/` folder

## Architecture

**Frontend:** Next.js 14 with App Router, TypeScript, TailwindCSS
**Auth:** NextAuth.js with Google OAuth (YouTube scopes)
**Database:** PostgreSQL
**Tables:** `quiz_jobs`, `uploaded_videos`
**AI Services:** DeepSeek API for content generation
**Media Processing:** Canvas API, FFmpeg, Cloudinary

## API Routes

  * `/api/auth/` - NextAuth authentication
  * `/api/jobs/` - English vocabulary quiz generation pipeline:
      * `generate-quiz` - Creates vocabulary quiz questions (DeepSeek API)
      * `create-frames` - Generates video frames (Canvas)
      * `assemble-video` - Compiles video (FFmpeg)
      * `upload-quiz-videos` - Uploads the final video to YouTube
  * `/api/quiz-dashboard/` - Dashboard data and statistics
  * `/api/test-db/` - Database connectivity testing
  * `/api/test-pipeline/` - Pipeline testing utilities

## English Vocabulary Content System

**Current Focus: English Vocabulary Builder**

  * A single, comprehensive persona (`english_vocab_builder`) covering a wide range of topics, including:
      * Synonyms & Antonyms
      * Phrasal Verbs & Idioms
      * Commonly Confused Words
      * Thematic Vocabulary (Business, Travel, etc.)
      * Formal vs. Casual Words

**3 Daily Generation Batches (9 total quizzes = 8 uploads + 1 extra):**

  * Early Morning (2 AM)
  * Mid-day (10 AM)
  * Evening (6 PM)

**4-Step Automated Process:**

1.  Generate vocabulary questions → 2. Create visual frames → 3. Assemble video → 4. Upload to YouTube

Monitor the entire pipeline via the dashboard at `/`.

**Upload Schedule:** 8 daily uploads optimized for global engagement across different time zones.

## Key Files

**Core Application:**

  * `app/page.tsx` - Quiz generation and upload monitoring dashboard
  * `app/layout.tsx` - Root layout with providers

**Authentication & Database:**

  * `lib/auth.ts` - NextAuth configuration with Google OAuth
  * `lib/database.ts` - PostgreSQL utilities and connection management

**AI & Content Generation:**

  * `lib/generationService.ts` - Vocabulary quiz generation service with AI prompts
  * `lib/personas.ts` - Defines the `english_vocab_builder` persona and its sub-categories

**Scheduling & Automation:**

  * `lib/schedule.ts` - Defines the generation (3x daily) and upload (8x daily) schedules

**Visual & Media Processing:**

  * `lib/frameService.ts` - Video frame generation service
  * `lib/visuals/` - Visual theme and layout system for quiz videos

**YouTube Integration:**

  * `lib/playlistManager.ts` - Manages YouTube playlists for different vocabulary topics
  * `lib/googleAuth.ts` - Google API authentication
  * `lib/cloudinary.ts` - Cloudinary integration for image processing

**Configuration:**

  * `lib/config.ts` - Application configuration
  * `lib/types.ts` - TypeScript type definitions
  * `database/schema.sql` - Database schema

**Setup & Utilities:**

  * `setup-database.js` - Database initialization script

## Current System Status

**Primary Focus:** English vocabulary acquisition for a global audience
**Content:** Single, comprehensive `english_vocab_builder` persona
**Generation Capacity:** 9 quizzes daily across 3 scheduled batches
**Upload Optimization:** 8 daily uploads targeting various international time zones

## Development Workflow

1.  Make changes
2.  Test with `npm run dev`
3.  Run `npm run build` (required before commits)
4.  Commit if build succeeds
5.  Auto-deploy via Vercel

## Production

**URL:** [https://aiyoutuber.vercel.app/](https://aiyoutuber.vercel.app/)
**Platform:** Vercel with automatic deployments
**Database:** Neon PostgreSQL with connection pooling
**Media Storage:** Cloudinary for generated frame storage
**Local Debug:** Videos saved to `generated-videos/` when DEBUG\_MODE=true