// app/api/jobs/assemble-video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOldestPendingJob, updateJob } from '@/lib/database';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';
import { 
  downloadImageFromCloudinary, 
  uploadVideoToCloudinary, 
  generateVideoPublicId 
} from '@/lib/cloudinary';
import { QuizJob } from '@/lib/types';
import { config } from '@/lib/config';

// Helper functions for video assembly
function getFFmpegPath(): string {
  // NOTE: This require must be inside the function to be safe in module environments
  const { existsSync } = require('fs');
  let ffmpegPath = '';

  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    ffmpegPath = ffmpegInstaller.path;

    if (typeof ffmpegPath === 'string' && existsSync(ffmpegPath)) {
      console.log(`✅ FFmpeg binary found via @ffmpeg-installer/ffmpeg: ${ffmpegPath}`);
      return ffmpegPath;
    }
  } catch (error) {
    console.error('❌ CRITICAL: Failed to load @ffmpeg-installer/ffmpeg:', error instanceof Error ? error.message : String(error));
  }

  const errMsg = 'FFmpeg binary not found or inaccessible. Check deployment bundling/limits.';
  console.error(`❌ ${errMsg}`);
  throw new Error(errMsg);
}

const AUDIO_FILES = ['1.mp3', '2.mp3', '3.mp3'];

function getRandomAudioFile(): string {
  const randomIndex = Math.floor(Math.random() * AUDIO_FILES.length);
  const selectedAudio = AUDIO_FILES[randomIndex];
  // Use path.join to correctly resolve the path regardless of OS
  const audioPath = path.join(process.cwd(), 'public', 'audio', selectedAudio);
  
  // NOTE: This require must be inside the function to be safe in module environments
  if (!require('fs').existsSync(audioPath)) {
    console.warn(`Audio file not found at ${audioPath}`);
    return ""; // Return empty string if not found
  }
  return audioPath;
}

