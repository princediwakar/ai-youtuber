import { createCanvas, Canvas, registerFont } from 'canvas';
import path from 'path';
import { promises as fs } from 'fs';
import { config } from './config';
import { themes } from './visuals/themes';
import { Theme, QuizJob } from '@/lib/types'; // Using QuizJob type
import { PersonaThemeMap } from './visuals/themeMap';
import * as mcqLayout from './visuals/layouts/mcqLayout';
import { 
  uploadImageToCloudinary, 
  generateFramePublicIds,
  cleanupJobFrames
} from '@/lib/cloudinary';

// Centralized font registration
try {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Poppins-Bold.ttf');
  registerFont(fontPath, { family: 'Poppins', weight: 'bold' });
} catch (error) {
  console.error("CRITICAL: Failed to register font. Frames cannot be created.", error);
}

// Layout Router
const layoutRouter = {
  multiple_choice: mcqLayout,
  default: mcqLayout,
};

export async function createFramesForJob(job: QuizJob): Promise<string[]> {
  const theme = selectThemeForPersona(job.persona);
  
  // @ts-ignore - question_type should be added to the job data for better routing
  const questionType = job.data.question.question_type || 'multiple_choice';
  const layout = layoutRouter[questionType as keyof typeof layoutRouter] || layoutRouter.default;

  const framesToRender = [
    (canvas: Canvas) => layout.renderQuestionFrame(canvas, job, theme),
    (canvas: Canvas) => layout.renderAnswerFrame(canvas, job, theme),
    (canvas: Canvas) => layout.renderExplanationFrame(canvas, job, theme),
  ];

  const renderedCanvases: Canvas[] = [];
  for (const [index, renderFunction] of framesToRender.entries()) {
      const canvas = createCanvas(config.VIDEO_WIDTH, config.VIDEO_HEIGHT);
      renderFunction(canvas);
      if (config.DEBUG_MODE) {
        await saveDebugFrame(canvas, `job-${job.id}-theme-${theme.name}-frame-${index + 1}.png`);
      }
      renderedCanvases.push(canvas);
  }

  return await uploadFrames(job.id, theme.name, renderedCanvases);
}

function selectThemeForPersona(persona: string): Theme {
  const themeNames = PersonaThemeMap[persona] || PersonaThemeMap.default;
  const randomThemeName = themeNames[Math.floor(Math.random() * themeNames.length)];
  return themes[randomThemeName];
}

async function uploadFrames(jobId: string, themeName: string, canvases: Canvas[]): Promise<string[]> { // 💡 FIX: Changed jobId to string
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