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

// More robust FFmpeg path resolution for serverless environments
function getFFmpegPath(): string {
  const staticPath = require('ffmpeg-static');
  if (staticPath && typeof staticPath === 'string') {
    return staticPath;
  }
  
  // Fallback paths for different environments
  const fallbackPaths = [
    '/opt/nodejs/node_modules/ffmpeg-static/ffmpeg',
    '/var/task/node_modules/ffmpeg-static/ffmpeg',
    '/vercel/path0/node_modules/ffmpeg-static/ffmpeg'
  ];
  
  const { existsSync } = require('fs');
  for (const fallbackPath of fallbackPaths) {
    if (existsSync(fallbackPath)) {
      return fallbackPath;
    }
  }
  
  throw new Error('FFmpeg binary not found in any known location');
}

// Array of available audio files
const AUDIO_FILES = [
  '1.mp3',
  '2.mp3', 
  '3.mp3',
  '4.mp3'
];

/**
 * Randomly selects an audio file from the available options
 * @returns Full path to a random audio file
 */
function getRandomAudioFile(): string {
  const randomIndex = Math.floor(Math.random() * AUDIO_FILES.length);
  const selectedAudio = AUDIO_FILES[randomIndex];
  const audioPath = path.join(process.cwd(), 'public', 'audio', selectedAudio);
  
  // Verify audio file exists
  const { existsSync } = require('fs');
  if (!existsSync(audioPath)) {
    console.warn(`Audio file not found at ${audioPath}, using embedded audio generation`);
    return null; // Will trigger embedded audio generation
  }
  
  return audioPath;
}

async function saveDebugVideo(videoBuffer: Buffer, jobId: string, themeName?: string) {
  if (!config.DEBUG_MODE) return;
  try {
    const debugDir = path.join(process.cwd(), 'generated-videos');
    await fs.mkdir(debugDir, { recursive: true });
    const themePrefix = themeName ? `${themeName}-` : '';
    const destinationPath = path.join(debugDir, `${themePrefix}quiz-${jobId}.mp4`);
    await fs.writeFile(destinationPath, videoBuffer);
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

    console.log('Starting video assembly batch...');
    
    // Auto-retry failed jobs with valid data
    await autoRetryFailedJobs();
    
    const jobs = await getPendingJobs(3, config.ASSEMBLY_CONCURRENCY);
    
    if (jobs.length === 0) {
      return NextResponse.json({ success: true, message: 'No jobs pending video assembly' });
    }

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

    return NextResponse.json({ success: true, summary });

  } catch (error) {
    console.error('Video assembly batch failed:', error);
    return NextResponse.json({ success: false, error: 'Video assembly failed' }, { status: 500 });
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

    const { videoUrl, videoSize } = await assembleVideoWithConcat(frameUrls, job, tempDir);
    
    await updateJob(job.id, {
      step: 4,
      status: 'upload_pending',
      data: { ...job.data, videoUrl, videoSize }
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

async function assembleVideoWithConcat(frameUrls: string[], job: QuizJob, tempDir: string): Promise<{videoUrl: string, videoSize: number}> {
  const ffmpegPath = getFFmpegPath();
  console.log(`[Job ${job.id}] Using FFmpeg path: ${ffmpegPath}`);
  
  const downloadPromises = frameUrls.map(async (url, index) => {
    const frameBuffer = await downloadImageFromCloudinary(url);
    const framePath = path.join(tempDir, `frame-${String(index + 1).padStart(3, '0')}.png`);
    await fs.writeFile(framePath, frameBuffer);
    return framePath;
  });
  await Promise.all(downloadPromises);

  const durations = [
    getFrameDuration(job.data.question, 1),
    getFrameDuration(job.data.question, 2),
    getFrameDuration(job.data.question, 3)
  ];
  
  const inputFileContent = `ffconcat version 1.0\n` + durations.map((d, i) => 
    `file 'frame-${String(i + 1).padStart(3, '0')}.png'\nduration ${d}`
  ).join('\n');

  const inputFilePath = path.join(tempDir, 'inputs.txt');
  await fs.writeFile(inputFilePath, inputFileContent);

  const tempVideoPath = path.join(tempDir, `quiz-${job.id}.mp4`);
  const totalVideoDuration = durations.reduce((sum, duration) => sum + duration, 0);
  const audioPath = getRandomAudioFile();
  
  let ffmpegArgs: string[];
  
  if (audioPath) {
    console.log(`[Job ${job.id}] Using audio file: ${path.basename(audioPath)}`);
    ffmpegArgs = [
      '-f', 'concat', '-safe', '0', '-i', inputFilePath,
      '-stream_loop', '-1', '-i', audioPath,
      '-c:v', 'libx264', '-c:a', 'aac',
      '-pix_fmt', 'yuv420p', '-vf', `scale=${config.VIDEO_WIDTH}:${config.VIDEO_HEIGHT}`,
      '-r', '30', '-preset', 'fast',
      '-t', totalVideoDuration.toString(),
      '-y', tempVideoPath
    ];
  } else {
    console.log(`[Job ${job.id}] Generating synthetic audio (audio files not accessible)`);
    ffmpegArgs = [
      '-f', 'concat', '-safe', '0', '-i', inputFilePath,
      '-f', 'lavfi', '-i', 'sine=frequency=220:duration=' + totalVideoDuration,
      '-c:v', 'libx264', '-c:a', 'aac',
      '-pix_fmt', 'yuv420p', '-vf', `scale=${config.VIDEO_WIDTH}:${config.VIDEO_HEIGHT}`,
      '-r', '30', '-preset', 'fast',
      '-t', totalVideoDuration.toString(),
      '-y', tempVideoPath
    ];
  }

  console.log(`[Job ${job.id}] Running FFmpeg...`);
  await new Promise<void>((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, { cwd: tempDir });
    ffmpegProcess.stderr.on('data', (data: Buffer) => console.log(`[FFmpeg Job ${job.id}]: ${data.toString()}`));
    ffmpegProcess.on('close', (code: number) => code === 0 ? resolve() : reject(new Error(`FFmpeg exited with code ${code}`)));
    ffmpegProcess.on('error', (err) => reject(err));
  });

  const videoBuffer = await fs.readFile(tempVideoPath);
  const themeName = job.data.themeName;
  await saveDebugVideo(videoBuffer, job.id, themeName);
  
  const publicId = generateVideoPublicId(job.id);
  const result = await uploadVideoToCloudinary(videoBuffer, {
    folder: config.CLOUDINARY_VIDEOS_FOLDER,
    public_id: publicId,
    resource_type: 'video',
  });

  return { videoUrl: result.secure_url, videoSize: videoBuffer.length };
}

function getFrameDuration(question: any, frameNumber: number): number {
  if (frameNumber === 1) {
    // Question frame: 4-7 seconds (balanced pace - readable but engaging)
    const textLength = (question?.question?.length || 0) + Object.values(question?.options || {}).join(" ").length;
    return Math.max(6, Math.min(8, Math.ceil(textLength / 15)));
  } else if (frameNumber === 2) {
    // Answer frame: 2.5 seconds (enough time to process the answer)
    return 3;
  } else {
    // Explanation frame: 4-6 seconds (readable explanation)
    return Math.max(4, Math.min(6, Math.ceil((question?.explanation?.length || 0) / 15)));
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;
