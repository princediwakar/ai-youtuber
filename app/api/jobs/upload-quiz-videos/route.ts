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

    // 1. Check the upload schedule to see what needs to be published now.
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hourOfDay = now.getHours();

    let personasToUpload: string[] = [];

    if (config.DEBUG_MODE) {
      // In debug mode, bypass schedule and allow all personas
      console.log('🐛 DEBUG MODE: Bypassing upload schedule, allowing all personas');
      personasToUpload = []; // Empty array means all personas in getPendingJobs
    } else {
      personasToUpload = UploadSchedule[dayOfWeek]?.[hourOfDay] || [];
      
      // 2. If no personas are scheduled for this hour, exit gracefully.
      if (personasToUpload.length === 0) {
        const message = `No uploads scheduled for this hour (${hourOfDay}:00).`;
        console.log(message);
        return NextResponse.json({ success: true, message });
      }
      
      console.log(`🚀 Found scheduled uploads for this hour: ${personasToUpload.join(', ')}`);
    }

    // 3. Fetch pending jobs for the scheduled personas (or all if debug mode).
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

async function processUpload(job: QuizJob, youtube: youtube_v3.Youtube, playlistMap: Map<string, string>) {
  let tempFile: string | null = null;
  try {
    console.log(`[Job ${job.id}] Starting YouTube upload...`);
    
    const videoUrl = job.data.videoUrl;
    if (!videoUrl) throw new Error(`Video URL not found in job data`);
    
    const videoBuffer = await downloadVideoFromCloudinary(videoUrl);
    tempFile = path.join('/tmp', `upload-${uuidv4()}.mp4`);
    await fs.writeFile(tempFile, videoBuffer);

    // Get playlist ID first so we can include it in metadata
    const playlistId = await getOrCreatePlaylist(youtube, job, playlistMap);
    
    // Generate metadata with playlist link
    const metadata = generateVideoMetadata(job, playlistId);
    
    // Get the first frame URL as thumbnail (question frame)
    const thumbnailUrl = job.data.frameUrls?.[0];
    
    const youtubeVideoId = await uploadToYouTube(tempFile, metadata, youtube, thumbnailUrl);
    
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
    if (tempFile) {
      await fs.unlink(tempFile).catch(e => console.warn(`Failed to delete temp file ${tempFile}:`, e));
    }
  }
}

async function uploadToYouTube(videoPath: string, metadata: any, youtube: youtube_v3.Youtube, thumbnailUrl?: string): Promise<string> {
    const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: metadata.title,
                description: metadata.description,
                tags: metadata.tags,
                categoryId: config.YOUTUBE_CATEGORY_ID,
            },
            status: { privacyStatus: 'unlisted', selfDeclaredMadeForKids: false },
        },
        media: { body: require('fs').createReadStream(videoPath) },
    });

    if (!response.data.id) {
        throw new Error("YouTube API did not return a video ID.");
    }

    // Upload custom thumbnail if provided
    if (thumbnailUrl) {
        try {
            await uploadThumbnailToYouTube(response.data.id, thumbnailUrl, youtube);
            console.log(`✅ Custom thumbnail uploaded for video ${response.data.id}`);
        } catch (error) {
            console.warn(`⚠️ Failed to upload thumbnail for video ${response.data.id}:`, error);
            // Don't fail the entire upload if thumbnail fails
        }
    }

    return response.data.id;
}

async function uploadThumbnailToYouTube(videoId: string, thumbnailUrl: string, youtube: youtube_v3.Youtube): Promise<void> {
    // Download the thumbnail image from Cloudinary
    const response = await fetch(thumbnailUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch thumbnail from ${thumbnailUrl}: ${response.statusText}`);
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    
    // Create a temporary file for the thumbnail
    const tempThumbnailPath = path.join(require('os').tmpdir(), `thumbnail-${videoId}-${Date.now()}.png`);
    await fs.writeFile(tempThumbnailPath, imageBuffer);
    
    try {
        // Upload thumbnail to YouTube
        await youtube.thumbnails.set({
            videoId: videoId,
            media: {
                body: require('fs').createReadStream(tempThumbnailPath),
                mimeType: 'image/png'
            }
        });
    } finally {
        // Clean up temp file
        await fs.unlink(tempThumbnailPath).catch(e => 
            console.warn(`Failed to delete temp thumbnail file ${tempThumbnailPath}:`, e)
        );
    }
}

async function addVideoToPlaylist(
  videoId: string,
  job: QuizJob,
  youtube: youtube_v3.Youtube,
  playlistMap: Map<string, string>,
  playlistId?: string
): Promise<void> {
  try {
    // Use provided playlistId or get/create one
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
  
  // Generate SEO-optimized, viral-worthy title
  const title = generateTitle(job.persona, topic_display_name);
  
  // Generate strategic hashtags for maximum reach
  const hashtags = generateHashtags(job.persona, job.topic);
  
  // Create engaging description with full question content and playlist link
  const description = generateDescription(question, topic_display_name, hashtags, playlistId);
  
  // Optimized tags for YouTube algorithm
  const tags = generateSEOTags(job.persona, job.topic, topic_display_name);
  
  return { title: title.slice(0, 100), description, tags };
}

/**
 * Generates viral-worthy, SEO-optimized titles with dynamic NEET year
 */
function generateTitle(persona: string, topicName: string): string {
  // Calculate target NEET year based on current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based (0 = January, 4 = May)
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

/**
 * Generates strategic hashtags for maximum reach with dynamic year
 */
function generateHashtags(persona: string, category: string): string {
  // Calculate target NEET year based on current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based (0 = January, 4 = May)
  const neetYear = currentMonth < 4 ? currentYear : currentYear + 1;
  
  const baseHashtags = `#shorts #viral #neet #neet${neetYear} #medicalentrance`;
  
  const subjectHashtags: Record<string, string> = {
    neet_physics: '#physics #neetphysics #neetprep #mcq',
    neet_chemistry: '#chemistry #neetchemistry #neetprep #mcq',
    neet_biology: '#biology #neetbiology #neetprep #mcq'
  };
  
  const viralBoosts = '#trending #fyp #foryou #challenge #quiz #education';
  
  return `${baseHashtags} ${subjectHashtags[persona] || ''} ${viralBoosts}`.trim();
}

/**
 * Creates engaging video descriptions with full question content
 */
function generateDescription(question: any, topicName: string, hashtags: string, playlistId?: string): string {
  const hooks = [
    "🤔 Think you can solve this?",
    "⚡ Test your NEET knowledge!",
    "🧠 Only 10% get this right!",
    "🎯 Can you crack this NEET question?"
  ];
  
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
  
  // Build playlist link first to place it at the top
  const playlistLink = playlistId ? 
    `📺 For more questions on ${topicName}, check out the full playlist:\nhttps://youtube.com/playlist?list=${playlistId}\n\n-------------------------------------------------\n` : '';

  // Build options string
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
/**
 * Generates SEO-optimized tags for YouTube algorithm with dynamic year
 */
function generateSEOTags(persona: string, category: string, topicName: string): string[] {
  // Calculate target NEET year based on current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based (0 = January, 4 = May)
  const neetYear = currentMonth < 4 ? currentYear : currentYear + 1;
  
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
  
  // Remove duplicates and return unique tags
  return [...new Set(allTags)].filter(Boolean);
}

// Legacy functions removed - replaced with optimized SEO functions above

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
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.warn(`Failed to extract public_id from URL: ${url}`, error);
    return null;
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;