import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, markJobCompleted, updateJob } from '@/lib/database';
import { google } from 'googleapis';
// import { getServerSession } from 'next-auth';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Rate limiting configuration for YouTube API
// const YOUTUBE_DAILY_QUOTA = 10000; // YouTube API daily quota units (default allocation)
const UPLOAD_QUOTA_COST = 1600; // Each upload costs ~1600 quota units
const MAX_DAILY_UPLOADS = 20; // Target: 20 videos per day (requires higher quota)
const UPLOAD_DELAY_MS = 2000; // 2 second delay between uploads for better throughput
const MAX_CONCURRENT_UPLOADS = 3; // Process max 3 uploads simultaneously for 20/day

// Simple in-memory rate limiter (in production, use Redis)
const uploadTracker = {
  dailyCount: 0,
  lastResetDate: new Date().toDateString(),
  activeUploads: 0
};

export async function POST(request: NextRequest) {
  try {
    // Auth check using CRON_SECRET
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting YouTube upload batch...');

    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    if (uploadTracker.lastResetDate !== today) {
      uploadTracker.dailyCount = 0;
      uploadTracker.lastResetDate = today;
      console.log('Daily upload counter reset');
    }

    // Check daily upload limit
    const remainingUploads = MAX_DAILY_UPLOADS - uploadTracker.dailyCount;
    if (remainingUploads <= 0) {
      console.log(`Daily upload limit reached (${MAX_DAILY_UPLOADS}). Skipping batch.`);
      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: `Daily upload limit reached (${uploadTracker.dailyCount}/${MAX_DAILY_UPLOADS})`,
        nextResetTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Check concurrent upload limit
    if (uploadTracker.activeUploads >= MAX_CONCURRENT_UPLOADS) {
      console.log(`Maximum concurrent uploads reached (${uploadTracker.activeUploads}/${MAX_CONCURRENT_UPLOADS}). Skipping batch.`);
      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: `Maximum concurrent uploads reached. Try again in a few minutes.`
      });
    }

    // Get jobs at step 4 (upload_pending) - limit by remaining daily quota
    const batchSize = Math.min(MAX_CONCURRENT_UPLOADS - uploadTracker.activeUploads, remainingUploads);
    const jobs = await getPendingJobs(4, batchSize);
    
    if (jobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: 'No jobs pending YouTube upload' 
      });
    }

    const processedJobs = [];

    // Process uploads with rate limiting and concurrency control
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      
      try {
        // Track active uploads
        uploadTracker.activeUploads++;
        
        console.log(`Uploading video for job ${job.id} - ${job.persona} ${job.category} (${i + 1}/${jobs.length})`);
        console.log(`Rate limit status: ${uploadTracker.dailyCount}/${MAX_DAILY_UPLOADS} daily, ${uploadTracker.activeUploads}/${MAX_CONCURRENT_UPLOADS} concurrent`);

        // Read video from file path (no longer stored in database)
        let videoBuffer;
        if (job.data.videoPath) {
          // Read video from saved file path
          videoBuffer = fs.readFileSync(job.data.videoPath);
          console.log(`Read video from file: ${job.data.videoPath} (${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
        } else if (job.data.videoBuffer) {
          // Fallback: convert from base64 if still stored in database
          videoBuffer = Buffer.from(job.data.videoBuffer, 'base64');
          console.log(`Read video from database buffer (${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
        } else {
          throw new Error('No video data found - neither videoPath nor videoBuffer available');
        }
        
        // Generate metadata for the video
        const metadata = generateVideoMetadata(job.data.question, job.persona, job.category, job.id);
        
        // Upload to YouTube with retry logic
        const youtubeVideoId = await uploadToYouTubeWithRetry(videoBuffer, metadata, 3);
        
        // Add video to appropriate playlist(s) based on category
        await addVideoToPlaylists(youtubeVideoId, job.persona, job.category, job.data.question);
        
        // Mark job as completed
        await markJobCompleted(job.id, youtubeVideoId, metadata);
        
        // Update counters
        uploadTracker.dailyCount++;
        
        processedJobs.push({ 
          id: job.id, 
          persona: job.persona, 
          category: job.category,
          youtube_video_id: youtubeVideoId
        });
        
        console.log(`YouTube upload completed for job ${job.id}: https://youtube.com/watch?v=${youtubeVideoId}`);

        // Add delay between uploads to respect rate limits
        if (i < jobs.length - 1) {
          console.log(`Waiting ${UPLOAD_DELAY_MS}ms before next upload...`);
          await new Promise(resolve => setTimeout(resolve, UPLOAD_DELAY_MS));
        }

      } catch (error) {
        console.error(`Failed to upload video for job ${job.id}:`, error);
        
        // Mark job as failed
        await updateJob(job.id, {
          status: 'failed',
          error_message: `YouTube upload failed: ${error.message}`
        });
      } finally {
        // Always decrement active uploads counter
        uploadTracker.activeUploads = Math.max(0, uploadTracker.activeUploads - 1);
      }
    }

    console.log(`YouTube upload batch completed. Processed ${processedJobs.length} jobs.`);

    return NextResponse.json({ 
      success: true, 
      processed: processedJobs.length,
      jobs: processedJobs,
      rateLimitStatus: {
        dailyUploads: uploadTracker.dailyCount,
        maxDailyUploads: MAX_DAILY_UPLOADS,
        remainingDailyUploads: MAX_DAILY_UPLOADS - uploadTracker.dailyCount,
        activeUploads: uploadTracker.activeUploads,
        maxConcurrentUploads: MAX_CONCURRENT_UPLOADS,
        nextResetTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('YouTube upload batch failed:', error);
    return NextResponse.json(
      { success: false, error: 'YouTube upload failed' },
      { status: 500 }
    );
  }
}

function generateVideoMetadata(question: any, persona: string, category: string, jobId: string) {
  // Generate vocabulary-focused titles
  const titles = {
    'vocabulary-english': `📚 Vocabulary Challenge: ${question.category_topic || 'Word Power'} ✨`,
    'current_affairs-world_news': `🌍 Current Affairs Quiz: ${question.category_topic || 'World Updates'} 📰`
  };
  
  const titleKey = `${persona}-${category}`;
  const title = titles[titleKey] || `${persona.charAt(0).toUpperCase() + persona.slice(1)} ${question.category_topic || 'Quiz'} #${jobId.slice(-4)}`;
  
  // Generate educational description
  let description = '';
  if (persona === 'vocabulary') {
    description = `📚 Boost your English vocabulary with this quick challenge!

${question.question.slice(0, 150)}${question.question.length > 150 ? '...' : ''}

🎯 Perfect for improving your word knowledge and language skills!

⏱️ 20-second vocabulary challenge
🧠 Think, choose, learn new words
✅ Answer with helpful explanation
📖 Build your vocabulary daily

Great for:
• English language learners
• Students preparing for exams
• Anyone wanting to improve vocabulary
• Quick learning breaks

🎓 Want to practice more? Use Gibbi AI to generate personalized quizzes and tests on any topic for any exam preparation. Create unlimited practice questions tailored to your learning goals: https://gibbi.vercel.app

#Vocabulary #English #WordPower #LanguageLearning #Education #Shorts #Quiz #StudyTips

Expand your vocabulary one word at a time! 🚀📚`;
  } else {
    description = `🎯 Quick ${persona} challenge - test your knowledge!

${question.question.slice(0, 150)}${question.question.length > 150 ? '...' : ''}

⏱️ 20-second challenge
🧠 Think, choose, learn
✅ Answer revealed with explanation

🎓 Want to practice more? Use Gibbi AI to generate personalized quizzes and tests on any topic for any exam preparation. Create unlimited practice questions tailored to your learning goals: https://gibbi.vercel.app

#Quiz #Shorts #Education #Learning`;
  }

  // Generate relevant tags
  const baseTags = ['quiz', 'shorts', 'education', 'learning'];
  let specificTags = [];
  
  if (persona === 'vocabulary') {
    specificTags = ['vocabulary', 'english', 'words', 'language'];
  }
  
  const tags = [...baseTags, ...specificTags, question.category_topic || 'general'].slice(0, 10);

  return {
    title: title.slice(0, 100), // YouTube title limit
    description: description.slice(0, 5000), // YouTube description limit
    tags
  };
}

async function uploadToYouTubeWithRetry(videoBuffer: Buffer, metadata: any, maxRetries: number = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries}`);
      return await uploadToYouTube(videoBuffer, metadata);
    } catch (error) {
      console.error(`Upload attempt ${attempt} failed:`, error);
      
      // Don't retry on authentication errors
      if (error.message.includes('Authentication failed') || error.message.includes('Invalid Credentials')) {
        throw error;
      }
      
      // Don't retry on quota exceeded errors
      if (error.message.includes('quotaExceeded')) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Upload failed after all retry attempts');
}

async function uploadToYouTube(videoBuffer: Buffer, metadata: any): Promise<string> {
  try {
    // Determine the redirect URI based on environment
    const redirectUri = process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/api/auth/callback/google'
        : (() => { throw new Error('NEXTAUTH_URL must be set in production environment'); })();

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Set the refresh token from environment
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    // Refresh the access token if needed
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      console.log('Access token refreshed successfully');
    } catch (tokenError) {
      console.error('Failed to refresh access token:', tokenError);
      throw new Error('Authentication failed - unable to refresh access token');
    }

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    // Create temporary file for upload
    const tempFile = path.join('/tmp', `quiz-upload-${uuidv4()}.mp4`);
    fs.writeFileSync(tempFile, videoBuffer);

    try {
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            categoryId: '27', // Education category
            defaultAudioLanguage: 'en',
            defaultLanguage: 'en'
          },
          status: {
            privacyStatus: 'public',
            madeForKids: false,
            selfDeclaredMadeForKids: false
          }
        },
        media: {
          body: fs.createReadStream(tempFile)
        }
      });

      // Cleanup temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return response.data.id!;
      
    } catch (uploadError) {
      // Cleanup temp file on error
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      throw uploadError;
    }

  } catch (error) {
    console.error('YouTube upload error:', error);
    
    // For development/testing, return a mock video ID
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: returning mock video ID');
      return `mock-video-${Date.now()}`;
    }
    
    throw new Error(`YouTube upload failed: ${error.message}`);
  }
}

async function addVideoToPlaylists(videoId: string, persona: string, category: string, question: any): Promise<void> {
  // Add to multiple playlists for better content discovery
  const playlistTargets = determinePlaylistTargets(persona, category, question);
  
  for (const target of playlistTargets) {
    await addVideoToSinglePlaylist(videoId, target.persona, target.category);
  }
}

function determinePlaylistTargets(persona: string, category: string, question: any): Array<{persona: string, category: string}> {
  const targets = [
    // Always add to main persona playlist
    { persona, category }
  ];
  
  // Add to special themed playlists based on content
  if (persona === 'vocabulary') {
    // Check if it's test-prep vocabulary
    const isTestPrep = question?.category_topic?.toLowerCase().includes('sat') || 
                      question?.category_topic?.toLowerCase().includes('gre') ||
                      question?.category_topic?.toLowerCase().includes('gmat') ||
                      question?.explanation?.toLowerCase().includes('exam');
    
    if (isTestPrep) {
      targets.push({ persona: 'test_prep', category: 'vocabulary' });
    }
    
    // Check if it's beginner-friendly content
    const isBeginnerFriendly = question?.difficulty === 'easy' || 
                              question?.difficulty === 'beginner';
    
    if (isBeginnerFriendly) {
      targets.push({ persona: 'language_learning', category: 'beginner' });
    }
  }
  
  // Add current affairs to general knowledge if it's educational
  if (persona === 'current_affairs') {
    targets.push({ persona: 'general_knowledge', category: 'current_events' });
  }
  
  return targets;
}

async function addVideoToSinglePlaylist(videoId: string, persona: string, category: string): Promise<void> {
  try {
    console.log(`Adding video ${videoId} to playlist for ${persona}-${category}`);
    
    // Determine the redirect URI based on environment
    const redirectUri = process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/api/auth/callback/google'
        : (() => { throw new Error('NEXTAUTH_URL must be set in production environment'); })();

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Set the refresh token from environment
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    // Refresh the access token if needed
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
    } catch (tokenError) {
      console.error('Failed to refresh access token for playlist:', tokenError);
      throw new Error('Authentication failed - unable to refresh access token');
    }

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    // Get or create playlist for this persona-category combination
    const playlistId = await getOrCreatePlaylist(youtube, persona, category);
    
    // Add video to playlist
    await youtube.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId: playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId: videoId
          }
        }
      }
    });

    console.log(`Successfully added video ${videoId} to playlist ${playlistId}`);
    
  } catch (error) {
    console.error(`Failed to add video ${videoId} to playlist:`, error);
    // Don't throw error - playlist addition is optional
  }
}

async function getOrCreatePlaylist(youtube: any, persona: string, category: string): Promise<string> {
  const playlistStrategy = determinePlaylistStrategy(persona, category);
  const playlistTitle = playlistStrategy.title;
  const playlistDescription = playlistStrategy.description;
  
  try {
    // Search for existing playlist
    const searchResponse = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50
    });

    const existingPlaylist = searchResponse.data.items?.find((playlist: any) => 
      playlist.snippet.title === playlistTitle
    );

    if (existingPlaylist) {
      console.log(`Found existing playlist: ${existingPlaylist.id} (${existingPlaylist.contentDetails?.itemCount || 0} videos)`);
      
      // Check if playlist needs splitting due to size
      const videoCount = parseInt(existingPlaylist.contentDetails?.itemCount || '0');
      if (shouldSplitPlaylist(playlistTitle, videoCount)) {
        return await createSequentialPlaylist(youtube, playlistTitle, playlistDescription, videoCount);
      }
      
      return existingPlaylist.id;
    }

    // Create new playlist if not found
    console.log(`Creating new playlist: ${playlistTitle}`);
    const createResponse = await youtube.playlists.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: playlistTitle,
          description: playlistDescription,
          defaultLanguage: 'en',
          tags: playlistStrategy.tags
        },
        status: {
          privacyStatus: 'public'
        }
      }
    });

    console.log(`Created new playlist: ${createResponse.data.id}`);
    return createResponse.data.id;
    
  } catch (error) {
    console.error('Failed to get or create playlist:', error);
    throw error;
  }
}

function determinePlaylistStrategy(persona: string, category: string) {
  const mainTitle = generatePlaylistTitle(persona, category);
  const mainDescription = generatePlaylistDescription(persona, category);
  
  // Generate SEO-optimized tags for better discoverability
  const tagSets: { [key: string]: string[] } = {
    'vocabulary': ['vocabulary', 'english', 'word power', 'SAT vocab', 'GRE words', 'language learning', 'test prep', 'vocabulary building'],
    'current_affairs': ['current affairs', 'news quiz', 'general knowledge', 'world events', 'competitive exams', 'current events', 'news update'],
    'test_prep': ['test preparation', 'exam prep', 'SAT', 'GRE', 'GMAT', 'study tips', 'practice questions', 'test strategy'],
    'general_knowledge': ['general knowledge', 'trivia', 'quiz', 'facts', 'learning', 'education', 'brain training', 'knowledge test'],
    'language_learning': ['language learning', 'ESL', 'english learning', 'grammar', 'pronunciation', 'language practice']
  };

  return {
    title: mainTitle,
    description: mainDescription,
    tags: tagSets[persona] || ['quiz', 'education', 'learning']
  };
}

function shouldSplitPlaylist(playlistTitle: string, videoCount: number): boolean {
  // Split playlists when they get too large for optimal user experience
  const OPTIMAL_PLAYLIST_SIZE = 100; // Sweet spot for engagement
  // const MAX_PLAYLIST_SIZE = 200; // Hard limit before splitting
  
  // Different personas have different optimal sizes
  if (playlistTitle.includes('Vocabulary')) {
    return videoCount >= 150; // Vocabulary can handle more videos
  } else if (playlistTitle.includes('Current Affairs')) {
    return videoCount >= 100; // Current affairs should be more recent
  } else {
    return videoCount >= OPTIMAL_PLAYLIST_SIZE;
  }
}

async function createSequentialPlaylist(youtube: any, baseTitle: string, baseDescription: string, currentCount: number): Promise<string> {
  // Create numbered sequential playlists (e.g., "Vocabulary Challenge - Part 2")
  const seriesNumber = Math.ceil(currentCount / 100) + 1;
  const newTitle = `${baseTitle} - Part ${seriesNumber}`;
  
  const sequentialDescription = `${baseDescription}

📚 This is Part ${seriesNumber} of our comprehensive quiz series!
📖 For earlier episodes, check out previous parts in this series.

🔗 Continue your learning journey with unlimited practice at Gibbi AI: https://gibbi.vercel.app`;

  console.log(`Creating sequential playlist: ${newTitle}`);
  const createResponse = await youtube.playlists.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: newTitle,
        description: sequentialDescription,
        defaultLanguage: 'en'
      },
      status: {
        privacyStatus: 'public'
      }
    }
  });

  return createResponse.data.id;
}