// Ensure this check is always run *first* before file system interaction
async function saveDebugVideo(videoBuffer: Buffer, jobId: string, themeName?: string, persona?: string) {
  if (!config.DEBUG_MODE) return;
  try {
    // CRITICAL FIX: Use /tmp, as the function's root directory (/var/task) is read-only.
    const debugDir = path.join(tmpdir(), 'generated-videos-debug');
    await fs.mkdir(debugDir, { recursive: true });
    const fileName = `video-${persona || 'unk'}-${themeName || 'unk'}-${jobId}.mp4`;
    const destinationPath = path.join(debugDir, fileName);
    await fs.writeFile(destinationPath, new Uint8Array(videoBuffer));
    console.log(`[DEBUG] Video for job ${jobId} saved to: ${destinationPath}`);
  } catch (error) {
    console.error(`[DEBUG] Failed to save debug video for job ${jobId}:`, error);
  }
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

/**
 * Executes the entire assembly and upload process. This function is designed
 * to run in the background (unawaited) or synchronously.
 */
async function processJob(job: QuizJob): Promise<{ processedJobId: string, videoUrl: string, videoSize: number }> {
  const tempDir = path.join(tmpdir(), `quiz-video-${job.id}-${Date.now()}`);
  const startTime = Date.now();

  try {
    console.log(`[Job ${job.id}] Assembling video...`);
    
    const frameUrls = job.data.frameUrls;
    if (!frameUrls || frameUrls.length === 0) {
      throw new Error('No frame URLs found in job data');
    }

    await fs.mkdir(tempDir, { recursive: true });
    
    // Core assembly work (LLM, FFmpeg, Cloudinary Upload)
    const { videoUrl, videoSize, audioFile, duration } = await assembleVideoFast(frameUrls, job, tempDir);
    
    await updateJob(job.id, {
      step: 4,
      status: 'upload_pending',
      data: { ...job.data, videoUrl, videoSize, audioFile, assembleDuration: duration }
    });
    
    console.log(`[Job ${job.id}] ✅ Video assembly successful. Duration: ${duration.toFixed(2)}s`);

    return { processedJobId: job.id, videoUrl, videoSize };

  } catch (error) {
    // This catch block is critical. It marks the job as failed.
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = (Date.now() - startTime) / 1000;
    console.error(`[Video Assembly] CRITICAL ERROR processing job ${job.id} (Time: ${duration.toFixed(2)}s):`, error);
    
    await updateJob(job.id, {
      status: 'failed',
      error_message: `Video assembly failed: ${errorMessage.substring(0, 500)}`
    });

    // Re-throw the error to ensure the async response handling logs it.
    throw error;
  } finally {
    // Cleanup the temporary directory regardless of success or failure
    await fs.rm(tempDir, { recursive: true, force: true }).catch(e => console.warn(`Failed to cleanup temp dir ${tempDir}:`, e));
  }
}


/**
 * The main entry point for the API route.
 * It fetches the job and then delegates the long-running work to an unawaited function.
 */
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
      // No body, process for all accounts if desired
    }

    console.log(`🚀 Starting ASYNC video assembly check for account: ${accountId || 'all'}`);
      
    // 1. Fetch the single oldest job pending assembly (Step 3)
    const jobFetchStartTime = Date.now();
    const job = await getOldestPendingJob(3, accountId);
    const jobFetchDuration = (Date.now() - jobFetchStartTime) / 1000;
    
    if (!job) {
      const message = `No jobs pending video assembly for account: ${accountId || 'all'}. (Job Fetch: ${jobFetchDuration.toFixed(2)}s)`;
      console.log(message);
      return NextResponse.json({ success: true, message });
    }

    // 2. Delegate the heavy lifting to an unawaited promise
    console.log(`[Video Assembly] Found job ${job.id}. Starting ASYNC process...`);

    // --- CRITICAL ASYNC EXECUTION ---
    // The promise is NOT awaited. It runs in the background.
    // The .catch() ensures any failure is logged and the DB status is updated.
    processJob(job).catch((error) => {
        // Since processJob already updates the database status to 'failed',
        // we just log the final error here.
        console.error(`[Video Assembly] ASYNC JOB FAILED in background for job ${job.id}:`, error);
    });

    // 3. Respond immediately to the HTTP request
    const responseDuration = (Date.now() - requestStartTime) / 1000;
    console.log(`[Video Assembly] ASYNC response sent for job ${job.id}. Response time: ${responseDuration.toFixed(2)}s.`);

    return NextResponse.json({ 
      success: true, 
      message: `Job ${job.id} started ASYNC processing. Check logs for completion.`,
      processedJobId: job.id 
    });

  } catch (error) {
    const responseDuration = (Date.now() - requestStartTime) / 1000;
    console.error(`❌ Video assembly endpoint failed (Total time: ${responseDuration.toFixed(2)}s):`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: 'Video assembly endpoint failed', details: errorMessage }, { status: 500 });
  }
}

/**
 * Optimized video assembly using a single FFmpeg pass with the concat demuxer
 * and duration flags on input images. This eliminates the intermediate clip generation.
 */
