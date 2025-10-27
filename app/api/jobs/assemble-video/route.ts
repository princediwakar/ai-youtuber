// app/api/jobs/assemble-video/route.ts
import { NextRequest, NextResponse } from 'next/server';
// --- FIX: Import getOldestPendingJob instead of getPendingJobs ---
import { getOldestPendingJob, updateJob, autoRetryFailedJobs } from '@/lib/database';
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

// --- TIME LOGGING UTILITY ---
const timeMap: Record<string, number> = {};
function timeStart(key: string) {
  timeMap[key] = Date.now();
}
function timeEnd(key: string) {
  const start = timeMap[key];
  if (!start) return;
  const duration = ((Date.now() - start) / 1000).toFixed(3); // Log in seconds, 3 decimal places
  console.log(`${key}: ${duration}s`);
  delete timeMap[key];
  return duration;
}
// ----------------------------

// Helper functions for video assembly
function getFFmpegPath(): string {
  const { existsSync } = require('fs');
  try {
    const ffmpeg = require('@ffmpeg-installer/ffmpeg');
    if (ffmpeg.path && typeof ffmpeg.path === 'string' && existsSync(ffmpeg.path)) {
      console.log(`✅ FFmpeg found via @ffmpeg-installer/ffmpeg: ${ffmpeg.path}`);
      return ffmpeg.path;
    }
  } catch (error) {
    console.warn('Could not require @ffmpeg-installer/ffmpeg:', error instanceof Error ? error.message : String(error));
  }
  console.log('✅ Fallback to system FFmpeg');
  return 'ffmpeg';
}

const AUDIO_FILES = ['1.mp3', '2.mp3', '3.mp3'];

function getRandomAudioFile(): string {
  const randomIndex = Math.floor(Math.random() * AUDIO_FILES.length);
  const selectedAudio = AUDIO_FILES[randomIndex];
  const audioPath = path.join(process.cwd(), 'public', 'audio', selectedAudio);
  if (!require('fs').existsSync(audioPath)) {
    console.warn(`Audio file not found at ${audioPath}`);
    return ""; // Return empty string if not found
  }
  return audioPath;
}

async function saveDebugVideo(videoBuffer: Buffer, jobId: string, themeName?: string, persona?: string) {
  if (!config.DEBUG_MODE) return;
  try {
    const debugDir = path.join(process.cwd(), 'generated-videos');
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
    return 6.0; // Generous default safe fallback
  }
  
  // Handle the special single-frame simplified_word layout
  if (layoutType === 'simplified_word') {
    if (frameNumber === 1) {
      // Single comprehensive frame needs significant time
      return 15.0; 
    }
    return 0; // No other frames should exist
  }
  
  // Fixed, generous durations based on frame purpose:
  switch (frameNumber) {
    case 1: 
      return 8.0; // 
      
    case 2: // Main Question/Setup/Key Concept (CRITICAL for MCQ Question + Options)
      // This is the most complex reading frame, requiring the most time.
      return 8.0; // Significantly increased to 8.0s
      
    case 3: // Secondary Content / Answer Reveal
      return 4.0; // Increased to 4.0s
      
    case 4: // Deep Content / Explanation / Practice
      return 7.0; // Increased to 7.0s
      
    case 5: // CTA Frame (Final prompt/call to action)
      return 3.5; // Increased to 3.5s
      
    default:
      return 4.0; // Fallback
  }
}