function generatePlaylistTitle(persona: string, _category: string): string {
  // Strategic playlist organization:
  // 1. Main personas get their own playlists (not sub-categories)
  // 2. Difficulty-based organization within personas
  // 3. Popular/trending content gets priority playlists
  // 4. Cross-persona playlists for specific use cases
  
  const mainPlaylists: { [key: string]: string } = {
    // Core vocabulary playlist - all vocabulary content goes here
    'vocabulary': '📚 English Vocabulary Challenge - Build Your Word Power',
    
    // Current affairs - all topics together for better discovery
    'current_affairs': '🌍 Current Affairs Quiz - Stay Updated',
    
    // Test prep - consolidated by exam type
    'test_prep': '📝 Test Preparation Quiz Series',
    
    // General knowledge
    'general_knowledge': '🧠 General Knowledge Challenge',
    
    // Language learning
    'language_learning': '🗣️ Language Learning Quiz Collection'
  };
  
  // Use main persona playlist instead of category-specific ones
  return mainPlaylists[persona] || `${persona.charAt(0).toUpperCase() + persona.slice(1)} Quiz Collection`;
}

function generatePlaylistDescription(persona: string, _category: string): string {
  const descriptions: { [key: string]: string } = {
    'vocabulary': `🎯 Master English vocabulary with this comprehensive collection of quiz videos!

📚 WHAT YOU'LL FIND:
• Word meanings & definitions
• Synonyms & antonyms
• Etymology & word origins
• Context clues & usage
• Academic & professional vocabulary
• SAT, GRE, GMAT vocabulary

🎯 PERFECT FOR:
• Test preparation (SAT, GRE, GMAT, TOEFL, IELTS)
• English language learners
• Students & professionals
• Daily vocabulary building
• Quick learning breaks

✨ FEATURES:
⏱️ 15-20 second challenges
📖 Clear explanations
🧠 Progressive difficulty
📱 Mobile-friendly format

🚀 Want unlimited personalized vocabulary practice? Create custom quizzes with Gibbi AI: https://gibbi.vercel.app

💡 New videos added regularly! Subscribe and hit the bell for vocabulary mastery.

#Vocabulary #English #WordPower #TestPrep #LanguageLearning #Education #SAT #GRE #GMAT`,
    
    'current_affairs': `🌍 Stay informed and test your knowledge with current affairs quiz videos!

📰 COVERAGE INCLUDES:
• World news & global events
• Politics & government
• Economics & business
• Technology & innovation
• Science & environment
• Social issues & culture

🎯 IDEAL FOR:
• Competitive exam preparation
• General knowledge building
• Staying informed on current events
• Interview preparation
• Academic discussions

✨ FEATURES:
⏱️ Quick 20-second challenges
📊 Recent developments
🧠 Critical thinking questions
📱 Bite-sized learning

🚀 Need more current affairs practice? Generate custom quizzes with Gibbi AI: https://gibbi.vercel.app

📅 Updated weekly with latest developments!

#CurrentAffairs #News #GeneralKnowledge #CompetitiveExams #WorldEvents #Quiz #Education`,
    
    'test_prep': `📝 Comprehensive test preparation through engaging quiz videos!

🎯 EXAM COVERAGE:
• SAT (Verbal & Math concepts)
• GRE (Vocabulary & Reasoning)
• GMAT (Critical Reasoning)
• TOEFL/IELTS (English proficiency)
• General aptitude tests

✅ PREPARATION BENEFITS:
• Quick concept reinforcement
• Timed practice questions
• Detailed explanations
• Common mistake patterns
• Strategic approaches

⏱️ STUDY EFFICIENTLY:
• 15-20 second micro-learning
• Focused topic coverage
• Progress tracking potential
• Mobile-friendly format

🚀 Want full-length practice tests? Create unlimited mock exams with Gibbi AI: https://gibbi.vercel.app

📈 Boost your test scores with consistent practice!

#TestPrep #SAT #GRE #GMAT #TOEFL #ExamPreparation #StudyTips #Education`,
    
    'general_knowledge': `🧠 Expand your general knowledge with fun and challenging quiz videos!

🌟 TOPICS COVERED:
• History & geography
• Science & technology  
• Arts & literature
• Sports & entertainment
• Famous personalities
• Interesting facts

🎯 GREAT FOR:
• Trivia enthusiasts
• Curious learners
• Social conversations
• Brain training
• Fun learning breaks

✨ EXPERIENCE:
⏱️ Quick knowledge bursts
🤔 Thought-provoking questions
💡 "Did you know?" moments
📱 Perfect for any time

🚀 Curious about specific topics? Generate targeted quizzes with Gibbi AI: https://gibbi.vercel.app

🎉 Learning should be fun - dive in!

#GeneralKnowledge #Trivia #Learning #Education #Facts #Quiz #BrainTraining`,
    
    'language_learning': `🗣️ Accelerate your language learning journey with interactive quiz videos!

📚 LANGUAGE SKILLS:
• Vocabulary building
• Grammar concepts
• Pronunciation guides
• Cultural context
• Common expressions
• Language usage patterns

🌍 LEARNER-FRIENDLY:
• Multiple proficiency levels
• Clear explanations
• Practical examples
• Cultural insights
• Progressive difficulty

✨ LEARNING METHOD:
⏱️ Micro-learning sessions
🎯 Focused skill building
📖 Context-rich content
🔄 Repetition for retention

🚀 Want personalized language practice? Create custom lessons with Gibbi AI: https://gibbi.vercel.app

🌟 Master languages one quiz at a time!

#LanguageLearning #English #Vocabulary #Grammar #ESL #Education #StudyTips`
  };
  
  return descriptions[persona] || `🎯 Educational quiz collection for ${persona} topics!

🚀 Create personalized practice with Gibbi AI: https://gibbi.vercel.app

#Quiz #Education #Learning`;
}

// Rate limiting status endpoint for monitoring
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    if (uploadTracker.lastResetDate !== today) {
      uploadTracker.dailyCount = 0;
      uploadTracker.lastResetDate = today;
    }

    return NextResponse.json({
      success: true,
      rateLimitStatus: {
        dailyUploads: uploadTracker.dailyCount,
        maxDailyUploads: MAX_DAILY_UPLOADS,
        remainingDailyUploads: MAX_DAILY_UPLOADS - uploadTracker.dailyCount,
        activeUploads: uploadTracker.activeUploads,
        maxConcurrentUploads: MAX_CONCURRENT_UPLOADS,
        nextResetTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
        quotaUsageEstimate: uploadTracker.dailyCount * UPLOAD_QUOTA_COST,
        remainingQuotaEstimate: (MAX_DAILY_UPLOADS - uploadTracker.dailyCount) * UPLOAD_QUOTA_COST
      }
    });
  } catch (error) {
    console.error('Rate limit status check failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get rate limit status' },
      { status: 500 }
    );
  }
}

// Configure for Vercel deployment  
export const runtime = 'nodejs';
export const maxDuration = 300;