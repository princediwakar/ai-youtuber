# Quiz Video Generation System - Complete Setup Guide

## 🎯 **System Overview**
This system automatically generates quiz videos for SAT/GMAT/GRE test preparation using a 4-step pipeline:
1. **Question Generation** - AI creates quiz questions
2. **Frame Creation** - Canvas API generates video frames  
3. **Video Assembly** - FFmpeg combines frames into videos
4. **YouTube Upload** - Automatically uploads to YouTube as Shorts

## 📋 **Prerequisites**

### Required Accounts & API Keys:
- **Neon Database** account (free tier available)
- **OpenAI API** key for question generation
- **Google/YouTube API** credentials for uploads
- **Cron-job.org** account for scheduling (free)

## 🛠️ **Setup Steps**

### 1. **Environment Configuration**

Update your `.env.local` file with all required credentials:

```env
# Existing YouTube credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NEW: OpenAI for quiz generation
OPENAI_API_KEY=sk-your-openai-api-key-here

# NEW: Neon Database
DATABASE_URL=postgresql://username:password@ep-xxx.us-west-2.aws.neon.tech/quiz_db?sslmode=require

# NEW: Cron authentication
CRON_SECRET=your-super-secure-random-string-here

# Existing
NEXTAUTH_SECRET=your-nextauth-secret
DEEPSEEK_API_KEY=your-deepseek-key
```

### 2. **Neon Database Setup**

1. Go to [neon.tech](https://neon.tech) and create account
2. Create new database project
3. Copy connection string to `DATABASE_URL`
4. Run the schema setup:

**Option A: Using psql command**
```bash
psql "your-database-url-here" -f database/schema.sql
```

**Option B: Using Neon Console**
- Open Neon dashboard > SQL Editor
- Copy/paste contents of `database/schema.sql`
- Execute the queries

### 3. **Install Dependencies**

```bash
npm install
```

New dependencies added:
- `canvas` - For frame generation
- `ffmpeg-static` & `fluent-ffmpeg` - For video assembly
- `pg` & `@types/pg` - PostgreSQL client

### 4. **Test Database Connection**

```bash
npm run dev
```

Visit: `http://localhost:3000/api/test-db`

Should return: `Database is ready for quiz generation!`

### 5. **Test the Dashboard**

Visit: `http://localhost:3000/quiz-dashboard`

Use the test buttons to verify each pipeline step.

### 6. **External Cron Job Setup**

1. Go to [cron-job.org](https://cron-job.org) (free account)
2. Create 4 cron jobs with these settings:

**Job 1: Question Generation**
- URL: `https://your-app.vercel.app/api/jobs/generate-quiz`
- Schedule: `*/30 * * * *` (every 30 minutes)
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

**Job 2: Frame Creation** 
- URL: `https://your-app.vercel.app/api/jobs/create-frames`
- Schedule: `5,35 * * * *` (5 minutes after Job 1)
- Method: POST  
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

**Job 3: Video Assembly**
- URL: `https://your-app.vercel.app/api/jobs/assemble-video`
- Schedule: `10,40 * * * *` (10 minutes after Job 1)
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

**Job 4: YouTube Upload**
- URL: `https://your-app.vercel.app/api/jobs/upload-quiz-videos`
- Schedule: `15,45 * * * *` (15 minutes after Job 1)
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

## 🚀 **Deployment**

### Deploy to Vercel:

```bash
npm run build
vercel --prod
```

### Set Environment Variables in Vercel:
```bash
vercel env add OPENAI_API_KEY
vercel env add DATABASE_URL
vercel env add CRON_SECRET
# ... add all other env vars
```

## 📊 **Expected Output**

### Daily Production:
- **Every 30 minutes**: 8 new quiz questions generated
- **Every 2 hours**: 32 quiz videos uploaded to YouTube
- **Daily**: 400+ practice quiz videos
- **Monthly**: 12,000+ educational quiz videos

### Content Distribution:
- 25% SAT Math
- 15% SAT Reading  
- 15% SAT Writing
- 15% GMAT Verbal
- 15% GMAT Quantitative
- 10% GRE Verbal
- 15% GRE Quantitative

## 🔍 **Monitoring & Debugging**

### Dashboard Features:
- Real-time job statistics
- Recent job history
- Step-by-step testing buttons
- Error message tracking

### Log Monitoring:
```bash
vercel logs
```

### Database Queries:
```sql
-- Check job status
SELECT status, COUNT(*) FROM quiz_jobs GROUP BY status;

-- Recent failed jobs
SELECT * FROM quiz_jobs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;

-- Daily video count
SELECT DATE(created_at), COUNT(*) FROM uploaded_videos GROUP BY DATE(created_at);
```

## 🛠️ **Troubleshooting**

### Common Issues:

**1. FFmpeg Errors**
- Solution: Ensure `ffmpeg-static` is installed
- Vercel automatically includes FFmpeg

**2. Canvas Module Issues**  
- Solution: Canvas requires native dependencies
- Vercel supports Canvas out of the box

**3. Database Connection**
- Solution: Check `DATABASE_URL` format
- Ensure SSL mode is enabled for Neon

**4. YouTube Upload Fails**
- Solution: Verify Google OAuth setup
- Check API quotas (10,000 units/day)

**5. Cron Jobs Not Triggering**
- Solution: Verify URLs and headers
- Check Vercel function logs

## 📈 **Scaling Considerations**

### Performance Optimization:
- **Database**: Connection pooling implemented
- **Memory**: Each job processes 2-3 items max
- **CPU**: Video assembly is most intensive step
- **Storage**: No permanent file storage (uses temp dirs)

### Rate Limits:
- **OpenAI**: 3,500 requests/minute (Tier 1)
- **YouTube API**: 10,000 units/day (≈6 uploads)
- **Vercel Functions**: 100GB-hours/month (Hobby)

### Monitoring Alerts:
Set up alerts for:
- Failed job rate > 10%
- Daily upload count < 300
- Database connection failures

## 🎥 **Video Specifications**

### Technical Details:
- **Resolution**: 1080x1920 (9:16 aspect ratio)
- **Duration**: 20 seconds (3+8+3+6 frame timing)
- **Format**: MP4, H.264 codec
- **Frame Rate**: 30 FPS
- **Category**: Education (YouTube category 27)

### Content Structure:
1. **Question Frame** (3s): Test type + question
2. **Options Frame** (8s): Multiple choice A-D
3. **Thinking Frame** (3s): "Think about it..." 
4. **Answer Frame** (6s): Correct answer + explanation

## 🔒 **Security Notes**

- All cron endpoints require `CRON_SECRET` authentication
- Database uses SSL connections
- No sensitive data stored in video metadata
- Temporary files cleaned up automatically

## 📞 **Support**

For issues:
1. Check dashboard at `/quiz-dashboard`
2. Review Vercel function logs  
3. Test individual steps manually
4. Check database connection with `/api/test-db`

The system is now ready for fully automated quiz video generation! 🚀