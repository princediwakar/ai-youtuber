import { Canvas, CanvasRenderingContext2D } from 'canvas';
import { Theme } from '@/lib/types';
import { QuizJob } from '@/lib/types';
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

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const textMaxWidth = canvas.width - 160;
  let fontSize = 55;
  let lines: string[];
  // Dynamically adjust font size to fit text in the available space
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
      ctx.fillText(line, 80, startY + index * lineHeight);
  });

  drawFooter(ctx, canvas.width, canvas.height, theme, job.persona);
}

function renderOptions(ctx: CanvasRenderingContext2D, width: number, startY: number, job: QuizJob, theme: Theme, isAnswerFrame: boolean) {
  const { options, answer } = job.data.question;
  ctx.font = `bold 50px ${theme.FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const buttonWidth = width * 0.85;
  const buttonHeight = 140;
  const buttonX = (width - buttonWidth) / 2;
  let optionY = startY;

  Object.entries(options).forEach(([key, value]) => {
      const optionText = `${key}. ${value}`;
      if (isAnswerFrame) {
          const isCorrect = key === answer;
          ctx.fillStyle = isCorrect ? theme.COLOR_CORRECT_BG : theme.COLOR_BUTTON_BG;
          drawRoundRect(ctx, buttonX, optionY, buttonWidth, buttonHeight, 30);
          ctx.fillStyle = isCorrect ? theme.COLOR_CORRECT_TEXT : theme.MUTED_TEXT_COLOR;
      } else {
          ctx.fillStyle = theme.COLOR_BUTTON_BG;
          drawRoundRect(ctx, buttonX, optionY, buttonWidth, buttonHeight, 30);
          ctx.fillStyle = theme.COLOR_TEXT_PRIMARY;
      }
      // Wrap option text if it's too long
      const textLines = wrapText(ctx, optionText, buttonWidth - 80);
      const textY = optionY + buttonHeight / 2 - (textLines.length -1) * 30;
      textLines.forEach((line, index) => {
        ctx.fillText(line, width / 2, textY + index * 60);
      })
      optionY += buttonHeight + 40;
  });
}