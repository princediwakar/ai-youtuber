import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob, autoRetryFailedJobs } from '@/lib/database';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';
import { 
  downloadImageFromCloudinary, 
  uploadVideoToCloudinary, 
  generateVideoPublicId 
} from '@/lib/cloudinary';
import { QuizJob } from '@/lib/types'; // 💡 FIX: Import the QuizJob type
import { config } from '@/lib/config';

// FFmpeg path resolution using @ffmpeg-installer/ffmpeg (working version)
function getFFmpegPath(): string {
  const { existsSync } = require('fs');
  
  try {
    // First try: @ffmpeg-installer/ffmpeg (the working approach)
    const ffmpeg = require('@ffmpeg-installer/ffmpeg');
    
    if (ffmpeg.path && typeof ffmpeg.path === 'string') {
      if (existsSync(ffmpeg.path)) {
        console.log(`✅ FFmpeg found via @ffmpeg-installer/ffmpeg: ${ffmpeg.path}`);
        return ffmpeg.path;
      }
    }
  } catch (error) {
    console.warn('Could not require @ffmpeg-installer/ffmpeg:', error instanceof Error ? error.message : String(error));
  }
  
  // Fallback to system FFmpeg
  console.log('✅ Fallback to system FFmpeg');
  return 'ffmpeg';
}

// Array of available audio files
const AUDIO_FILES = [
  '1.mp3',
  '2.mp3', 
  '3.mp3',
];

/**
 * Randomly selects an audio file from the available options
 * @returns Full path to a random audio file
 */
function getRandomAudioFile(): string {
  const randomIndex = Math.floor(Math.random() * AUDIO_FILES.length);
  const selectedAudio = AUDIO_FILES[randomIndex];
  const audioPath = path.join(process.cwd(), 'public', 'audio', selectedAudio);
  
  console.log(`Selected audio file: ${selectedAudio}`);
  console.log(`Full audio path: ${audioPath}`);
  console.log(`Current working directory: ${process.cwd()}`);
  
  // Check if public/audio directory exists
  const publicAudioDir = path.join(process.cwd(), 'public', 'audio');
  const { existsSync } = require('fs');
  
  if (existsSync(publicAudioDir)) {
    console.log(`Audio directory exists: ${publicAudioDir}`);
    try {
      const audioFiles = require('fs').readdirSync(publicAudioDir);
      console.log(`Available audio files:`, audioFiles);
    } catch (err) {
      console.log(`Could not read audio directory:`, err instanceof Error ? err.message : String(err));
    }
  } else {
    console.log(`Audio directory does not exist: ${publicAudioDir}`);
  }
  
  // Verify audio file exists
  if (!existsSync(audioPath)) {
    console.warn(`Audio file not found at ${audioPath}, using embedded audio generation`);
    return null; // Will trigger embedded audio generation
  }
  
  console.log(`Audio file found at: ${audioPath}`);
  return audioPath;
}

