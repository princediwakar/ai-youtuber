//lib/frameService.ts
import { createCanvas, Canvas, registerFont } from 'canvas';
import path from 'path';
import { promises as fs } from 'fs';
import { config } from './config';
import { themes } from './visuals/themes';
import { QuizJob } from '@/lib/types';
import { Theme } from './visuals/themes';
import { PersonaThemeMap } from './visuals/themeMap';
import * as mcqLayout from './visuals/layouts/mcqLayout';
import * as commonMistakeLayout from './visuals/layouts/commonMistakeLayout';
import * as quickFixLayout from './visuals/layouts/quickFixLayout';
import * as usageDemoLayout from './visuals/layouts/usageDemoLayout';
import * as quickTipLayout from './visuals/layouts/quickTipLayout';
import * as beforeAfterLayout from './visuals/layouts/beforeAfterLayout';
import * as challengeLayout from './visuals/layouts/challengeLayout';
import { 
  uploadImageToCloudinary, 
  generateFramePublicIds,
  cleanupJobFrames
} from '@/lib/cloudinary';
import { getAccountConfig } from '@/lib/accounts';
import { renderCtaFrame } from '@/lib/visuals/layouts/commonFrames';
import { ContentFormat, FormatType, getFormat } from '@/lib/formats';

// Enhanced interface for format-aware job data
interface FormatJobData extends QuizJob {
  formatType?: FormatType;
  formatFrameData?: any[];
}


// Centralized font registration
try {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Poppins-Bold.ttf');
  registerFont(fontPath, { family: 'Poppins', weight: 'bold' });
} catch (error) {
  console.error("CRITICAL: Failed to register font. Frames cannot be created.", error);
}

// Legacy Layout Router (used only for fallback when format system fails)
// TODO: Remove when format system is fully stable
const legacyLayoutRouter = {
  multiple_choice: mcqLayout,
  assertion_reason: mcqLayout,
  true_false: mcqLayout,
  default: mcqLayout,
};

// Format-specific frame rendering functions
interface FormatFrameRenderer {
  [formatType: string]: {
    [frameType: string]: (canvas: Canvas, job: QuizJob, theme: Theme) => void;
  };
}

