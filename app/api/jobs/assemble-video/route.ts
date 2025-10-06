// app/api/jobs/assemble-video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOldestPendingJob, updateJob, autoRetryFailedJobs } from '@/lib/database'; // Using getOldestPendingJob
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';
import { 
  downloadImageFromCloudinary, 
  uploadVideoToCloudinary, 
  generateVideoPublicId,
  CloudinaryUploadResult
} from '@/lib/cloudinary';
import { QuizJob } from '@/lib/types'; 
import { config } from '@/lib/config';

// --- Helper Functions (getFFmpegPath, getRandomAudioFile, saveDebugVideo, getFrameDuration) ---

// FFmpeg path resolution using @ffmpeg-installer/ffmpeg
function getFFmpegPath(): string {
  const { existsSync } = require('fs');
  
  console.log('=== FFmpeg Path Resolution Debug ===');
  console.log('process.cwd():', process.cwd());
  console.log('__dirname:', __dirname);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('VERCEL:', process.env.VERCEL);
  console.log('AWS_LAMBDA_FUNCTION_NAME:', process.env.AWS_LAMBDA_FUNCTION_NAME);
  
  try {
    // First try: @ffmpeg-installer/ffmpeg
    const ffmpeg = require('@ffmpeg-installer/ffmpeg');
    console.log('@ffmpeg-installer/ffmpeg require result:', typeof ffmpeg.path, ffmpeg.path);
    
    if (ffmpeg.path && typeof ffmpeg.path === 'string') {
      console.log('Checking if ffmpeg.path exists:', ffmpeg.path);
      if (existsSync(ffmpeg.path)) {
        console.log(`✅ FFmpeg found via @ffmpeg-installer/ffmpeg: ${ffmpeg.path}`);
        return ffmpeg.path;
      } else {
        console.log('❌ @ffmpeg-installer/ffmpeg path does not exist on filesystem');
      }
    }
  } catch (error: any) {
    console.warn('❌ Could not require @ffmpeg-installer/ffmpeg:', error.message);
  }
  
  // Fallback paths for @ffmpeg-installer/ffmpeg
  const fallbackPaths = [
    // @ffmpeg-installer/ffmpeg paths in serverless environments
    '/var/task/node_modules/@ffmpeg-installer/ffmpeg/ffmpeg',
    '/opt/nodejs/node_modules/@ffmpeg-installer/ffmpeg/ffmpeg',
    '/var/runtime/node_modules/@ffmpeg-installer/ffmpeg/ffmpeg',
    
    // Vercel-specific paths
    '/vercel/path0/node_modules/@ffmpeg-installer/ffmpeg/ffmpeg',
    '/vercel/path1/node_modules/@ffmpeg-installer/ffmpeg/ffmpeg',
    '/vercel/path2/node_modules/@ffmpeg-installer/ffmpeg/ffmpeg',
    
    // Relative to current working directory
    path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', 'ffmpeg', 'ffmpeg'),
    
    // Relative to __dirname
    path.join(__dirname, '..', '..', '..', '..', 'node_modules', '@ffmpeg-installer', 'ffmpeg', 'ffmpeg'),
    path.join(__dirname, '..', '..', '..', 'node_modules', '@ffmpeg-installer', 'ffmpeg', 'ffmpeg')
  ];
  
  console.log('Checking fallback paths...');
  for (const fallbackPath of fallbackPaths) {
    console.log(`Checking: ${fallbackPath}`);
    if (existsSync(fallbackPath)) {
      console.log(`✅ FFmpeg found at fallback path: ${fallbackPath}`);
      return fallbackPath;
    }
  }
  
  // Last resort: try system FFmpeg with proper validation
  const systemPaths = [
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg'
  ];
  
  console.log('Checking system paths...');
  for (const systemPath of systemPaths) {
    try {
      console.log(`Checking system path: ${systemPath}`);
      if (existsSync(systemPath)) {
        // Test if binary is actually executable
        const { execSync } = require('child_process');
        try {
          execSync(`${systemPath} -version`, { timeout: 5000 });
          console.log(`✅ FFmpeg found and verified at system path: ${systemPath}`);
          return systemPath;
        } catch (execError: any) {
          console.log(`❌ FFmpeg at ${systemPath} exists but is not executable:`, execError.message);
        }
      }
    } catch (error: any) {
      console.log(`❌ Error checking system path ${systemPath}:`, error.message);
      continue;
    }
  }
  
  // Final attempt: debug what's actually available
  const dirsToCheck = ['/var/task', '/opt/nodejs', process.cwd()];
  for (const dir of dirsToCheck) {
    try {
      if (existsSync(dir)) {
        console.log(`Contents of ${dir}:`, require('fs').readdirSync(dir).slice(0, 20)); // Limit output
        
        const nodeModulesPath = path.join(dir, 'node_modules');
        if (existsSync(nodeModulesPath)) {
          const nodeModulesContents = require('fs').readdirSync(nodeModulesPath);
          console.log(`node_modules packages count: ${nodeModulesContents.length}`);
          
          // Check if @ffmpeg-installer/ffmpeg exists
          if (nodeModulesContents.includes('@ffmpeg-installer')) {
            console.log(`✅ @ffmpeg-installer directory found in ${nodeModulesPath}`);
            const ffmpegInstallerPath = path.join(nodeModulesPath, '@ffmpeg-installer');
            const ffmpegInstallerContents = require('fs').readdirSync(ffmpegInstallerPath);
            console.log(`@ffmpeg-installer contents:`, ffmpegInstallerContents);
            
            if (ffmpegInstallerContents.includes('ffmpeg')) {
              const ffmpegPackagePath = path.join(ffmpegInstallerPath, 'ffmpeg');
              const ffmpegPackageContents = require('fs').readdirSync(ffmpegPackagePath);
              console.log(`@ffmpeg-installer/ffmpeg contents:`, ffmpegPackageContents);
              
              // Check for binary files in the package
              for (const item of ffmpegPackageContents) {
                if (item.includes('ffmpeg') && !item.includes('.')) { // Likely the binary
                  const itemPath = path.join(ffmpegPackagePath, item);
                  try {
                    const stat = require('fs').statSync(itemPath);
                    console.log(`${item}: size=${stat.size}, isFile=${stat.isFile()}, mode=${stat.mode.toString(8)}`);
                    
                    if (stat.isFile() && stat.size > 1000000) { // FFmpeg binary should be large
                      console.log(`✅ FOUND BINARY: ${itemPath}, size=${stat.size}, executable=${!!(stat.mode & parseInt('111', 8))}`);
                      return itemPath;
                    }
                  } catch (statError: any) {
                    console.log(`Could not stat ${itemPath}:`, statError.message);
                  }
                }
              }
            }
          } else {
            console.log(`❌ @ffmpeg-installer package NOT found in ${nodeModulesPath}`);
          }
        }
      }
    } catch (error: any) {
      console.log(`Could not list contents of ${dir}:`, error.message);
    }
  }
  
  const allPaths = [...fallbackPaths, ...systemPaths];
  throw new Error(`FFmpeg binary not found in any location. Environment: ${process.env.VERCEL ? 'Vercel' : 'Other'}. Checked ${allPaths.length} paths: ${allPaths.join(', ')}`);
}

