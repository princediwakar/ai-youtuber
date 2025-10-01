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
  } catch (error) {
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
        } catch (execError) {
          console.log(`❌ FFmpeg at ${systemPath} exists but is not executable:`, execError.message);
        }
      }
    } catch (error) {
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
                  } catch (statError) {
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
    } catch (error) {
      console.log(`Could not list contents of ${dir}:`, error.message);
    }
  }
  
  const allPaths = [...fallbackPaths, ...systemPaths];
  throw new Error(`FFmpeg binary not found in any location. Environment: ${process.env.VERCEL ? 'Vercel' : 'Other'}. Checked ${allPaths.length} paths: ${allPaths.join(', ')}`);
}

// Array of available audio files
const AUDIO_FILES = [
  '1.mp3',
  '2.mp3', 
  '3.mp3',
];

/**
 * Randomly selects an audio file from the available options
 * @returns Full path to a random audio file
 */
function getRandomAudioFile(): string {
  const randomIndex = Math.floor(Math.random() * AUDIO_FILES.length);
  const selectedAudio = AUDIO_FILES[randomIndex];
  const audioPath = path.join(process.cwd(), 'public', 'audio', selectedAudio);
  
  console.log(`Selected audio file: ${selectedAudio}`);
  console.log(`Full audio path: ${audioPath}`);
  console.log(`Current working directory: ${process.cwd()}`);
  
  // Check if public/audio directory exists
  const publicAudioDir = path.join(process.cwd(), 'public', 'audio');
  const { existsSync } = require('fs');
  
  if (existsSync(publicAudioDir)) {
    console.log(`Audio directory exists: ${publicAudioDir}`);
    try {
      const audioFiles = require('fs').readdirSync(publicAudioDir);
      console.log(`Available audio files:`, audioFiles);
    } catch (err) {
      console.log(`Could not read audio directory:`, err.message);
    }
  } else {
    console.log(`Audio directory does not exist: ${publicAudioDir}`);
  }
  
  // Verify audio file exists
  if (!existsSync(audioPath)) {
    console.warn(`Audio file not found at ${audioPath}, using embedded audio generation`);
    return null; // Will trigger embedded audio generation
  }
  
  console.log(`Audio file found at: ${audioPath}`);
  return audioPath;
}

async function saveDebugVideo(videoBuffer: Buffer, jobId: string, themeName?: string, persona?: string) {
  if (!config.DEBUG_MODE) return;
  try {
    const debugDir = path.join(process.cwd(), 'generated-videos');
    await fs.mkdir(debugDir, { recursive: true });
    const personaName = persona || 'unknown';
    const theme = themeName || 'unknown';
    const destinationPath = path.join(debugDir, `1-video-${personaName}-quiz-${theme}-${jobId}.mp4`);
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

    // Parse request body to get accountId (optional)
    let accountId: string | undefined;
    try {
      const body = await request.json();
      accountId = body.accountId;
    } catch {
      // No body or invalid JSON - process all accounts
    }

    console.log(`🚀 Starting video assembly for account: ${accountId || 'all'}`);

    // FIXED: Process synchronously instead of fire-and-forget
    const result = await processVideoAssemblyWithRetry(accountId);

    return NextResponse.json({ 
      success: true, 
      accountId: accountId || 'all',
      result,
      message: 'Video assembly completed'
    });

  } catch (error) {
    console.error('Video assembly batch failed:', error);
    return NextResponse.json({ success: false, error: 'Video assembly failed' }, { status: 500 });
  }
}

/**
 * Background processing function that includes retry logic and video assembly.
 * Runs asynchronously without blocking the API response.
 */
async function processVideoAssemblyWithRetry(accountId: string | undefined) {
  try {
    console.log(`🔄 Background video assembly started for account: ${accountId || 'all'}`);
    
    // Auto-retry failed jobs with valid data (moved to background)
    await autoRetryFailedJobs();
    
    // Get jobs; prefer SQL-side filtering by account to avoid LIMIT mismatches
    const jobs = await getPendingJobs(3, config.ASSEMBLY_CONCURRENCY, undefined, accountId);
    
    if (jobs.length === 0) {
      const message = accountId ? 
        `No jobs pending video assembly for account ${accountId}` :
        'No jobs pending video assembly';
      console.log(message);
      return { success: false, message };
    }

    console.log(`Found ${jobs.length} jobs for video assembly. Processing...`);

    // Process video assembly
    const result = await processVideoAssemblyInBackground(jobs);
    
    console.log(`✅ Video assembly completed for account: ${accountId || 'all'}`);
    return result;

  } catch (error) {
    console.error(`❌ Video assembly failed for ${accountId}:`, error);
    throw error;
  }
}

/**
 * Background processing function for video assembly.
 * Runs asynchronously without blocking the API response.
 */
