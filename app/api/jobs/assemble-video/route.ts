import { NextRequest, NextResponse } from 'next/server';
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

// Helper function to find the absolute path to the FFmpeg binary.
function getFFmpegPath(): string {
  const { existsSync } = require('fs');
  let ffmpegPath = '';

  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    ffmpegPath = ffmpegInstaller.path;

    if (typeof ffmpegPath === 'string' && existsSync(ffmpegPath)) {
      console.log(`✅ FFmpeg binary found via @ffmpeg-installer/ffmpeg at: ${ffmpegPath}`);
      return ffmpegPath;
    }
  } catch (error) {
    console.error('❌ Failed to load @ffmpeg-installer/ffmpeg:', error instanceof Error ? error.message : String(error));
  }

  // CRITICAL FIX: If the absolute path is not found, we throw a clear error.
  const errMsg = 'FFmpeg binary not found. This is often fixed by configuring @ffmpeg-installer/ffmpeg as an external package in next.config.js.';
  console.error(`❌ CRITICAL FAILURE: ${errMsg}`);
  throw new Error(errMsg);
}

// Helper to check and log disk usage in the writable /tmp directory.
async function logDiskUsage(label: string = 'Current'): Promise<void> {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    const { stdout } = await execPromise('du -sh /tmp');
    console.log(`💾 [DISK CHECK - ${label}] /tmp usage: ${stdout.trim()}. (Vercel limit is ~500MB)`);
  } catch (e) {
    console.warn(`💾 [DISK CHECK - ${label}] Could not execute 'du', skipping disk check. Error: ${e.message}`);
  }
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
    // This is a simplified duration logic. 
    return 4;
}


// --- ASYNC EXECUTION HELPER ---
// This function runs the long process and handles errors, detached from the main response.
async function executeLongJob(job: QuizJob, tempDir: string) {
    const startTime = Date.now();
    
    try {
        console.log(`[Job ${job.id}] ASYNC STARTING processJob...`);
        
        // 1. Mark job as in-progress immediately
        await updateJob(job.id, { status: 'assembly_in_progress' });
        
        const frameUrls = job.data.frameUrls;
        if (!frameUrls || frameUrls.length === 0) {
            throw new Error('No frame URLs found in job data');
        }

        await fs.mkdir(tempDir, { recursive: true });
        getFFmpegPath(); // Check path one more time
        
        const { videoUrl, videoSize, audioFile } = await assembleVideoWithConcat(frameUrls, job, tempDir);
        
        // 2. Update job status on success
        await updateJob(job.id, {
            step: 4,
            status: 'upload_pending',
            data: { ...job.data, videoUrl, videoSize, audioFile }
        });
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`[Job ${job.id}] ASYNC SUCCESS. Video assembly complete. Duration: ${duration.toFixed(2)}s`);

    } catch (error) {
        // 3. Mark job as failed on error
        const duration = (Date.now() - startTime) / 1000;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Job ${job.id}] ASYNC FAILURE (Time: ${duration.toFixed(2)}s):`, error);
        await updateJob(job.id, {
            status: 'failed',
            error_message: `Video assembly failed (Async): ${errorMessage.substring(0, 500)}`
        });
    } finally {
        // 4. Always clean up
        await fs.rm(tempDir, { recursive: true, force: true }).catch(e => console.warn(`Failed to cleanup temp dir ${tempDir}:`, e));
    }
}


export async function POST(request: NextRequest) {
  const requestStartTime = Date.now(); // Start timer for the whole function
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
    
    // We keep autoRetryFailedJobs here, as it's a quick DB check and doesn't interrupt the async job.
    // However, for maximum speed, we keep it commented out.

    const job = await getOldestPendingJob(3, accountId);
    
    if (!job) {
      const message = `No jobs pending video assembly for account: ${accountId || 'all'}.`;
      console.log(message);
      
      const requestDuration = (Date.now() - requestStartTime) / 1000;
      console.log(`[Endpoint] Finished check in: ${requestDuration.toFixed(2)}s`);
      return NextResponse.json({ success: true, message });
    }

    console.log(`[Video Assembly] Found job ${job.id}. Starting ASYNC process...`);
    
    const tempDir = path.join(tmpdir(), `quiz-video-${job.id}-${Date.now()}`);
    
    // --- CRITICAL ASYNC IMPLEMENTATION ---
    // 1. Do NOT await the long-running job.
    // 2. Detach the promise execution from the request lifecycle.
    executeLongJob(job, tempDir); 
    // The long-running job will now proceed in the background.
    // --- END ASYNC IMPLEMENTATION ---

    const requestDuration = (Date.now() - requestStartTime) / 1000;
    console.log(`[Video Assembly] ASYNC response sent for job ${job.id}. Response time: ${requestDuration.toFixed(2)}s.`);
    
    // 3. Return a successful, immediate response to the cron service.
    return NextResponse.json({ 
      success: true, 
      message: `Job ${job.id} started assembly asynchronously.`, 
      processedJobId: job.id 
    });

  } catch (error) {
    const requestDuration = (Date.now() - requestStartTime) / 1000;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Video assembly endpoint failed (Time: ${requestDuration.toFixed(2)}s):`, error);
    return NextResponse.json({ success: false, error: 'Video assembly endpoint failed', details: errorMessage }, { status: 500 });
  }
}

