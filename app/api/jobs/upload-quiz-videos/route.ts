import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, markJobCompleted, updateJob } from '@/lib/database';
import { google } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { downloadVideoFromCloudinary, deleteVideoFromCloudinary, deleteImageFromCloudinary } from '@/lib/cloudinary';
// Import the new playlist manager
import { findManagedPlaylists, getOrCreatePlaylist } from '@/lib/playlistManager';

// --- RATE LIMITING & CACHING CONFIGURATION ---
const MAX_DAILY_UPLOADS = 20;
const MAX_CONCURRENT_UPLOADS = 3;

// Cache is now more powerful, storing the playlist map for the entire batch.
interface Cache {
  dailyCount: number;
  lastResetDate: string;
  // Use a Map for efficient lookups. Key is canonicalKey, value is playlistId.
  playlistMap: Map<string, string> | null;
}

let memoryCache: Cache = {
  dailyCount: 0,
  lastResetDate: new Date().toDateString(),
  playlistMap: null, // Start as null, fetch on first run.
};

// getCache and setCache functions remain the same...

async function getCache(): Promise<Cache> { return memoryCache; }
async function setCache(cache: Cache): Promise<void> { memoryCache = cache; }


export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting YouTube upload batch...');
    let cache = await getCache();
    const today = new Date().toDateString();

    if (cache.lastResetDate !== today) {
      cache = { dailyCount: 0, lastResetDate: today, playlistMap: null };
      console.log('Daily counters and cache reset.');
    }

    const remainingUploads = MAX_DAILY_UPLOADS - cache.dailyCount;
    if (remainingUploads <= 0) {
      console.log(`Daily upload limit reached (${MAX_DAILY_UPLOADS}).`);
      return NextResponse.json({ success: true, processed: 0, message: 'Daily upload limit reached.' });
    }

    const jobs = await getPendingJobs(4, Math.min(MAX_CONCURRENT_UPLOADS, remainingUploads));
    if (jobs.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No jobs pending YouTube upload.' });
    }
    
    // --- KEY IMPROVEMENT: Initialize YouTube client and fetch playlist map ONCE per batch ---
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    // Note: Refreshing the token inside the loop is inefficient. 
    // It's better to ensure it's valid before starting. A full implementation might check expiry.
    // For simplicity here, we assume the token is valid for the batch duration.
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    // If the playlist map hasn't been fetched for this invocation, fetch it now.
    if (!cache.playlistMap) {
      cache.playlistMap = await findManagedPlaylists(youtube);
    }
    // -----------------------------------------------------------------------------------------

    const processPromises = jobs.map(job => processUpload(job, youtube, cache.playlistMap!));
    const results = await Promise.allSettled(processPromises);
    
    const processedJobs = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => (r as PromiseFulfilledResult<any>).value);
    
    cache.dailyCount += processedJobs.length;
    await setCache(cache);

    console.log(`YouTube upload batch completed. Processed ${processedJobs.length} jobs.`);
    return NextResponse.json({ success: true, processed: processedJobs.length, jobs: processedJobs });

  } catch (error) {
    console.error('YouTube upload batch failed:', error);
    return NextResponse.json({ success: false, error: 'YouTube upload failed' }, { status: 500 });
  }
}

async function processUpload(job: any, youtube: any, playlistMap: Map<string, string>) {
  let tempFile: string | null = null;
  try {
    console.log(`Uploading video for job ${job.id}`);
    
    const videoUrl = job.data.videoUrl;
    if (!videoUrl) throw new Error(`Video URL not found in job data`);
    
    const videoBuffer = await downloadVideoFromCloudinary(videoUrl);
    tempFile = path.join('/tmp', `upload-${uuidv4()}.mp4`);
    await fs.writeFile(tempFile, videoBuffer);

    const metadata = generateVideoMetadata(job.data.question, job.persona, job.category);
    const youtubeVideoId = await uploadToYouTube(tempFile, metadata, youtube);
    
    // Pass the pre-fetched map to the playlist function
    await addVideoToPlaylist(youtubeVideoId, job.persona, job.category, youtube, playlistMap);
    
    await markJobCompleted(job.id, youtubeVideoId, metadata);
    
    // Cleanup Cloudinary assets after successful upload
    await cleanupCloudinaryAssets(job.data);
    
    console.log(`✅ YouTube upload completed for job ${job.id}: https://youtu.be/${youtubeVideoId}`);
    return { id: job.id, youtube_video_id: youtubeVideoId };

  } catch (error) {
    console.error(`❌ Failed to upload video for job ${job.id}:`, error);
    await updateJob(job.id, {
      status: 'failed',
      error_message: `YouTube upload failed: ${(error as Error).message}`
    });
    return null;
  } finally {
    if (tempFile) {
      await fs.unlink(tempFile).catch(e => console.warn(`Failed to delete temp file ${tempFile}:`, e));
    }
  }
}

