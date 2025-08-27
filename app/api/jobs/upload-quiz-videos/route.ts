// app/api/jobs/upload-quiz-videos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, markJobCompleted, updateJob } from '@/lib/database';
import { google } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// --- RATE LIMITING & CACHING CONFIGURATION ---

const MAX_DAILY_UPLOADS = 20;
const MAX_CONCURRENT_UPLOADS = 3;

// **FIX**: Use a file-based cache to simulate a persistent store like Redis.
// This is crucial for a serverless environment to share state across invocations.
const CACHE_FILE_PATH = path.join('/tmp', 'youtube_upload_cache.json');

interface Cache {
  dailyCount: number;
  lastResetDate: string;
  playlistIds: Record<string, string>; // e.g., { "vocabulary-english": "PL..." }
}

/**
 * Reads the cache from the file system.
 */
async function getCache(): Promise<Cache> {
  try {
    const data = await fs.readFile(CACHE_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return a default cache object.
    return { dailyCount: 0, lastResetDate: new Date().toDateString(), playlistIds: {} };
  }
}

/**
 * Writes the updated cache state to the file system.
 */
async function setCache(cache: Cache): Promise<void> {
  await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(cache, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting YouTube upload batch...');
    let cache = await getCache();
    const today = new Date().toDateString();

    // Reset daily counter if it's a new day
    if (cache.lastResetDate !== today) {
      cache.dailyCount = 0;
      cache.lastResetDate = today;
      console.log('Daily upload counter reset.');
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

    const processPromises = jobs.map(job => processUpload(job, cache));
    const results = await Promise.allSettled(processPromises);
    
    const processedJobs = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => (r as PromiseFulfilledResult<any>).value);
    
    // Update the daily count in the cache after the batch is done.
    cache.dailyCount += processedJobs.length;
    await setCache(cache);

    console.log(`YouTube upload batch completed. Processed ${processedJobs.length} jobs.`);
    return NextResponse.json({ success: true, processed: processedJobs.length, jobs: processedJobs });

  } catch (error) {
    console.error('YouTube upload batch failed:', error);
    return NextResponse.json({ success: false, error: 'YouTube upload failed' }, { status: 500 });
  }
}

/**
 * Processes a single video upload.
 * @param job - The job to process.
 * @param cache - The shared cache object (passed by reference to update).
 */
async function processUpload(job: any, cache: Cache) {
  let tempFile: string | null = null;
  try {
    console.log(`Uploading video for job ${job.id}`);

    // **FIX**: Use async file reading.
    if (!job.data.videoPath || !(await fs.stat(job.data.videoPath).catch(() => false))) {
        throw new Error(`Video file not found at path: ${job.data.videoPath}`);
    }
    const videoBuffer = await fs.readFile(job.data.videoPath);

    // Write buffer to a temporary file for the Google API client
    tempFile = path.join('/tmp', `upload-${uuidv4()}.mp4`);
    await fs.writeFile(tempFile, videoBuffer);

    const metadata = generateVideoMetadata(job.data.question, job.persona, job.category, job.id);
    const youtubeVideoId = await uploadToYouTube(tempFile, metadata);
    
    await addVideoToPlaylists(youtubeVideoId, job.persona, job.category, cache);
    await markJobCompleted(job.id, youtubeVideoId, metadata);
    
    console.log(`✅ YouTube upload completed for job ${job.id}: https://youtube.com/watch?v=${youtubeVideoId}`);
    return { id: job.id, youtube_video_id: youtubeVideoId };

  } catch (error) {
    console.error(`❌ Failed to upload video for job ${job.id}:`, error);
    await updateJob(job.id, {
      status: 'failed',
      error_message: `YouTube upload failed: ${(error as Error).message}`
    });
    return null;
  } finally {
    // **FIX**: Ensure temporary files are always cleaned up.
    if (tempFile) {
      await fs.unlink(tempFile).catch(e => console.warn(`Failed to delete temp file ${tempFile}:`, e));
    }
  }
}

async function uploadToYouTube(videoPath: string, metadata: any): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

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


async function addVideoToPlaylists(videoId: string, persona: string, category: string, cache: Cache): Promise<void> {
  const playlistKey = `${persona}-${category}`;
  try {
    // **FIX**: Use the cache to get the playlist ID.
    let playlistId = cache.playlistIds[playlistKey];
    
    if (!playlistId) {
      console.log(`Playlist ID for "${playlistKey}" not in cache. Fetching from YouTube...`);
      playlistId = await getOrCreatePlaylist(persona, category);
      cache.playlistIds[playlistKey] = playlistId; // Store in cache for next time
      await setCache(cache); // Persist the updated cache
    } else {
      console.log(`Using cached playlist ID for "${playlistKey}": ${playlistId}`);
    }

    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    await youtube.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId: playlistId,
          resourceId: { kind: 'youtube#video', videoId: videoId },
        },
      },
    });
    console.log(`Added video ${videoId} to playlist ${playlistId}`);
  } catch (error) {
    console.error(`Failed to add video ${videoId} to playlist "${playlistKey}":`, error);
    // Non-fatal error, so we don't throw.
  }
}

async function getOrCreatePlaylist(persona: string, category: string): Promise<string> {
    const playlistTitle = `📚 ${persona.charAt(0).toUpperCase() + persona.slice(1)} Quizzes (${category})`;
    const playlistDescription = `A collection of short quiz videos for ${persona} in the ${category} category.`;
    
    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.playlists.list({ part: ['snippet'], mine: true, maxResults: 50 });
    const existingPlaylist = response.data.items?.find(p => p.snippet?.title === playlistTitle);

    if (existingPlaylist?.id) {
        return existingPlaylist.id;
    }

    const newPlaylist = await youtube.playlists.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: { title: playlistTitle, description: playlistDescription },
            status: { privacyStatus: 'public' },
        },
    });

    if (!newPlaylist.data.id) {
        throw new Error("Failed to create a new playlist.");
    }
    return newPlaylist.data.id;
}


function generateVideoMetadata(question: any, persona: string, category: string, jobId: string) {
  const title = `📚 Vocabulary Quiz: ${question.category_topic || 'Word Power'} | #shorts`;
  const description = `Boost your English vocabulary with this quick challenge! Can you guess the right answer?

${question.question}

Perfect for students, professionals, and anyone preparing for exams like the SAT, GRE, or GMAT.

#Vocabulary #English #WordOfTheDay #LearnEnglish #Shorts #Quiz #Education #TestPrep`;
  const tags = ['vocabulary', 'english', 'quiz', 'shorts', 'education', persona, category, question.category_topic];
  return { title: title.slice(0, 100), description, tags };
}

export const runtime = 'nodejs';
export const maxDuration = 300;
