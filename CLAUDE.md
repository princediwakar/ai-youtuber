
# Multi-Channel YouTube Shorts Content Generator

This Next.js application is an automated multi-account system for generating and uploading educational content as YouTube Shorts across multiple specialized channels.

## Project Overview

**Multi-Account Architecture:**

  * **English Shots Channel:** Automated English vocabulary quiz generator for language learners worldwide
  * **Health Shots Channel:** Automated health tips and awareness content for wellness-focused audiences
  * **Unified Pipeline:** Shared codebase with account-specific content generation, branding, and scheduling

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

**Core Application:**
  * `NEXTAUTH_URL` - App URL (e.g., http://localhost:3000)
  * `NEXTAUTH_SECRET` - Token hashing secret
  * `DEEPSEEK_API_KEY` - DeepSeek API key for AI content generation
  * `CRON_SECRET` - Secret for securing cron job API routes
  * `DEBUG_MODE` - Set to 'true' to save videos locally in `generated-videos/` folder

**Account Management:**
All account credentials (Google OAuth, Cloudinary keys) are now stored in the database via the `accounts` table. No account-specific environment variables are needed.

## Architecture

**Frontend:** Next.js 14 with App Router, TypeScript, TailwindCSS
**Auth:** NextAuth.js with Google OAuth (YouTube scopes)
**Database:** PostgreSQL
**Tables:** `quiz_jobs`, `uploaded_videos`
**AI Services:** DeepSeek API for content generation
**Media Processing:** Canvas API, FFmpeg, Cloudinary

## API Routes

**Core Application:**
  * `/api/auth/` - NextAuth authentication
  * `/api/quiz-dashboard/` - Multi-account dashboard data and statistics
  * `/api/test-db/` - Database connectivity testing
  * `/api/test-pipeline/` - Pipeline testing utilities

**Multi-Account Pipeline (Single Endpoints with Account Parameter):**
  * `/api/jobs/generate-quiz` - Creates content for any account (DeepSeek API)
    - Pass `{ "accountId": "english_shots" }` for English vocabulary quizzes
    - Pass `{ "accountId": "health_shots" }` for brain/eye health tips
  * `/api/jobs/create-frames` - Generates account-specific video frames (Canvas)
  * `/api/jobs/assemble-video` - Compiles videos with account-specific assets (FFmpeg)
  * `/api/jobs/upload-quiz-videos` - Uploads to account-specific YouTube channels
    - Uses account-specific OAuth credentials and branding

## Multi-Account Content System

### English Shots Channel
**Persona:** `english_vocab_builder`
**Content Focus:** English vocabulary quizzes covering:
  * Synonyms & Antonyms
  * Phrasal Verbs & Idioms
  * Commonly Confused Words
  * Thematic Vocabulary (Business, Travel, etc.)
  * Formal vs. Casual Words

**Schedule:** 3 daily generation batches (2 AM, 10 AM, 6 PM IST) → 8 daily uploads

### Health Shots Channel
**Personas:** `brain_health_tips`, `eye_health_tips`
**Content Focus:** Health awareness and tips covering:
  * **Brain Health:** Memory techniques, focus tips, cognitive exercises, brain-healthy foods
  * **Eye Health:** Screen protection, eye exercises, vision nutrition, daily eye care habits

**Schedule:** Independent generation and upload timing optimized for wellness audience

### Unified 4-Step Process:
1. **Generate Content** (account-specific AI prompts) → 2. **Create Visual Frames** (themed per account) → 3. **Assemble Video** (account branding) → 4. **Upload to YouTube** (separate channels)

Monitor both pipelines via the unified dashboard at `/`.

## Key Files

**Core Application:**

  * `app/page.tsx` - Quiz generation and upload monitoring dashboard
  * `app/layout.tsx` - Root layout with providers

**Authentication & Database:**

  * `lib/auth.ts` - NextAuth configuration with Google OAuth
  * `lib/database.ts` - PostgreSQL utilities and connection management

**Multi-Account Infrastructure:**

  * `lib/accounts.ts` - Multi-account configuration and credential management
  * `lib/personas.ts` - Defines all personas (`english_vocab_builder`, `brain_health_tips`, `eye_health_tips`)

**AI & Content Generation:**

  * `lib/generationService.ts` - Multi-persona content generation service with account-specific AI prompts
  * `lib/schedule.ts` - Account-specific generation and upload schedules

**Visual & Media Processing:**

  * `lib/frameService.ts` - Account-aware video frame generation service
  * `lib/visuals/` - Multi-themed visual system for different content types

**Account-Specific Services:**

  * `lib/playlistManager.ts` - Account-aware YouTube playlist management
  * `lib/googleAuth.ts` - Multi-account Google API authentication
  * `lib/cloudinary.ts` - Account-specific Cloudinary integration

**Configuration:**

  * `lib/config.ts` - Application configuration
  * `lib/types.ts` - TypeScript type definitions
  * `database/schema.sql` - Database schema

**Setup & Utilities:**

  * `setup-database.js` - Database initialization script

## Current System Status

**✅ FULLY IMPLEMENTED Multi-Channel Operation:**
  * **English Shots:** English vocabulary quizzes (8 daily uploads, 3 generation batches)
  * **Health Shots:** Brain & eye health tips (4 daily uploads, 3 generation batches)

**✅ COMPLETED Architecture:** 
  * **Accounts:** 2 independent YouTube channels with database-stored credentials
  * **Content Generation:** Account-specific AI prompting and branding
  * **Storage:** Separate Cloudinary accounts for complete isolation
  * **API Design:** Single endpoints with `accountId` parameter (DRY principle)
  * **Scheduling:** Account-specific generation and upload schedules
  * **Data Storage:** All account configurations stored in PostgreSQL `accounts` table

**Implementation Status:** ✅ **COMPLETED** - Multi-account architecture with database storage fully operational
**Usage:** Pass `{ "accountId": "english_shots" }` or `{ "accountId": "health_shots" }` in API calls

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