const AUDIO_FILES = ['1.mp3', '2.mp3', '3.mp3', '4.mp3'];

function getRandomAudioFile(): string | null {
  const randomIndex = Math.floor(Math.random() * AUDIO_FILES.length);
  const selectedAudio = AUDIO_FILES[randomIndex];
  const audioPath = path.join(process.cwd(), 'public', 'audio', selectedAudio);
  
  console.log(`Selected audio file: ${selectedAudio}`);
  
  const publicAudioDir = path.join(process.cwd(), 'public', 'audio');
  const { existsSync } = require('fs');
  
  if (existsSync(publicAudioDir)) {
    // Log available audio files for debugging static asset bundling
    try {
      const audioFiles = require('fs').readdirSync(publicAudioDir);
      console.log(`Available audio files in public/audio:`, audioFiles);
    } catch (err: any) {
      console.log(`Could not read audio directory:`, err.message);
    }
  }
  
  // Verify audio file exists
  if (!existsSync(audioPath)) {
    console.warn(`Audio file not found at ${audioPath}, using embedded audio generation`);
    return null; 
  }
  
  console.log(`Audio file found at: ${audioPath}`);
  return audioPath;
}

async function saveDebugVideo(videoBuffer: Buffer, jobId: string, themeName?: string) {
  if (!config.DEBUG_MODE) return;
  try {
    const debugDir = path.join(tmpdir(), 'generated-videos-debug');
    await fs.mkdir(debugDir, { recursive: true });
    const themePrefix = themeName ? `${themeName}-` : '';
    const destinationPath = path.join(debugDir, `${themePrefix}quiz-${jobId}.mp4`);
    await fs.writeFile(destinationPath, videoBuffer);
    console.log(`[DEBUG] Video for job ${jobId} saved to: ${destinationPath}`);
  } catch (error) {
    console.error(`[DEBUG] Failed to save debug video for job ${jobId}:`, error);
  }
}

