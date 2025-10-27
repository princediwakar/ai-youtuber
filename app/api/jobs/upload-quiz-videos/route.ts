import { NextRequest, NextResponse } from 'next/server';
import { getOldestPendingJob, markJobCompleted, updateJob, autoRetryFailedJobs } from '@/lib/database';
import { google, youtube_v3 } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { downloadVideoFromCloudinary } from '@/lib/cloudinary';
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
  const requestStartTime = Date.now();
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
    
    // Auto-retry is a quick DB check, keeping it here is usually safe.
    const autoRetryStart = Date.now();
    await autoRetryFailedJobs();
    console.log(`[YouTube Upload] Auto-retry finished in ${(Date.now() - autoRetryStart) / 1000}s.`);


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
            const requestDuration = (Date.now() - requestStartTime) / 1000;
            console.log(`[YouTube Upload] Finished check in: ${requestDuration.toFixed(2)}s.`);
            return NextResponse.json({ success: true, message });
        }
    }
      
    const jobFetchStart = Date.now();
    const job = await getOldestPendingJob(4, accountId);
    console.log(`[YouTube Upload] Job Fetch: ${(Date.now() - jobFetchStart) / 1000}s.`);
    
    if (!job) {
      const message = `No videos ready for upload for account: ${accountId || 'all'}.`;
      console.log(message);
      const requestDuration = (Date.now() - requestStartTime) / 1000;
      console.log(`[YouTube Upload] Finished check in: ${requestDuration.toFixed(2)}s.`);
      return NextResponse.json({ success: true, message });
    }

    console.log(`[YouTube Upload] Found job ${job.id}. Starting process...`);

    try {
      const youtubeClientStart = Date.now();
      const youtube = await getYouTubeClientForJob(job);
      console.log(`[YouTube Upload] YouTube client initialized in ${(Date.now() - youtubeClientStart) / 1000}s.`);
      
      await processUpload(job, youtube, playlistMapCache);
      
      const requestDuration = (Date.now() - requestStartTime) / 1000;
      console.log(`[YouTube Upload] Successfully completed job ${job.id}. Total time: ${requestDuration.toFixed(2)}s.`);
      return NextResponse.json({ success: true, processedJobId: job.id });
    } catch (error) {
      const requestDuration = (Date.now() - requestStartTime) / 1000;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[YouTube Upload] CRITICAL ERROR processing job ${job.id} (Time: ${requestDuration.toFixed(2)}s):`, error);
      await updateJob(job.id, {
        status: 'failed',
        error_message: `YouTube upload failed: ${errorMessage.substring(0, 500)}`
      });
      return NextResponse.json({ success: false, error: errorMessage, failedJobId: job.id }, { status: 500 });
    }

  } catch (error) {
    const requestDuration = (Date.now() - requestStartTime) / 1000;
    console.error(`❌ YouTube upload endpoint failed (Time: ${requestDuration.toFixed(2)}s):`, error);
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
  const processStart = Date.now();
  let tempFile: string | null = null;
  
  try {
    const videoUrl = job.data.videoUrl;
    if (!videoUrl) throw new Error(`Video URL not found in job data for job ${job.id}`);
    
    const downloadStart = Date.now();
    const videoBuffer = await downloadVideoFromCloudinary(videoUrl);
    console.log(`[Job ${job.id}] Video downloaded in ${(Date.now() - downloadStart) / 1000}s.`);

    const tempFileStart = Date.now();
    tempFile = path.join(tmpdir(), `upload-${uuidv4()}.mp4`);
    await fs.writeFile(tempFile, new Uint8Array(videoBuffer));
    console.log(`[Job ${job.id}] Temp file written in ${(Date.now() - tempFileStart) / 1000}s.`);


    const playlistStart = Date.now();
    if (!playlistMap.has(job.account_id!)) {
        const accountPlaylists = await findManagedPlaylists(youtube);
        accountPlaylists.forEach((id, name) => playlistMap.set(name, id));
        console.log(`Found ${accountPlaylists.size} existing managed playlists.`);
        console.log(`[Job ${job.id}] Refreshed playlist cache.`);
    }
    
    const playlistId = await getOrCreatePlaylist(youtube, job, playlistMap);
    const metadata = generateVideoMetadata(job, playlistId);
    console.log(`[Job ${job.id}] Playlist resolved in ${(Date.now() - playlistStart) / 1000}s.`);

    const thumbnailUrl = job.data.frameUrls?.[0];
    
    const uploadStart = Date.now();
    const youtubeVideoId = await uploadToYouTube(tempFile, metadata, youtube, thumbnailUrl);
    console.log(`[Job ${job.id}] YouTube upload (file transfer) completed in ${(Date.now() - uploadStart) / 1000}s.`);
    
    await addVideoToPlaylist(youtubeVideoId, playlistId, youtube, job.id);
    console.log(`[Job ${job.id}] Added video to playlist.`);

    
    // 1. Mark job complete first
    await markJobCompleted(job.id, youtubeVideoId, metadata);
    


    const totalProcessDuration = (Date.now() - processStart) / 1000;
    console.log(`[Job ${job.id}] Total processUpload time: ${totalProcessDuration.toFixed(2)}s.`);
    
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
    const { content, topic, topic_display_name, account_id, question_format } = { ...job.data, ...job };

    const finalTopic = topic_display_name || content?.topic || topic || 'Quiz';

    // --- ENHANCED: Include #Shorts in title for algorithm recognition ---
    let rawTitle = finalTopic;
    // Ensure title ends with #Shorts for discovery
    const title = rawTitle.includes('#Shorts') ? rawTitle.substring(0, 100) : `${rawTitle} #Shorts`.substring(0, 100);

    // --- ENHANCED: Niche-specific + broad hashtags (3-8 optimal) ---
    const hashtagMap: { [key: string]: string } = {
        'english_shots': '#Shorts #LearnEnglish #Vocabulary #EnglishTips #LanguageLearning #FYP #Viral',
        'health_shots': '#Shorts #HealthTips #Wellness #BrainHealth #HealthyLiving #FYP #Viral',
        'ssc_shots': '#Shorts #SSC #GovernmentExam #CompetitiveExams #StudyTips #SSCPreparation #FYP',
        'astronomy_shots': '#Shorts #Space #Astronomy #ScienceFacts #SpaceFacts #Universe #FYP #Viral'
    };
    const finalHashtags = hashtagMap[account_id!] || '#Shorts #Education #Quiz #FYP #Viral #Learning';

    // --- ENHANCED: Include full content in description for SEO ---
    let contentDetails = '';
    if (content) {
        const parts: string[] = [];
        if (content.question) parts.push(`❓ ${content.question}`);
        if (content.options && typeof content.options === 'object') {
            const optionsArray = Object.values(content.options);
            const optionsText = optionsArray.map((opt: any, i: number) =>
                `${String.fromCharCode(65 + i)}) ${opt}`
            ).join('\n');
            parts.push(optionsText);
        }
        if (content.answer) parts.push(`\n✅ Answer: ${content.answer}`);
        if (content.explanation) parts.push(`\n💡 ${content.explanation}`);
        contentDetails = parts.join('\n');
    }

    const playlistLink = playlistId ? `\n\n📺 More ${finalTopic} videos: https://www.youtube.com/playlist?list=${playlistId}` : '';
    const ctaSection = '\n\n🔔 Subscribe for daily educational shorts!\n💬 Drop your answer in comments!\n🔁 Share with friends who need this!';

    const description = contentDetails
        ? `${contentDetails}${playlistLink}${ctaSection}\n\n${finalHashtags}`
        : `${title}${playlistLink}${ctaSection}\n\n${finalHashtags}`;

    // --- ENHANCED: 8-15 tags with niche-specific + trending keywords ---
    const tagMap: { [key: string]: string[] } = {
        'english_shots': ['english', 'vocabulary', 'learn english', 'english grammar', 'spoken english', 'english words', 'language learning', 'esl', 'english tips', 'improve english', 'daily english'],
        'health_shots': ['health', 'wellness', 'health tips', 'brain health', 'eye health', 'healthy lifestyle', 'wellness tips', 'mental health', 'fitness', 'healthcare', 'medical advice'],
        'ssc_shots': ['ssc', 'government exam', 'ssc cgl', 'ssc chsl', 'competitive exams', 'exam preparation', 'study tips', 'government jobs', 'upsc', 'banking', 'ssc gk'],
        'astronomy_shots': ['space', 'astronomy', 'science', 'space facts', 'universe', 'planets', 'nasa', 'cosmos', 'astrophysics', 'science education', 'space exploration']
    };
    const specificTags = tagMap[account_id!] || [finalTopic.toLowerCase(), 'education', 'learning'];

    // Add format-specific tags
    const formatTags = question_format === 'quick_tip' ? ['tips', 'life hacks', 'did you know'] : ['quiz', 'trivia', 'test yourself'];

    return {
        title,
        description,
        tags: ['shorts', 'short', 'youtube shorts', 'education', ...formatTags, ...specificTags].slice(0, 15)
    };
}


export const runtime = 'nodejs';
export const maxDuration = 300;
