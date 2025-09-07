# Analytics Collection Cron Job Setup

## Overview
Set up automated collection of YouTube video analytics with AI-powered insights and performance analysis.

## Required Cron Jobs

### 1. Analytics Collection Job (Required)
- **URL**: `https://aiyoutuber.vercel.app/api/analytics/collect`
- **Method**: POST
- **Schedule**: Daily at 3:00 AM IST (21:30 UTC)
- **Body**: 
  ```json
  {
    "secret": "$CRON_SECRET"
  }
  ```
- **Purpose**: Collects basic YouTube metrics (views, likes, comments) for videos uploaded 24+ hours ago

### 2. AI-Powered Analytics Job (Required)
- **URL**: `https://aiyoutuber.vercel.app/api/analytics/ai-insights`
- **Method**: POST
- **Schedule**: Weekly on Saturdays at 5:00 AM IST (23:30 UTC)  
- **Body**:
  ```json
  {
    "secret": "$CRON_SECRET"
  }
  ```
- **Purpose**: Generates AI-powered performance insights, content recommendations, and engagement strategies

## Setup Instructions

### Using cron-job.org (Recommended)
1. Go to https://cron-job.org/
2. Create account and log in
3. Add new cron job with above configurations
4. Set timezone to IST (India Standard Time)
5. Enable job and test


## Monitoring

### Success Response
```json
{
  "success": true,
  "message": "Analytics collection completed successfully",
  "stats": {
    "videosCollected": 18,
    "errors": 0,
    "durationMs": 15000
  },
  "timestamp": "2025-01-XX..."
}
```

### Test Endpoints
- Analytics collection: `GET /api/analytics/collect?secret=YOUR_SECRET`
- Analytics summary: `GET /api/analytics/summary`
- AI insights (all personas): `POST /api/analytics/ai-insights` with secret in body
- AI insights (specific persona): `GET /api/analytics/ai-insights?secret=YOUR_SECRET&persona=english_vocab_builder&accountId=english_shots`

## Database Tables Used
- `video_analytics` - Stores collected YouTube metrics
- `uploaded_videos` - Source of videos to analyze
- `quiz_jobs` - Links analytics to original content jobs

## API Quota Impact
- **YouTube Data API**: ~1 unit per day (0.01% of 10,000 daily limit)
- **Cost**: Negligible - can handle 1000+ videos/day within quota

## System Architecture

The analytics system uses **consolidated AI insights** within the main `analyticsService.ts`:
- Basic metrics collection (daily) feeds data to the analytics database
- AI analysis (weekly) processes this data using DeepSeek API for intelligent recommendations
- Single service handles both collection and AI-powered analysis
- No separate refinement cron needed - AI insights include content optimization

## Benefits
- **Consolidated Analytics**: Single service manages both data collection and AI analysis
- **AI-Powered Insights**: DeepSeek AI analyzes performance patterns and provides intelligent recommendations
- **Data-driven optimization**: Identify best performing content types and topics
- **Automated insights**: Weekly AI-generated recommendations for content improvement
- **Performance tracking**: Monitor engagement trends and predict future opportunities
- **Persona-specific advice**: Tailored recommendations for each content type (vocabulary, health tips, etc.)

## AI Analytics Features
- **Performance Analysis**: AI identifies patterns humans might miss
- **Predictive Insights**: Forecasts performance potential based on current trends
- **Topic Optimization**: Recommends which content types to focus on or avoid
- **Engagement Strategies**: Tactical advice for improving viewer interaction
- **Content Recommendations**: Specific video ideas based on successful patterns