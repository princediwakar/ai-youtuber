


















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


export async function POST(request: NextRequest) {
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

    console.log(`🚀 Starting single video assembly for account: ${accountId || 'all'}`);

    // --- FIX: The main logic now runs directly in the request. ---
    // This is more robust for serverless environments as it finds and processes ONE job.
    
    // 1. Auto-retry previously failed jobs (this is a quick check)
    await autoRetryFailedJobs();
      
    // 2. Fetch the single oldest job pending assembly (Step 3)
    const job = await getOldestPendingJob(3, accountId);
    
    if (!job) {
      const message = `No jobs pending video assembly for account: ${accountId || 'all'}.`;
      console.log(message);
      return NextResponse.json({ success: true, message });
    }

    console.log(`[Video Assembly] Found job ${job.id}. Starting process...`);

    // 3. Process the single job within a try/catch block
    try {
      await processJob(job);
      console.log(`[Video Assembly] Successfully completed job ${job.id}.`);
      return NextResponse.json({ success: true, processedJobId: job.id });
    } catch (error) {
       // This catch block is critical. It marks the job as failed in the database,
       // preventing an infinite loop of failures.
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Video Assembly] CRITICAL ERROR processing job ${job.id}:`, error);
      await updateJob(job.id, {
        status: 'failed',
        error_message: `Video assembly failed: ${errorMessage.substring(0, 500)}`
      });
      return NextResponse.json({ success: false, error: errorMessage, failedJobId: job.id }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Video assembly endpoint failed:', error);
    return NextResponse.json({ success: false, error: 'Video assembly endpoint failed' }, { status: 500 });
  }
}

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

  } catch (error) {
    // Re-throw the error to be caught by the main POST handler,
    // which will then mark the job as failed in the database.
    throw error;
  } finally {
    // Cleanup the temporary directory regardless of success or failure
    await fs.rm(tempDir, { recursive: true, force: true }).catch(e => console.warn(`Failed to cleanup temp dir ${tempDir}:`, e));
  }
}

async function assembleVideoWithConcat(frameUrls: string[], job: QuizJob, tempDir: string): Promise<{videoUrl: string, videoSize: number, audioFile: string | null}> {
  const ffmpegPath = getFFmpegPath();
  const framePaths = await Promise.all(
    frameUrls.map(async (url, index) => {
      const frameBuffer = await downloadImageFromCloudinary(url);
      const framePath = path.join(tempDir, `frame-${String(index + 1).padStart(3, '0')}.png`);
      await fs.writeFile(framePath, new Uint8Array(frameBuffer));
      return framePath;
    })
  );

  const durations = Array.from({ length: framePaths.length }, (_, index) => {
    return getFrameDuration(job.data.content || {}, index + 1, job.data.layoutType) || 4;
  });

  const outputVideoPath = path.join(tempDir, `quiz-${job.id}.mp4`);
  const audioPath = getRandomAudioFile();
  const audioFileName = audioPath ? path.basename(audioPath) : null;
  const clipPaths: string[] = [];

  for (let i = 0; i < framePaths.length; i++) {
    const framePath = framePaths[i];
    const duration = durations[i] || 4;
    const clipPath = path.join(tempDir, `clip-${i}.mp4`);
    
    const clipArgs = [
      '-loop', '1', '-i', framePath, '-t', String(duration), '-c:v', 'libx264',
      '-preset', 'ultrafast', '-crf', '30', '-pix_fmt', 'yuv420p',
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black',
      '-threads', '2', '-y', clipPath
    ];
    
    await new Promise<void>((resolve, reject) => {
      const process = spawn(ffmpegPath, clipArgs, { cwd: tempDir });
      let stderr = '';
      const timeoutId = setTimeout(() => {
        process.kill('SIGKILL');
        reject(new Error(`Frame ${i} processing timed out after 40 seconds`));
      }, 40000); // 40 second timeout per frame
      
      process.stderr?.on('data', (d) => { stderr += d.toString(); });
      process.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) resolve();
        else reject(new Error(`Frame ${i} failed with code ${code}: ${stderr.slice(-300)}`));
      });
      process.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
    
    clipPaths.push(clipPath);
  }

  const concatContent = clipPaths.map(p => `file '${path.basename(p)}'`).join('\n');
  const concatFilePath = path.join(tempDir, 'concat.txt');
  await fs.writeFile(concatFilePath, concatContent);

  const ffmpegArgs = audioPath ? [
      '-f', 'concat', '-safe', '0', '-i', concatFilePath, '-i', audioPath,
      '-c:v', 'copy', '-c:a', 'aac', '-filter:a', 'volume=0.3', '-shortest', '-y', outputVideoPath
    ] : [
      '-f', 'concat', '-safe', '0', '-i', concatFilePath, '-c:v', 'copy', '-y', outputVideoPath
    ];

  await new Promise<void>((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, { cwd: tempDir });
    let stderr = '';
    const timeoutId = setTimeout(() => {
      ffmpegProcess.kill('SIGKILL');
      reject(new Error('FFmpeg final assembly timed out after 30 seconds'));
    }, 30000);
    
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

  const videoBuffer = await fs.readFile(outputVideoPath);
  await saveDebugVideo(videoBuffer, job.id, job.data.themeName, job.persona);
  
  if (!job.account_id) throw new Error(`Job ${job.id} is missing account_id`);
  
  const publicId = generateVideoPublicId(job.id, job.account_id, job.persona, job.data.themeName);
  const result = await uploadVideoToCloudinary(videoBuffer, job.account_id, {
    folder: config.CLOUDINARY_VIDEOS_FOLDER,
    public_id: publicId,
    resource_type: 'video',
  });

  return { videoUrl: result.secure_url, videoSize: videoBuffer.length, audioFile: audioFileName };
}


export const runtime = 'nodejs';
export const maxDuration = 300;