const formatFrameRenderers: FormatFrameRenderer = {
  mcq: {
    hook: (canvas: Canvas, job: QuizJob, theme: Theme) => mcqLayout.renderQuestionFrame(canvas, job, theme),
    question: (canvas: Canvas, job: QuizJob, theme: Theme) => mcqLayout.renderQuestionFrame(canvas, job, theme),
    options: (canvas: Canvas, job: QuizJob, theme: Theme) => mcqLayout.renderQuestionFrame(canvas, job, theme),
    answer: (canvas: Canvas, job: QuizJob, theme: Theme) => mcqLayout.renderAnswerFrame(canvas, job, theme),
    explanation: (canvas: Canvas, job: QuizJob, theme: Theme) => mcqLayout.renderExplanationFrame(canvas, job, theme),
    cta: (canvas: Canvas, job: QuizJob, theme: Theme) => renderCtaFrame(canvas, job, theme),
  },
  common_mistake: {
    hook: (canvas: Canvas, job: QuizJob, theme: Theme) => commonMistakeLayout.renderHookFrame(canvas, job, theme),
    mistake: (canvas: Canvas, job: QuizJob, theme: Theme) => commonMistakeLayout.renderMistakeFrame(canvas, job, theme),
    correct: (canvas: Canvas, job: QuizJob, theme: Theme) => commonMistakeLayout.renderCorrectFrame(canvas, job, theme),
    practice: (canvas: Canvas, job: QuizJob, theme: Theme) => commonMistakeLayout.renderPracticeFrame(canvas, job, theme),
    cta: (canvas: Canvas, job: QuizJob, theme: Theme) => renderCtaFrame(canvas, job, theme),
  },
  quick_fix: {
    hook: (canvas: Canvas, job: QuizJob, theme: Theme) => quickFixLayout.renderHookFrame(canvas, job, theme),
    before: (canvas: Canvas, job: QuizJob, theme: Theme) => quickFixLayout.renderBeforeFrame(canvas, job, theme),
    after: (canvas: Canvas, job: QuizJob, theme: Theme) => quickFixLayout.renderAfterFrame(canvas, job, theme),
    cta: (canvas: Canvas, job: QuizJob, theme: Theme) => renderCtaFrame(canvas, job, theme),
  },
  usage_demo: {
    hook: (canvas: Canvas, job: QuizJob, theme: Theme) => usageDemoLayout.renderHookFrame(canvas, job, theme),
    wrong: (canvas: Canvas, job: QuizJob, theme: Theme) => usageDemoLayout.renderWrongFrame(canvas, job, theme),
    right: (canvas: Canvas, job: QuizJob, theme: Theme) => usageDemoLayout.renderRightFrame(canvas, job, theme),
    practice: (canvas: Canvas, job: QuizJob, theme: Theme) => usageDemoLayout.renderPracticeFrame(canvas, job, theme),
    cta: (canvas: Canvas, job: QuizJob, theme: Theme) => renderCtaFrame(canvas, job, theme),
  },
  quick_tip: {
    hook: (canvas: Canvas, job: QuizJob, theme: Theme) => quickTipLayout.renderHookFrame(canvas, job, theme),
    action: (canvas: Canvas, job: QuizJob, theme: Theme) => quickTipLayout.renderActionFrame(canvas, job, theme),
    result: (canvas: Canvas, job: QuizJob, theme: Theme) => quickTipLayout.renderResultFrame(canvas, job, theme),
    cta: (canvas: Canvas, job: QuizJob, theme: Theme) => renderCtaFrame(canvas, job, theme),
  },
  before_after: {
    hook: (canvas: Canvas, job: QuizJob, theme: Theme) => beforeAfterLayout.renderHookFrame(canvas, job, theme),
    before: (canvas: Canvas, job: QuizJob, theme: Theme) => beforeAfterLayout.renderBeforeFrame(canvas, job, theme),
    after: (canvas: Canvas, job: QuizJob, theme: Theme) => beforeAfterLayout.renderAfterFrame(canvas, job, theme),
    proof: (canvas: Canvas, job: QuizJob, theme: Theme) => beforeAfterLayout.renderProofFrame(canvas, job, theme),
    cta: (canvas: Canvas, job: QuizJob, theme: Theme) => renderCtaFrame(canvas, job, theme),
  },
  challenge: {
    hook: (canvas: Canvas, job: QuizJob, theme: Theme) => challengeLayout.renderHookFrame(canvas, job, theme),
    setup: (canvas: Canvas, job: QuizJob, theme: Theme) => challengeLayout.renderSetupFrame(canvas, job, theme),
    challenge: (canvas: Canvas, job: QuizJob, theme: Theme) => challengeLayout.renderChallengeFrame(canvas, job, theme),
    reveal: (canvas: Canvas, job: QuizJob, theme: Theme) => challengeLayout.renderRevealFrame(canvas, job, theme),
    cta: (canvas: Canvas, job: QuizJob, theme: Theme) => challengeLayout.renderCtaFrame(canvas, job, theme),
  }
};

export async function createFramesForJob(job: QuizJob): Promise<string[]> {
  const theme = selectThemeForPersona(job.persona);
  const formatJob = job as FormatJobData;
  
  // Determine format type
  const formatType = (formatJob.formatType || job.format_type || 'mcq') as FormatType;
  const format = getFormat(formatType, job.account_id);
  
  if (!format) {
    console.warn(`Format ${formatType} not found for account ${job.account_id}, falling back to MCQ`);
    return createLegacyFrames(job, theme);
  }

  // Support both legacy and new content structures
  const contentData = job.data?.content || job.data?.question;
  if (!contentData) {
    throw new Error(`Job ${job.id} missing content data. Expected either job.data.content or job.data.question.`);
  }

  // Ensure job.data.question exists for layout functions (normalize the structure)
  if (!job.data.question && job.data.content) {
    job.data.question = job.data.content;
  }

  // Generate frames based on format definition
  const framesToRender = createFrameRenderPipeline(format, formatJob, theme);
  
  const renderedCanvases: Canvas[] = [];
  for (const [index, renderFunction] of framesToRender.entries()) {
    const canvas = createCanvas(config.VIDEO_WIDTH, config.VIDEO_HEIGHT);
    renderFunction(canvas);
    
    if (config.DEBUG_MODE) {
      const frameType = format.frames[index]?.type || `frame-${index}`;
      await saveDebugFrame(canvas, `${theme.name}-job-${job.id}-${formatType}-${frameType}.png`);
    }
    renderedCanvases.push(canvas);
  }

  // Get account for this job to determine upload destination
  const account = await getAccountConfig(job.account_id);
  const frameUrls = await uploadFrames(job.id, theme.name, renderedCanvases, account.id);
  
  const { updateJob } = await import('@/lib/database');
  await updateJob(job.id, {
    data: { 
      ...job.data, 
      frameUrls, 
      themeName: theme.name,
      formatType,
      formatMetadata: {
        frameCount: format.frameCount,
        totalDuration: format.timing.totalDuration
      }
    }
  });
  
  return frameUrls;
}