async function processVideoAssemblyInBackground(jobs: QuizJob[]) {
  try {
    console.log(`🔄 Background video assembly started for ${jobs.length} jobs`);

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

    const successCount = summary.filter(s => s.status === 'success').length;
    console.log(`✅ Video assembly completed: ${successCount}/${jobs.length} successful`);
    
    return { 
      success: true, 
      processed: jobs.length, 
      successful: successCount,
      summary 
    };

  } catch (error) {
    console.error('❌ Video assembly failed:', error);
    throw error;
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

    const { videoUrl, videoSize, audioFile } = await assembleVideoWithConcat(frameUrls, job, tempDir);
    
    await updateJob(job.id, {
      step: 4,
      status: 'upload_pending',
      data: { ...job.data, videoUrl, videoSize, audioFile }
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

async function assembleVideoWithConcat(frameUrls: string[], job: QuizJob, tempDir: string): Promise<{videoUrl: string, videoSize: number, audioFile: string | null}> {
  const ffmpegPath = getFFmpegPath();

  console.log(`[Job ${job.id}] Assembling video with simple concatenation...`);

  // Download frames
  const framePaths = await Promise.all(
    frameUrls.map(async (url, index) => {
      const frameBuffer = await downloadImageFromCloudinary(url);
      const framePath = path.join(tempDir, `frame-${String(index + 1).padStart(3, '0')}.png`);
      await fs.writeFile(framePath, frameBuffer);
      return framePath;
    })
  );

  // Normalize job data structure for different formats
  const questionData = job.data.content || job.data.content || {};
  
  // Determine actual frame count from frameUrls length
  const actualFrameCount = frameUrls.length;
  
  // Generate durations array based on actual frame count
  const durations = Array.from({ length: actualFrameCount }, (_, index) => {
    return getFrameDuration(questionData, index + 1) || 4;
  });

  // Create individual video clips from static frames
  const clipPromises = framePaths.map(async (framePath, index) => {
    const duration = durations[index];
    const clipPath = path.join(tempDir, `clip-${String(index + 1).padStart(3, '0')}.mp4`);
    
    const args = [
      '-loop', '1',
      '-i', framePath,
      '-c:v', 'libx264',
      '-t', String(duration || 4),
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-y', clipPath
    ];

    await new Promise<void>((resolve, reject) => {
      const process = spawn(ffmpegPath, args, { cwd: tempDir });
      let stderr = '';
      process.stderr?.on('data', (d) => { stderr += d.toString(); });
      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg clip creation failed with code ${code}. ${stderr ? 'Stderr: ' + stderr : ''}`));
      });
      process.on('error', reject);
    });

    return clipPath;
  });

  const clipPaths = await Promise.all(clipPromises);

  // Create concat file for the clips
  const concatContent = clipPaths.map(path => `file '${path.split('/').pop()}'`).join('\n');
  const concatFilePath = path.join(tempDir, 'concat.txt');
  await fs.writeFile(concatFilePath, concatContent);

  const outputVideoPath = path.join(tempDir, `quiz-${job.id}.mp4`);
  const totalDuration = durations.reduce((acc, d) => acc + (d || 4), 0);
  const audioPath = getRandomAudioFile();
  
  // Extract audio file name for analytics tracking
  const audioFileName = audioPath ? path.basename(audioPath) : null;

  let ffmpegArgs: string[];
  
  if (audioPath) {
    // Use background music with reduced volume (0.3 = 30% volume)
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
      '-t', String(totalDuration || 16),
      '-y', outputVideoPath
    ];
  } else {
    // Generate ambient background audio with low volume
    ffmpegArgs = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath,
      '-f', 'lavfi',
      '-i', 'sine=frequency=220:duration=' + String(totalDuration || 16) + ',sine=frequency=330:duration=' + String(totalDuration || 16) + ',sine=frequency=440:duration=' + String(totalDuration || 16),
      '-filter_complex', '[1:a][2:a][3:a]amix=inputs=3:duration=shortest:weights=0.3 0.4 0.3,volume=0.08,aecho=0.6:0.7:1000:0.2,lowpass=f=800',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-shortest',
      '-t', String(totalDuration || 16),
      '-y', outputVideoPath
    ];
  }

  console.log(`[Job ${job.id}] Running FFmpeg with args:`, ffmpegArgs);

  await new Promise<void>((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, { cwd: tempDir });
    let stderr = '';
    ffmpegProcess.stderr?.on('data', (d) => { stderr += d.toString(); });
    ffmpegProcess.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}. ${stderr ? 'Stderr: ' + stderr : ''}`));
    });
    ffmpegProcess.on('error', (err) => reject(err));
  });

  const videoBuffer = await fs.readFile(outputVideoPath);
  
  // Save debug video locally if DEBUG_MODE is enabled
  await saveDebugVideo(videoBuffer, job.id, job.data.themeName, job.persona);
  
  if (config.DEBUG_MODE) {
    // In DEBUG_MODE, skip Cloudinary upload to speed up testing
    const localVideoUrl = `local://generated-videos/1-video-${job.persona}-quiz-${job.data.themeName || 'unknown'}-${job.id}.mp4`;
    console.log(`[DEBUG] Skipping Cloudinary upload, using local URL: ${localVideoUrl}`);
    return { videoUrl: localVideoUrl, videoSize: videoBuffer.length, audioFile: audioFileName };
  }
  
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

  return { videoUrl: result.secure_url, videoSize: videoBuffer.length, audioFile: audioFileName };
}


function getFrameDuration(questionData: any, frameNumber: number): number {
  if (!questionData || typeof questionData !== 'object') {
    return 5; // Safe fallback for invalid data - increased from 4
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
// --- MODIFICATION END ---


export const runtime = 'nodejs';
export const maxDuration = 60;