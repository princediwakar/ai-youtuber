import { Canvas, CanvasRenderingContext2D } from 'canvas';
import { Theme } from '@/lib/visuals/themes';
import { QuizJob } from '@/lib/types';
import { drawHeader, drawFooter, drawBackground, wrapText, drawRoundRect } from '../drawingUtils';


function drawStatementText(ctx: CanvasRenderingContext2D, canvas: Canvas, statement: string, theme: Theme): number {
  ctx.fillStyle = theme.text.primary;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textMaxWidth = canvas.width - 160;
  let fontSize = 72;
  let lines: string[];
  let lineHeight: number;

  do {
    ctx.font = `bold ${fontSize}px ${theme.fontFamily}`;
    lines = wrapText(ctx, statement, textMaxWidth);
    lineHeight = fontSize * 1.25;
    const textHeight = lines.length * lineHeight;

    if (textHeight < 450 || fontSize <= 44) break;

    fontSize -= 2;
  } while (fontSize > 44);

  let y = 350;
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

function renderTrueFalseOptions(ctx: CanvasRenderingContext2D, width: number, startY: number, job: QuizJob, theme: Theme, showAnswer: boolean): void {
  const options = ['True', 'False'];
  const correctAnswer = job.data.question.answer;

  const boxWidth = 300;
  const boxHeight = 120;
  const spacing = 80;
  const totalWidth = (boxWidth * 2) + spacing;
  const startX = (width - totalWidth) / 2;

  options.forEach((option, index) => {
    const x = startX + index * (boxWidth + spacing);
    const y = startY;

    let bgColor = theme.button.background;
    let textColor = theme.button.text;

    if (showAnswer && option === correctAnswer) {
      bgColor = theme.feedback.correct;
      textColor = theme.text.onAccent;
    }

    drawRoundRect(ctx, x, y, boxWidth, boxHeight, 20);
    ctx.fillStyle = bgColor;
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = `bold 52px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(option, x + boxWidth / 2, y + boxHeight / 2);
  });
}

export function renderQuestionFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { question } = job.data;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme, job);

  const statementEndY = drawStatementText(ctx, canvas, question.question, theme);
  renderTrueFalseOptions(ctx, canvas.width, statementEndY + 80, job, theme, false);

  drawFooter(ctx, canvas.width, canvas.height, theme);
}

export function renderAnswerFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { question } = job.data;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme, job);

  const statementEndY = drawStatementText(ctx, canvas, question.question, theme);
  renderTrueFalseOptions(ctx, canvas.width, statementEndY + 80, job, theme, true);

  drawFooter(ctx, canvas.width, canvas.height, theme);
}

export function renderExplanationFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { question } = job.data;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  
  // Draw custom header with "Explanation" instead of persona name
  ctx.fillStyle = theme.text.primary;
  ctx.font = `bold 48px ${theme.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Explanation', canvas.width / 2, 90);

  // Show the answer prominently
  ctx.fillStyle = theme.feedback.correct;
  ctx.font = `bold 84px ${theme.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(question.answer, canvas.width / 2, 280);

  // Show explanation
  ctx.fillStyle = theme.text.primary;
  const textMaxWidth = canvas.width - 120;
  let fontSize = 56;
  let lines: string[];

  do {
    ctx.font = `${fontSize}px ${theme.fontFamily}`;
    lines = wrapText(ctx, question.explanation, textMaxWidth);
    const lineHeight = fontSize * 1.3;
    const textHeight = lines.length * lineHeight;

    if (textHeight < 500 || fontSize <= 36) break;
    fontSize -= 2;
  } while (fontSize > 36);

  const lineHeight = fontSize * 1.3;
  let y = 420;

  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, y + index * lineHeight);
  });

  drawFooter(ctx, canvas.width, canvas.height, theme);
}