function getFrameDuration(questionData: any, frameNumber: number): number {
  if (!questionData || typeof questionData !== 'object') {
    return 5;
  }
  
  const CHARS_PER_SECOND = 10;
  const EXTRA_PROCESSING_TIME = 1.5;
  
  switch (frameNumber) {
    case 1:
      const firstText = questionData.question || questionData.mistake || questionData.basic_word || questionData.action || questionData.wrong_example || questionData.setup || '';
      const firstOptions = questionData.options ? Object.values(questionData.options).join(" ") : '';
      const firstLength = firstText.length + firstOptions.length;
      const firstBaseTime = Math.ceil(firstLength / CHARS_PER_SECOND);
      return Math.max(4, Math.min(8, firstBaseTime + EXTRA_PROCESSING_TIME));
      
    case 2:
      const secondText = questionData.answer || questionData.correct || questionData.advanced_word || questionData.result || questionData.right_example || questionData.challenge || '';
      const secondBaseTime = Math.ceil(secondText.length / CHARS_PER_SECOND);
      return Math.max(4, Math.min(7, secondBaseTime + EXTRA_PROCESSING_TIME));
      
    case 3:
      const thirdText = questionData.explanation || questionData.practice || questionData.reveal || '';
      if (thirdText.length > 0) {
        const thirdBaseTime = Math.ceil(thirdText.length / CHARS_PER_SECOND);
        return Math.max(4, Math.min(8, thirdBaseTime + EXTRA_PROCESSING_TIME));
      }
      return 4;
      
    case 4:
      const fourthText = questionData.cta || '';
      if (fourthText.length > 0) {
        const fourthBaseTime = Math.ceil(fourthText.length / CHARS_PER_SECOND);
        return Math.max(3, Math.min(6, fourthBaseTime + EXTRA_PROCESSING_TIME));
      }
      return 4;
      
    case 5:
      return 4;
      
    default:
      return 5;
  }
}


