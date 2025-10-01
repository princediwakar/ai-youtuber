// app/api/jobs/upload-quiz-videos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, markJobCompleted, updateJob, autoRetryFailedJobs } from '@/lib/database';
import { google, youtube_v3 } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { downloadVideoFromCloudinary, deleteVideoFromCloudinary, deleteImageFromCloudinary } from '@/lib/cloudinary';
import { findManagedPlaylists, getOrCreatePlaylist } from '@/lib/playlistManager';
import { QuizJob } from '@/lib/types';
import { config } from '@/lib/config';
import { getOAuth2Client } from '@/lib/googleAuth';
import { getScheduledPersonasForUpload } from '@/lib/schedule';
import { getAccountConfig } from '@/lib/accounts';

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

    // Process directly - await the work to keep function alive
    try {
      await processCompleteUploadFlow(accountId);
      return NextResponse.json({ 
        success: true, 
        accountId: accountId || 'multiple',
        message: 'Upload processing completed successfully'
      });
    } catch (error) {
      console.error('Upload processing failed:', error);
      return NextResponse.json({ 
        success: false, 
        accountId: accountId || 'multiple',
        message: 'Upload processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('YouTube upload batch failed:', error);
    return NextResponse.json({ success: false, error: 'YouTube upload failed' }, { status: 500 });
  }
}

/**
 * Complete upload flow including all validations moved to background.
 * Runs asynchronously without blocking the API response.
 */
async function processCompleteUploadFlow(accountId: string | undefined) {
  try {
    console.log(`🔄 Background upload flow started for account: ${accountId || 'multiple'}`);

    // Validate account exists if accountId is provided (moved to background)
    let account;
    if (accountId) {
      try {
        account = await getAccountConfig(accountId);
        console.log(`[upload-quiz-videos] Retrieved account ${accountId}:`, {
          name: account.name,
          personas: account.personas,
          personasType: typeof account.personas,
          personasLength: account.personas?.length
        });
      } catch (error) {
        console.error(`❌ Invalid accountId in background: ${accountId}`, error);
        return;
      }
    }

    // Handle schedule logic based on whether accountId is provided
    let personasToUpload: string[] = [];
    
    if (!accountId) {
      // No accountId provided - process all accounts (backward compatibility)
      console.log('No accountId provided - processing all pending jobs');
    } else {
      // AccountId provided - check schedule for that specific account
      const now = new Date();
      // Convert to IST (UTC + 5:30)
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const dayOfWeek = istTime.getDay(); // 0 for Sunday, 1 for Monday, etc.
      const hourOfDay = istTime.getHours();

      if (config.DEBUG_MODE) {
        // In debug mode, bypass schedule and allow account-specific personas
        console.log(`🐛 DEBUG MODE: Bypassing ${account!.name} upload schedule, allowing account personas`);
        personasToUpload = Array.isArray(account!.personas) ? account!.personas : []; // Ensure it's an array
        if (personasToUpload.length === 0) {
          console.log(`⚠️  DEBUG MODE: Account ${accountId} has no personas defined`);
          return;
        }
      } else {
        personasToUpload = getScheduledPersonasForUpload(accountId, dayOfWeek, hourOfDay) || [];
        
        // 2. If no personas are scheduled for this hour, exit gracefully.
        if (personasToUpload.length === 0) {
          const message = `No ${account!.name} uploads scheduled for this hour (${hourOfDay}:00).`;
          console.log(message);
          return;
        }
        
        console.log(`🚀 Found scheduled ${account!.name} uploads for this hour: ${personasToUpload.join(', ')}`);
      }
    }

    if (accountId) {
      console.log(`📋 Personas to upload: ${personasToUpload.join(', ')} (${personasToUpload.length} personas)`);

      // Ensure personasToUpload is always an array when accountId is provided
      if (!Array.isArray(personasToUpload)) {
        console.error(`❌ personasToUpload is not an array:`, personasToUpload);
        return;
      }
    }

    // Process uploads
    await processUploadWithValidation(accountId, personasToUpload, account);

  } catch (error) {
    console.error(`❌ Background complete upload flow failed for ${accountId}:`, error);
  }
}

/**
 * Background processing function that includes validation and upload processing.
 * Runs asynchronously without blocking the API response.
 */
async function processUploadWithValidation(accountId: string | undefined, personasToUpload: string[], account?: any) {
  try {
    console.log(`🔄 Background upload processing started for account: ${accountId || 'multiple'}`);

    // 3. Auto-retry failed jobs with valid data (moved to background)
    await autoRetryFailedJobs();
    
    // 4. Fetch pending jobs - filter by account and personas if specified
    let jobs = await getPendingJobs(4, config.UPLOAD_CONCURRENCY, personasToUpload.length > 0 ? personasToUpload : undefined);
    
    // Filter by accountId if provided
    if (accountId) {
      jobs = jobs.filter(job => job.account_id === accountId);
    }
    
    if (jobs.length === 0) {
      const message = accountId ? 
        `No videos ready for upload for account ${accountId}` :
        'No videos ready for upload';
      console.log(message);
      return;
    }

    console.log(`Found ${jobs.length} jobs for upload. Processing...`);

    // Process uploads
    await processUploadInBackground(jobs, accountId, account || null, personasToUpload);

  } catch (error) {
    console.error(`❌ Background upload validation/processing failed for ${accountId}:`, error);
  }
}

/**
 * Background processing function for YouTube uploads.
 * Runs asynchronously without blocking the API response.
 */
async function processUploadInBackground(
  jobs: QuizJob[], 
  accountId: string | undefined, 
  account: any, 
  personasToUpload: string[]
) {
  try {
    console.log(`🔄 Background upload processing started for ${jobs.length} jobs`);

    const cache = await getCache();
    
    // Process jobs by account - group by account_id to handle OAuth clients properly
    const jobsByAccount = new Map<string, QuizJob[]>();
    jobs.forEach(job => {
      const jobAccountId = job.account_id || 'english_shots'; // fallback for legacy jobs
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

    const accountName = account && typeof account.name === 'string' ? account.name : (accountId || 'unknown');
    const message = accountId 
      ? (config.DEBUG_MODE 
          ? `${accountName} personas (debug mode)` 
          : personasToUpload.join(', '))
      : `All accounts: ${processedAccounts.join(', ')}`;
      
    console.log(`✅ Background YouTube upload completed. Processed ${totalSuccessfulJobs} jobs for: ${message}.`);

  } catch (error) {
    console.error('❌ Background YouTube upload failed:', error);
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
    await fs.writeFile(tempFile, videoBuffer);

    // Get playlist ID first so we can include it in metadata
    const playlistId = await getOrCreatePlaylist(youtube, job, playlistMap);
    
    // Generate account-specific metadata with playlist link
    const metadata = generateVideoMetadata(job, playlistId, accountId);
    
    // Get the first frame URL as thumbnail (question frame)
    const thumbnailUrl = job.data.frameUrls?.[0];
    
    const youtubeVideoId = await uploadToYouTube(tempFile, metadata, youtube, thumbnailUrl);
    
    await addVideoToPlaylist(youtubeVideoId, job, youtube, playlistMap, playlistId);
    
    await markJobCompleted(job.id, youtubeVideoId, metadata);
    await cleanupCloudinaryAssets(job.data, job.account_id || accountId);
    
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

async function uploadToYouTube(videoPath: string, metadata: any, youtube: youtube_v3.Youtube, thumbnailUrl?: string): Promise<string> {
    const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: metadata.title,
                description: metadata.description,
                tags: metadata.tags,
                categoryId: config.YOUTUBE_CATEGORY_ID, // Ensure this category (e.g., '27' for Education) is correct
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

function generateVideoMetadata(job: QuizJob, playlistId: string | undefined, accountId: string) {
  console.log(`[Job ${job.id}] Generating metadata for accountId: ${accountId}, persona: ${job.persona}`);
  
  const contentData = job.data.content || job.data.content; // Support both structures
  const topic_display_name = job.topic_display_name || job.data.topic_display_name || 'Quiz';
  
  console.log(`[Job ${job.id}] Content data exists: ${!!contentData}, Topic: ${topic_display_name}`);
  
  try {
    // Generate account-specific SEO-optimized, viral-worthy title
    const title = generateTitle(accountId, job.persona, topic_display_name);
    console.log(`[Job ${job.id}] Generated title: ${title}`);
    
    // Generate account-specific strategic hashtags for maximum reach
    const hashtags = generateHashtags(accountId, job.persona, job.topic);
    console.log(`[Job ${job.id}] Generated hashtags`);
    
    // Create engaging description with full content and playlist link
    const description = generateDescription(accountId, contentData, topic_display_name, hashtags, playlistId);
    console.log(`[Job ${job.id}] Generated description (${description.length} chars)`);
    
    // Optimized tags for YouTube algorithm
    const tags = generateSEOTags(accountId, job.persona, job.topic, topic_display_name);
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
 * Generates account-specific professional, SEO-optimized titles without emojis.
 */
function generateTitle(accountId: string, persona: string, topicName: string): string {
  const titleTemplates: Record<string, Record<string, string[]>> = {
    english_shots: {
      english_vocab_builder: [
        `English Vocabulary Quiz | ${topicName}`,
        `Can You Answer This? | English Vocab Challenge`,
        `9/10 Fail This Vocabulary Test | ${topicName}`,
        `Daily English Vocabulary Quiz | ${topicName}`,
        `English Quiz Challenge | ${topicName}`,
        `Test Your English Skills | ${topicName}`,
      ]
    },
    health_shots: {
      brain_health_tips: [
        `Brain Health Tip | ${topicName}`,
        `Boost Your Memory | ${topicName}`,
        `Neurologist's Secret | ${topicName}`,
        `Brain Power Boost | ${topicName}`,
        `Memory Enhancement | ${topicName}`,
        `Cognitive Health Tips | ${topicName}`,
      ],
      eye_health_tips: [
        `Eye Health Tip | ${topicName}`,
        `Screen Time Safety | ${topicName}`,
        `Protect Your Vision | ${topicName}`,
        `Optometrist's Advice | ${topicName}`,
        `Vision Care Tips | ${topicName}`,
        `Eye Safety Guide | ${topicName}`,
      ]
    }
  };
  
  const accountTemplates = titleTemplates[accountId] || {};
  const templates = accountTemplates[persona] || [`${topicName} | Expert Tips`];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generates account-specific strategic hashtags.
 */
function generateHashtags(accountId: string, persona: string, category: string): string {
  const hashtagMap: Record<string, Record<string, string>> = {
    english_shots: {
      english_vocab_builder: '#shorts #viral #learnenglish #english #vocabulary #englishquiz #vocab #esl #ielts #toefl #englishteacher #trending #fyp #challenge #quiz #education'
    },
    health_shots: {
      brain_health_tips: '#shorts #viral #brainhealth #memory #focus #cognitivehealth #wellness #brainfood #neurology #mindfulness #trending #fyp #health #tips #education',
      eye_health_tips: '#shorts #viral #eyehealth #visioncare #screentime #eyecare #healthyeyes #optometry #digitalstrain #bluelight #trending #fyp #health #vision #tips'
    }
  };

  const accountHashtags = hashtagMap[accountId] || {};
  return accountHashtags[persona] || '#shorts #viral #health #tips #wellness #trending #fyp #education';
}

/**
 * Creates account-specific engaging video descriptions with format-aware content extraction.
 */
function generateDescription(accountId: string, contentData: any, topicName: string, hashtags: string, playlistId?: string): string {
  console.log(`[generateDescription] Processing ${accountId} with format: ${contentData.format_type || 'unknown'}`);
  console.log(`[generateDescription] Content data keys:`, Object.keys(contentData || {}));
  
  // English account description
  if (accountId === 'english_shots') {
    return generateEnglishDescription(contentData, topicName, hashtags, playlistId);
  }

  // Health account description
  if (accountId === 'health_shots') {
    return generateHealthDescription(contentData, topicName, hashtags, playlistId);
  }

  // Fallback description
  const questionText = extractMainContent(contentData);
  const explanationText = extractExplanation(contentData);
  return `${questionText}\n\n${explanationText}\n\n${hashtags}`;
}

/**
 * Generates English account descriptions with format-aware content extraction
 */
function generateEnglishDescription(contentData: any, topicName: string, hashtags: string, playlistId?: string): string {
  const hooks = [
    "🤔 Think you know this word?",
    "⚡ Test your English vocabulary!",
    "🧠 Only 10% get this right!",
    "🎯 Can you master this English quiz?"
  ];
  
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
  
  const playlistLink = playlistId ? 
    `📺 For more questions on ${topicName}, check out the full playlist:\nhttps://www.youtube.com/playlist?list=${playlistId}\n\n-------------------------------------------------\n` : '';

  // Format-specific content extraction for English
  const formatType = contentData.format_type;
  let questionSection = '';
  let optionsSection = '';
  let answerSection = '';
  let explanationSection = '';

  if (formatType === 'quick_fix') {
    // Quick Fix format: hook, basic_word, advanced_word, usage_example, explanation
    questionSection = `📚 VOCABULARY UPGRADE:\n${contentData.hook || 'Upgrade your vocabulary!'}`;
    optionsSection = `🔄 REPLACE:\n"${contentData.basic_word || 'Basic word'}" → "${contentData.advanced_word || 'Advanced word'}"`;
    answerSection = `✅ USAGE EXAMPLE:\n${contentData.usage_example || 'See the video for usage example!'}`;
    explanationSection = contentData.explanation || 'Watch for explanation!';
  } else if (formatType === 'common_mistake') {
    // Common Mistake format: hook, mistake, correct, practice, explanation
    questionSection = `📚 COMMON MISTAKE:\n${contentData.hook || 'Avoid this mistake!'}`;
    optionsSection = `❌ WRONG: ${contentData.mistake || 'Common mistake'}\n✅ RIGHT: ${contentData.correct || 'Correct usage'}`;
    answerSection = `🎯 PRACTICE:\n${contentData.practice || 'Practice with the example!'}`;
    explanationSection = contentData.explanation || 'Watch for explanation!';
  } else if (formatType === 'usage_demo') {
    // Usage Demo format: hook, target_word, wrong_example, right_example, practice
    questionSection = `📚 WORD USAGE:\n${contentData.hook || 'Learn proper usage!'}`;
    optionsSection = `🎯 WORD: "${contentData.target_word || 'Target word'}"\n❌ WRONG: ${contentData.wrong_example || 'Wrong example'}\n✅ RIGHT: ${contentData.right_example || 'Right example'}`;
    answerSection = `🎯 PRACTICE:\n${contentData.practice || 'Practice with the examples!'}`;
    explanationSection = contentData.explanation || 'Watch for explanation!';
  } else {
    // MCQ format (default): question/content, options, answer, explanation
    const mainQuestion = contentData.question || contentData.content || contentData.assertion || 'English vocabulary question';
    questionSection = `📚 QUESTION:\n${mainQuestion}`;
    
    const optionsText = contentData.options ? 
      Object.entries(contentData.options).map(([key, value]) => `${key}) ${value}`).join('\n') : '';
    optionsSection = `🔤 OPTIONS:\n${optionsText}`;
    
    answerSection = `✅ ANSWER: \nThe correct answer is revealed in the video!`;
    explanationSection = contentData.explanation || 'Watch the video for a detailed explanation!';
  }

  return `${hook}\n${playlistLink}${questionSection}

${optionsSection}

${answerSection}

💡 EXPLANATION:
${explanationSection}

🏆 Join thousands of learners improving their English daily!

🎯 BOOST YOUR LEARNING:
💡 Comment your answer below - let's discuss!
🔔 Subscribe for daily English quizzes!
⚡ Share with your study partners!

${hashtags}`;
}

/**
 * Generates Health account descriptions with format-aware content extraction
 */
function generateHealthDescription(contentData: any, topicName: string, hashtags: string, playlistId?: string): string {
  const hooks = [
    "🌟 Transform your health today!",
    "💡 Expert health tip coming up!",
    "🎯 Science-backed advice ahead!",
    "🚀 Boost your wellness journey!"
  ];
  
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
  
  const playlistLink = playlistId ? 
    `📺 For more tips on ${topicName}, check out the full playlist:\nhttps://www.youtube.com/playlist?list=${playlistId}\n\n-------------------------------------------------\n` : '';

  // Format-specific content extraction for Health
  const formatType = contentData.format_type;
  let contentSection = '';
  let answerSection = '';

  if (formatType === 'quick_tip') {
    // Quick Tip format: hook, action, result, cta
    contentSection = `💡 HEALTH TIP:\n${contentData.hook || 'Health tip coming up!'}\n\n🎯 ACTION:\n${contentData.action || 'Take this action'}`;
    answerSection = `✨ RESULT:\n${contentData.result || 'See the benefits!'}`;
  } else if (formatType === 'challenge') {
    // Challenge format: hook, setup, instructions, challenge_type, reveal, answer
    contentSection = `🎯 HEALTH CHALLENGE:\n${contentData.hook || 'Take this challenge!'}\n\n📋 SETUP:\n${contentData.setup || 'Challenge setup'}\n\n🎮 INSTRUCTIONS:\n${contentData.instructions || 'Follow the instructions'}`;
    answerSection = `🎉 REVEAL:\n${contentData.reveal || 'Challenge results revealed in video!'}\n\n✅ ANSWER:\n${contentData.answer || 'Watch for the answer!'}`;
  } else {
    // MCQ format (default): question, options, answer, explanation
    const mainQuestion = contentData.question || contentData.content || 'Health knowledge question';
    contentSection = `❓ HEALTH QUIZ:\n${mainQuestion}`;
    
    const answerText = contentData.answer === 'A' ? 'TRUE' : 
                      contentData.answer === 'B' ? 'FALSE' : 
                      contentData.answer || 'Answer revealed in video';
    const explanationText = contentData.explanation || 'Watch for explanation!';
    answerSection = `🎯 ANSWER & EXPLANATION:\n${answerText} - ${explanationText}`;
  }

  return `${hook}\n${playlistLink}${contentSection}

${answerSection}

🏆 Join thousands improving their health knowledge!

🎯 TAKE ACTION:
💡 Test your health knowledge and learn something new!
🔔 Subscribe for daily health quizzes!
⚡ Share with friends who care about their health!

${hashtags}`;
}

/**
 * Extracts the main content/question from any format
 */
function extractMainContent(contentData: any): string {
  return contentData.question || 
         contentData.content || 
         contentData.hook || 
         contentData.assertion || 
         contentData.target_word || 
         'Expert content';
}

/**
 * Extracts explanation from any format
 */
function extractExplanation(contentData: any): string {
  return contentData.explanation || 
         contentData.result || 
         contentData.reason || 
         'Professional advice for better health and wellness.';
}

/**
 * Generates account-specific SEO-optimized tags for YouTube algorithm.
 */
function generateSEOTags(accountId: string, persona: string, category: string, topicName: string): string[] {
  const tagMap: Record<string, Record<string, string[]>> = {
    english_shots: {
      english_vocab_builder: ['learn english', 'english vocabulary', 'english quiz', 'vocabulary', 'english lesson', 'esl', 'ielts vocabulary', 'toefl vocabulary', 'speak english', 'challenge', 'english test', 'study english']
    },
    health_shots: {
      brain_health_tips: ['brain health', 'memory improvement', 'cognitive function', 'mental wellness', 'focus techniques', 'brain exercises', 'neurology', 'brain tips', 'memory tips'],
      eye_health_tips: ['eye health', 'vision care', 'screen time protection', 'eye exercises', 'digital eye strain', 'eye safety', 'optometry', 'vision tips', 'healthy eyes']
    }
  };

  const baseTags = ['shorts', 'viral', 'education', 'tips', 'health', 'wellness'];
  const accountTags = tagMap[accountId] || {};
  const personaTags = accountTags[persona] || ['health tips', 'wellness'];
  
  const categoryTag = (category || 'general').toLowerCase().replace(/_/g, ' ');
  const topicTag = (topicName || 'quiz').toLowerCase();
  
  const allTags = [
    ...baseTags,
    ...personaTags,
    categoryTag,
    topicTag
  ];
  
  return [...new Set(allTags)].filter(Boolean);
}

async function cleanupCloudinaryAssets(jobData: any, jobAccountId: string): Promise<void> {
  try {
    const cleanupPromises = [];
    if (jobData.videoUrl) {
      const videoPublicId = extractPublicIdFromUrl(jobData.videoUrl);
      if (videoPublicId) {
        cleanupPromises.push(deleteVideoFromCloudinary(videoPublicId, jobAccountId).catch(err => console.warn(`Failed to delete video ${videoPublicId} for ${jobAccountId}:`, err)));
      }
    }
    if (jobData.frameUrls && Array.isArray(jobData.frameUrls)) {
      jobData.frameUrls.forEach((frameUrl: string) => {
        const framePublicId = extractPublicIdFromUrl(frameUrl);
        if (framePublicId) {
          cleanupPromises.push(deleteImageFromCloudinary(framePublicId, jobAccountId).catch(err => console.warn(`Failed to delete frame ${framePublicId} for ${jobAccountId}:`, err)));
        }
      });
    }
    await Promise.allSettled(cleanupPromises);
    console.log(`🧹 Cleaned up Cloudinary assets for ${jobAccountId} job`);
  } catch (error) {
    console.error(`Error during Cloudinary cleanup for ${jobAccountId}:`, error);
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