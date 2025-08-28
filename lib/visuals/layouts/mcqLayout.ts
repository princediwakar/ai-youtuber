import { Canvas, CanvasRenderingContext2D } from 'canvas';
import { Theme, QuizJob } from '@/lib/types';
import { drawHeader, drawFooter, wrapText, drawRoundRect } from '../drawingUtils';

const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, theme: Theme) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, theme.COLOR_BG_DARK);
    gradient.addColorStop(1, theme.COLOR_BG_LIGHT);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
};

export function renderQuestionFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { question } = job.data;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme);
  
  ctx.fillStyle = theme.COLOR_TEXT_PRIMARY;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold 68px ${theme.FONT_FAMILY}`;
  let y = 400;
  const questionLines = wrapText(ctx, question.question, canvas.width - 160);
  questionLines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, y + index * 85);
  });
  y += questionLines.length * 85;

  renderOptions(ctx, canvas.width, y + 100, job, theme, false);
  drawFooter(ctx, canvas.width, canvas.height, theme, job.persona);
}

export function renderAnswerFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  renderQuestionFrame(canvas, job, theme); // Draw the base frame first
  const ctx = canvas.getContext('2d');
  
  let y = 400;
  ctx.font = `bold 68px ${theme.FONT_FAMILY}`;
  const questionLines = wrapText(ctx, job.data.question.question, canvas.width - 160);
  y += questionLines.length * 85;

  // Then, re-render options with highlighting logic
  renderOptions(ctx, canvas.width, y + 100, job, theme, true);
}

export function renderExplanationFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { explanation } = job.data.question;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme);

  ctx.fillStyle = theme.COLOR_TEXT_PRIMARY;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `bold 70px ${theme.FONT_FAMILY}`;
  ctx.fillText('Explanation', canvas.width / 2, 250);

  const textMaxWidth = canvas.width - 160;
  const textStartX = (canvas.width - textMaxWidth) / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  let fontSize = 55;
  let lines: string[];
  
  do {
      ctx.font = `bold ${fontSize}px ${theme.FONT_FAMILY}`;
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

  drawFooter(ctx, canvas.width, canvas.height, theme, job.persona);
}

// ✨ CORRECTED FUNCTION
function renderOptions(ctx: CanvasRenderingContext2D, width: number, startY: number, job: QuizJob, theme: Theme, isAnswerFrame: boolean) {
  const { options, answer } = job.data.question;

  const buttonWidth = width * 0.85;
  const buttonX = (width - buttonWidth) / 2;
  let optionY = startY;

  // Layout constants
  const PADDING = 40;
  const FONT_SIZE = 45;
  const LINE_HEIGHT = FONT_SIZE * 1.4;
  const OPTION_SPACING = 40;

  // Convert options object to array for iteration
  Object.entries(options).forEach(([optionKey, optionText]) => {
      const fullOptionText = `${optionKey}. ${optionText}`;
      
      ctx.font = `bold ${FONT_SIZE}px ${theme.FONT_FAMILY}`;

      const maxWidth = buttonWidth - (PADDING * 2);
      const lines = wrapText(ctx, fullOptionText, maxWidth);

      const textBlockHeight = lines.length * LINE_HEIGHT;
      const dynamicButtonHeight = textBlockHeight + (PADDING * 2);

      // Determine colors - compare with correct answer key
      const isCorrect = optionKey === answer;
      if (isAnswerFrame) {
          ctx.fillStyle = isCorrect ? theme.COLOR_CORRECT_BG : theme.COLOR_BUTTON_BG;
      } else {
          ctx.fillStyle = theme.COLOR_BUTTON_BG;
      }
      
      drawRoundRect(ctx, buttonX, optionY, buttonWidth, dynamicButtonHeight, 30);
      
      ctx.fillStyle = isAnswerFrame && !isCorrect ? theme.MUTED_TEXT_COLOR : theme.COLOR_TEXT_PRIMARY;
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