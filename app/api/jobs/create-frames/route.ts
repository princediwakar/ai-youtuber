// app/api/jobs/create-frames/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob } from '@/lib/database';
import { createCanvas, Canvas, CanvasRenderingContext2D, registerFont } from 'canvas';
import { promises as fs } from 'fs';
import path from 'path';

// --- FONT REGISTRATION ---
try {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Poppins-Bold.ttf');
  registerFont(fontPath, { family: 'Poppins', weight: 'bold' });
  console.log('Successfully registered Poppins-Bold font.');
} catch (error) {
  console.error('Failed to register font:', error);
}

// --- THEME CONFIGURATION ---
interface Theme {
  name: string;
  FONT_FAMILY: string;
  COLOR_BG_DARK: string;
  COLOR_BG_LIGHT: string;
  COLOR_TEXT_PRIMARY: string;
  COLOR_BUTTON_BG: string;
  COLOR_CORRECT_BG: string;
  COLOR_CORRECT_TEXT: string;
  MUTED_TEXT_COLOR: string;
}

// First, ensure your Theme interface includes the 'name' property
interface Theme {
  name: string;
  FONT_FAMILY: string;
  COLOR_BG_DARK: string;
  COLOR_BG_LIGHT: string;
  COLOR_TEXT_PRIMARY: string;
  COLOR_BUTTON_BG: string;
  COLOR_CORRECT_BG: string;
  COLOR_CORRECT_TEXT: string;
  MUTED_TEXT_COLOR: string;
}

// Corrected 'themes' constant as an array of Theme objects
const themes: Theme[] = [

  {
    name: 'darkCoffee',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#4b3832',
    COLOR_BG_LIGHT: '#854442',
    COLOR_TEXT_PRIMARY: '#fff4e6',
    COLOR_BUTTON_BG: '#3c2f2f',
    COLOR_CORRECT_BG: '#be9b7b',
    COLOR_CORRECT_TEXT: '#3c2f2f',
    MUTED_TEXT_COLOR: 'rgba(255, 244, 230, 0.5)',
  },
  {
    name: 'lightCoffee',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#fff4e6',
    COLOR_BG_LIGHT: '#fff4e6',
    COLOR_TEXT_PRIMARY: '#3c2f2f',
    COLOR_BUTTON_BG: '#be9b7b',
    COLOR_CORRECT_BG: '#854442',
    COLOR_CORRECT_TEXT: '#fff4e6',
    MUTED_TEXT_COLOR: 'rgba(60, 47, 47, 0.5)',
  },
  {
    name: 'warmPaper',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#FFFCF2',
    COLOR_BG_LIGHT: '#FFFCF2',
    COLOR_TEXT_PRIMARY: '#252422',
    COLOR_BUTTON_BG: '#CCC5B9',
    COLOR_CORRECT_BG: '#EB5E28',
    COLOR_CORRECT_TEXT: '#FFFCF2',
    MUTED_TEXT_COLOR: 'rgba(37, 36, 34, 0.5)',
  },
  {
    name: 'desertBloom',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#F4F1DE',
    COLOR_BG_LIGHT: '#F4F1DE',
    COLOR_TEXT_PRIMARY: '#3D405B',
    COLOR_BUTTON_BG: '#E07A5F', // Terracotta buttons for a warmer, bolder feel
    COLOR_CORRECT_BG: '#81B29A', // The sage green acts as a cool, surprising "bloom"
    COLOR_CORRECT_TEXT: '#F4F1DE',
    MUTED_TEXT_COLOR: 'rgba(61, 64, 91, 0.5)',
  },
  {
    name: 'charcoalOrange',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#252422',
    COLOR_BG_LIGHT: '#403D39',
    COLOR_TEXT_PRIMARY: '#FFFCF2',
    COLOR_BUTTON_BG: '#403D39',
    COLOR_CORRECT_BG: '#EB5E28',
    COLOR_CORRECT_TEXT: '#252422',
    MUTED_TEXT_COLOR: 'rgba(255, 252, 242, 0.6)',
  },
  {
    name: 'sageTerracotta',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#F4F1DE',
    COLOR_BG_LIGHT: '#F4F1DE',
    COLOR_TEXT_PRIMARY: '#3D405B',
    COLOR_BUTTON_BG: '#E07A5F',
    COLOR_CORRECT_BG: '#81B29A',
    COLOR_CORRECT_TEXT: '#F4F1DE',
    MUTED_TEXT_COLOR: 'rgba(61, 64, 91, 0.5)',
  },
  {
    name: 'midnightGarden',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#3D405B',
    COLOR_BG_LIGHT: '#3D405B',
    COLOR_TEXT_PRIMARY: '#F4F1DE',
    COLOR_BUTTON_BG: '#81B29A',
    COLOR_CORRECT_BG: '#F2CC8F',
    COLOR_CORRECT_TEXT: '#3D405B',
    MUTED_TEXT_COLOR: 'rgba(244, 241, 222, 0.6)',
  },
  {
    name: 'sunsetDune',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#F4F1DE',
    COLOR_BG_LIGHT: '#F4F1DE',
    COLOR_TEXT_PRIMARY: '#3D405B',
    COLOR_BUTTON_BG: '#F2CC8F',
    COLOR_CORRECT_BG: '#E07A5F',
    COLOR_CORRECT_TEXT: '#F4F1DE',
    MUTED_TEXT_COLOR: 'rgba(61, 64, 91, 0.5)',
  },
  {
    name: 'slateGold',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#3D405B',
    COLOR_BG_LIGHT: '#494c6f', // A slightly lighter variant of the dark slate
    COLOR_TEXT_PRIMARY: '#F2CC8F',
    COLOR_BUTTON_BG: 'rgba(244, 241, 222, 0.1)', // A subtle, almost transparent button
    COLOR_CORRECT_BG: '#81B29A',
    COLOR_CORRECT_TEXT: '#3D405B',
    MUTED_TEXT_COLOR: 'rgba(242, 204, 143, 0.6)',
  },
];


