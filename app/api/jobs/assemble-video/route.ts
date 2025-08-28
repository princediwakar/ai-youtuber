import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob } from '@/lib/database';
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

const ffmpegPath = require('ffmpeg-static');

async function saveDebugVideo(videoBuffer: Buffer, jobId: string) {
  if (!config.DEBUG_MODE) return;
  try {
    const debugDir = path.join(process.cwd(), 'generated-videos');
    await fs.mkdir(debugDir, { recursive: true });
    const destinationPath = path.join(debugDir, `quiz-${jobId}.mp4`);
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
  if (!ffmpegPath) throw new Error("ffmpeg binary not found.");
  
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
  const audioPath = path.join(process.cwd(), 'public', 'audio', '1.mp3'); // Assuming a default audio

  const ffmpegArgs = [
    '-f', 'concat', '-safe', '0', '-i', inputFilePath,
    '-stream_loop', '-1', '-i', audioPath,
    '-c:v', 'libx264', '-c:a', 'aac',
    '-pix_fmt', 'yuv420p', '-vf', `scale=${config.VIDEO_WIDTH}:${config.VIDEO_HEIGHT}`,
    '-r', '30', '-preset', 'fast',
    '-t', totalVideoDuration.toString(),
    '-y', tempVideoPath
  ];

  console.log(`[Job ${job.id}] Running FFmpeg...`);
  await new Promise<void>((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, { cwd: tempDir });
    ffmpegProcess.stderr.on('data', (data: Buffer) => console.log(`[FFmpeg Job ${job.id}]: ${data.toString()}`));
    ffmpegProcess.on('close', (code: number) => code === 0 ? resolve() : reject(new Error(`FFmpeg exited with code ${code}`)));
    ffmpegProcess.on('error', (err) => reject(err));
  });

  const videoBuffer = await fs.readFile(tempVideoPath);
  await saveDebugVideo(videoBuffer, job.id);
  
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
