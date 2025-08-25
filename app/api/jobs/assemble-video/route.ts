import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob } from '@/lib/database';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Set the ffmpeg binary path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export async function POST(request: NextRequest) {
  try {
    // Auth check using CRON_SECRET
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting video assembly batch...');

    // Get jobs at step 3 (assembly_pending)
    const jobs = await getPendingJobs(3, 2); // Process 2 jobs at a time (video processing is heavy)
    
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

        // Assemble video from frames
        const videoBuffer = await assembleVideo(job.data.frames, job.id);
        
        // Update job to next step with video data
        await updateJob(job.id, {
          step: 4,
          status: 'upload_pending',
          data: { 
            ...job.data, 
            videoBuffer: videoBuffer.toString('base64') // Store as base64 temporarily
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

async function assembleVideo(frameStrings: string[], jobId: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create temporary directory for this job
      const tempDir = path.join('/tmp', `quiz-video-${jobId}-${uuidv4()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      console.log(`Created temp directory: ${tempDir}`);

      // Convert base64 frames back to image files
      const framePaths: string[] = [];
      for (let i = 0; i < frameStrings.length; i++) {
        const framePath = path.join(tempDir, `frame${i}.png`);
        const frameBuffer = Buffer.from(frameStrings[i], 'base64');
        fs.writeFileSync(framePath, frameBuffer);
        framePaths.push(framePath);
        console.log(`Saved frame ${i} to ${framePath}`);
      }

      // Create input list file for ffmpeg
      const inputListPath = path.join(tempDir, 'input.txt');
      const inputList = [
        `file '${framePaths[0]}'`, // Question frame - 3 seconds
        'duration 3',
        `file '${framePaths[1]}'`, // Options frame - 8 seconds  
        'duration 8',
        `file '${framePaths[2]}'`, // Thinking frame - 3 seconds
        'duration 3',
        `file '${framePaths[3]}'`, // Answer frame - 6 seconds
        'duration 6'
      ].join('\n');
      
      fs.writeFileSync(inputListPath, inputList);
      console.log('Created input list file');

      const outputPath = path.join(tempDir, 'quiz.mp4');

      // Use ffmpeg to create video from frames with specific timing
      ffmpeg()
        .input(inputListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-c:v libx264',        // H.264 codec for compatibility
          '-pix_fmt yuv420p',    // Pixel format for web compatibility
          '-r 30',               // 30 FPS
          '-s 1080x1920',        // Vertical resolution for Shorts
          '-t 20',               // Total duration: 20 seconds
          '-movflags +faststart' // Optimize for web streaming
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg started with command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', () => {
          console.log('FFmpeg processing finished');
          
          try {
            // Read the generated video file
            const videoBuffer = fs.readFileSync(outputPath);
            console.log(`Generated video size: ${videoBuffer.length} bytes`);
            
            // Cleanup temporary files
            cleanup(tempDir);
            
            resolve(videoBuffer);
          } catch (readError) {
            console.error('Failed to read generated video:', readError);
            cleanup(tempDir);
            reject(readError);
          }
        })
        .on('error', (error) => {
          console.error('FFmpeg error:', error);
          cleanup(tempDir);
          reject(new Error(`Video assembly failed: ${error.message}`));
        })
        .run();

    } catch (error) {
      console.error('Video assembly setup failed:', error);
      reject(error);
    }
  });
}

function cleanup(tempDir: string) {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`Cleaned up temp directory: ${tempDir}`);
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// Alternative simpler approach using image slideshow
async function assembleVideoSimple(frameStrings: string[], jobId: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const tempDir = path.join('/tmp', `quiz-simple-${jobId}-${uuidv4()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      // Save frames
      for (let i = 0; i < frameStrings.length; i++) {
        const framePath = path.join(tempDir, `frame${i.toString().padStart(2, '0')}.png`);
        const frameBuffer = Buffer.from(frameStrings[i], 'base64');
        fs.writeFileSync(framePath, frameBuffer);
      }

      const outputPath = path.join(tempDir, 'quiz.mp4');

      // Create slideshow with custom frame durations
      ffmpeg()
        .input(path.join(tempDir, 'frame%02d.png'))
        .inputOptions([
          '-framerate', '1/3'  // 1 frame every 3 seconds by default
        ])
        .outputOptions([
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-s 1080x1920',
          '-r 30',
          '-movflags +faststart'
        ])
        .output(outputPath)
        .on('end', () => {
          const videoBuffer = fs.readFileSync(outputPath);
          cleanup(tempDir);
          resolve(videoBuffer);
        })
        .on('error', (error) => {
          cleanup(tempDir);
          reject(error);
        })
        .run();

    } catch (error) {
      reject(error);
    }
  });
}