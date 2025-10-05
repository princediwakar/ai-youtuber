// app/api/jobs/upload-quiz-videos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, markJobCompleted, updateJob, autoRetryFailedJobs } from '@/lib/database';
import { google, youtube_v3 } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { downloadVideoFromCloudinary, cleanupJobAssets } from '@/lib/cloudinary';
import { findManagedPlaylists, getOrCreatePlaylist } from '@/lib/playlistManager';
import { QuizJob } from '@/lib/types';
import { config } from '@/lib/config';
import { getOAuth2Client } from '@/lib/googleAuth';
import { getScheduledPersonasForUpload } from '@/lib/schedule';
import { getAccountConfig } from '@/lib/accounts';
import { uploadToYouTube, addVideoToPlaylist } from '@/lib/youtubeUpload';
import { initializeErrorHandlers } from '@/lib/errorHandlers';

// Initialize global error handlers
initializeErrorHandlers();

// The in-memory cache for the playlist map is still useful to avoid re-fetching on every run.
interface Cache {
  playlistMap: Map<string, string> | null;
}
let memoryCache: Cache = { playlistMap: null };
async function getCache(): Promise<Cache> { return memoryCache; }
async function setCache(cache: Cache): Promise<void> { memoryCache = cache; }



export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse request body to get accountId (required for targeted processing)
    let accountId: string | undefined;
    try {
      const body = await request.json();
      accountId = body.accountId;
    } catch {
      // No body or invalid JSON - process all accounts (backward compatibility)
    }

    console.log(`🚀 Starting upload processing for account: ${accountId || 'multiple'}`);

    // Process asynchronously to prevent timeout
    processCompleteUploadFlow(accountId).catch(error => {
      console.error('Background upload processing failed:', error);
    });

    return NextResponse.json({ 
      success: true, 
      accountId: accountId || 'multiple',
      message: 'Upload processing started in background'
    });

  } catch (error) {
    console.error('YouTube upload batch failed:', error);
    return NextResponse.json({ success: false, error: 'YouTube upload failed' }, { status: 500 });
  }
}

/**
 * Complete upload flow - handles account validation, scheduling, and upload processing.
 * Runs asynchronously without blocking the API response.
 */
async function processCompleteUploadFlow(accountId: string | undefined) {
  // Global timeout for entire upload process (4 minutes max)
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Upload process exceeded 4 minute limit'));
    }, 240000);
  });

  try {
    console.log(`🔄 Background upload flow started for account: ${accountId || 'multiple'}`);

    const uploadPromise = (async () => {
      // Validate account and get personas to upload
      let account: any;
      let personasToUpload: string[] = [];
    
    if (accountId) {
      try {
        account = await getAccountConfig(accountId);
        
        // Check schedule for specific account
        const now = new Date();
        const istDateString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const istTime = new Date(istDateString);

        const hourOfDay = istTime.getHours();

        if (config.DEBUG_MODE) {
          personasToUpload = Array.isArray(account.personas) ? account.personas : [];
          if (personasToUpload.length === 0) {
            console.log(`⚠️  DEBUG MODE: Account ${accountId} has no personas defined`);
            return;
          }
        } else {
          personasToUpload = getScheduledPersonasForUpload(accountId, istTime.getDay(), hourOfDay) || [];
          if (personasToUpload.length === 0) {
            console.log(`No ${account.name} uploads scheduled for this hour (${hourOfDay}:00).`);
            return;
          }
        }
      } catch (error) {
        console.error(`❌ Invalid accountId: ${accountId}`, error);
        return;
      }
    }

    // Auto-retry failed jobs and get pending jobs
    await autoRetryFailedJobs();
    let jobs = await getPendingJobs(4, config.UPLOAD_CONCURRENCY, personasToUpload.length > 0 ? personasToUpload : undefined);
    
    if (accountId) {
      jobs = jobs.filter(job => job.account_id === accountId);
    }
    
    if (jobs.length === 0) {
      console.log(accountId ? `No videos ready for upload for account ${accountId}` : 'No videos ready for upload');
      return;
    }

    console.log(`Found ${jobs.length} jobs for upload. Processing...`);

    // Process uploads by account
    const cache = await getCache();
    const jobsByAccount = new Map<string, QuizJob[]>();
    jobs.forEach(job => {
      const jobAccountId = job.account_id || 'english_shots';
      if (!jobsByAccount.has(jobAccountId)) {
        jobsByAccount.set(jobAccountId, []);
      }
      jobsByAccount.get(jobAccountId)!.push(job);
    });

    let totalSuccessfulJobs = 0;
    const processedAccounts: string[] = [];

    for (const [jobAccountId, accountJobs] of jobsByAccount.entries()) {
      try {
        const oauth2Client = await getOAuth2Client(jobAccountId);
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        
        if (!cache.playlistMap) {
          cache.playlistMap = await findManagedPlaylists(youtube);
          await setCache(cache);
        }

        const processPromises = accountJobs.map(job => processUpload(job, youtube, cache.playlistMap!, jobAccountId));
        const results = await Promise.allSettled(processPromises);
        
        const successfulJobs = results.filter(r => r.status === 'fulfilled' && r.value).length;
        totalSuccessfulJobs += successfulJobs;
        processedAccounts.push(jobAccountId);
        
        console.log(`Account ${jobAccountId}: Processed ${successfulJobs}/${accountJobs.length} jobs`);
      } catch (error) {
        console.error(`Failed to process jobs for account ${jobAccountId}:`, error);
      }
    }

    const accountName = account?.name || accountId || 'unknown';
    const message = accountId 
      ? (config.DEBUG_MODE ? `${accountName} personas (debug mode)` : personasToUpload.join(', '))
      : `All accounts: ${processedAccounts.join(', ')}`;
      
    console.log(`✅ Background YouTube upload completed. Processed ${totalSuccessfulJobs} jobs for: ${message}.`);
    
    return { success: true, processed: totalSuccessfulJobs, accounts: processedAccounts };
    })();

    return await Promise.race([uploadPromise, timeoutPromise]);

  } catch (error) {
    console.error(`❌ Background upload flow failed for ${accountId}:`, error);
    
    // If it's a timeout error, mark pending jobs as failed
    if (error instanceof Error && error.message.includes('exceeded 4 minute limit')) {
      try {
        const jobs = await getPendingJobs(4, config.UPLOAD_CONCURRENCY);
        const accountJobs = accountId ? jobs.filter(job => job.account_id === accountId) : jobs;
        for (const job of accountJobs) {
          await updateJob(job.id, {
            status: 'failed',
            error_message: 'Upload timed out due to Vercel execution limit'
          });
        }
      } catch (updateError) {
        console.error('Failed to update timed-out jobs:', updateError);
      }
    }
    
    throw error;
  }
}