// --- Main Job Processing Function (Kept as synchronous worker) ---
async function processJob(job: QuizJob) {
  const tempDir = path.join(tmpdir(), `quiz-video-${job.id}-${Date.now()}`);
  const jobStartTime = Date.now();
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
    
    const jobDuration = (Date.now() - jobStartTime) / 1000;
    console.log(`[Job ${job.id}] ✅ Video assembly successful. Total Time: ${jobDuration.toFixed(2)}s`);
    return { id: job.id, persona: job.persona };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Job ${job.id}] ❌ Failed to assemble video:`, errorMessage);
    await updateJob(job.id, {
      status: 'failed',
      error_message: `Video assembly failed: ${errorMessage.substring(0, 500)}`
    });
    // We MUST re-throw here to ensure the top-level catch logs it if called synchronously
    throw error; 
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(e => console.warn(`Failed to cleanup temp dir ${tempDir}:`, e));
  }
}

async function assembleVideoWithConcat(frameUrls: string[], job: QuizJob, tempDir: string): Promise<{videoUrl: string, videoSize: number}> {
  const assemblyStartTime = Date.now();
  const ffmpegPath = getFFmpegPath();

  console.log(`[Job ${job.id}] 0. Starting network egress test...`);
  const networkTestStart = Date.now();
  try {
      // CRITICAL: Test external network connectivity
      await fetch('https://www.google.com', { signal: AbortSignal.timeout(5000) });
      console.log(`[Job ${job.id}] ✅ Network Egress Test successful in ${((Date.now() - networkTestStart) / 1000).toFixed(3)}s.`);
  } catch (error) {
      const errMsg = `CRITICAL Network Egress Failure. The function cannot reach external websites.`;
      console.error(`[Job ${job.id}] ❌ ${errMsg}:`, error);
      throw new Error(errMsg);
  }

  console.log(`[Job ${job.id}] 1. Starting frame download and clip preparation...`);
  const downloadStart = Date.now();

  // Download frames and write to disk sequentially to manage memory
  const framePaths: string[] = [];
  const frameDurations: number[] = [];
  const questionData = job.data.content || job.data.content || {};

  for (let index = 0; index < frameUrls.length; index++) {
      const url = frameUrls[index];
      const frameNumber = index + 1;
      const individualFrameStart = Date.now();

      try {
          console.log(`[Job ${job.id}] Downloading frame ${frameNumber}...`); 
          const frameBuffer = await downloadImageFromCloudinary(url);
          const framePath = path.join(tempDir, `frame-${String(frameNumber).padStart(3, '0')}.png`);
          await fs.writeFile(framePath, frameBuffer);
          
          const duration = getFrameDuration(questionData, frameNumber) || 4;
          framePaths.push(framePath);
          frameDurations.push(duration);

          const frameTime = (Date.now() - individualFrameStart) / 1000;
          console.log(`[Job ${job.id}] Frame ${frameNumber} downloaded/saved (${frameBuffer.length} bytes, ${duration.toFixed(1)}s duration) in ${frameTime.toFixed(3)}s.`);
      } catch (error) {
          console.error(`[Job ${job.id}] CRITICAL: Failed to download or save frame ${frameNumber}.`, error);
          throw new Error(`Failed to process frame ${frameNumber} during download/save: ${error instanceof Error ? error.message : String(error)}`);
      }
  }

  const clipPrepStart = Date.now();

  // Create individual video clips from static frames
  const clipPromises = framePaths.map(async (framePath, index) => {
    const duration = frameDurations[index];
    const clipPath = path.join(tempDir, `clip-${String(index + 1).padStart(3, '0')}.mp4`);
    
    const args = [
      '-loop', '1',
      '-i', framePath,
      '-c:v', 'libx264',
      '-t', String(duration),
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-y', clipPath
    ];

    const clipStartTime = Date.now();
    await new Promise<void>((resolve, reject) => {
      let stderr = '';
      const process = spawn(ffmpegPath, args, { cwd: tempDir });
      process.stderr?.on('data', (d) => { stderr += d.toString(); });
      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg clip ${index + 1} failed with code ${code}. Stderr: ${stderr.slice(-500)}`));
      });
      process.on('error', reject);
    });
    console.log(`[Job ${job.id}] Clip ${index + 1} (duration ${duration.toFixed(1)}s) created in ${((Date.now() - clipStartTime) / 1000).toFixed(3)}s.`);

    return clipPath;
  });

  const clipPaths = await Promise.all(clipPromises);
  const clipPrepTime = (Date.now() - clipPrepStart) / 1000;
  console.log(`[Job ${job.id}] Clips preparation finished. Time: ${clipPrepTime.toFixed(2)}s.`);

  const concatStart = Date.now();
  // Create concat file for the clips
  const concatContent = clipPaths.map(path => `file '${path.split('/').pop()}'`).join('\n');
  const concatFilePath = path.join(tempDir, 'concat.txt');
  await fs.writeFile(concatFilePath, concatContent);
  const concatTime = (Date.now() - concatStart) / 1000;
  console.log(`[Job ${job.id}] 2. Concat file created. Time: ${concatTime.toFixed(3)}s.`);


  const finalFfmpegStart = Date.now();
  const outputVideoPath = path.join(tempDir, `quiz-${job.id}.mp4`);
  const totalDuration = frameDurations.reduce((acc, d) => acc + d, 0); 
  const audioPath = getRandomAudioFile();

  let ffmpegArgs: string[];
  
  if (audioPath) {
    ffmpegArgs = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath,
      '-stream_loop', '-1',
      '-i', audioPath,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-filter:a', 'volume=0.3',
      '-shortest',
      '-t', String(totalDuration), 
      '-y', outputVideoPath
    ];
  } else {
    ffmpegArgs = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-t', String(totalDuration),
      '-y', outputVideoPath
    ];
  }

  console.log(`[Job ${job.id}] 3. Running final FFmpeg assembly...`);

  await new Promise<void>((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, { cwd: tempDir });
    let stderr = '';
    ffmpegProcess.stderr?.on('data', (d) => { stderr += d.toString(); });
    ffmpegProcess.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg final assembly failed with code ${code}. Stderr: ${stderr.slice(-500)}`));
    });
    ffmpegProcess.on('error', (err) => reject(err));
  });
  
  const finalFfmpegTime = (Date.now() - finalFfmpegStart) / 1000;
  console.log(`[Job ${job.id}] Final FFmpeg finished. Time: ${finalFfmpegTime.toFixed(2)}s.`);

  const uploadStart = Date.now();
  const videoBuffer = await fs.readFile(outputVideoPath);
  
  // Save debug video locally if DEBUG_MODE is enabled
  await saveDebugVideo(videoBuffer, job.id, job.data.themeName);
  
  // Get account ID from job data
  const accountId = job.account_id;
  if (!accountId) {
    throw new Error(`Job ${job.id} is missing account_id - database migration may be incomplete`);
  }
  
  const publicId = generateVideoPublicId(job.id, accountId, job.persona, job.data.themeName);
  const result = await uploadVideoToCloudinary(videoBuffer, accountId, {
    folder: config.CLOUDINARY_VIDEOS_FOLDER,
    public_id: publicId,
    resource_type: 'video',
  });
  const uploadTime = (Date.now() - uploadStart) / 1000;
  const totalAssemblyTime = (Date.now() - assemblyStartTime) / 1000;

  console.log(`[Job ${job.id}] 4. Cloudinary upload finished. Time: ${uploadTime.toFixed(2)}s.`);
  console.log(`[Job ${job.id}] Total assembleVideoWithConcat time: ${totalAssemblyTime.toFixed(2)}s.`);

  return { videoUrl: result.secure_url, videoSize: videoBuffer.length };
}


// --- POST Function (Refactored for Asynchronous Execution) ---

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 1. Parse accountId
    let accountId: string | undefined;
    try {
      const body = await request.json();
      accountId = body.accountId;
    } catch {
      // No body
    }

    console.log(`🚀 Starting ASYNC video assembly check for account: ${accountId || 'all'}`);
    
    // 2. Auto-retry failed jobs first (synchronous database operation)
    await autoRetryFailedJobs();

    // 3. Fetch the single oldest job pending assembly (Step 3)
    // We only fetch one job to minimize contention and keep the initial response fast.
    const job = await getOldestPendingJob(3, accountId);
    
    if (!job) {
      const message = `No jobs pending video assembly for account: ${accountId || 'all'}.`;
      console.log(message);
      return NextResponse.json({ success: true, message });
    }

    // 4. Delegate the heavy lifting to an UNWAITED promise
    console.log(`[Video Assembly] Found job ${job.id}. Starting ASYNC process...`);

    // The promise is NOT awaited. It runs in the background.
    // The .catch() ensures any failure is logged and the DB status is updated.
    processJob(job).catch((error) => {
        // processJob updates the DB status to 'failed', we just log the final error here.
        console.error(`[Video Assembly] ASYNC JOB FAILED in background for job ${job.id}:`, error);
    });
    
    // 5. Respond IMMEDIATELY to the HTTP request
    const responseDuration = (Date.now() - requestStartTime) / 1000;
    console.log(`[Video Assembly] ASYNC response sent for job ${job.id}. Response time: ${responseDuration.toFixed(2)}s.`);

    return NextResponse.json({ 
      success: true, 
      message: `Job ${job.id} started ASYNC processing (unawaited).`,
      processedJobId: job.id
    });

  } catch (error) {
    console.error('Video assembly endpoint failed:', error);
    return NextResponse.json({ success: false, error: 'Video assembly endpoint failed' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;