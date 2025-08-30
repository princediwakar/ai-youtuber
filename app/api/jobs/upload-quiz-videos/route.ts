// app/api/jobs/upload-quiz-videos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, markJobCompleted, updateJob } from '@/lib/database';
import { google, youtube_v3 } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { downloadVideoFromCloudinary, deleteVideoFromCloudinary, deleteImageFromCloudinary } from '@/lib/cloudinary';
import { findManagedPlaylists, getOrCreatePlaylist } from '@/lib/playlistManager';
import { QuizJob } from '@/lib/types';
import { config } from '@/lib/config';
import { getOAuth2Client } from '@/lib/googleAuth';
import { UploadSchedule } from '@/lib/uploadSchedule';

// The in-memory cache for the playlist map
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

    const now = new Date();
    const dayOfWeek = now.getDay();
    const hourOfDay = now.getHours();

    let personasToUpload: string[] = [];

    if (config.DEBUG_MODE) {
      console.log('🐛 DEBUG MODE: Bypassing upload schedule, allowing all personas');
      personasToUpload = [];
    } else {
      personasToUpload = UploadSchedule[dayOfWeek]?.[hourOfDay] || [];
      
      if (personasToUpload.length === 0) {
        const message = `No uploads scheduled for this hour (${hourOfDay}:00).`;
        console.log(message);
        return NextResponse.json({ success: true, message });
      }
      
      console.log(`🚀 Found scheduled uploads for this hour: ${personasToUpload.join(', ')}`);
    }

    const jobs = await getPendingJobs(4, config.UPLOAD_CONCURRENCY, personasToUpload.length > 0 ? personasToUpload : undefined);
    if (jobs.length === 0) {
      const message = config.DEBUG_MODE 
        ? `No videos ready for upload (debug mode - all personas allowed).`
        : `No videos ready for upload for scheduled personas.`;
      return NextResponse.json({ success: true, message });
    }
    
    const cache = await getCache();
    const oauth2Client = getOAuth2Client();
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    if (!cache.playlistMap) {
      cache.playlistMap = await findManagedPlaylists(youtube);
      await setCache(cache);
    }

    const processPromises = jobs.map(job => processUpload(job, youtube, cache.playlistMap!));
    const results = await Promise.allSettled(processPromises);
    
    const successfulJobs = results.filter(r => r.status === 'fulfilled' && r.value).length;

    const personaMessage = config.DEBUG_MODE 
      ? 'all personas (debug mode)' 
      : personasToUpload.join(', ');
    console.log(`YouTube upload batch completed. Processed ${successfulJobs} jobs for: ${personaMessage}.`);
    return NextResponse.json({ success: true, processed: successfulJobs });

  } catch (error) {
    console.error('YouTube upload batch failed:', error);
    return NextResponse.json({ success: false, error: 'YouTube upload failed' }, { status: 500 });
  }
}

// 💡 FIX: This function is completely rewritten for optimization.
async function processUpload(job: QuizJob, youtube: youtube_v3.Youtube, playlistMap: Map<string, string>) {
  let tempVideoFile: string | null = null;
  let tempThumbnailFile: string | null = null;

  try {
    console.log(`[Job ${job.id}] Starting YouTube upload...`);
    
    const videoUrl = job.data.videoUrl;
    const thumbnailUrl = job.data.frameUrls?.[0];

    if (!videoUrl || !thumbnailUrl) {
      throw new Error(`[Job ${job.id}] Video or Thumbnail URL not found in job data`);
    }

    // 💡 FIX: Download video and thumbnail in parallel to save time.
    console.log(`[Job ${job.id}] Downloading assets from Cloudinary in parallel...`);
    const [videoBuffer, imageBuffer] = await Promise.all([
      downloadVideoFromCloudinary(videoUrl),
      fetch(thumbnailUrl).then(res => {
        if (!res.ok) throw new Error(`Failed to fetch thumbnail: ${res.statusText}`);
        return res.arrayBuffer().then(Buffer.from);
      })
    ]);

    // Create temporary local files for both assets.
    tempVideoFile = path.join('/tmp', `upload-${uuidv4()}.mp4`);
    tempThumbnailFile = path.join('/tmp', `thumbnail-${uuidv4()}.png`);
    await fs.writeFile(tempVideoFile, videoBuffer);
    await fs.writeFile(tempThumbnailFile, imageBuffer);
    console.log(`[Job ${job.id}] Assets saved to temporary files.`);
    
    const playlistId = await getOrCreatePlaylist(youtube, job, playlistMap);
    const metadata = generateVideoMetadata(job, playlistId);
    
    // Upload the video from its local file.
    const youtubeVideoId = await uploadToYouTube(tempVideoFile, metadata, youtube);
    
    // Set the thumbnail from its local file.
    await setThumbnailWithRetry(youtubeVideoId, tempThumbnailFile, youtube);
    
    await addVideoToPlaylist(youtubeVideoId, job, youtube, playlistMap, playlistId);
    await markJobCompleted(job.id, youtubeVideoId, metadata);
    await cleanupCloudinaryAssets(job.data);
    
    console.log(`[Job ${job.id}] ✅ YouTube upload successful: https://youtu.be/${youtubeVideoId}`);
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
    // Clean up both temporary files.
    if (tempVideoFile) {
      await fs.unlink(tempVideoFile).catch(e => console.warn(`Failed to delete temp video file ${tempVideoFile}:`, e));
    }
    if (tempThumbnailFile) {
      await fs.unlink(tempThumbnailFile).catch(e => console.warn(`Failed to delete temp thumbnail file ${tempThumbnailFile}:`, e));
    }
  }
}

