import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob } from '@/lib/database';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

// Don't set FFmpeg path - let fluent-ffmpeg auto-detect in serverless
console.log('Using auto-detection for FFmpeg binary in serverless environment');

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
        console.log(`Assembling video for job ${job.id} - ${job.persona} ${job.category}`);

        // Create video from frames using FFmpeg
        const { videoBuffer, persistentPath } = await assembleVideo(job.data.frames, job.id, job.data.question);
        
        // Update job to next step WITHOUT storing video data in database
        await updateJob(job.id, {
          step: 4,
          status: 'upload_pending',
          data: { 
            ...job.data,
            videoPath: persistentPath, // Store file path instead of buffer
            videoSize: videoBuffer.length
          }
        });
        
        processedJobs.push({ id: job.id, persona: job.persona, category: job.category });
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

async function assembleVideo(frames: string[], jobId: string, question: any): Promise<{videoBuffer: Buffer, persistentPath: string}> {
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

    // Create video using FFmpeg with dynamic timing and background audio
    const outputPath = path.join(tempDir, 'output.mp4');
    
    // Calculate durations for each frame
    const frame1Duration = getFrameDuration(question, 1);
    const frame2Duration = getFrameDuration(question, 2);
    const frame3Duration = getFrameDuration(question, 3);
    const totalDuration = frame1Duration + frame2Duration + frame3Duration;
    
    console.log(`Frame durations: ${frame1Duration}s, ${frame2Duration}s, ${frame3Duration}s (total: ${totalDuration}s)`);
    
    // Check for background audio files (with priority order)
    const audioOptions = [
      '2.mp3',
      '3.mp3',
      '4.mp3',
      '5.mp3',
      '6.mp3',            // Original background track (fallback)
    ];
    
    let backgroundAudioPath = '';
    let hasBackgroundAudio = false;
    
    // Try audio files in priority order
    for (const audioFile of audioOptions) {
      const audioPath = path.join(process.cwd(), 'public', 'audio', audioFile);
      const exists = await fs.access(audioPath).then(() => true).catch(() => false);
      if (exists) {
        backgroundAudioPath = audioPath;
        hasBackgroundAudio = true;
        console.log(`Selected background audio: ${audioFile}`);
        break;
      }
    }
    
    if (!hasBackgroundAudio) {
      console.log('No background audio found, creating video without audio');
    }
    
    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg();
      
      // Add each frame as separate input with loop option
      imagePaths.forEach((imagePath) => {
        command.input(imagePath).inputOptions(['-loop 1']);
      });
      
      // Add background audio if available (without loop option)
      if (hasBackgroundAudio) {
        command.input(backgroundAudioPath);
      }
      
      const videoFilterComplex = 
        `[0:v]scale=1080:1920,setpts=PTS-STARTPTS[f0];` +
        `[1:v]scale=1080:1920,setpts=PTS-STARTPTS[f1];` +
        `[2:v]scale=1080:1920,setpts=PTS-STARTPTS[f2];` +
        `[f0]trim=duration=${frame1Duration}[v0];` +
        `[f1]trim=duration=${frame2Duration}[v1];` +
        `[f2]trim=duration=${frame3Duration}[v2];` +
        `[v0][v1][v2]concat=n=3:v=1:a=0[outv]`;
      
      const audioFilterComplex = hasBackgroundAudio ? 
        `[3:a]volume=0.3,afade=t=in:st=0:d=1,afade=t=out:st=${totalDuration-1}:d=1,aloop=loop=-1:size=2e+09[bg_audio]` : '';
      
      const fullFilterComplex = hasBackgroundAudio ? 
        videoFilterComplex + ';' + audioFilterComplex : videoFilterComplex;
      
      command
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-b:a 128k',
          '-pix_fmt yuv420p',
          '-r 30', // 30 fps output
          '-s 1080x1920', // YouTube Shorts resolution
          '-filter_complex', fullFilterComplex,
          '-map', '[outv]',
          ...(hasBackgroundAudio ? ['-map', '[bg_audio]'] : []),
          '-t', totalDuration.toString(),
          '-shortest'
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

    return { videoBuffer, persistentPath };

  } finally {
    // Cleanup temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp directory:', cleanupError);
    }
  }
}

// Helper function to determine frame duration based on content length
function getFrameDuration(question: any, frameNumber: number): number {
  if (frameNumber === 1) {
    // Frame 1: Question + Options - dynamic based on content length
    const questionLength = (question?.question?.length || 0);
    if (questionLength < 100) return 8;      // Short questions: 5 seconds
    if (questionLength < 200) return 12;      // Medium questions: 7 seconds
    return 15;                                // Long questions: 9 seconds
  } else if (frameNumber === 2) {
    return 4;  // Frame 2: Answer reveal - 4 seconds
  } else {
    return 7;  // Frame 3: Explanation - 7 seconds
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;