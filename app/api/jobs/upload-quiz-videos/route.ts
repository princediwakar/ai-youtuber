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

    const personasToUpload = UploadSchedule[dayOfWeek]?.[hourOfDay];

    // 2. If no personas are scheduled for this hour, exit gracefully.
    if (!personasToUpload || personasToUpload.length === 0) {
      const message = `No uploads scheduled for this hour (${hourOfDay}:00).`;
      console.log(message);
      return NextResponse.json({ success: true, message });
    }

    console.log(`🚀 Found scheduled uploads for this hour: ${personasToUpload.join(', ')}`);

    // 3. Fetch pending jobs ONLY for the scheduled personas.
    const jobs = await getPendingJobs(4, config.UPLOAD_CONCURRENCY, personasToUpload);
    if (jobs.length === 0) {
      return NextResponse.json({ success: true, message: `No videos ready for upload for scheduled personas.` });
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

    console.log(`YouTube upload batch completed. Processed ${successfulJobs} jobs for: ${personasToUpload.join(', ')}.`);
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

    const metadata = generateVideoMetadata(job);
    const youtubeVideoId = await uploadToYouTube(tempFile, metadata, youtube);
    
    await addVideoToPlaylist(youtubeVideoId, job, youtube, playlistMap);
    
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

async function uploadToYouTube(videoPath: string, metadata: any, youtube: youtube_v3.Youtube): Promise<string> {
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
    return response.data.id;
}

async function addVideoToPlaylist(
  videoId: string,
  job: QuizJob,
  youtube: youtube_v3.Youtube,
  playlistMap: Map<string, string>
): Promise<void> {
  try {
    const playlistId = await getOrCreatePlaylist(youtube, job, playlistMap);
    await youtube.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId: playlistId,
          resourceId: { kind: 'youtube#video', videoId: videoId },
        },
      },
    });
    console.log(`[Job ${job.id}] Added video to playlist ${playlistId}`);
  } catch (error) {
    console.error(`[Job ${job.id}] Failed to add video to playlist:`, error);
  }
}

function generateVideoMetadata(job: QuizJob) {
  const { question, topic_display_name, category_display_name } = job.data;
  const title = `▶️ ${topic_display_name || category_display_name} Quiz | #shorts #${job.persona}`;
  const description = `Test your knowledge with this quick challenge on ${topic_display_name}!
  
${question.question}

A) ${question.options.A}
B) ${question.options.B}
C) ${question.options.C}
D) ${question.options.D}

#${job.persona} #${job.category} #${topic_display_name?.replace(/\s/g, '')} #Quiz #Education`;
  
  const tags = [job.persona, job.category, topic_display_name, 'quiz', 'shorts', 'education'];
  return { title: title.slice(0, 100), description, tags: [...new Set(tags)].filter(Boolean) as string[] };
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