// Legacy frame creation for backward compatibility
function createLegacyFrames(job: QuizJob, theme: Theme): Promise<string[]> {
  const contentData = job.data?.content || job.data?.question;
  const questionType = contentData?.question_type || 'multiple_choice';
  const layout = legacyLayoutRouter[questionType as keyof typeof legacyLayoutRouter] || legacyLayoutRouter.default;

  const framesToRender = [
    (canvas: Canvas) => layout.renderQuestionFrame(canvas, job, theme),
    (canvas: Canvas) => layout.renderAnswerFrame(canvas, job, theme),
    (canvas: Canvas) => layout.renderExplanationFrame(canvas, job, theme),
    (canvas: Canvas) => renderCtaFrame(canvas, job, theme),
  ];

  return renderFramesAndUpload(job, theme, framesToRender, ['question', 'answer', 'explanation', 'cta']);
}

// Create frame render pipeline based on format definition
function createFrameRenderPipeline(
  format: ContentFormat, 
  job: FormatJobData, 
  theme: Theme
): Array<(canvas: Canvas) => void> {
  const framesToRender: Array<(canvas: Canvas) => void> = [];
  const formatRenderers = formatFrameRenderers[format.type];
  
  if (!formatRenderers) {
    console.warn(`No renderers found for format ${format.type}, falling back to MCQ`);
    return [
      (canvas: Canvas) => mcqLayout.renderQuestionFrame(canvas, job, theme),
      (canvas: Canvas) => mcqLayout.renderAnswerFrame(canvas, job, theme),
      (canvas: Canvas) => mcqLayout.renderExplanationFrame(canvas, job, theme),
      (canvas: Canvas) => renderCtaFrame(canvas, job, theme),
    ];
  }

  // Create render functions for each frame in the format
  format.frames.forEach((frameDefinition, index) => {
    const renderer = formatRenderers[frameDefinition.type];
    if (renderer) {
      framesToRender.push((canvas: Canvas) => renderer(canvas, job, theme));
    } else {
      console.warn(`No renderer found for frame type ${frameDefinition.type} in format ${format.type}`);
      framesToRender.push((canvas: Canvas) => renderCtaFrame(canvas, job, theme));
    }
  });

  return framesToRender;
}

// Common frame rendering utility
async function renderFramesAndUpload(
  job: QuizJob, 
  theme: Theme, 
  framesToRender: Array<(canvas: Canvas) => void>,
  frameTypes: string[]
): Promise<string[]> {
  const renderedCanvases: Canvas[] = [];
  
  for (const [index, renderFunction] of framesToRender.entries()) {
    const canvas = createCanvas(config.VIDEO_WIDTH, config.VIDEO_HEIGHT);
    renderFunction(canvas);
    
    if (config.DEBUG_MODE) {
      const frameType = frameTypes[index] || `frame-${index}`;
      await saveDebugFrame(canvas, `${theme.name}-job-${job.id}-frame-${index + 1}-${frameType}.png`);
    }
    renderedCanvases.push(canvas);
  }

  const account = await getAccountConfig(job.account_id);
  const frameUrls = await uploadFrames(job.id, theme.name, renderedCanvases, account.id);
  
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

async function uploadFrames(jobId: string, themeName: string, canvases: Canvas[], accountId: string): Promise<string[]> {
  const publicIds = generateFramePublicIds(jobId, themeName, accountId, canvases.length);
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

// Health format layouts are now fully implemented and integrated above