// --- CONFIGURATION & SETUP ---
const FRAMES_STORAGE_DIR = path.join('/tmp', 'generated-frames');

async function setupStorage() {
  try {
    await fs.mkdir(FRAMES_STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create frames storage directory:", error);
  }
}
setupStorage();

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const jobs = await getPendingJobs(2, 2);
    if (jobs.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No jobs pending frame creation.' });
    }

    const processPromises = jobs.map((job) => {
      // Select a random theme for every job
          // Select a random theme object directly from the array
    const randomIndex = Math.floor(Math.random() * themes.length);
    const selectedTheme = themes[randomIndex];
      return processJob(job, selectedTheme);
    });

    const results = await Promise.allSettled(processPromises);
    const processedJobs = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => (r as PromiseFulfilledResult<any>).value);
    return NextResponse.json({ success: true, processed: processedJobs.length, jobs: processedJobs });
  } catch (error) {
    console.error('Frame creation process failed:', error);
    return NextResponse.json({ success: false, error: 'Frame creation failed' }, { status: 500 });
  }
}

async function processJob(job: any, theme: Theme) {
  try {
    console.log(`Creating frames for job ${job.id} with theme ${theme.name}`); // Use theme.name
    const framePaths = await createAndStoreFrames(job.id, job.data.question, job.persona, job.category, theme);
    await updateJob(job.id, {
      step: 3,
      status: 'assembly_pending',
      data: { ...job.data, framePaths: framePaths }
    });
    console.log(`✅ Frame creation completed for job ${job.id}`);
    return { id: job.id, persona: job.persona, category: job.category };
  } catch (error) {
    console.error(`❌ Failed to create frames for job ${job.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateJob(job.id, {
      status: 'failed',
      error_message: `Frame creation failed: ${errorMessage}`
    });
    return null;
  }
}

async function saveDebugFrame(canvas: Canvas, filename: string) {
  if (process.env.DEBUG_MODE !== 'true') return;
  try {
    const debugDir = path.join(process.cwd(), 'debug-frames');
    await fs.mkdir(debugDir, { recursive: true });
    await fs.writeFile(path.join(debugDir, filename), canvas.toBuffer('image/png'));
    console.log(`📸 Saved debug frame: ${filename}`);
  } catch (error) {
    console.error(`Failed to save debug frame ${filename}:`, error);
  }
}

/**
 * Creates and stores video frames using a dynamic theme.
 */
async function createAndStoreFrames(jobId: string, question: any, persona: string, category: string, theme: Theme): Promise<string[]> {
  const width = 1080;
  const height = 1920;

  const questionText = question?.question || 'Despite the company’s efforts to ___ its carbon emissions, critics argued the new policy would only ___ the problem.';
  const explanationText = question?.explanation || 'Affect is a verb meaning ‘to influence’, while effect is a noun meaning ‘a result’. You affect something to produce an effect.';
  const correctAnswer = question?.answer || 'B';
  const options = question?.options || { A: 'lessen & lesson', B: 'affect & effect', C: 'compliment & complement', D: 'elicit & illicit' };

  // --- Helper Functions ---
  const createBaseCanvas = () => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, theme.COLOR_BG_DARK);
    gradient.addColorStop(1, theme.COLOR_BG_LIGHT);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return { canvas, ctx };
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0] || '';
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = `${currentLine} ${word}`;
        if (ctx.measureText(testLine).width > maxWidth && i > 0) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    return lines;
  };

  const drawHeader = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = theme.COLOR_TEXT_PRIMARY;
    ctx.font = `48px ${theme.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(`QUIZ TIME`, width / 2, 100);
  };

  const drawFooter = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = theme.COLOR_TEXT_PRIMARY;
    ctx.font = `40px ${theme.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText('@gibbiai', width / 2, height - 60);
  };

  const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  };

  // --- Frame 1 & 2 (Question/Answer) ---
  const frames = [];
  for (let i = 1; i <= 2; i++) {
    const isAnswerFrame = i === 2;
    const frame = createBaseCanvas();
    drawHeader(frame.ctx);

    frame.ctx.fillStyle = theme.COLOR_TEXT_PRIMARY;
    frame.ctx.textAlign = 'center';

    let y = 350;
    if (questionText.length < 20) {
      frame.ctx.font = `140px ${theme.FONT_FAMILY}`;
      frame.ctx.fillText(questionText, width / 2, y);
      y += 120;
      frame.ctx.font = `45px ${theme.FONT_FAMILY}`;
      frame.ctx.fillText('What is the meaning of this word?', width / 2, y);
    } else {
      frame.ctx.font = `64px ${theme.FONT_FAMILY}`;
      const questionLines = wrapText(frame.ctx, questionText, width - 120);
      questionLines.forEach(line => {
        frame.ctx.fillText(line, width / 2, y);
        y += 85;
      });
    }

    const optionsYStart = (persona === 'vocabulary' && questionText.length < 20) ? 650 : y + 150;
    let optionY = optionsYStart;

    frame.ctx.font = `50px ${theme.FONT_FAMILY}`;
    const buttonWidth = width * 0.8;
    const buttonHeight = 120;
    const buttonX = (width - buttonWidth) / 2;

    Object.entries(options).forEach(([key, value]) => {
      const optionText = `${key}) ${value}`;
      const textWidth = frame.ctx.measureText(optionText).width;
      const maxTextWidth = buttonWidth - 40; // 20px padding on each side
      
      let currentButtonHeight = buttonHeight;
      let lines = [optionText];
      
      // If text is too wide, wrap it
      if (textWidth > maxTextWidth) {
        lines = wrapText(frame.ctx, optionText, maxTextWidth);
        currentButtonHeight = Math.max(buttonHeight, lines.length * 60 + 20);
      }
      
      if (isAnswerFrame) {
        const isCorrect = key === correctAnswer;
        if (isCorrect) {
          drawRoundRect(frame.ctx, buttonX, optionY, buttonWidth, currentButtonHeight, 20, theme.COLOR_CORRECT_BG);
          frame.ctx.fillStyle = theme.COLOR_CORRECT_TEXT;
        } else {
          drawRoundRect(frame.ctx, buttonX, optionY, buttonWidth, currentButtonHeight, 20, theme.COLOR_BUTTON_BG);
          frame.ctx.fillStyle = theme.MUTED_TEXT_COLOR;
        }
      } else {
        drawRoundRect(frame.ctx, buttonX, optionY, buttonWidth, currentButtonHeight, 20, theme.COLOR_BUTTON_BG);
        frame.ctx.fillStyle = theme.COLOR_TEXT_PRIMARY;
      }
      
      // Draw text lines centered vertically in button
      const lineHeight = 60;
      const totalTextHeight = lines.length * lineHeight;
      const startY = optionY + (currentButtonHeight - totalTextHeight) / 2 + lineHeight / 2 + 10;
      
      lines.forEach((line, lineIndex) => {
        frame.ctx.fillText(line, width / 2, startY + lineIndex * lineHeight);
      });
      
      optionY += currentButtonHeight + 60;
    });

    drawFooter(frame.ctx);
    await saveDebugFrame(frame.canvas, `${theme.name}-job-${jobId}-frame-${i}-${isAnswerFrame ? 'answer' : 'question'}.png`);
    frames.push(frame.canvas);
  }

  // --- Frame 3: Explanation (with Dynamic Layout) ---
  const frame3 = createBaseCanvas();
  drawHeader(frame3.ctx);

  const contentYStart = 300;
  const contentYEnd = height - 300;
  const contentHeight = contentYEnd - contentYStart;
  const textPadding = 80;
  const textMaxWidth = width - (textPadding * 2);

  let finalFontSize = 55;
  let finalLines = [];
  let finalLineHeight = 0;

  for (let fs = finalFontSize; fs >= 20; fs -= 2) {
    const lineHeight = fs * 1.4;
    frame3.ctx.font = `${fs}px ${theme.FONT_FAMILY}`;
    const lines = wrapText(frame3.ctx, explanationText, textMaxWidth);
    const totalTextHeight = lines.length * lineHeight;

    if (totalTextHeight <= contentHeight - 150) {
      finalFontSize = fs;
      finalLines = lines;
      finalLineHeight = lineHeight;
      break;
    }
  }

  const titleHeight = 70;
  const spaceAfterTitle = 60;
  const bodyHeight = finalLines.length * finalLineHeight;
  const totalBlockHeight = titleHeight + spaceAfterTitle + bodyHeight;
  let y3 = contentYStart + (contentHeight - totalBlockHeight) / 2;

// --- Draw Title (Centered) ---
frame3.ctx.fillStyle = theme.COLOR_TEXT_PRIMARY;
frame3.ctx.textAlign = 'center'; // Set alignment to CENTER for the title
frame3.ctx.font = `${titleHeight}px ${theme.FONT_FAMILY}`;
frame3.ctx.fillText('Explanation', width / 2, y3);

  y3 += titleHeight + spaceAfterTitle;

// --- Draw Body Text (Left-aligned) ---
frame3.ctx.textAlign = 'left'; // ✅ FIX: Set alignment to LEFT for the body
frame3.ctx.font = `${finalFontSize}px ${theme.FONT_FAMILY}`;
const textX = textPadding; // ✅ FIX: Define the starting X coordinate

finalLines.forEach(line => {
  frame3.ctx.fillText(line, textX, y3); // ✅ FIX: Use the new X coordinate
  y3 += finalLineHeight;
});


  drawFooter(frame3.ctx);
  await saveDebugFrame(frame3.canvas, `${theme.name}-job-${jobId}-frame-3-explanation.png`);
  frames.push(frame3.canvas);

  // --- Save Canvases to Final Storage ---
  const savePromises = frames.map(async (canvas, index) => {
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join(FRAMES_STORAGE_DIR, `{theme.name}-job-${jobId}-frame-${index + 1}.png`);
    await fs.writeFile(filePath, buffer);
    return filePath;
  });

  return Promise.all(savePromises);
}