// Simplified function now takes an initialized client
async function uploadToYouTube(videoPath: string, metadata: any, youtube: any): Promise<string> {
    const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: metadata.title,
                description: metadata.description,
                tags: metadata.tags,
                categoryId: '27', // Education
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

// Updated function uses the new playlistManager
async function addVideoToPlaylist(
  videoId: string,
  persona: string,
  category: string,
  youtube: any,
  playlistMap: Map<string, string>
): Promise<void> {
  const canonicalKey = `${persona}-${category}`.toLowerCase();
  try {
    const playlistId = await getOrCreatePlaylist(youtube, persona, category, playlistMap);

    await youtube.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId: playlistId,
          resourceId: { kind: 'youtube#video', videoId: videoId },
        },
      },
    });
    console.log(`Added video ${videoId} to playlist ${playlistId} (${canonicalKey})`);
  } catch (error) {
    console.error(`Failed to add video ${videoId} to playlist for key "${canonicalKey}":`, error);
  }
}

// generateVideoMetadata function remains the same, but no longer needs jobId
function generateVideoMetadata(question: any, persona: string, category: string) {
  const title = `📚 Vocabulary Quiz: ${question.category_topic || 'Word Power'} | #shorts`;
  const description = `Boost your English vocabulary with this quick challenge! Can you guess the right answer?

${question.question}

Perfect for students, professionals, and anyone preparing for exams like the SAT, GRE, or GMAT.

#Vocabulary #English #WordOfTheDay #LearnEnglish #Shorts #Quiz #Education #TestPrep`;
  const tags = ['vocabulary', 'english', 'quiz', 'shorts', 'education', persona, category, question.category_topic];
  return { title: title.slice(0, 100), description, tags };
}

async function cleanupCloudinaryAssets(jobData: any): Promise<void> {
  try {
    const cleanupPromises = [];
    
    // Cleanup video from Cloudinary
    if (jobData.videoUrl) {
      const videoPublicId = extractPublicIdFromUrl(jobData.videoUrl);
      if (videoPublicId) {
        cleanupPromises.push(
          deleteVideoFromCloudinary(videoPublicId).catch(err => 
            console.warn(`Failed to delete video ${videoPublicId}:`, err)
          )
        );
      }
    }
    
    // Cleanup frames from Cloudinary
    if (jobData.frameUrls && Array.isArray(jobData.frameUrls)) {
      jobData.frameUrls.forEach((frameUrl: string) => {
        const framePublicId = extractPublicIdFromUrl(frameUrl);
        if (framePublicId) {
          cleanupPromises.push(
            deleteImageFromCloudinary(framePublicId).catch(err => 
              console.warn(`Failed to delete frame ${framePublicId}:`, err)
            )
          );
        }
      });
    }
    
    await Promise.allSettled(cleanupPromises);
    console.log(`🧹 Cleaned up Cloudinary assets for uploaded video`);
  } catch (error) {
    console.error('Error during Cloudinary cleanup:', error);
  }
}

function extractPublicIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/([^/]+)\/([^/]+)\/([^.]+)/);
    if (match && match[1] && match[2] && match[3]) {
      return `${match[1]}/${match[2]}/${match[3]}`;
    }
    return null;
  } catch (error) {
    console.warn(`Failed to extract public_id from URL: ${url}`, error);
    return null;
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;