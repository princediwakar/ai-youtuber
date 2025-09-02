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
  
  console.log(`[Job ${job.id}] Frame URLs to download:`, frameUrls);
  console.log(`[Job ${job.id}] Downloading ${frameUrls.length} frames to: ${tempDir}`);
  
  const downloadPromises = frameUrls.map(async (url, index) => {
    try {
      console.log(`[Job ${job.id}] Downloading frame ${index + 1} from: ${url}`);
      
      // Test if URL is accessible
      const testResponse = await fetch(url, { method: 'HEAD' });
      console.log(`[Job ${job.id}] Frame ${index + 1} URL test - Status: ${testResponse.status}, Content-Type: ${testResponse.headers.get('content-type')}`);
      
      if (!testResponse.ok) {
        throw new Error(`Frame URL not accessible: ${testResponse.status} ${testResponse.statusText}`);
      }
      
      const frameBuffer = await downloadImageFromCloudinary(url);
      if (!frameBuffer || frameBuffer.length === 0) {
        throw new Error(`Downloaded frame buffer is empty for URL: ${url}`);
      }
      
      const framePath = path.join(tempDir, `frame-${String(index + 1).padStart(3, '0')}.png`);
      console.log(`[Job ${job.id}] Saving frame ${index + 1} to: ${framePath} (${frameBuffer.length} bytes)`);
      
      await fs.writeFile(framePath, frameBuffer);
      
      // Verify file was written correctly
      const savedFile = await fs.stat(framePath);
      console.log(`[Job ${job.id}] Frame ${index + 1} saved successfully - File size: ${savedFile.size} bytes`);
      
      if (savedFile.size === 0) {
        throw new Error(`Saved frame file is empty: ${framePath}`);
      }
      
      return framePath;
    } catch (error) {
      console.error(`[Job ${job.id}] Failed to download frame ${index + 1}:`, error.message);
      throw new Error(`Frame ${index + 1} download failed: ${error.message}`);
    }
  });
  
  await Promise.all(downloadPromises);
  
  console.log(`[Job ${job.id}] All frames downloaded successfully`);
  
  // Verify all frame files exist
  try {
    const tempDirContentsAfterDownload = require('fs').readdirSync(tempDir);
    console.log(`[Job ${job.id}] Temp directory contents after frame download:`, tempDirContentsAfterDownload);
  } catch (err) {
    console.log(`[Job ${job.id}] Could not read temp directory after download:`, err.message);
  }

  const durations = [
      getFrameDuration(job.data.question, 1), // Hook
      getFrameDuration(job.data.question, 2), // Question
      getFrameDuration(job.data.question, 3), // Answer
      getFrameDuration(job.data.question, 4), // Explanation
      getFrameDuration(job.data.question, 5)  // CTA
  ];
  
  const inputFileContent = `ffconcat version 1.0\n` + durations.map((d, i) => 
    `file 'frame-${String(i + 1).padStart(3, '0')}.png'\nduration ${d}`
  ).join('\n');

  const inputFilePath = path.join(tempDir, 'inputs.txt');
  await fs.writeFile(inputFilePath, inputFileContent);

  const tempVideoPath = path.join(tempDir, `quiz-${job.id}.mp4`);
  const totalVideoDuration = durations.reduce((sum, duration) => sum + duration, 0);
  const audioPath = getRandomAudioFile();
  
  // Debug temp directory
  console.log(`[Job ${job.id}] Temp directory: ${tempDir}`);
  console.log(`[Job ${job.id}] Output video path: ${tempVideoPath}`);
  try {
    const tempDirContents = require('fs').readdirSync(tempDir);
    console.log(`[Job ${job.id}] Temp directory contents:`, tempDirContents);
  } catch (err) {
    console.log(`[Job ${job.id}] Could not read temp directory:`, err.message);
  }
  
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

  console.log(`[Job ${job.id}] Running FFmpeg with args:`, ffmpegArgs);
  
  // Verify FFmpeg binary is executable before spawning
  try {
    const stats = require('fs').statSync(ffmpegPath);
    console.log(`[Job ${job.id}] FFmpeg binary stats:`, {
      size: stats.size,
      isFile: stats.isFile(),
      mode: stats.mode.toString(8),
      executable: !!(stats.mode & parseInt('111', 8))
    });
  } catch (statError) {
    console.error(`[Job ${job.id}] Cannot stat FFmpeg binary:`, statError.message);
  }
  
  await new Promise<void>((resolve, reject) => {
    let ffmpegProcess;
    
    try {
      ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, { 
        cwd: tempDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PATH: process.env.PATH }
      });
    } catch (spawnError) {
      reject(new Error(`Failed to spawn FFmpeg: ${spawnError.message}. Path: ${ffmpegPath}. CWD: ${tempDir}`));
      return;
    }
    
    let stderr = '';
    let stdout = '';
    let hasStarted = false;
    
    ffmpegProcess.stdout?.on('data', (data: Buffer) => {
      hasStarted = true;
      stdout += data.toString();
      console.log(`[FFmpeg Job ${job.id} stdout]: ${data.toString()}`);
    });
    
    ffmpegProcess.stderr?.on('data', (data: Buffer) => {
      hasStarted = true;
      stderr += data.toString();
      console.log(`[FFmpeg Job ${job.id} stderr]: ${data.toString()}`);
    });
    
    ffmpegProcess.on('close', (code: number) => {
      console.log(`[Job ${job.id}] FFmpeg process closed with code: ${code}`);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}. stderr: ${stderr}. stdout: ${stdout}`));
      }
    });
    
    ffmpegProcess.on('error', (err) => {
      const errorContext = {
        error: err.message,
        code: err.code,
        errno: err.errno,
        path: ffmpegPath,
        hasStarted,
        platform: process.platform,
        arch: process.arch
      };
      console.error(`[Job ${job.id}] FFmpeg spawn error:`, errorContext);
      reject(new Error(`FFmpeg spawn error: ${err.message} (${err.code}). Path: ${ffmpegPath}. Context: ${JSON.stringify(errorContext)}`));
    });
    
    // Additional timeout safety
    setTimeout(() => {
      if (!hasStarted) {
        console.error(`[Job ${job.id}] FFmpeg did not start within 10 seconds, likely binary issue`);
        try {
          ffmpegProcess.kill();
        } catch (e) {}
        reject(new Error(`FFmpeg failed to start within 10 seconds. Binary may be corrupted or incompatible.`));
      }
    }, 10000);
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
  switch (frameNumber) {
    case 1: // Hook Frame
      return 2.5; // Short and snappy
    
    case 2: // Question Frame
      const textLength = (question?.question?.length || 0) + Object.values(question?.options || {}).join(" ").length;
      return Math.max(5, Math.min(7, Math.ceil(textLength / 15)));
      
    case 3: // Answer Frame
      return 3; // Enough time to see the answer
      
    case 4: // Explanation Frame
      return Math.max(4, Math.min(6, Math.ceil((question?.explanation?.length || 0) / 15)));
      
    case 5: // CTA Frame
      return 3; // Standard duration for a call-to-action
      
    default:
      return 4; // Fallback
  }
}
// --- MODIFICATION END ---


export const runtime = 'nodejs';
export const maxDuration = 300;