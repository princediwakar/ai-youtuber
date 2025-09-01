# Multi-Account YouTube Channel System - Comprehensive Master Plan

## Overview
Transform the current single-channel English vocabulary system into a 4-channel multi-niche educational platform while maintaining single codebase architecture.

## Phase 1: Database & Authentication Foundation (Week 1-2)

### Database Schema Changes
```sql
-- New accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    google_client_id VARCHAR(255) NOT NULL,
    google_client_secret VARCHAR(255) NOT NULL,
    refresh_token TEXT NOT NULL,
    access_token TEXT,
    token_expires_at TIMESTAMPTZ,
    youtube_channel_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add account relationships
ALTER TABLE quiz_jobs ADD COLUMN account_id UUID REFERENCES accounts(id);
ALTER TABLE uploaded_videos ADD COLUMN account_id UUID REFERENCES accounts(id);

-- Indexes for performance
CREATE INDEX idx_jobs_account ON quiz_jobs(account_id, status);
CREATE INDEX idx_videos_account ON uploaded_videos(account_id);
```

### Manual Account Setup (No Complex UI Needed)
1. Create 4 Google Cloud Projects with YouTube API enabled
2. Generate OAuth credentials for each project
3. Get refresh tokens via simple one-time OAuth flow
4. Insert directly into accounts table:
   - Account 1: English Vocabulary Channel
   - Account 2: NEET Prep Channel  
   - Account 3: SSC Prep Channel
   - Account 4: UPSC Prep Channel

### Authentication System Updates
- Replace `process.env.GOOGLE_CLIENT_ID` with database lookup
- Modify `googleAuth.ts` to accept account_id parameter
- Update token refresh logic to work per-account
- Add account selection logic throughout auth flows

## Phase 2: Content Pipeline Multi-Tenancy (Week 2-3)

### Personas System Restructure
```typescript
// From single persona to account-specific personas
export const AccountPersonas = {
  account_1: {
    english_vocab_builder: { /* existing structure */ }
  },
  account_2: {
    neet_biology: { subCategories: [...] },
    neet_physics: { subCategories: [...] },
    neet_chemistry: { subCategories: [...] }
  },
  account_3: {
    ssc_reasoning: { subCategories: [...] },
    ssc_quantitative: { subCategories: [...] }
  },
  account_4: {
    upsc_current_affairs: { subCategories: [...] },
    upsc_history: { subCategories: [...] }
  }
}
```

### Schedule System Overhaul
```typescript
// From single schedule to per-account schedules
export const AccountSchedules = {
  account_1: { // English - global timing
    generation: { 2: ['english_vocab_builder'], 10: [...], 18: [...] },
    upload: { 8: [...], 11: [...], 13: [...], ... }
  },
  account_2: { // NEET - Indian study hours
    generation: { 6: ['neet_biology'], 14: ['neet_physics'], 20: [...] },
    upload: { 7: [...], 16: [...], 21: [...] }
  },
  // ... accounts 3 & 4
}
```

### Service Layer Updates (All Need Account Awareness)
- **GenerationService**: Account-specific AI prompts and question formats
- **FrameService**: Account-specific branding, colors, logos
- **PlaylistManager**: Route to correct YouTube channel, account-specific SEO
- **ThemeMap/Themes**: Complete visual identity per account
- **Cloudinary**: Account-specific asset folders and branding

## Phase 3: Critical Cron Job Architecture (Week 3)

### Current Problem
- Step-by-step crons exist but will timeout with 4+ accounts
- Each step: 12-20 seconds × 4 accounts = 48-80 seconds (exceeds 30s limit)

### Solution: Per-Account Cron Endpoints
Create 16 total cron endpoints (4 accounts × 4 steps):

```
Account 1 (English):
/api/cron/account-1/generate-quiz
/api/cron/account-1/create-frames  
/api/cron/account-1/assemble-video
/api/cron/account-1/upload-videos

Account 2 (NEET):
/api/cron/account-2/generate-quiz
/api/cron/account-2/create-frames
/api/cron/account-2/assemble-video  
/api/cron/account-2/upload-videos

... (repeat for accounts 3 & 4)
```

### Cron Scheduling Strategy
- Each endpoint processes only 1 account = stays under 30s
- Schedule independently per account's target audience
- Perfect isolation - account failures don't affect others
- Easy debugging and monitoring per account

## Phase 4: API Routes & Pipeline Updates (Week 4)

### All API Routes Need Account Parameter
- `/api/jobs/generate-quiz` → Add account_id parameter
- `/api/jobs/create-frames` → Account-specific theming
- `/api/jobs/assemble-video` → Account-specific branding
- `/api/jobs/upload-quiz-videos` → Route to correct YouTube channel

### Database Query Updates
- All job creation: Include account_id
- All job processing: Filter by account_id  
- Analytics queries: Group by account_id
- Cross-account operations: Explicit account selection

## Phase 5: Dashboard & Management (Week 5)

