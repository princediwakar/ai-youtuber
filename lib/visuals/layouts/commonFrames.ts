import { Canvas } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
// Assuming drawingUtils is in the same directory based on layout file structure
import { drawBackground, wrapText, drawFooter, drawHeader } from '@/lib/visuals/drawingUtils'; 

/**
 * Renders the initial hook frame to grab viewer attention.
 * This frame displays a short, catchy text phrase.
 */
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { hook } = job.data.question;
  const ctx = canvas.getContext('2d');
  
  // 1. Draw the standard background
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme, job);
  
  // 2. Set text properties for the hook text
  ctx.fillStyle = theme.text.primary;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle'; // Center text vertically
  
  const textMaxWidth = canvas.width - 120; // 60px padding on each side
  let fontSize = 90; // Start with a large font size
  let lines: string[];

  // 3. Dynamically reduce font size to fit the text within the canvas height
  do {
    ctx.font = `bold ${fontSize}px ${theme.fontFamily}`;
    lines = wrapText(ctx, hook, textMaxWidth);
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    
    // If text fits or font is at minimum, break the loop
    if (totalTextHeight < canvas.height * 0.6 || fontSize <= 50) {
      break;
    }
    fontSize -= 4; // Decrease font size and re-measure
  } while (fontSize > 50);

  // 4. Draw the final, wrapped text onto the canvas
  const lineHeight = fontSize * 1.2;
  const startY = (canvas.height - (lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight) - (lines.length / 2 * lineHeight / 2));
  });
  drawFooter(ctx, canvas.width, canvas.height, theme);
}

/**
 * Renders the final call-to-action (CTA) frame.
 * This encourages viewers to like, follow, or comment.
 */
export function renderCtaFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { cta } = job.data.question;
  const ctx = canvas.getContext('2d');

  // 1. Draw background
  drawBackground(ctx, canvas.width, canvas.height, theme);
  
  // 2. Draw the main CTA text
  ctx.fillStyle = theme.text.primary;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const textMaxWidth = canvas.width - 160;
  ctx.font = `bold 75px ${theme.fontFamily}`;
  const lines = wrapText(ctx, cta, textMaxWidth);
  const lineHeight = 75 * 1.2;
  const startY = (canvas.height / 2) - 80; // Position slightly above center

  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
  });

  // 3. Draw a secondary element, like the channel name
  const { MasterPersonas } = require('@/lib/personas');
  const personaDisplayName = MasterPersonas[job.persona]?.displayName || '';

  ctx.fillStyle = theme.text.secondary;
  ctx.font = `bold 45px ${theme.fontFamily}`;
  // ctx.fillText(`@${personaDisplayName}`, canvas.width / 2, canvas.height / 2 + 80);

  // 4. Draw the footer for a consistent look
  drawFooter(ctx, canvas.width, canvas.height, theme);
}
