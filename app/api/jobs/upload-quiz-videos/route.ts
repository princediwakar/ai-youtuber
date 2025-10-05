import { NextRequest, NextResponse } from 'next/server';
import { getOldestPendingJob, markJobCompleted, updateJob, autoRetryFailedJobs } from '@/lib/database';
import { google, youtube_v3 } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os'; // --- FIX: Import tmpdir from the 'os' module ---
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

// In-memory cache for playlist map
const playlistMapCache = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let accountId: string | undefined;
    try {
      const body = await request.json();
      accountId = body.accountId;
    } catch {
      // No body, process for all accounts
    }

    console.log(`🚀 Starting single video upload for account: ${accountId || 'all'}`);
    
    // 1. Auto-retry previously failed jobs
    await autoRetryFailedJobs();

    // 2. Check schedule before fetching a job
    if (accountId && process.env.DEBUG_MODE !== 'true') {
        const account = await getAccountConfig(accountId);
        const now = new Date();
        const istDateString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const istTime = new Date(istDateString);
        const hourOfDay = istTime.getHours();
        const personasToUpload = getScheduledPersonasForUpload(accountId, istTime.getDay(), hourOfDay) || [];

        if (personasToUpload.length === 0) {
            const message = `No uploads scheduled for ${account.name} at this hour (${hourOfDay}:00 IST).`;
            console.log(message);
            return NextResponse.json({ success: true, message });
        }
    }
      
    // 3. Fetch the single oldest job pending upload (Step 4)
    const job = await getOldestPendingJob(4, accountId);
    
    if (!job) {
      const message = `No videos ready for upload for account: ${accountId || 'all'}.`;
      console.log(message);
      return NextResponse.json({ success: true, message });
    }

    console.log(`[YouTube Upload] Found job ${job.id}. Starting process...`);

    // 4. Process the single job within a robust try/catch block
    try {
      const youtube = await getYouTubeClientForJob(job);
      await processUpload(job, youtube, playlistMapCache);
      console.log(`[YouTube Upload] Successfully completed job ${job.id}.`);
      return NextResponse.json({ success: true, processedJobId: job.id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[YouTube Upload] CRITICAL ERROR processing job ${job.id}:`, error);
      await updateJob(job.id, {
        status: 'failed',
        error_message: `YouTube upload failed: ${errorMessage.substring(0, 500)}`
      });
      return NextResponse.json({ success: false, error: errorMessage, failedJobId: job.id }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ YouTube upload endpoint failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: 'YouTube upload endpoint failed', details: errorMessage }, { status: 500 });
  }
}

async function getYouTubeClientForJob(job: QuizJob): Promise<youtube_v3.Youtube> {
    if (!job.account_id) {
        throw new Error(`Job ${job.id} is missing an account_id.`);
    }
    const oauth2Client = await getOAuth2Client(job.account_id);
    return google.youtube({ version: 'v3', auth: oauth2Client });
}


async function processUpload(job: QuizJob, youtube: youtube_v3.Youtube, playlistMap: Map<string, string>) {
  let tempFile: string | null = null;
  try {
    const videoUrl = job.data.videoUrl;
    if (!videoUrl) throw new Error(`Video URL not found in job data for job ${job.id}`);
    
    const videoBuffer = await downloadVideoFromCloudinary(videoUrl);
    tempFile = path.join(tmpdir(), `upload-${uuidv4()}.mp4`);
    await fs.writeFile(tempFile, new Uint8Array(videoBuffer));

    if (!playlistMap.has(job.account_id!)) {
        const accountPlaylists = await findManagedPlaylists(youtube);
        accountPlaylists.forEach((id, name) => playlistMap.set(name, id));
    }
    
    const playlistId = await getOrCreatePlaylist(youtube, job, playlistMap);
    const metadata = generateVideoMetadata(job, playlistId);
    
    const thumbnailUrl = job.data.frameUrls?.[0];
    
    const youtubeVideoId = await uploadToYouTube(tempFile, metadata, youtube, thumbnailUrl);
    
    await addVideoToPlaylist(youtubeVideoId, playlistId, youtube, job.id);
    
    await markJobCompleted(job.id, youtubeVideoId, metadata);
    
    await cleanupJobAssets(job.data, job.account_id!);
    
    console.log(`[Job ${job.id}] ✅ YouTube upload successful: https://www.youtube.com/watch?v=${youtubeVideoId}`);

  } catch (error) {
    throw error;
  } finally {
    if (tempFile) {
      await fs.unlink(tempFile).catch(e => console.warn(`Failed to delete temp file ${tempFile}:`, e));
    }
  }
}

function generateVideoMetadata(job: QuizJob, playlistId?: string) {
    const content = job.data.content;
    const topic = job.topic_display_name || 'Quiz';
    const accountId = job.account_id!;

    const title = (content?.hook || content?.topic || topic).substring(0, 100);

    const hashtags: { [key: string]: string } = {
        'english_shots': '#shorts #viral #learnenglish #english #vocabulary #quiz',
        'health_shots': '#shorts #viral #health #wellness #tips #education',
        'ssc_shots': '#shorts #viral #ssc #exam #government #study #education',
        'astronomy_shots': '#shorts #viral #space #astronomy #science #facts #education'
    };
    const finalHashtags = hashtags[accountId] || '#shorts #viral #trending #fyp #education';

    const playlistLink = playlistId ? `📺 More ${topic} questions: https://www.youtube.com/playlist?list=${playlistId}\n\n` : '';
    const description = `${title}\n\n${playlistLink}🔔 Subscribe for daily quizzes!\n\n${finalHashtags}`;

    const tagMap: { [key: string]: string[] } = {
        'english_shots': ['english', 'vocabulary', 'learn english'],
        'health_shots': ['health', 'wellness', 'tips'],
        'ssc_shots': ['ssc', 'government exam', 'study'],
        'astronomy_shots': ['space', 'astronomy', 'science']
    };
    const specificTags = tagMap[accountId] || [topic.toLowerCase()];

    return { title, description, tags: ['shorts', 'education', 'quiz', ...specificTags] };
}


export const runtime = 'nodejs';
export const maxDuration = 300;

