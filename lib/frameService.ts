//lib/frameService.ts
import { createCanvas, Canvas, registerFont } from 'canvas';
import path from 'path';
import { promises as fs } from 'fs';
import { config } from './config';
import { themes } from './visuals/themes';
import { QuizJob } from '@/lib/types';
import { Theme } from './visuals/themes';
import { PersonaThemeMap } from './visuals/themeMap';
import { 
  detectLayoutType, 
  getLayout, 
  createRenderFunctions,
  LayoutType
} from './visuals/layouts/layoutSelector';
import { 
  uploadImageToCloudinary, 
  generateFramePublicIds,
  cleanupJobFrames
} from '@/lib/cloudinary';
import { getAccountConfig } from '@/lib/accounts';

// Centralized font registration
try {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Poppins-Bold.ttf');
  registerFont(fontPath, { family: 'Poppins', weight: 'bold' });
} catch (error) {
  console.error("CRITICAL: Failed to register font. Frames cannot be created.", error);
}

export async function createFramesForJob(job: QuizJob): Promise<string[]> {
  const { theme, themeName } = selectThemeForPersona(job.persona);
  
  // Use new content structure
  const contentData = job.data?.content;
  if (!contentData) {
    throw new Error(`Job ${job.id} missing content data. Expected job.data.content.`);
  }
  
  // Detect layout type from content structure
  const layoutType = detectLayoutType(contentData);
  const layout = getLayout(layoutType);
  
  console.log(`[Job ${job.id}] Using ${layoutType} layout with theme ${themeName} and ${layout.frames.length} frames`);
  
  // Create render functions
  const renderFunctions = createRenderFunctions(layoutType, job, theme);
  
  const renderedCanvases: Canvas[] = [];
  for (const [index, renderFunction] of renderFunctions.entries()) {
    const canvas = createCanvas(config.VIDEO_WIDTH, config.VIDEO_HEIGHT);
    
    try {
      renderFunction(canvas);
    } catch (error) {
      console.error(`[Job ${job.id}] Error rendering frame ${index} (${layout.frames[index]}):`, error);
      // Render fallback frame
      renderFallbackFrame(canvas, job, theme, `Frame ${index + 1} Error`);
    }
    
    if (config.DEBUG_MODE) {
      const frameType = layout.frames[index] || `frame-${index}`;
      await saveDebugFrame(canvas, `${index + 1}-${frameType}-${job.persona}-${layoutType}-${theme.name}-${job.id}.png`);
    }
    renderedCanvases.push(canvas);
  }

  // Get account for this job to determine upload destination
  const account = await getAccountConfig(job.account_id);
  const frameUrls = await uploadFrames(job.id, themeName, renderedCanvases, account.id, job.persona, layoutType);
  
  // Calculate frame durations for analytics tracking
  const frameDurations = Array.from({ length: layout.frames.length }, (_, index) => {
    return calculateFrameDuration(contentData, index + 1) || 4;
  });
  
  const { updateJob } = await import('@/lib/database');
  await updateJob(job.id, {
    step: 3,
    status: 'assembly_pending',
    data: { 
      ...job.data, 
      frameUrls, 
      themeName: themeName,
      frameDurations: frameDurations,
      layoutType: layoutType,
      layoutMetadata: {
        frameCount: layout.frames.length,
        contentKeys: Object.keys(contentData),
        detectionTimestamp: Date.now()
      }
    }
  });
  
  console.log(`[Job ${job.id}] ✅ Generated ${renderedCanvases.length} frames using ${layoutType} layout`);
  return frameUrls;
}

// Render fallback frame for errors
function renderFallbackFrame(canvas: Canvas, job: QuizJob, theme: Theme, errorMessage: string): void {
  const ctx = canvas.getContext('2d');
  const { drawBackground, drawHeader, drawFooter } = require('./visuals/drawingUtils');
  
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme, job);
  
  // Draw error message
  ctx.fillStyle = theme.text.primary;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold 48px ${theme.fontFamily}`;
  ctx.fillText(errorMessage, canvas.width / 2, canvas.height / 2);
  
  drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

function selectThemeForPersona(persona: string): { theme: Theme; themeName: string } {
  const themeNames = PersonaThemeMap[persona] || PersonaThemeMap.default;
  const randomThemeName = themeNames[Math.floor(Math.random() * themeNames.length)];
  return {
    theme: themes[randomThemeName],
    themeName: randomThemeName
  };
}

function calculateFrameDuration(questionData: any, frameNumber: number): number {
  if (!questionData || typeof questionData !== 'object') {
    return 5; // Safe fallback for invalid data
  }
  
  const MIN_DURATION = 1.5; // Minimum time to register visual content
  
  switch (frameNumber) {
    case 1: // First Frame (Hook Frame - should be short and punchy)
      return MIN_DURATION;
      
    case 2: // Second Frame (varies by format)
      return 10;
      
    case 3: // Third Frame (if exists)
      return 3;
      
    case 4: // Fourth Frame (if exists)
      return 4;
      
    case 5: // Fifth Frame (if exists - rare, but possible for future formats)
      return 4;
      
    default:
      return 5; // Fallback
  }
}

async function uploadFrames(jobId: string, themeName: string, canvases: Canvas[], accountId: string, persona: string, layoutType: string): Promise<string[]> {
  const publicIds = generateFramePublicIds(jobId, themeName, accountId, canvases.length, persona, layoutType);
  try {
    const uploadPromises = canvases.map((canvas, index) => {
      const buffer = canvas.toBuffer('image/png');
      return uploadImageToCloudinary(buffer, accountId, {
        folder: config.CLOUDINARY_FRAMES_FOLDER,
        public_id: publicIds[index],
      });
    });
    const results = await Promise.all(uploadPromises);
    console.log(`[Job ${jobId}] ✅ All ${canvases.length} frames uploaded to ${accountId} Cloudinary account.`);
    return results.map(r => r.secure_url);
  } catch (error) {
    console.error(`[Job ${jobId}] ❌ Cloudinary upload failed for account ${accountId}. Cleaning up...`, error);
    await cleanupJobFrames(publicIds, accountId);
    throw new Error(`Failed to upload frames to Cloudinary for account ${accountId}.`);
  }
}

async function saveDebugFrame(canvas: Canvas, filename: string): Promise<void> {
  try {
    const debugDir = path.join(process.cwd(), 'debug-frames');
    await fs.mkdir(debugDir, { recursive: true });
    await fs.writeFile(path.join(debugDir, filename), canvas.toBuffer('image/png'));
    console.log(`[DEBUG] 📸 Saved debug frame: ${filename}`);
  } catch (error) {
    console.warn(`[DEBUG] Failed to save debug frame ${filename}:`, error);
  }
}