// 💡 FIX: This function is simplified. It no longer handles thumbnails.
async function uploadToYouTube(videoPath: string, metadata: any, youtube: youtube_v3.Youtube): Promise<string> {
    console.log(`Uploading video from ${videoPath} to YouTube...`);
    const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: metadata.title,
                description: metadata.description,
                tags: metadata.tags,
                categoryId: config.YOUTUBE_CATEGORY_ID,
            },
            status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
        },
        media: { body: require('fs').createReadStream(videoPath) },
    });

    if (!response.data.id) {
        throw new Error("YouTube API did not return a video ID.");
    }
    console.log(`Video upload started successfully. Video ID: ${response.data.id}`);
    return response.data.id;
}

// 💡 FIX: New helper function for delays.
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 💡 FIX: New "manager" function for robustly setting the thumbnail.
async function setThumbnailWithRetry(videoId: string, thumbnailPath: string, youtube: youtube_v3.Youtube) {
  // Using tuned parameters for a ~30s timeout environment: 3 attempts, 2s delay.
  const retries = 3;
  const delay = 2000;

  for (let i = 0; i < retries; i++) {
    try {
      await uploadThumbnailToYouTube(videoId, thumbnailPath, youtube);
      console.log(`[Video ${videoId}] ✅ Custom thumbnail uploaded on attempt ${i + 1}.`);
      return; // Success, exit the loop.
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (i < retries - 1) {
        console.warn(`[Video ${videoId}] ⚠️ Thumbnail upload attempt ${i + 1} failed. Retrying in ${delay / 1000}s... Error: ${errorMessage}`);
        await sleep(delay);
      } else {
        console.error(`[Video ${videoId}] ❌ Failed to upload thumbnail after ${retries} attempts. The video will use a default thumbnail. Error: ${errorMessage}`);
        // Do not throw error, allow the job to complete.
      }
    }
  }
}

// 💡 FIX: This "worker" function now accepts a file path, not a URL.
async function uploadThumbnailToYouTube(videoId: string, thumbnailPath: string, youtube: youtube_v3.Youtube): Promise<void> {
    await youtube.thumbnails.set({
        videoId: videoId,
        media: {
            body: require('fs').createReadStream(thumbnailPath),
            mimeType: 'image/png'
        }
    });
}

async function addVideoToPlaylist(
  videoId: string,
  job: QuizJob,
  youtube: youtube_v3.Youtube,
  playlistMap: Map<string, string>,
  playlistId?: string
): Promise<void> {
  try {
    const finalPlaylistId = playlistId || await getOrCreatePlaylist(youtube, job, playlistMap);
    await youtube.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId: finalPlaylistId,
          resourceId: { kind: 'youtube#video', videoId: videoId },
        },
      },
    });
    console.log(`[Job ${job.id}] Added video to playlist ${finalPlaylistId}`);
  } catch (error) {
    console.error(`[Job ${job.id}] Failed to add video to playlist:`, error);
  }
}

function generateVideoMetadata(job: QuizJob, playlistId?: string) {
  const { question } = job.data;
  const topic_display_name = job.topic_display_name || job.data.topic_display_name;
  
  const title = generateTitle(job.persona, topic_display_name);
  const hashtags = generateHashtags(job.persona, job.topic);
  const description = generateDescription(question, topic_display_name, hashtags, playlistId);
  const tags = generateSEOTags(job.persona, job.topic, topic_display_name);
  
  return { title: title.slice(0, 100), description, tags };
}

function generateTitle(persona: string, topicName: string): string {
  const now = new Date(); // Current date: August 30, 2025
  const currentYear = now.getFullYear(); // 2025
  const currentMonth = now.getMonth(); // 7 (August)
  // Since 7 is not < 4, neetYear will be 2025 + 1 = 2026. This is correct.
  const neetYear = currentMonth < 4 ? currentYear : currentYear + 1;
  
  const titleTemplates: Record<string, string[]> = {
    neet_physics: [
      `🚀 NEET Physics Challenge | ${topicName}`,
      `⚡ Can You Solve This NEET Physics? | ${topicName}`,
      `🧠 NEET Physics Quiz That 90% Fail | ${topicName}`,
      `🎯 NEET ${neetYear} Physics | ${topicName} MCQ`
    ],
    neet_chemistry: [
      `⚗️ NEET Chemistry Challenge | ${topicName}`,
      `🔬 Can You Solve This NEET Chemistry? | ${topicName}`,
      `🧪 NEET Chemistry Quiz That 90% Fail | ${topicName}`,
      `🎯 NEET ${neetYear} Chemistry | ${topicName} MCQ`
    ],
    neet_biology: [
      `🧬 NEET Biology Challenge | ${topicName}`,
      `🔬 Can You Solve This NEET Biology? | ${topicName}`,
      `🧠 NEET Biology Quiz That 90% Fail | ${topicName}`,
      `🎯 NEET ${neetYear} Biology | ${topicName} MCQ`
    ]
  };
  
  const templates = titleTemplates[persona] || [`📚 NEET Quiz | ${topicName}`];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateHashtags(persona: string, category: string): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const neetYear = currentMonth < 4 ? currentYear : currentYear + 1; // Correctly calculates 2026
  
  const baseHashtags = `#shorts #viral #neet #neet${neetYear} #medicalentrance`;
  const subjectHashtags: Record<string, string> = {
    neet_physics: '#physics #neetphysics #neetprep #mcq',
    neet_chemistry: '#chemistry #neetchemistry #neetprep #mcq',
    neet_biology: '#biology #neetbiology #neetprep #mcq'
  };
  const viralBoosts = '#trending #fyp #foryou #challenge #quiz #education';
  
  return `${baseHashtags} ${subjectHashtags[persona] || ''} ${viralBoosts}`.trim();
}