async function assembleVideoFast(frameUrls: string[], job: QuizJob, tempDir: string): Promise<{videoUrl: string, videoSize: number, audioFile: string | null, duration: number}> {
  const startTime = Date.now();
  const ffmpegPath = getFFmpegPath();
  
  // 1. Download Frames Concurrently
  const durations: number[] = [];
  const framePaths = await Promise.all(frameUrls.map(async (url, index) => {
    const downloadStart = Date.now();
    const frameBuffer = await downloadImageFromCloudinary(url);
    const framePath = path.join(tempDir, `frame-${String(index + 1).padStart(3, '0')}.png`);
    await fs.writeFile(framePath, new Uint8Array(frameBuffer));
    
    // Calculate and store duration after successful download
    const duration = getFrameDuration(job.data.content || {}, index + 1, job.data.layoutType) || 4;
    durations.push(duration);
    
    console.log(`[Job ${job.id}] Downloaded frame ${index + 1} (${duration.toFixed(1)}s) in ${((Date.now() - downloadStart) / 1000).toFixed(3)}s`);
    return framePath;
  }));

  const outputVideoPath = path.join(tempDir, `quiz-${job.id}.mp4`);
  const audioPath = getRandomAudioFile();
  const audioFileName = audioPath ? path.basename(audioPath) : null;

  // 2. Generate Concat File for Single Pass
  const concatContent = framePaths.map((p, i) => 
    `file '${path.basename(p)}'\nduration ${durations[i]}`
  ).join('\n') + `\nfile '${path.basename(framePaths[framePaths.length - 1])}'`; // Repeat last frame for proper duration count
  
  const concatFilePath = path.join(tempDir, 'concat.txt');
  await fs.writeFile(concatFilePath, concatContent);

  // 3. Execute Single FFmpeg Command (Video & Audio)
  // FIX: Corrected typo from Date.ISONStart to Date.now()
  const finalAssemblyStart = Date.now(); 
  
  // 3a. Input Arguments (must come first)
  const inputArgs: string[] = [
    // Video input (images via concat demuxer)
    '-f', 'concat', '-safe', '0', '-i', concatFilePath, 
  ];

  if (audioPath) {
    // Audio input
    inputArgs.push('-i', audioPath);
  }

  // 3b. Processing & Output Arguments (come after all -i flags)
  const outputArgs: string[] = [
    // Video Codec Arguments (Optimized for speed)
    '-c:v', 'libx264', 
    '-preset', 'ultrafast', // Most aggressive speed preset
    '-crf', '28', // Slightly lower quality for major speed increase
    '-pix_fmt', 'yuv420p',
    // Scale filter (must be applied since we are re-encoding)
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,setsar=1',
    '-r', '25', // Target 25 FPS
  ];

  if (audioPath) {
    // Audio options
    outputArgs.push(
      '-c:a', 'aac', 
      '-filter_complex', '[1:a]volume=0.3[aout]', // Stream 1 (audio) gets volume filter
      '-map', '0:v', // Map video stream from first input (concat)
      '-map', '[aout]', // Map audio output from complex filter
      '-shortest', // Stop video when audio ends (or vice-versa)
    );
  } else {
    // If no audio, make sure to map the video stream explicitly
    outputArgs.push('-map', '0:v');
  }

  const ffmpegArgs = [
    ...inputArgs,
    ...outputArgs,
    '-y', outputVideoPath // Output file
  ];

  await new Promise<void>((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, { cwd: tempDir });
    let stderr = '';
    // Increase timeout to 40s to cover all file reading/encoding time
    const timeoutId = setTimeout(() => {
      ffmpegProcess.kill('SIGKILL');
      reject(new Error('FFmpeg final assembly timed out after 40 seconds'));
    }, 40000); 
    
    ffmpegProcess.stderr?.on('data', (d) => { stderr += d.toString(); });
    ffmpegProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}. Stderr: ${stderr.slice(-500)}`));
    });
    ffmpegProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
  console.log(`[Job ${job.id}] Final assembly (single-pass) finished in ${((Date.now() - finalAssemblyStart) / 1000).toFixed(3)}s.`);


  // 4. Upload to Cloudinary (remains the same)
  const uploadStart = Date.now();
  const videoBuffer = await fs.readFile(outputVideoPath);
  await saveDebugVideo(videoBuffer, job.id, job.data.themeName, job.persona);
  
  if (!job.account_id) throw new Error(`Job ${job.id} is missing account_id`);
  
  const publicId = generateVideoPublicId(job.id, job.account_id, job.persona, job.data.themeName);
  const result = await uploadVideoToCloudinary(videoBuffer, job.account_id, {
    folder: config.CLOUDINARY_VIDEOS_FOLDER,
    public_id: publicId,
    resource_type: 'video',
  });
  console.log(`[Job ${job.id}] Cloudinary upload finished in ${((Date.now() - uploadStart) / 1000).toFixed(3)}s.`);

  return { 
    videoUrl: result.secure_url, 
    videoSize: videoBuffer.length, 
    audioFile: audioFileName,
    duration: (Date.now() - startTime) / 1000
  };
}

export const runtime = 'nodejs';
export const maxDuration = 300;