async function saveDebugVideo(videoBuffer: Buffer, jobId: string, themeName?: string, persona?: string) {
  if (!config.DEBUG_MODE) return;
  try {
    const debugDir = path.join(process.cwd(), 'generated-videos');
    await fs.mkdir(debugDir, { recursive: true });
    const personaName = persona || 'unknown';
    const theme = themeName || 'unknown';
    const destinationPath = path.join(debugDir, `1-video-${personaName}-quiz-${theme}-${jobId}.mp4`);
    await fs.writeFile(destinationPath, new Uint8Array(videoBuffer));
    console.log(`[DEBUG] Video for job ${jobId} saved to: ${destinationPath}`);
  } catch (error) {
    console.error(`[DEBUG] Failed to save debug video for job ${jobId}:`, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse request body to get accountId (optional)
    let accountId: string | undefined;
    try {
      const body = await request.json();
      accountId = body.accountId;
    } catch {
      // No body or invalid JSON - process all accounts
    }

    console.log(`🚀 Starting video assembly for account: ${accountId || 'all'}`);

    // FIXED: Process synchronously instead of fire-and-forget
    const result = await processVideoAssemblyWithRetry(accountId);

    return NextResponse.json({ 
      success: true, 
      accountId: accountId || 'all',
      result,
      message: 'Video assembly completed'
    });

  } catch (error) {
    console.error('Video assembly batch failed:', error);
    return NextResponse.json({ success: false, error: 'Video assembly failed' }, { status: 500 });
  }
}

/**
 * Background processing function that includes retry logic and video assembly.
 * Runs asynchronously without blocking the API response.
 */
async function processVideoAssemblyWithRetry(accountId: string | undefined) {
  try {
    console.log(`🔄 Background video assembly started for account: ${accountId || 'all'}`);
    
    // Auto-retry failed jobs with valid data (moved to background)
    await autoRetryFailedJobs();
    
    // Get jobs; prefer SQL-side filtering by account to avoid LIMIT mismatches
    const jobs = await getPendingJobs(3, config.ASSEMBLY_CONCURRENCY, undefined, accountId);
    
    if (jobs.length === 0) {
      const message = accountId ? 
        `No jobs pending video assembly for account ${accountId}` :
        'No jobs pending video assembly';
      console.log(message);
      return { success: false, message };
    }

    console.log(`Found ${jobs.length} jobs for video assembly. Processing...`);

    // Process video assembly
    const result = await processVideoAssemblyInBackground(jobs);
    
    console.log(`✅ Video assembly completed for account: ${accountId || 'all'}`);
    return result;

  } catch (error) {
    console.error(`❌ Video assembly failed for ${accountId}:`, error);
    throw error;
  }
}

/**
 * Background processing function for video assembly.
 * Runs asynchronously without blocking the API response.
 */
async function processVideoAssemblyInBackground(jobs: QuizJob[]) {
  try {
    console.log(`🔄 Background video assembly started for ${jobs.length} jobs`);

    const processPromises = jobs.map(job => processJob(job));
    const results = await Promise.allSettled(processPromises);

    const summary = results.map((result, index) => {
        const jobId = jobs[index].id;
        if (result.status === 'fulfilled' && result.value) {
            return { jobId, status: 'success' };
        } else {
            return { jobId, status: 'failed', reason: result.status === 'rejected' ? String(result.reason) : 'Unknown error' };
        }
    });

    const successCount = summary.filter(s => s.status === 'success').length;
    console.log(`✅ Video assembly completed: ${successCount}/${jobs.length} successful`);
    
    return { 
      success: true, 
      processed: jobs.length, 
      successful: successCount,
      summary 
    };

  } catch (error) {
    console.error('❌ Video assembly failed:', error);
    throw error;
  }
}

// 💡 FIX: Use the strongly-typed QuizJob interface instead of 'any'.
async function processJob(job: QuizJob) {
  const tempDir = path.join(tmpdir(), `quiz-video-${job.id}-${Date.now()}`);
  try {
    console.log(`[Job ${job.id}] Assembling video...`);
    const frameUrls = job.data.frameUrls;
    if (!frameUrls || frameUrls.length === 0) {
      throw new Error('No frame URLs found in job data');
    }

    await fs.mkdir(tempDir, { recursive: true });
    const { videoUrl, videoSize, audioFile } = await assembleVideoWithConcat(frameUrls, job, tempDir);
    
    await updateJob(job.id, {
      step: 4,
      status: 'upload_pending',
      data: { ...job.data, videoUrl, videoSize, audioFile }
    });
    
    console.log(`[Job ${job.id}] ✅ Video assembly successful: ${videoUrl}`);
    return { id: job.id, persona: job.persona };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Job ${job.id}] ❌ Failed to assemble video:`, errorMessage);
    await updateJob(job.id, {
      status: 'failed',
      error_message: `Video assembly failed: ${errorMessage}`
    });
    return null;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(e => console.warn(`Failed to cleanup temp dir ${tempDir}:`, e));
  }
}

async function assembleVideoWithConcat(frameUrls: string[], job: QuizJob, tempDir: string): Promise<{videoUrl: string, videoSize: number, audioFile: string | null}> {
  const ffmpegPath = getFFmpegPath();

  console.log(`[Job ${job.id}] Assembling video with simple concatenation...`);

  // Download frames
  const framePaths = await Promise.all(
    frameUrls.map(async (url, index) => {
      const frameBuffer = await downloadImageFromCloudinary(url);
      const framePath = path.join(tempDir, `frame-${String(index + 1).padStart(3, '0')}.png`);
      await fs.writeFile(framePath, new Uint8Array(frameBuffer));
      return framePath;
    })
  );

  // Normalize job data structure for different formats
  const questionData = job.data.content || {};
  const layoutType = job.data.layoutType || 'mcq'; // Get layout type from job data
  
  // Determine actual frame count from frameUrls length
  const actualFrameCount = frameUrls.length;
  
  // Generate durations array based on actual frame count
  const durations = Array.from({ length: actualFrameCount }, (_, index) => {
    return getFrameDuration(questionData, index + 1, layoutType) || 4;
  });

  // Simplified approach: Create one video directly from frames with faster processing
  const outputVideoPath = path.join(tempDir, `quiz-${job.id}.mp4`);
  const totalDuration = durations.reduce((acc, d) => acc + (d || 4), 0);
  const audioPath = getRandomAudioFile();
  
  // Extract audio file name for analytics tracking
  const audioFileName = audioPath ? path.basename(audioPath) : null;

  // Use the traditional concat method which is more reliable in serverless
  // Create individual video clips first, then concat them
  const clipPaths: string[] = [];
  
  for (let i = 0; i < framePaths.length; i++) {
    const framePath = framePaths[i];
    const duration = durations[i] || 4;
    const clipPath = path.join(tempDir, `clip-${i}.mp4`);
    
    const clipArgs = [
      '-loop', '1',
      '-i', framePath,
      '-t', String(duration),
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black',
      '-y', clipPath
    ];
    
    await new Promise<void>((resolve, reject) => {
      const process = spawn(ffmpegPath, clipArgs, { cwd: tempDir });
      let stderr = '';
      
      // 30 second timeout per frame
      const timeoutId = setTimeout(() => {
        process.kill('SIGKILL');
        reject(new Error(`Frame ${i} processing timed out after 30 seconds`));
      }, 30000);
      
      process.stderr?.on('data', (d) => { stderr += d.toString(); });
      process.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          console.log(`[Job ${job.id}] Frame ${i} processed successfully`);
          resolve();
        } else {
          reject(new Error(`Frame ${i} processing failed with code ${code}: ${stderr.slice(-200)}`));
        }
      });
      process.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(new Error(`Frame ${i} process error: ${err.message}`));
      });
    });
    
    clipPaths.push(clipPath);
  }

  // Create concat file
  const concatContent = clipPaths.map(path => `file '${path.split('/').pop()}'`).join('\n');
  const concatFilePath = path.join(tempDir, 'concat.txt');
  await fs.writeFile(concatFilePath, concatContent);

  // Final assembly with audio if available
  let ffmpegArgs: string[];
  
  if (audioPath) {
    ffmpegArgs = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath,
      '-i', audioPath,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-filter:a', 'volume=0.3',
      '-shortest',
      '-y', outputVideoPath
    ];
  } else {
    ffmpegArgs = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath,
      '-c:v', 'copy',
      '-y', outputVideoPath
    ];
  }

  console.log(`[Job ${job.id}] Running simplified FFmpeg with ${framePaths.length} frames`);

  await new Promise<void>((resolve, reject) => {
    console.log(`[Job ${job.id}] Final assembly command:`, ffmpegArgs.join(' '));
    
    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, { cwd: tempDir });
    let stderr = '';
    let stdout = '';
    
    // Set a 90-second timeout for the final assembly
    const timeoutId = setTimeout(() => {
      ffmpegProcess.kill('SIGKILL');
      reject(new Error('FFmpeg final assembly timed out after 90 seconds'));
    }, 90000);
    
    ffmpegProcess.stdout?.on('data', (d) => { stdout += d.toString(); });
    ffmpegProcess.stderr?.on('data', (d) => { stderr += d.toString(); });
    
    ffmpegProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        console.log(`[Job ${job.id}] FFmpeg completed successfully`);
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}. Stderr: ${stderr.slice(-500)}`));
      }
    });
    
    ffmpegProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(new Error(`FFmpeg process error: ${err.message}`));
    });
  });

  const videoBuffer = await fs.readFile(outputVideoPath);
  
  // Save debug video locally if DEBUG_MODE is enabled
  await saveDebugVideo(videoBuffer, job.id, job.data.themeName, job.persona);
  
  // Get account ID from job data
  const accountId = job.account_id;
  if (!accountId) {
    throw new Error(`Job ${job.id} is missing account_id - database migration may be incomplete`);
  }
  
  // Always upload to Cloudinary (even in debug mode)
  const publicId = generateVideoPublicId(job.id, accountId, job.persona, job.data.themeName);
  const result = await uploadVideoToCloudinary(videoBuffer, accountId, {
    folder: config.CLOUDINARY_VIDEOS_FOLDER,
    public_id: publicId,
    resource_type: 'video',
  });

  if (config.DEBUG_MODE) {
    console.log(`[DEBUG] Video uploaded to Cloudinary AND saved locally: ${result.secure_url}`);
  }

  return { videoUrl: result.secure_url, videoSize: videoBuffer.length, audioFile: audioFileName };
}


