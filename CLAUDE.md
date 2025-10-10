
# Multi-Channel YouTube Shorts Generator

Next.js application for automated multi-account educational YouTube Shorts generation and upload.

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

- `NEXTAUTH_URL` - App URL
- `NEXTAUTH_SECRET` - Auth secret
- `DEEPSEEK_API_KEY` - AI content generation
- `CRON_SECRET` - API route security
- `DEBUG_MODE` - Save videos locally when 'true'

Account credentials stored in database `accounts` table.

**NOTE:** Current state includes full analytics system with video_analytics table.

## Architecture

**Stack:** Next.js 14, TypeScript, PostgreSQL, NextAuth.js  
**AI:** DeepSeek API  
**Media:** Canvas, FFmpeg, Cloudinary  
**Database:** Neon PostgreSQL (crimson-haze-61309062)

## API Routes

- `/api/jobs/generate-quiz` - Content generation (DeepSeek)
- `/api/jobs/create-frames` - Video frame generation (Canvas)  
- `/api/jobs/assemble-video` - Video compilation (FFmpeg)
- `/api/jobs/upload-quiz-videos` - YouTube upload
- `/api/analytics/*` - Performance analytics

Pass `{ "accountId": "english_shots" }` or `{ "accountId": "health_shots" }` in requests.

## Directory Structure

```
lib/
├── generation/           # AI content generation system
│   ├── core/            # Core generation logic
│   │   ├── generationService.ts
│   │   ├── promptGenerator.ts
│   │   ├── contentValidator.ts
│   │   └── contentSource.ts
│   ├── personas/        # Account-specific personas
│   │   ├── english/     # English vocabulary prompts
│   │   ├── health/      # Health tips prompts
│   │   ├── ssc/         # SSC exam prompts
│   │   └── astronomy/   # Space facts prompts
│   ├── routing/         # Prompt routing logic
│   ├── shared/          # Shared types and utilities
│   └── index.ts         # Main exports
├── visuals/             # Video frame generation
│   ├── layouts/         # Frame layout systems
│   ├── themes.ts        # Visual themes
│   └── themeMap.ts      # Theme routing
├── accounts.ts          # Account management
├── frameService.ts      # Frame generation service
├── database.ts          # Database utilities
└── config.ts           # Application config

database/
├── schema.sql          # Complete database schema
└── migrations/         # Schema migrations

app/
├── api/jobs/          # Generation pipeline endpoints
├── api/analytics/     # Analytics endpoints
└── page.tsx          # Dashboard
```

## Database Schema

**Tables (Current State):**
- `accounts` - Account credentials and configuration (OAuth, Cloudinary)
- `quiz_jobs` - Content generation pipeline tracking (uses account_id)
- `uploaded_videos` - YouTube upload records
- `video_analytics` - Performance tracking (views, engagement, timing, etc.)

**Current Implementation:**
- Uses `account_id` for account identification
- Full analytics system with performance tracking
- Video analytics collected but currently empty (0 rows)
- Complete 4-table schema for comprehensive tracking

## Active Accounts

**CONTENT STRATEGY OVERHAUL (2025-10-10):** Simplified to beginner-friendly, curiosity-driven content based on actual performance data.

**All Channels Active:**
- **English Shots:** `english_vocab_builder` (Best single video: 176 views, avg: 51.57)
- **Health Shots:** `brain_health_tips`, `eye_health_tips` (Best performer: 72 avg views)
- **Space Facts:** `space_facts_quiz` (Strong performer: 172 views #2 video, 65.5 avg)
- **SSC Shots:** `ssc_shots` (ONLY video with engagement: 118 views + 1 like)

### Performance Analysis (24 videos, 1-2 days old)
**Format Performance:**
- **Quick Tip Format:** 80 avg views (4 videos) - 37% better than MCQ
- **MCQ Format:** 54 avg views (20 videos)
- **Removed Formats:** common_mistake, quick_fix, usage_demo, simplified_word (no data, removed from rotation)

**Top 3 Videos:**
1. "90% Say This WRONG 🚨" - 176 views (English, MCQ) - #1
2. "Sun's true color! ☀️" - 172 views (Space, MCQ) - #2
3. "CRACK SSC 2X FASTER with this trick!" - 118 views + 1 like (SSC, Quick Tip) - ONLY engagement

**Critical Insights:**
- Videos are too new (1-2 days) for confident conclusions
- Quick tip format showing promise (80 vs 54 avg)
- Engagement is 0% across board (only 1 like total)
- Beginner-friendly, curious hooks work better than aggressive/shameful tones

### Content Strategy Changes (2025-10-10)
**Prompt Simplification:**
- Removed aggressive language ("STOP EMBARRASSING YOURSELF", "STOP SOUNDING BASIC")
- Changed tone to curious, inviting, beginner-friendly
- Focus on LEARNING and DISCOVERY, not fear/shame
- Simplified prompts from 200+ lines to 50 lines
- Format rotation limited to: MCQ + Quick Tip only

**Winning Hook Patterns:**
- Curiosity: "90% Say This WRONG 🚨" (not attacking)
- Simple exclamations: "Sun's true color! ☀️" (exciting)
- Helpful promises: "CRACK SSC 2X FASTER" (actionable)

**Format Rotation (Updated):**
- `english_vocab_builder`: MCQ, Quick Tip
- `brain_health_tips`: Quick Tip, MCQ (quick tip priority)
- `eye_health_tips`: Quick Tip, MCQ (quick tip priority)
- `ssc_shots`: MCQ, Quick Tip
- `space_facts_quiz`: MCQ, Quick Tip

## Development

```bash
# Test endpoints
curl -X POST http://localhost:3000/api/jobs/assemble-video \
  -H "Authorization: Bearer tdD0pkJYJM0Ozj4f1jPuLBybMXLx3lqfnTqJf0tFx7c=" \
  -H "Content-Type: application/json" \
  -d '{"accountId": "health_shots"}'
```

**Production:** https://aiyoutuber.vercel.app/

