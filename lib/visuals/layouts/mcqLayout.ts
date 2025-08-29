import { Canvas, CanvasRenderingContext2D } from 'canvas';
import { Theme } from '@/lib/visuals/themes'; // ✨ FIX: Import new Theme type
import { QuizJob } from '@/lib/types';
import { drawHeader, drawFooter, wrapText, drawRoundRect } from '../drawingUtils';

// --- Updated to use the new theme structure ---
const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, theme: Theme) => {
    // Simplified to a solid background color from the new theme structure.
    ctx.fillStyle = theme.page.background; // ✨ Changed
    ctx.fillRect(0, 0, width, height);
};

// --- Updated to use the new theme structure ---
function drawQuestionText(ctx: CanvasRenderingContext2D, canvas: Canvas, question: string, theme: Theme): number {
  ctx.fillStyle = theme.text.primary; // ✨ Changed
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const textMaxWidth = canvas.width - 160;
  let fontSize = 68;
  let lines: string[];
  let lineHeight: number;
  
  do {
      ctx.font = `bold ${fontSize}px ${theme.fontFamily}`; // ✨ Changed
      lines = wrapText(ctx, question, textMaxWidth);
      lineHeight = fontSize * 1.25;
      const textHeight = lines.length * lineHeight;
      
      if (textHeight < 400 || fontSize <= 40) break;
      
      fontSize -= 2;
  } while (fontSize > 40);
  
  let y = 300;
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

// --- No changes needed here, but functions it calls are updated ---
export function renderQuestionFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { question } = job.data;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme, job);
  
  const questionEndY = drawQuestionText(ctx, canvas, question.question, theme);
  renderOptions(ctx, canvas.width, questionEndY + 100, job, theme, false);
  drawFooter(ctx, canvas.width, canvas.height, theme);
}

// --- No changes needed here, but functions it calls are updated ---
export function renderAnswerFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { question } = job.data;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme, job);
  
  const questionEndY = drawQuestionText(ctx, canvas, question.question, theme);
  renderOptions(ctx, canvas.width, questionEndY + 100, job, theme, true);
  drawFooter(ctx, canvas.width, canvas.height, theme);
}

// --- Updated to use the new theme structure ---
export function renderExplanationFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { explanation } = job.data.question;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme, job);

  ctx.fillStyle = theme.text.primary; // ✨ Changed
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `bold 70px ${theme.fontFamily}`; // ✨ Changed
  ctx.fillText('Explanation', canvas.width / 2, 250);

  const textMaxWidth = canvas.width - 160;
  const textStartX = (canvas.width - textMaxWidth) / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  let fontSize = 55;
  let lines: string[];
  
  do {
      ctx.font = `bold ${fontSize}px ${theme.fontFamily}`; // ✨ Changed
      lines = wrapText(ctx, explanation, textMaxWidth);
      const textHeight = lines.length * fontSize * 1.5;
      if (textHeight < canvas.height - 700) break;
      fontSize -= 2;
  } while (fontSize > 20);

  const lineHeight = fontSize * 1.5;
  const startY = 400;
  lines.forEach((line, index) => {
      ctx.fillText(line, textStartX, startY + index * lineHeight);
  });

  drawFooter(ctx, canvas.width, canvas.height, theme);
}

// --- Fully updated to use the new theme structure ---
function renderOptions(ctx: CanvasRenderingContext2D, width: number, startY: number, job: QuizJob, theme: Theme, isAnswerFrame: boolean) {
  const { options, answer } = job.data.question;

  const buttonWidth = width * 0.85;
  const buttonX = (width - buttonWidth) / 2;
  let optionY = startY;

  const PADDING = 40;
  const FONT_SIZE = 45;
  const LINE_HEIGHT = FONT_SIZE * 1.4;
  const OPTION_SPACING = 40;

  Object.entries(options).forEach(([optionKey, optionText]) => {
      const fullOptionText = `${optionKey}. ${optionText}`;
      
      ctx.font = `bold ${FONT_SIZE}px ${theme.fontFamily}`; // ✨ Changed

      const maxWidth = buttonWidth - (PADDING * 2);
      const lines = wrapText(ctx, fullOptionText, maxWidth);

      const textBlockHeight = lines.length * LINE_HEIGHT;
      const dynamicButtonHeight = textBlockHeight + (PADDING * 2);

      const isCorrect = optionKey === answer;
      if (isAnswerFrame) {
          ctx.fillStyle = isCorrect ? theme.feedback.correct : theme.button.background; // ✨ Changed
      } else {
          ctx.fillStyle = theme.button.background; // ✨ Changed
      }
      
      drawRoundRect(ctx, buttonX, optionY, buttonWidth, dynamicButtonHeight, 30);
      
      if (isAnswerFrame) {
        ctx.fillStyle = isCorrect ? theme.text.onAccent : theme.text.secondary; // ✨ Changed
      } else {
        // This is the key legibility fix: always use the button's dedicated text color.
        ctx.fillStyle = theme.button.text; // ✨ Changed
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const textStartY = optionY + PADDING;
      lines.forEach((line, lineIndex) => {
        const textX = buttonX + PADDING;
        const textY = textStartY + (lineIndex * LINE_HEIGHT);
        ctx.fillText(line, textX, textY);
      });

      optionY += dynamicButtonHeight + OPTION_SPACING;
  });
}