import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, markJobCompleted, updateJob } from '@/lib/database';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Rate limiting configuration for YouTube API
const YOUTUBE_DAILY_QUOTA = 10000; // YouTube API daily quota units (default allocation)
const UPLOAD_QUOTA_COST = 1600; // Each upload costs ~1600 quota units
const MAX_DAILY_UPLOADS = 20; // Target: 20 videos per day (requires higher quota)
const UPLOAD_DELAY_MS = 2000; // 2 second delay between uploads for better throughput
const MAX_CONCURRENT_UPLOADS = 3; // Process max 3 uploads simultaneously for 20/day

// Simple in-memory rate limiter (in production, use Redis)
const uploadTracker = {
  dailyCount: 0,
  lastResetDate: new Date().toDateString(),
  activeUploads: 0
};

export async function POST(request: NextRequest) {
  try {
    // Auth check using CRON_SECRET
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting YouTube upload batch...');

    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    if (uploadTracker.lastResetDate !== today) {
      uploadTracker.dailyCount = 0;
      uploadTracker.lastResetDate = today;
      console.log('Daily upload counter reset');
    }

    // Check daily upload limit
    const remainingUploads = MAX_DAILY_UPLOADS - uploadTracker.dailyCount;
    if (remainingUploads <= 0) {
      console.log(`Daily upload limit reached (${MAX_DAILY_UPLOADS}). Skipping batch.`);
      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: `Daily upload limit reached (${uploadTracker.dailyCount}/${MAX_DAILY_UPLOADS})`,
        nextResetTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Check concurrent upload limit
    if (uploadTracker.activeUploads >= MAX_CONCURRENT_UPLOADS) {
      console.log(`Maximum concurrent uploads reached (${uploadTracker.activeUploads}/${MAX_CONCURRENT_UPLOADS}). Skipping batch.`);
      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: `Maximum concurrent uploads reached. Try again in a few minutes.`
      });
    }

    // Get jobs at step 4 (upload_pending) - limit by remaining daily quota
    const batchSize = Math.min(MAX_CONCURRENT_UPLOADS - uploadTracker.activeUploads, remainingUploads);
    const jobs = await getPendingJobs(4, batchSize);
    
    if (jobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: 'No jobs pending YouTube upload' 
      });
    }

    const processedJobs = [];

    // Process uploads with rate limiting and concurrency control
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      
      try {
        // Track active uploads
        uploadTracker.activeUploads++;
        
        console.log(`Uploading video for job ${job.id} - ${job.test_type} ${job.subject} (${i + 1}/${jobs.length})`);
        console.log(`Rate limit status: ${uploadTracker.dailyCount}/${MAX_DAILY_UPLOADS} daily, ${uploadTracker.activeUploads}/${MAX_CONCURRENT_UPLOADS} concurrent`);

        // Convert video buffer back from base64
        const videoBuffer = Buffer.from(job.data.videoBuffer, 'base64');
        
        // Generate metadata for the video
        const metadata = generateVideoMetadata(job.data.question, job.test_type, job.subject, job.id);
        
        // Upload to YouTube with retry logic
        const youtubeVideoId = await uploadToYouTubeWithRetry(videoBuffer, metadata, 3);
        
        // Mark job as completed
        await markJobCompleted(job.id, youtubeVideoId, metadata);
        
        // Update counters
        uploadTracker.dailyCount++;
        
        processedJobs.push({ 
          id: job.id, 
          test_type: job.test_type, 
          subject: job.subject,
          youtube_video_id: youtubeVideoId
        });
        
        console.log(`YouTube upload completed for job ${job.id}: https://youtube.com/watch?v=${youtubeVideoId}`);

        // Add delay between uploads to respect rate limits
        if (i < jobs.length - 1) {
          console.log(`Waiting ${UPLOAD_DELAY_MS}ms before next upload...`);
          await new Promise(resolve => setTimeout(resolve, UPLOAD_DELAY_MS));
        }

      } catch (error) {
        console.error(`Failed to upload video for job ${job.id}:`, error);
        
        // Mark job as failed
        await updateJob(job.id, {
          status: 'failed',
          error_message: `YouTube upload failed: ${error.message}`
        });
      } finally {
        // Always decrement active uploads counter
        uploadTracker.activeUploads = Math.max(0, uploadTracker.activeUploads - 1);
      }
    }

    console.log(`YouTube upload batch completed. Processed ${processedJobs.length} jobs.`);

    return NextResponse.json({ 
      success: true, 
      processed: processedJobs.length,
      jobs: processedJobs,
      rateLimitStatus: {
        dailyUploads: uploadTracker.dailyCount,
        maxDailyUploads: MAX_DAILY_UPLOADS,
        remainingDailyUploads: MAX_DAILY_UPLOADS - uploadTracker.dailyCount,
        activeUploads: uploadTracker.activeUploads,
        maxConcurrentUploads: MAX_CONCURRENT_UPLOADS,
        nextResetTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('YouTube upload batch failed:', error);
    return NextResponse.json(
      { success: false, error: 'YouTube upload failed' },
      { status: 500 }
    );
  }
}

function generateVideoMetadata(question: any, testType: string, subject: string, jobId: string) {
  // Generate quiz-focused title
  const titles = {
    'SAT-Math': `SAT Math Quick Quiz: ${question.topic || 'Problem Solving'} 🧮`,
    'SAT-Reading': `SAT Reading Practice: ${question.topic || 'Comprehension'} 📚`,
    'SAT-Writing': `SAT Writing Skills: ${question.topic || 'Grammar'} ✍️`,
    'GMAT-Verbal': `GMAT Verbal Challenge: ${question.topic || 'Critical Thinking'} 💼`,
    'GMAT-Quantitative': `GMAT Quant Practice: ${question.topic || 'Problem Solving'} 📊`,
    'GRE-Verbal': `GRE Verbal Skills: ${question.topic || 'Word Power'} 🎓`,
    'GRE-Quantitative': `GRE Math Challenge: ${question.topic || 'Quantitative'} 🔢`
  };
  
  const titleKey = `${testType}-${subject}`;
  const title = titles[titleKey] || `${testType} ${subject} Practice Question #${jobId.slice(-4)}`;
  
  // Generate educational description
  const description = `🎯 Quick ${testType} practice question - can you solve it?

${question.question.slice(0, 150)}${question.question.length > 150 ? '...' : ''}

Test your ${subject.toLowerCase()} skills with this practice problem! 

⏱️ 20-second challenge
🧠 Think, choose, learn
✅ Answer revealed with explanation

Perfect for:
• ${testType} test preparation
• Quick study breaks
• Skill assessment
• Educational practice

#${testType} #StudyTips #Quiz #Shorts #TestPrep #${subject} #Practice #Education #QuickLearning

Ready to challenge yourself? Watch and see how you do! 🚀`;

  // Generate relevant tags
  const tags = [
    testType.toLowerCase(),
    'quiz',
    'practice', 
    'shorts',
    'study',
    subject.toLowerCase(),
    'test prep',
    'education',
    question.topic || 'general',
    'quick quiz',
  ].slice(0, 10); // YouTube allows max 10 tags

  return {
    title: title.slice(0, 100), // YouTube title limit
    description: description.slice(0, 5000), // YouTube description limit
    tags
  };
}

async function uploadToYouTubeWithRetry(videoBuffer: Buffer, metadata: any, maxRetries: number = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries}`);
      return await uploadToYouTube(videoBuffer, metadata);
    } catch (error) {
      console.error(`Upload attempt ${attempt} failed:`, error);
      
      // Don't retry on authentication errors
      if (error.message.includes('Authentication failed') || error.message.includes('Invalid Credentials')) {
        throw error;
      }
      
      // Don't retry on quota exceeded errors
      if (error.message.includes('quotaExceeded')) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Upload failed after all retry attempts');
}

async function uploadToYouTube(videoBuffer: Buffer, metadata: any): Promise<string> {
  try {
    // Determine the redirect URI based on environment
    const redirectUri = process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/api/auth/callback/google'
        : (() => { throw new Error('NEXTAUTH_URL must be set in production environment'); })();

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Set the refresh token from environment
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    // Refresh the access token if needed
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      console.log('Access token refreshed successfully');
    } catch (tokenError) {
      console.error('Failed to refresh access token:', tokenError);
      throw new Error('Authentication failed - unable to refresh access token');
    }

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    // Create temporary file for upload
    const tempFile = path.join('/tmp', `quiz-upload-${uuidv4()}.mp4`);
    fs.writeFileSync(tempFile, videoBuffer);

    try {
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            categoryId: '27', // Education category
            defaultAudioLanguage: 'en',
            defaultLanguage: 'en'
          },
          status: {
            privacyStatus: 'public',
            madeForKids: false,
            selfDeclaredMadeForKids: false
          }
        },
        media: {
          body: fs.createReadStream(tempFile)
        }
      });

      // Cleanup temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return response.data.id!;
      
    } catch (uploadError) {
      // Cleanup temp file on error
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      throw uploadError;
    }

  } catch (error) {
    console.error('YouTube upload error:', error);
    
    // For development/testing, return a mock video ID
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: returning mock video ID');
      return `mock-video-${Date.now()}`;
    }
    
    throw new Error(`YouTube upload failed: ${error.message}`);
  }
}

// Rate limiting status endpoint for monitoring
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    if (uploadTracker.lastResetDate !== today) {
      uploadTracker.dailyCount = 0;
      uploadTracker.lastResetDate = today;
    }

    return NextResponse.json({
      success: true,
      rateLimitStatus: {
        dailyUploads: uploadTracker.dailyCount,
        maxDailyUploads: MAX_DAILY_UPLOADS,
        remainingDailyUploads: MAX_DAILY_UPLOADS - uploadTracker.dailyCount,
        activeUploads: uploadTracker.activeUploads,
        maxConcurrentUploads: MAX_CONCURRENT_UPLOADS,
        nextResetTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
        quotaUsageEstimate: uploadTracker.dailyCount * UPLOAD_QUOTA_COST,
        remainingQuotaEstimate: (MAX_DAILY_UPLOADS - uploadTracker.dailyCount) * UPLOAD_QUOTA_COST
      }
    });
  } catch (error) {
    console.error('Rate limit status check failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get rate limit status' },
      { status: 500 }
    );
  }
}