function generateDescription(question: any, topicName: string, hashtags: string, playlistId?: string): string {
  const hooks = [
    "🤔 Think you can solve this?",
    "⚡ Test your NEET knowledge!",
    "🧠 Only 10% get this right!",
    "🎯 Can you crack this NEET question?"
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
  const playlistLink = playlistId ? 
    `📺 For more questions on ${topicName}, check out the full playlist:\nhttps://www.youtube.com/playlist?list=${playlistId}\n\n-------------------------------------------------\n` : '';
  const optionsText = question.options ? 
    Object.entries(question.options).map(([key, value]) => `${key}) ${value}`).join('\n') : '';
  
  return `${hook}\n${playlistLink}📚 QUESTION:
${question.question}

🔤 OPTIONS:
${optionsText}

✅ ANSWER: 
The correct answer is revealed in the video!

💡 EXPLANATION:
${question.explanation || 'Watch the video for a detailed explanation!'}

🏆 Join 50,000+ NEET aspirants using our MCQs to crack medical entrance!

🎯 BOOST YOUR PREP:
💡 Comment your answer below - let's discuss!
🔔 Subscribe for daily NEET MCQs & PYQs!
⚡ Share with your NEET preparation friends!

${hashtags}`;
}

function generateSEOTags(persona: string, category: string, topicName: string): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const neetYear = currentMonth < 4 ? currentYear : currentYear + 1; // Correctly calculates 2026
  
  const baseTags = ['neet', `neet ${neetYear}`, 'medical entrance', 'mcq', 'quiz', 'shorts', 'viral', 'education'];
  const subjectTags: Record<string, string[]> = {
    neet_physics: ['physics', 'neet physics', 'physics mcq', 'neet physics questions'],
    neet_chemistry: ['chemistry', 'neet chemistry', 'chemistry mcq', 'neet chemistry questions'],
    neet_biology: ['biology', 'neet biology', 'biology mcq', 'neet biology questions']
  };
  const categoryTag = category.toLowerCase();
  const topicTag = topicName.toLowerCase();
  
  const allTags = [
    ...baseTags,
    ...(subjectTags[persona] || []),
    categoryTag,
    topicTag,
    'challenge',
    'test prep',
    'study tips'
  ];
  
  return [...new Set(allTags)].filter(Boolean);
}

async function cleanupCloudinaryAssets(jobData: any): Promise<void> {
  try {
    const cleanupPromises = [];
    if (jobData.videoUrl) {
      const videoPublicId = extractPublicIdFromUrl(jobData.videoUrl);
      if (videoPublicId) {
        cleanupPromises.push(deleteVideoFromCloudinary(videoPublicId).catch(err => console.warn(`Failed to delete video ${videoPublicId}:`, err)));
      }
    }
    if (jobData.frameUrls && Array.isArray(jobData.frameUrls)) {
      jobData.frameUrls.forEach((frameUrl: string) => {
        const framePublicId = extractPublicIdFromUrl(frameUrl);
        if (framePublicId) {
          cleanupPromises.push(deleteImageFromCloudinary(framePublicId).catch(err => console.warn(`Failed to delete frame ${framePublicId}:`, err)));
        }
      });
    }
    await Promise.allSettled(cleanupPromises);
    console.log(`🧹 Cleaned up Cloudinary assets for job`);
  } catch (error) {
    console.error('Error during Cloudinary cleanup:', error);
  }
}

function extractPublicIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/v[0-9]+\/(.+?)(?:\.[\w]+)?$/);
    return (match && match[1]) ? match[1] : null;
  } catch (error) {
    console.warn(`Failed to extract public_id from URL: ${url}`, error);
    return null;
  }
}

export const runtime = 'nodejs';
// Note: You mentioned a 30s timeout. This setting attempts to override that to 300s (5 minutes).
// Ensure your deployment platform (e.g., Vercel Pro/Enterprise) supports this override.
// On Vercel Hobby, API routes timeout after 10-60s regardless of this setting.
export const maxDuration = 300;