async function processUpload(job: QuizJob, youtube: youtube_v3.Youtube, playlistMap: Map<string, string>, accountId: string) {
  let tempFile: string | null = null;
  try {
    console.log(`[Job ${job.id}] Starting YouTube upload...`);
    
    const videoUrl = job.data.videoUrl;
    if (!videoUrl) throw new Error(`Video URL not found in job data`);
    
    const videoBuffer = await downloadVideoFromCloudinary(videoUrl);
    tempFile = path.join('/tmp', `upload-${uuidv4()}.mp4`);
    await fs.writeFile(tempFile, new Uint8Array(videoBuffer));

    // Get playlist ID first so we can include it in metadata
    const playlistId = await getOrCreatePlaylist(youtube, job, playlistMap);
    
    // Generate account-specific metadata with playlist link
    const metadata = generateVideoMetadata(job, playlistId, accountId);
    
    // Get the first frame URL as thumbnail (question frame)
    const thumbnailUrl = job.data.frameUrls?.[0];
    
    const youtubeVideoId = await uploadToYouTube(tempFile, metadata, youtube, thumbnailUrl);
    
    await addVideoToPlaylist(youtubeVideoId, playlistId, youtube, job.id.toString());
    
    await markJobCompleted(job.id, youtubeVideoId, metadata);
    await cleanupJobAssets(job.data, job.account_id || accountId);
    
    console.log(`[Job ${job.id}] ✅ YouTube upload successful: https://www.youtube.com/watch?v=${youtubeVideoId}`);
    return { id: job.id, youtube_video_id: youtubeVideoId };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Job ${job.id}] ❌ YouTube upload failed:`, errorMessage);
    await updateJob(job.id, {
      status: 'failed',
      error_message: `YouTube upload failed: ${errorMessage}`
    });
    return null;
  } finally {
    if (tempFile) {
      await fs.unlink(tempFile).catch(e => console.warn(`Failed to delete temp file ${tempFile}:`, e));
    }
  }
}


function generateVideoMetadata(job: QuizJob, playlistId: string | undefined, accountId: string) {
  console.log(`[Job ${job.id}] Generating metadata for accountId: ${accountId}, persona: ${job.persona}`);
  
  const contentData = job.data.content; // Get content data
  const topic_display_name = job.topic_display_name || job.data.topic_display_name || 'Quiz';
  
  console.log(`[Job ${job.id}] Content data exists: ${!!contentData}, Topic: ${topic_display_name}`);
  
  try {
    // Generate title using AI-generated hook
    const title = generateTitle(accountId, topic_display_name, contentData);
    console.log(`[Job ${job.id}] Generated title: ${title}`);
    
    // Generate basic hashtags
    const hashtags = generateHashtags(accountId);
    console.log(`[Job ${job.id}] Generated hashtags`);
    
    // Create engaging description with full content and playlist link
    const description = generateDescription(accountId, contentData, topic_display_name, hashtags, playlistId);
    console.log(`[Job ${job.id}] Generated description (${description.length} chars)`);
    
    // Basic SEO tags
    const tags = generateSEOTags(accountId, topic_display_name);
    console.log(`[Job ${job.id}] Generated ${tags.length} SEO tags`);
    
    return { title: title.slice(0, 100), description, tags };
  } catch (error) {
    console.error(`[Job ${job.id}] Error generating metadata:`, error);
    console.error(`[Job ${job.id}] Job data:`, JSON.stringify({
      accountId,
      persona: job.persona,
      topic: job.topic,
      topic_display_name,
      hasContentData: !!contentData
    }, null, 2));
    throw error;
  }
}

/**
 * Generates title using AI-generated hook from content data.
 */
function generateTitle(accountId: string, topicName: string, contentData: any): string {
  // Use AI-generated hook as title if available
  const aiHook = contentData?.hook || contentData?.title;
  if (aiHook && aiHook.length <= 100) {
    return aiHook;
  }
  
  // Fallback to simple topic-based title
  const suffix = {
    'english_shots': 'English Quiz',
    'health_shots': 'Health Tips', 
    'ssc_shots': 'SSC Exam',
    'astronomy_shots': 'Space Facts'
  }[accountId] || 'Quiz';
  
  return `${topicName} | ${suffix}`;
}

/**
 * Generates basic hashtags for shorts content.
 */
function generateHashtags(accountId: string): string {
  const baseHashtags = '#shorts #viral #trending #fyp #education';
  
  if (accountId === 'english_shots') {
    return `${baseHashtags} #learnenglish #english #vocabulary #quiz`;
  }
  
  if (accountId === 'health_shots') {
    return `${baseHashtags} #health #wellness #tips`;
  }
  
  if (accountId === 'ssc_shots') {
    return `${baseHashtags} #ssc #exam #government #study`;
  }
  
  if (accountId === 'astronomy_shots') {
    return `${baseHashtags} #space #astronomy #science #facts`;
  }
  
  return baseHashtags;
}

