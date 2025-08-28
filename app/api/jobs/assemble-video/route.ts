// app/api/jobs/assemble-video/route.ts
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
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static');

/**
 * Saves a copy of the generated video to a local 'generated-videos' folder for debugging.
 * This function only runs if the DEBUG_MODE environment variable is set to 'true'.
 */
async function saveDebugVideo(videoBuffer: Buffer, jobId: string) {
  if (process.env.DEBUG_MODE !== 'true') {
    return;
  }

  try {
    const debugDir = path.join(process.cwd(), 'generated-videos');
    await fs.mkdir(debugDir, { recursive: true });
    const destinationPath = path.join(debugDir, `quiz-${jobId}.mp4`);
    await fs.writeFile(destinationPath, videoBuffer);
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

    // Use frameUrls from Cloudinary
    const frameUrls = job.data.frameUrls;
    if (!frameUrls || frameUrls.length === 0) {
      throw new Error('No frame URLs found for video assembly');
    }

    const { videoUrl, videoSize } = await assembleVideoWithConcat(
        frameUrls, 
        job.id, 
        job.data.question
    );
    
    await updateJob(job.id, {
      step: 4,
      status: 'upload_pending',
      data: { 
        ...job.data,
        videoUrl: videoUrl,
        videoSize: videoSize
      }
    });
    
    console.log(`✅ Video assembly completed for job ${job.id}: ${videoUrl}`);
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

async function assembleVideoWithConcat(frameUrls: string[], jobId: string, question: any): Promise<{videoUrl: string, videoSize: number}> {
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

    // Create video in temp directory first
    const tempVideoPath = path.join(tempDir, `quiz-${jobId}.mp4`);
    
    // Calculate total video duration
    const totalVideoDuration = durations.reduce((sum, duration) => sum + duration, 0);
    console.log(`Total video duration: ${totalVideoDuration} seconds`);
    
    // Try multiple audio files
    const audioFiles = ['1.mp3', '2.mp3', '3.mp3', '4.mp3'];
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
      
      // Add audio input with proper duration handling
      ...(audioExists ? [
        '-i', audioPath,
        '-filter_complex', `[1:a]aloop=loop=-1:size=2e+09,atrim=duration=${totalVideoDuration}[audio]`,
        '-map', '0:v',
        '-map', '[audio]'
      ] : []),
      
      // Codecs
      '-c:v', 'libx264',
      ...(audioExists ? ['-c:a', 'aac'] : []),
      
      // Output format
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=1080:1920',
      '-r', '30',
      '-preset', 'fast',
      '-t', totalVideoDuration.toString(), // Explicitly set output duration
      '-y',
      tempVideoPath
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

    // Upload video to Cloudinary
    console.log(`Uploading video to Cloudinary...`);
    const videoBuffer = await fs.readFile(tempVideoPath);
    const publicId = generateVideoPublicId(jobId);
    
    // Save debug copy locally if DEBUG_MODE is enabled
    await saveDebugVideo(videoBuffer, jobId);
    
    const result = await uploadVideoToCloudinary(videoBuffer, {
      folder: 'quiz-videos',
      public_id: publicId,
      format: 'mp4'
    });

    console.log(`✅ Video uploaded to Cloudinary: ${result.secure_url} (${(videoBuffer.length / 1e6).toFixed(2)} MB)`);
    return { videoUrl: result.secure_url, videoSize: videoBuffer.length };

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