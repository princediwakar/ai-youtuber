//lib/frameService.ts
import { createCanvas, Canvas, registerFont } from 'canvas';
import path from 'path';
import { promises as fs } from 'fs';
import { config } from './config';
import { themes } from './visuals/themes';
import { Theme, QuizJob } from '@/lib/types';
import { PersonaThemeMap } from './visuals/themeMap';
import * as mcqLayout from './visuals/layouts/mcqLayout';
import * as trueFalseLayout from './visuals/layouts/trueFalseLayout';
import { 
  uploadImageToCloudinary, 
  generateFramePublicIds,
  cleanupJobFrames
} from '@/lib/cloudinary';

// --- FIX START ---
// 1. Correctly import from the commonFrames file using a relative path
import { renderHookFrame, renderCtaFrame } from '@/lib/visuals/layouts/commonFrames';
// --- FIX END ---


// Centralized font registration
try {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Poppins-Bold.ttf');
  registerFont(fontPath, { family: 'Poppins', weight: 'bold' });
} catch (error) {
  console.error("CRITICAL: Failed to register font. Frames cannot be created.", error);
}

// Layout Router (no changes here)
const layoutRouter = {
  multiple_choice: mcqLayout,
  assertion_reason: mcqLayout,
  true_false: trueFalseLayout,
  default: mcqLayout,
};

export async function createFramesForJob(job: QuizJob): Promise<string[]> {
  const theme = selectThemeForPersona(job.persona);
  
  const questionType = job.data.question.question_type || 'multiple_choice';
  const layout = layoutRouter[questionType as keyof typeof layoutRouter] || layoutRouter.default;

  // --- FIX START ---
  // 2. Call the common functions directly, and the specific functions via the 'layout' object
  const framesToRender = [
    (canvas: Canvas) => renderHookFrame(canvas, job, theme),           // Direct call
    (canvas: Canvas) => layout.renderQuestionFrame(canvas, job, theme),  // Layout-specific call
    (canvas: Canvas) => layout.renderAnswerFrame(canvas, job, theme),    // Layout-specific call
    (canvas: Canvas) => layout.renderExplanationFrame(canvas, job, theme),// Layout-specific call
    (canvas: Canvas) => renderCtaFrame(canvas, job, theme),           // Direct call
  ];
  // --- FIX END ---

  const renderedCanvases: Canvas[] = [];
  for (const [index, renderFunction] of framesToRender.entries()) {
      const canvas = createCanvas(config.VIDEO_WIDTH, config.VIDEO_HEIGHT);
      renderFunction(canvas);
      if (config.DEBUG_MODE) {
        const frameType = ['hook', 'question', 'answer', 'explanation', 'cta'][index];
        await saveDebugFrame(canvas, `${theme.name}-job-${job.id}-frame-${index + 1}-${frameType}.png`);
      }
      renderedCanvases.push(canvas);
  }

  const frameUrls = await uploadFrames(job.id, theme.name, renderedCanvases);
  
  const { updateJob } = await import('@/lib/database');
  await updateJob(job.id, {
    data: { ...job.data, frameUrls, themeName: theme.name }
  });
  
  return frameUrls;
}

function selectThemeForPersona(persona: string): Theme {
  const themeNames = PersonaThemeMap[persona] || PersonaThemeMap.default;
  const randomThemeName = themeNames[Math.floor(Math.random() * themeNames.length)];
  return themes[randomThemeName];
}

async function uploadFrames(jobId: string, themeName: string, canvases: Canvas[]): Promise<string[]> {
  const publicIds = generateFramePublicIds(jobId, themeName, canvases.length);
  try {
    const uploadPromises = canvases.map((canvas, index) => {
      const buffer = canvas.toBuffer('image/png');
      return uploadImageToCloudinary(buffer, {
        folder: config.CLOUDINARY_FRAMES_FOLDER,
        public_id: publicIds[index],
      });
    });
    const results = await Promise.all(uploadPromises);
    console.log(`[Job ${jobId}] ✅ All ${canvases.length} frames uploaded to Cloudinary.`);
    return results.map(r => r.secure_url);
  } catch (error) {
    console.error(`[Job ${jobId}] ❌ Cloudinary upload failed. Cleaning up...`, error);
    await cleanupJobFrames(publicIds);
    throw new Error('Failed to upload frames to Cloudinary.');
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