### Multi-Account Dashboard Features
- **Account Overview**: Health status, recent uploads, error rates per account
- **Account Switcher**: Toggle between accounts for targeted operations  
- **Cross-Account Analytics**: Compare performance between niches
- **Job Queue Monitoring**: Per-account pipeline status
- **Bulk Operations**: Schedule content across multiple accounts

### Account-Specific Configurations
- Visual theme previews per account
- Upload schedule management per account
- Persona and topic management per account
- Performance metrics and optimization per account

## Phase 6: Testing & Deployment (Week 6)

### Gradual Rollout
1. **Start with English + 1 additional account** (NEET)
2. **Test all pipeline steps work independently**
3. **Verify cron jobs don't interfere with each other**
4. **Add remaining accounts one by one**

### Production Deployment
- **Database migration** with careful foreign key handling
- **Environment cleanup** (remove single-account variables)
- **Cron job setup** for all 16 endpoints with proper scheduling
- **Monitoring setup** for multi-account system health

## Expected Architecture Benefits

### Scalability
- **4 YouTube Channels**: English, NEET, SSC, UPSC
- **Independent Operation**: Each account isolated from others
- **Specialized Content**: Niche-appropriate questions and branding
- **Flexible Scheduling**: Account-specific timing optimization

### Technical Benefits  
- **Single Codebase**: Shared improvements benefit all channels
- **Unified Deployment**: One Vercel deployment for all accounts
- **Centralized Database**: Single source of truth with account isolation
- **Shared Infrastructure**: Cost-efficient hosting and monitoring

### Risk Management
- **Channel Isolation**: Issues on one channel don't affect others
- **API Quota Distribution**: Each account has separate Google Cloud project
- **Content Diversification**: Multiple revenue streams and audiences
- **Failure Resilience**: System continues operating if individual accounts fail

## Prerequisites & Setup Requirements

1. **4 separate Google accounts** for YouTube channels
2. **4 Google Cloud Projects** with YouTube Data API v3 enabled
3. **OAuth credential generation** for each project
4. **Database backup strategy** before migration
5. **Testing environment** for validation
6. **Cron job scheduler access** (16 new endpoints)

## Detailed Implementation Checklist

### Database Layer
- [ ] Create `accounts` table with OAuth credentials
- [ ] Add `account_id` foreign keys to existing tables
- [ ] Create performance indexes
- [ ] Test database migration in development
- [ ] Implement account encryption for sensitive data

### Authentication & Authorization
- [ ] Update `lib/auth.ts` for multi-account support
- [ ] Modify `lib/googleAuth.ts` to accept account parameters
- [ ] Implement per-account token refresh logic
- [ ] Create account selection middleware
- [ ] Test OAuth flows for each account

### Content Generation Pipeline
- [ ] Restructure `lib/personas.ts` for account-specific personas
- [ ] Update `lib/generationService.ts` for account-aware prompts
- [ ] Modify `lib/schedule.ts` for per-account schedules
- [ ] Update AI prompts for different exam types
- [ ] Test content generation for each account type

### Visual & Media Processing
- [ ] Update `lib/frameService.ts` for account-specific branding
- [ ] Modify `lib/visuals/themes.ts` for per-account visual identity
- [ ] Update `lib/visuals/themeMap.ts` for account routing
- [ ] Create account-specific asset folders in Cloudinary
- [ ] Test video generation with different branding

### YouTube Integration
- [ ] Update `lib/playlistManager.ts` for multi-channel routing
- [ ] Modify upload logic to use correct account credentials
- [ ] Implement account-specific playlist management
- [ ] Update SEO and metadata generation per account
- [ ] Test uploads to different YouTube channels

### API Routes Conversion
- [ ] Update `/api/jobs/generate-quiz` for account parameter
- [ ] Modify `/api/jobs/create-frames` for account theming
- [ ] Update `/api/jobs/assemble-video` for account branding
- [ ] Modify `/api/jobs/upload-quiz-videos` for channel routing
- [ ] Create 16 new per-account cron endpoints
- [ ] Update `/api/quiz-dashboard` for multi-account display

### Dashboard & Frontend
- [ ] Add account selector component
- [ ] Update dashboard to show multi-account data
- [ ] Create account-specific analytics views
- [ ] Implement cross-account comparison features
- [ ] Add bulk operations across accounts
- [ ] Test UI with multiple accounts

### Testing Strategy
- [ ] Unit tests for account parameter passing
- [ ] Integration tests for multi-account pipeline
- [ ] Cron job timeout testing
- [ ] OAuth flow testing for each account
- [ ] End-to-end testing with real YouTube uploads
- [ ] Load testing with concurrent account operations

### Deployment & Monitoring
- [ ] Set up production database migration
- [ ] Configure 16 cron job schedules
- [ ] Implement multi-account monitoring
- [ ] Set up account-specific error tracking
- [ ] Create deployment rollback strategy
- [ ] Document account management procedures

## Timeline: 6 weeks with incremental rollout and validation at each phase

This plan maintains single-repo benefits while properly handling the complexity of multi-account operations, cron timeouts, and account isolation.

---

**Next Steps**: Begin with Phase 1 database schema changes and authentication updates, testing thoroughly before proceeding to content pipeline modifications.