async function assembleVideoWithConcat(frameUrls: string[], job: QuizJob, tempDir: string): Promise<{videoUrl: string, videoSize: number, audioFile: string | null}> {
  const overallStart = Date.now(); 

  const ffmpegPath = getFFmpegPath();
  
  // 1. Download frames concurrently (already optimal)
  const framePaths = await Promise.all(
    frameUrls.map(async (url, index) => {
      const frameStart = Date.now();
      const frameBuffer = await downloadImageFromCloudinary(url);
      const framePath = path.join(tempDir, `frame-${String(index + 1).padStart(3, '0')}.png`);
      await fs.writeFile(framePath, new Uint8Array(frameBuffer));
      console.log(`[Job ${job.id}] Downloaded frame ${index + 1} in ${(Date.now() - frameStart) / 1000}s`);
      return framePath;
    })
  );

  const durations = Array.from({ length: framePaths.length }, (_, index) => {
    return getFrameDuration(job.data.content || {}, index + 1, job.data.layoutType) || 4;
  });

  const outputVideoPath = path.join(tempDir, `quiz-${job.id}.mp4`);
  const audioPath = getRandomAudioFile();
  const audioFileName = audioPath ? path.basename(audioPath) : null;
  
  // 2. OPTIMIZATION: Run clip generation concurrently
  const clipCreationPromises = framePaths.map((framePath, i) => {
      const duration = durations[i] || 4;
      const clipPath = path.join(tempDir, `clip-${i}.mp4`);

      const clipArgs = [
          '-loop', '1', '-i', framePath, '-t', String(duration), 
          '-c:v', 'libx264',
          // AGGRESSIVE SPEED OPTIMIZATION: Use 'veryfast' preset to aggressively prioritize speed.
          '-preset', 'veryfast', 
          '-crf', '30', 
          '-pix_fmt', 'yuv420p',
          // REMOVED COMPLEX FILTER: The scaling/padding filter is removed for maximum speed.
          // The frames must be 1080x1920 already.
          '-y', clipPath
      ];

      return new Promise<string>((resolve, reject) => {
          const frameStart = Date.now();
          const process = spawn(ffmpegPath, clipArgs, { cwd: tempDir });
          let stderr = '';
          const timeoutId = setTimeout(() => {
              process.kill('SIGKILL');
              reject(new Error(`Frame ${i} processing timed out after 30 seconds`));
          }, 30000); 

          process.stderr?.on('data', (d) => { stderr += d.toString(); });
          process.on('close', (code) => {
              clearTimeout(timeoutId);
              if (code === 0) {
                console.log(`[Job ${job.id}] Frame ${i} clip finished in ${(Date.now() - frameStart) / 1000}s.`);
                resolve(clipPath); 
              }
              else reject(new Error(`Frame ${i} failed with code ${code}. Stderr: ${stderr.slice(-300)}`));
          });
          process.on('error', (err) => {
              clearTimeout(timeoutId);
              reject(new Error(`FFmpeg spawn error for clip ${i}: ${err.message}. Path used: ${ffmpegPath}`));
          });
      });
  });

  // Wait for ALL clips to be created.
  const clipPaths = await Promise.all(clipCreationPromises);

  // 3. Final Concatenation
  const concatContent = clipPaths.map(p => `file '${path.basename(p)}'`).join('\n');
  const concatFilePath = path.join(tempDir, 'concat.txt');
  await fs.writeFile(concatFilePath, concatContent);

  const finalStart = Date.now();
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
      reject(new Error('FFmpeg final assembly timed out after 20 seconds'));
    }, 20000);
    
    ffmpegProcess.stderr?.on('data', (d) => { stderr += d.toString(); });
    ffmpegProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        console.log(`[Job ${job.id}] Final assembly finished in ${(Date.now() - finalStart) / 1000}s.`);
        resolve();
      }
      else reject(new Error(`FFmpeg exited with code ${code}. Stderr: ${stderr.slice(-500)}`));
    });
    ffmpegProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(new Error(`FFmpeg spawn error for final assembly: ${err.message}. Path used: ${ffmpegPath}`));
    });
  });

  const videoBuffer = await fs.readFile(outputVideoPath);
  await saveDebugVideo(videoBuffer, job.id, job.data.themeName, job.persona);
  
  if (!job.account_id) throw new Error(`Job ${job.id} is missing account_id`);
  
  const publicId = generateVideoPublicId(job.id, job.account_id, job.persona, job.data.themeName);
  
  // --- Time the upload operation ---
  const uploadStart = Date.now();
  const result = await uploadVideoToCloudinary(videoBuffer, job.account_id, {
    folder: config.CLOUDINARY_VIDEOS_FOLDER,
    public_id: publicId,
    resource_type: 'video',
  });
  console.log(`[Job ${job.id}] Cloudinary upload finished in ${(Date.now() - uploadStart) / 1000}s.`);
  // --- End upload timing ---

  const overallDuration = (Date.now() - overallStart) / 1000; 
  console.log(`[Job ${job.id}] Total assembleVideoWithConcat duration: ${overallDuration.toFixed(2)}s.`); 

  return { videoUrl: result.secure_url, videoSize: videoBuffer.length, audioFile: audioFileName };
}


export const runtime = 'nodejs';
export const maxDuration = 300;