function getFrameDuration(questionData: any, frameNumber: number, layoutType?: string): number {
  if (!questionData || typeof questionData !== 'object') {
    return 5; // Safe fallback for invalid data - increased from 4
  }
  
  // SIMPLIFIED FORMATS: Single frame gets full video duration
  if (layoutType === 'simplified_word') {
    if (frameNumber === 1) {
      return 15; // 15 seconds for the single comprehensive frame
    }
    return 0; // No other frames should exist
  }
  
  const MIN_DURATION = 1.5; // Minimum time to register visual content
  
  switch (frameNumber) {
    case 1: // First Frame (Hook Frame - should be short and punchy)
      // Hook frames should be brief and attention-grabbing, max 1.5s
      return MIN_DURATION; // 1.5s for hooks
      
      
    case 2: // Second Frame (varies by format)
      // MCQ: answer, Common Mistake: correct, Quick Fix: advanced_word, Quick Tip: result, Usage Demo: right_example, Challenge: challenge
      
      return 3;
      
    case 3: // Third Frame (if exists)
      // MCQ: explanation, Common Mistake: practice, Usage Demo: practice, Challenge: reveal
        return 2;
      
    case 4: // Fourth Frame (if exists - Challenge: cta)
        return 2;
      
    case 5: // Fifth Frame (if exists - rare, but possible for future formats)
      return 2; // Standard duration for additional frames - increased from 3
      
    default:
      return 2; // Fallback - increased from 4
  }
}
// --- MODIFICATION END ---


export const runtime = 'nodejs';
export const maxDuration = 300;