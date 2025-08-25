import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob } from '@/lib/database';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

// Set FFmpeg path for production
const correctPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
ffmpeg.setFfmpegPath(correctPath);
console.log('FFmpeg path set to:', correctPath);

export async function POST(request: NextRequest) {
  try {
    // Auth check using CRON_SECRET
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting video assembly batch...');

    // Get jobs at step 3 (assembly_pending)
    const jobs = await getPendingJobs(3, 2); // Process 2 jobs at a time
    
    if (jobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: 'No jobs pending video assembly' 
      });
    }

    const processedJobs = [];

    for (const job of jobs) {
      try {
        console.log(`Assembling video for job ${job.id} - ${job.test_type} ${job.subject}`);

        // Create video from frames using FFmpeg
        const videoBuffer = await assembleVideo(job.data.frames, job.id);
        
        // Update job to next step with video data
        await updateJob(job.id, {
          step: 4,
          status: 'upload_pending',
          data: { 
            ...job.data, 
            videoBuffer: videoBuffer.toString('base64') 
          }
        });
        
        processedJobs.push({ id: job.id, test_type: job.test_type, subject: job.subject });
        console.log(`Video assembly completed for job ${job.id}`);

      } catch (error) {
        console.error(`Failed to assemble video for job ${job.id}:`, error);
        
        // Mark job as failed
        await updateJob(job.id, {
          status: 'failed',
          error_message: `Video assembly failed: ${error.message}`
        });
      }
    }

    console.log(`Video assembly batch completed. Processed ${processedJobs.length} jobs.`);

    return NextResponse.json({ 
      success: true, 
      processed: processedJobs.length,
      jobs: processedJobs
    });

  } catch (error) {
    console.error('Video assembly batch failed:', error);
    return NextResponse.json(
      { success: false, error: 'Video assembly failed' },
      { status: 500 }
    );
  }
}

async function assembleVideo(frames: string[], jobId: string): Promise<Buffer> {
  const tempDir = path.join(tmpdir(), `quiz-video-${jobId}-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    console.log(`Creating video from ${frames.length} frames in ${tempDir}`);

    // Save frames as images
    const imagePaths: string[] = [];
    for (let i = 0; i < frames.length; i++) {
      const frameData = frames[i].replace(/^data:image\/png;base64,/, '');
      const imagePath = path.join(tempDir, `frame_${i.toString().padStart(3, '0')}.png`);
      await fs.writeFile(imagePath, frameData, 'base64');
      imagePaths.push(imagePath);
    }

    // Create video using FFmpeg
    const outputPath = path.join(tempDir, 'output.mp4');
    
    await new Promise<void>((resolve, reject) => {
      // Create video from images using simpler FFmpeg pattern input
      const framePattern = path.join(tempDir, 'frame_%03d.png');
      
      ffmpeg()
        .input(framePattern)
        .inputOptions([
          '-framerate 1/3', // 3 seconds per frame
          '-loop 1'
        ])
        .outputOptions([
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-r 30', // 30 fps output
          '-s 1080x1920', // YouTube Shorts resolution
          '-t 12' // Maximum 12 seconds
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('end', () => {
          console.log(`Video assembly completed: ${outputPath}`);
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });

    // Read the generated video
    const videoBuffer = await fs.readFile(outputPath);
    console.log(`Video file size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Also save video to persistent directory for testing
    const persistentDir = path.join(process.cwd(), 'generated-videos');
    await fs.mkdir(persistentDir, { recursive: true });
    const persistentPath = path.join(persistentDir, `quiz-${jobId}-${Date.now()}.mp4`);
    await fs.copyFile(outputPath, persistentPath);
    console.log(`Video also saved to: ${persistentPath}`);

    return videoBuffer;

  } finally {
    // Cleanup temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp directory:', cleanupError);
    }
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;