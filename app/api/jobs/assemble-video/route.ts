// app/api/jobs/assemble-video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob } from '@/lib/database';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';
import { downloadImageFromCloudinary } from '@/lib/cloudinary';
const ffmpegPath = require('ffmpeg-static');

// --- CONFIGURATION ---
const PERSISTENT_VIDEO_DIR = path.join('/tmp', 'generated-videos');
// Set to true in your .env.local for local debugging
const isDebug = process.env.DEBUG_MODE === 'true';

// --- SETUP ---
async function setupStorage() {
  try {
    await fs.mkdir(PERSISTENT_VIDEO_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create persistent video directory:", error);
  }
}
setupStorage();

/**
 * Saves a copy of the generated video to a local 'generated-videos' folder for debugging.
 * This function only runs if the DEBUG_MODE environment variable is set to 'true'.
 * @param {string} sourcePath - The path of the generated video file in the temporary directory.
 * @param {string} jobId - The ID of the job, used for naming the debug file.
 */
async function saveDebugVideo(sourcePath: string, jobId: string) {
  if (!isDebug) {
    return;
  }

  try {
    const debugDir = path.join(process.cwd(), 'generated-videos');
    await fs.mkdir(debugDir, { recursive: true });
    const destinationPath = path.join(debugDir, path.basename(sourcePath));
    await fs.copyFile(sourcePath, destinationPath);
    console.log(`[DEBUG] Video for job ${jobId} saved to: ${destinationPath}`);
  } catch (error) {
    // Log an error but don't throw, as this is a non-critical debug step.
    console.error(`[DEBUG] Failed to save debug video for job ${jobId}:`, error);
  }
}


export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting video assembly batch...');
    const jobs = await getPendingJobs(3, 2);
    
    if (jobs.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No jobs pending video assembly' });
    }

    const processPromises = jobs.map(job => processJob(job));
    const results = await Promise.allSettled(processPromises);

    const processedJobs = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => (r as PromiseFulfilledResult<any>).value);

    return NextResponse.json({ success: true, processed: processedJobs.length, jobs: processedJobs });

  } catch (error) {
    console.error('Video assembly batch failed:', error);
    return NextResponse.json({ success: false, error: 'Video assembly failed' }, { status: 500 });
  }
}

async function processJob(job: any) {
  try {
    console.log(`Assembling video for job ${job.id}`);

    // Use frameUrls instead of framePaths
    const frameUrls = job.data.frameUrls || job.data.framePaths; // Fallback for existing jobs
    if (!frameUrls || frameUrls.length === 0) {
      throw new Error('No frame URLs found for video assembly');
    }

    const { persistentPath, videoSize } = await assembleVideoWithConcat(
        frameUrls, 
        job.id, 
        job.data.question
    );
    
    await updateJob(job.id, {
      step: 4,
      status: 'upload_pending',
      data: { 
        ...job.data,
        videoPath: persistentPath,
        videoSize: videoSize
      }
    });
    
    console.log(`✅ Video assembly completed for job ${job.id}`);
    return { id: job.id, persona: job.persona, category: job.category };

  } catch (error) {
    console.error(`❌ Failed to assemble video for job ${job.id}:`, error);
    await updateJob(job.id, {
      status: 'failed',
      error_message: `Video assembly failed: ${(error as Error).message}`
    });
    return null;
  }
}

async function assembleVideoWithConcat(frameUrls: string[], jobId: string, question: any): Promise<{persistentPath: string, videoSize: number}> {
  if (!ffmpegPath) {
      throw new Error("ffmpeg binary not found. Make sure ffmpeg-static is installed.");
  }

  const tempDir = path.join(tmpdir(), `quiz-video-${jobId}-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    // Download frames from Cloudinary to temp directory
    console.log(`Downloading ${frameUrls.length} frames from Cloudinary...`);
    const downloadPromises = frameUrls.map(async (url, index) => {
      const frameBuffer = await downloadImageFromCloudinary(url);
      const framePath = path.join(tempDir, `frame-${index + 1}.png`);
      await fs.writeFile(framePath, frameBuffer);
      console.log(`Downloaded frame ${index + 1}: ${framePath}`);
      return framePath;
    });

    const framePaths = await Promise.all(downloadPromises);
    console.log(`✅ All frames downloaded to temp directory`);
    
    // Continue with existing video assembly logic...
    const durations = [
      getFrameDuration(question, 1),
      getFrameDuration(question, 2),
      getFrameDuration(question, 3)
    ];
    
    const inputFileContent = framePaths.map((p, i) => 
      `file '${path.resolve(p)}'\nduration ${durations[i]}`
    ).join('\n');
    const inputFilePath = path.join(tempDir, 'inputs.txt');
    await fs.writeFile(inputFilePath, inputFileContent);

    const persistentPath = path.join(PERSISTENT_VIDEO_DIR, `quiz-${jobId}.mp4`);
    
    // Try multiple audio files
    const audioFiles = ['6.mp3', 'quiz-ambient.mp3', 'default.mp3'];
    let audioPath = '';
    let audioExists = false;
    
    for (const audioFile of audioFiles) {
      const testPath = path.join(process.cwd(), 'public', 'audio', audioFile);
      try {
        await fs.stat(testPath);
        audioPath = testPath;
        audioExists = true;
        console.log(`Using audio file: ${audioFile}`);
        break;
      } catch {
        continue;
      }
    }
    
    if (!audioExists) {
      console.warn('No audio file found, creating silent video');
    }

    const ffmpegArgs = [
      // Video input from frames
      '-f', 'concat',
      '-safe', '0',
      '-i', inputFilePath,
      
      // Add audio input with looping enabled
      ...(audioExists ? ['-stream_loop', '-1', '-i', audioPath] : []),
      
      // Codecs
      '-c:v', 'libx264',
      '-c:a', 'aac',
      
      // Stop encoding when the shortest stream (the video) ends
      '-shortest',
      
      // Output format
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=1080:1920',
      '-r', '30',
      '-preset', 'fast',
      '-y',
      persistentPath
    ];

    console.log(`Running FFmpeg: ${ffmpegPath} ${ffmpegArgs.join(' ')}`);

    await new Promise<void>((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
      
      ffmpegProcess.stderr.on('data', (data: Buffer) => console.log(`FFmpeg: ${data.toString()}`));
      ffmpegProcess.on('close', (code: number) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with code ${code}`));
      });
      ffmpegProcess.on('error', (err) => reject(err));
    });

    // --- HELPER FUNCTION CALL ---
    // Save a copy of the video to the local project folder if in debug mode.
    await saveDebugVideo(persistentPath, jobId);

    const stats = await fs.stat(persistentPath);
    console.log(`✅ Video created: ${persistentPath} (${(stats.size / 1e6).toFixed(2)} MB)`);
    return { persistentPath, videoSize: stats.size };

  } catch (error) {
    console.error('❌ Video assembly failed:', error);
    throw error;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(e => console.warn("Failed to cleanup temp dir:", e));
  }
}

function getFrameDuration(question: any, frameNumber: number): number {
  if (frameNumber === 1) {
    const textLength = (question?.question?.length || 0) + Object.values(question?.options || {}).join(" ").length;
    return Math.max(5, Math.min(10, Math.ceil(textLength / 15)));
  } else if (frameNumber === 2) {
    return 3;
  } else {
    return Math.max(5, Math.min(8, Math.ceil((question?.explanation?.length || 0) / 15)));
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;