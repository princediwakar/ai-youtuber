import { Canvas } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
// Assuming drawingUtils is in the same directory based on layout file structure
import { drawBackground, wrapText, drawFooter, drawHeader } from '@/lib/visuals/drawingUtils'; 


/**
 * Renders the final call-to-action (CTA) frame.
 * This encourages viewers to like, follow, or comment.
 */
export function renderCtaFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { cta } = job.data.content;
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
  drawFooter(ctx, canvas.width, canvas.height, theme, job);
}