export async function POST(request: NextRequest) {
  timeStart('POST /assemble-video');
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      timeEnd('POST /assemble-video');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let accountId: string | undefined;
    try {
      const body = await request.json();
      accountId = body.accountId;
    } catch {
      // No body, process for all accounts if desired
    }

    console.log(`🚀 Starting single video assembly for account: ${accountId || 'all'}`);

    // 1. Auto-retry previously failed jobs (this is a quick check)
    timeStart('autoRetryFailedJobs');
    await autoRetryFailedJobs();
    timeEnd('autoRetryFailedJobs');
      
    // 2. Fetch the single oldest job pending assembly (Step 3)
    timeStart('getOldestPendingJob');
    const job = await getOldestPendingJob(3, accountId);
    timeEnd('getOldestPendingJob');
    
    if (!job) {
      const message = `No jobs pending video assembly for account: ${accountId || 'all'}.`;
      console.log(message);
      timeEnd('POST /assemble-video');
      return NextResponse.json({ success: true, message });
    }

    console.log(`[Video Assembly] Found job ${job.id}. Starting process...`);

    // 3. Process the single job within a try/catch block
    try {
      timeStart(`processJob ${job.id}`);
      await processJob(job);
      timeEnd(`processJob ${job.id}`);
      console.log(`[Video Assembly] Successfully completed job ${job.id}.`);
      timeEnd('POST /assemble-video');
      return NextResponse.json({ success: true, processedJobId: job.id });
    } catch (error) {
       // This catch block is critical. It marks the job as failed in the database,
       // preventing an infinite loop of failures.
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Video Assembly] CRITICAL ERROR processing job ${job.id}:`, error);
      
      timeStart(`updateJob-fail ${job.id}`);
      await updateJob(job.id, {
        status: 'failed',
        error_message: `Video assembly failed: ${errorMessage.substring(0, 500)}`
      });
      timeEnd(`updateJob-fail ${job.id}`);
      
      timeEnd('POST /assemble-video');
      return NextResponse.json({ success: false, error: errorMessage, failedJobId: job.id }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Video assembly endpoint failed:', error);
    timeEnd('POST /assemble-video');
    return NextResponse.json({ success: false, error: 'Video assembly endpoint failed' }, { status: 500 });
  }
}

async function processJob(job: QuizJob) {
  const tempDir = path.join(tmpdir(), `quiz-video-${job.id}-${Date.now()}`);
  const jobKey = `Job ${job.id}`; // Base key for all job-specific timings
  try {
    console.log(`[Job ${job.id}] Assembling video...`);
    const frameUrls = job.data.frameUrls;
    if (!frameUrls || frameUrls.length === 0) {
      throw new Error('No frame URLs found in job data');
    }

    timeStart(`${jobKey} - Make temp dir`);
    await fs.mkdir(tempDir, { recursive: true });
    timeEnd(`${jobKey} - Make temp dir`);
    
    timeStart(`${jobKey} - assembleVideoWithConcat`);
    const { videoUrl, videoSize, audioFile } = await assembleVideoWithConcat(frameUrls, job, tempDir);
    timeEnd(`${jobKey} - assembleVideoWithConcat`);
    
    timeStart(`${jobKey} - updateJob-success`);
    await updateJob(job.id, {
      step: 4,
      status: 'upload_pending',
      data: { ...job.data, videoUrl, videoSize, audioFile }
    });
    timeEnd(`${jobKey} - updateJob-success`);
    
    console.log(`[Job ${job.id}] ✅ Video assembly successful: ${videoUrl}`);

  } catch (error) {
    // Re-throw the error to be caught by the main POST handler,
    // which will then mark the job as failed in the database.
    throw error;
  } finally {
    // Cleanup the temporary directory regardless of success or failure
    timeStart(`${jobKey} - Cleanup temp dir`);
    await fs.rm(tempDir, { recursive: true, force: true }).catch(e => console.warn(`Failed to cleanup temp dir ${tempDir}:`, e));
    timeEnd(`${jobKey} - Cleanup temp dir`);
  }
}

async function assembleVideoWithConcat(frameUrls: string[], job: QuizJob, tempDir: string): Promise<{videoUrl: string, videoSize: number, audioFile: string | null}> {
  const ffmpegPath = getFFmpegPath();
  const jobKey = `Job ${job.id}`;
  
  timeStart(`${jobKey} - Download frames`);
  const framePaths = await Promise.all(
    frameUrls.map(async (url, index) => {
      const frameBuffer = await downloadImageFromCloudinary(url);
      const framePath = path.join(tempDir, `frame-${String(index + 1).padStart(3, '0')}.png`);
      await fs.writeFile(framePath, new Uint8Array(frameBuffer));
      return framePath;
    })
  );
  timeEnd(`${jobKey} - Download frames`);

  const durations = Array.from({ length: framePaths.length }, (_, index) => {
    // Get duration for each frame. Default to 4 seconds.
    return getFrameDuration(job.data.content || {}, index + 1, job.data.layoutType) || 4;
  });

  const outputVideoPath = path.join(tempDir, `quiz-${job.id}.mp4`);
  const audioPath = getRandomAudioFile();
  const audioFileName = audioPath ? path.basename(audioPath) : null;

  // --- START OPTIMIZATION: Replacing the clip-by-clip loop ---
  timeStart(`${jobKey} - Single FFmpeg assembly`);

  // 1. Build the input arguments
  const inputArgs: string[] = [];
  for (const framePath of framePaths) {
    inputArgs.push('-i', framePath);
  }
  
  // 2. Build the filter_complex graph
  let filterComplex = '';
  let concatInputs = '';
  let totalDuration = 0;

  for (let i = 0; i < framePaths.length; i++) {
    const duration = durations[i];
    totalDuration += duration;
    
    // Scale and Pad filter (same as your clip generation step)
    const scalePadFilter = 
      `scale=1080:1920:force_original_aspect_ratio=decrease,` + 
      `pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black`;

    // Process each image: scale, pad, and use tpad to hold the frame for 'duration' seconds
    filterComplex += 
      `[${i}:v]${scalePadFilter},` + 
      `setpts=N/FRAME_RATE/TB,` + 
      `tpad=stop_mode=clone:stop_duration=${duration}[v${i}];`; // Hold frame for duration
    
    concatInputs += `[v${i}]`; // Add processed video stream to the final concatenation list
  }

  // Final concatenation of all video streams
  filterComplex += `${concatInputs}concat=n=${framePaths.length}:v=1:a=0[v_out]`;

  // 3. Build the full FFmpeg command arguments
  const videoOutputArgs = [
    // Input files (images)
    ...inputArgs,
    
    // Audio input (if present)
    ...(audioPath ? ['-i', audioPath] : []),
    
    // Filter complex graph (The core of the assembly)
    '-filter_complex', filterComplex,
    
    // Video encoding
    '-map', '[v_out]',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '30',
    '-pix_fmt', 'yuv420p',

    // Audio encoding and mapping
    ...(audioPath ? [
        '-map', `${frameUrls.length}:a`, // The audio input index will be the last one
        '-c:a', 'aac',
        '-filter:a', 'volume=0.3', 
        '-shortest', // Stop video stream when audio ends 
    ] : []),
    
    '-threads', '2',
    '-y',
    outputVideoPath,
  ];

  await new Promise<void>((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, videoOutputArgs, { cwd: tempDir });
    let stderr = '';
    
    // Adjusted timeout based on expected total video length + buffer (e.g., total duration + 20s)
    const processTimeout = (totalDuration * 1000) + 20000; 
    console.log(`[Job ${job.id}] Total video duration: ${totalDuration.toFixed(1)}s. Setting FFmpeg timeout to ${Math.min(processTimeout, 120000)}ms.`);
    
    const timeoutId = setTimeout(() => {
      ffmpegProcess.kill('SIGKILL');
      reject(new Error(`FFmpeg single assembly timed out after ${Math.min(processTimeout, 120000) / 1000} seconds`));
    }, Math.min(processTimeout, 120000)); // Cap the timeout at 120 seconds

    ffmpegProcess.stderr?.on('data', (d) => { stderr += d.toString(); });
    ffmpegProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}. Stderr: ${stderr.slice(-1000)}`));
    });
    ffmpegProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });

  timeEnd(`${jobKey} - Single FFmpeg assembly`);
  // --- END OPTIMIZATION ---

  const videoBuffer = await fs.readFile(outputVideoPath);
  
  timeStart(`${jobKey} - Debug save/Upload`);
  await saveDebugVideo(videoBuffer, job.id, job.data.themeName, job.persona); 
  
  if (!job.account_id) throw new Error(`Job ${job.id} is missing account_id`);
  
  const publicId = generateVideoPublicId(job.id, job.account_id, job.persona, job.data.themeName);
  const result = await uploadVideoToCloudinary(videoBuffer, job.account_id, {
    folder: config.CLOUDINARY_VIDEOS_FOLDER,
    public_id: publicId,
    resource_type: 'video',
  });
  timeEnd(`${jobKey} - Debug save/Upload`);

  return { videoUrl: result.secure_url, videoSize: videoBuffer.length, audioFile: audioFileName };
}

export const runtime = 'nodejs';
export const maxDuration = 300;