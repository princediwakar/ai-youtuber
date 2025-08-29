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

    const metadata = generateVideoMetadata(job);
    
    // Get the first frame URL as thumbnail (question frame)
    const thumbnailUrl = job.data.frameUrls?.[0];
    
    const youtubeVideoId = await uploadToYouTube(tempFile, metadata, youtube, thumbnailUrl);
    
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
            status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
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
  const { question } = job.data;
  // Use display names from job properties first, then fallback to data properties  
  const topic_display_name = job.topic_display_name || job.data.topic_display_name;
  const category_display_name = job.category_display_name || job.data.category_display_name;
  const title = `▶️ ${topic_display_name || category_display_name} Quiz | #shorts #${job.persona}`;
  
  // Generate viral and relevant hashtags
  const viralHashtags = [
    '#viral', '#trending', '#fyp', '#foryou', '#explore', '#shorts', 
    '#quiz', '#challenge', '#learn', '#education', '#study', '#test'
  ];
  
  const personaSpecificHashtags = generatePersonaHashtags(job.persona);
  const categoryHashtags = generateCategoryHashtags(job.category, topic_display_name);
  
  const description = `Test your knowledge with this quick challenge on ${topic_display_name}! 🧠💡
  
${question.question}

A) ${question.options.A}
B) ${question.options.B}
C) ${question.options.C}
D) ${question.options.D}

📚 Answer in the comments below! 
🔔 Follow for more educational content!

${viralHashtags.slice(0, 8).join(' ')} ${personaSpecificHashtags.join(' ')} ${categoryHashtags.join(' ')}`;
  
  const tags = [
    job.persona, job.category, topic_display_name, 
    'quiz', 'shorts', 'education', 'viral', 'trending',
    'study', 'learn', 'challenge', 'test'
  ];
  
  return { title: title.slice(0, 100), description, tags: [...new Set(tags)].filter(Boolean) as string[] };
}

function generatePersonaHashtags(persona: string): string[] {
  const personaHashtagMap: Record<string, string[]> = {
    'english_learning': [
      '#EnglishLearning', '#ESL', '#Grammar', '#Vocabulary', '#EnglishQuiz',
      '#LearnEnglish', '#EnglishTips', '#LanguageLearning', '#EnglishTest'
    ],
    'cricket_trivia': [
      '#Cricket', '#CricketTrivia', '#CricketQuiz', '#IPL', '#WorldCup',
      '#CricketFacts', '#CricketRecords', '#CricketLovers', '#CricketFever'
    ],
    'psychology_facts': [
      '#Psychology', '#PsychologyFacts', '#MindTricks', '#BodyLanguage', '#HumanBehavior',
      '#MentalHealth', '#BrainScience', '#PsychologyQuiz', '#MindReading'
    ],
    'historical_facts': [
      '#History', '#HistoryFacts', '#HistoryQuiz', '#Inventions', '#HistoricalEvents',
      '#WorldHistory', '#Legends', '#HistoryLovers', '#AncientHistory'
    ],
    'geography_travel': [
      '#Geography', '#Travel', '#Countries', '#WorldExplorer', '#TravelFacts',
      '#GeographyQuiz', '#TravelTrivia', '#WorldKnowledge', '#Landmarks'
    ],
    'science_facts': [
      '#Science', '#ScienceFacts', '#ScienceQuiz', '#Space', '#Nature',
      '#ScienceLovers', '#STEM', '#Discovery', '#Universe', '#Animals'
    ],
    'technology_facts': [
      '#Technology', '#TechFacts', '#AI', '#DigitalWorld', '#TechQuiz',
      '#Innovation', '#FutureTech', '#TechTrends', '#TechLovers'
    ]
  };
  
  return personaHashtagMap[persona] || [`#${persona}`];
}

function generateCategoryHashtags(category: string, topicDisplayName?: string): string[] {
  const hashtags: string[] = [];
  
  // Category-specific hashtags
  const categoryHashtagMap: Record<string, string[]> = {
    'vocabulary': ['#WordMeaning', '#Synonyms', '#Antonyms', '#Words', '#Dictionary'],
    'grammar': ['#GrammarRules', '#Tenses', '#Sentence', '#PartsOfSpeech', '#Punctuation'],
    'records': ['#Records', '#CricketRecords', '#SportRecords', '#Champions', '#Legends'],
    'tournaments': ['#Tournament', '#Championship', '#Competition', '#WorldCup', '#IPL'],
    'body_language': ['#BodyLanguage', '#Gestures', '#FacialExpressions', '#Communication'],
    'human_behavior': ['#HumanBehavior', '#Psychology', '#MindScience', '#BrainFacts'],
    'inventions': ['#Inventions', '#Innovation', '#Discovery', '#History', '#Inventors'],
    'historical_events': ['#HistoricalEvents', '#History', '#WorldEvents', '#Timeline'],
    'countries': ['#Countries', '#World', '#Geography', '#Nations', '#Culture'],
    'travel_facts': ['#Travel', '#TravelFacts', '#WorldFacts', '#Culture', '#Adventure'],
    'space': ['#Space', '#Universe', '#Planets', '#Astronomy', '#SpaceExploration'],
    'nature': ['#Nature', '#Animals', '#Plants', '#Wildlife', '#Environment'],
    'internet': ['#Internet', '#Digital', '#Technology', '#SocialMedia', '#Web'],
    'innovations': ['#Innovation', '#Technology', '#AI', '#FutureTech', '#TechBreakthroughs']
  };
  
  hashtags.push(...(categoryHashtagMap[category] || [`#${category}`]));
  
  // Topic-specific hashtags
  if (topicDisplayName) {
    const topicWords = topicDisplayName.split(' ');
    topicWords.forEach(word => {
      if (word.length > 3) {
        hashtags.push(`#${word.replace(/[^a-zA-Z]/g, '')}`);
      }
    });
  }
  
  return hashtags.slice(0, 5); // Limit to 5 category hashtags
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
