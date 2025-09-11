
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

**Tables:**
- `accounts` - Account configs & encrypted credentials
- `quiz_jobs` - Content generation pipeline tracking
- `uploaded_videos` - YouTube upload records  
- `video_analytics` - Performance metrics

## Active Accounts

**ANALYTICS UPDATE (2025-09-10):** Based on engagement analysis, all content now uses MCQ format only.

**English Shots:** `english_vocab_builder` persona (1.26% engagement rate - best performing)
**Health Shots:** `brain_health_tips`, `eye_health_tips` personas (0.18% engagement - needs optimization)
**SSC Shots:** `ssc_shots` persona (paused - 0% engagement)
**Astronomy:** `space_facts_quiz` persona (paused - 0% engagement)

### Format Performance Analysis
- **MCQ Format:** 1.26% engagement rate (ONLY format that works)
- **Complex Formats:** 0% engagement rate (quick_fix, common_mistake, usage_demo, challenge, quick_tip)
- **73% of videos** have zero engagement - complex formats are the primary cause

### Content Optimization (2025-09-10)
**Analytics-Driven Changes:**
- Forced MCQ format across all personas (prompt router updated)
- Disabled complex layout detection (layout selector simplified)
- Added hook effectiveness tracking based on high-performing patterns
- Priority focus on English vocabulary content (proven 1.26% engagement)
- Paused low-performing personas (SSC, Astronomy) until format is proven

## Development

```bash
# Test endpoints
curl -X POST http://localhost:3000/api/jobs/assemble-video \
  -H "Authorization: Bearer tdD0pkJYJM0Ozj4f1jPuLBybMXLx3lqfnTqJf0tFx7c=" \
  -H "Content-Type: application/json" \
  -d '{"accountId": "health_shots"}'
```

**Production:** https://aiyoutuber.vercel.app/

## MCP Integrations

The project uses Model Context Protocol (MCP) for enhanced development capabilities:

**Neon Database MCP:**
- `mcp__Neon__run_sql` - Execute SQL queries
- `mcp__Neon__get_connection_string` - Database connections
- `mcp__Neon__describe_table_schema` - Schema inspection
- `mcp__Neon__list_projects` - Project management

**Vercel MCP:**
- `mcp__vercel__list_deployments` - Deployment monitoring
- `mcp__vercel__get_deployment_build_logs` - Build diagnostics

**Playwright MCP:**
- `mcp__playwright__browser_*` - Automated browser testing and screenshots

**IDE MCP:**
- `mcp__ide__getDiagnostics` - Language diagnostics
- `mcp__ide__executeCode` - Jupyter code execution