/**
 * Creates simple engaging video descriptions using AI-generated content.
 */
function generateDescription(accountId: string, contentData: any, topicName: string, hashtags: string, playlistId?: string): string {
  const defaultHooks = {
    'english_shots': '🤔 Test your English knowledge!',
    'health_shots': '💡 Expert health knowledge!',
    'ssc_shots': '📚 SSC exam preparation!',
    'astronomy_shots': '🚀 Amazing space facts!'
  };
  
  const hook = contentData.hook || (defaultHooks as any)[accountId] || '🎯 Test your knowledge!';
  const question = contentData.question || contentData.content || 'Check out this knowledge!';
  const explanation = contentData.explanation || 'Watch for the answer!';
  
  const playlistLink = playlistId ? 
    `📺 More ${topicName} questions: https://www.youtube.com/playlist?list=${playlistId}\n\n` : '';
  
  return `${hook}\n\n${playlistLink}${question}\n\n💡 ${explanation}\n\n🔔 Subscribe for daily quizzes!\n\n${hashtags}`;
}


/**
 * Generates basic SEO tags for YouTube.
 */
function generateSEOTags(accountId: string, topicName: string): string[] {
  const baseTags = ['shorts', 'viral', 'education', 'quiz'];
  
  if (accountId === 'english_shots') {
    return [...baseTags, 'english', 'vocabulary', 'learn english'];
  }
  
  if (accountId === 'health_shots') {
    return [...baseTags, 'health', 'wellness', 'tips'];
  }
  
  if (accountId === 'ssc_shots') {
    return [...baseTags, 'ssc', 'government exam', 'study'];
  }
  
  if (accountId === 'astronomy_shots') {
    return [...baseTags, 'space', 'astronomy', 'science'];
  }
  
  return [...baseTags, topicName.toLowerCase()];
}


export const runtime = 'nodejs';
export const maxDuration = 300;