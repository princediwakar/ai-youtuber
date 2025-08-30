import { Canvas, CanvasRenderingContext2D } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
import { 
    drawHeader, 
    drawFooter, 
    wrapText, 
    drawRoundRect,
    calculateOptimalLayout,
    calculateDynamicPositions,
    measureQuestionContent,
    ContentMeasurements,
    LayoutPositions 
} from '../drawingUtils';

// --- Updated to use the new theme structure ---
const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, theme: Theme) => {
    // Simplified to a solid background color from the new theme structure.
    ctx.fillStyle = theme.page.background; // ✨ Changed
    ctx.fillRect(0, 0, width, height);
};

// Dynamic question text drawing with optimized font size
function drawQuestionText(
    ctx: CanvasRenderingContext2D, 
    canvas: Canvas, 
    question: string, 
    theme: Theme,
    startY: number,
    fontSize: number
): number {
  ctx.fillStyle = theme.text.primary;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  const textMaxWidth = canvas.width - 160;
  ctx.font = `bold ${fontSize}px ${theme.fontFamily}`;
  const lines = wrapText(ctx, question, textMaxWidth);
  const lineHeight = fontSize * 1.4;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
  });
  
  return startY + lines.length * lineHeight;
}

// Dynamic MCQ question frame with optimized layout
export function renderQuestionFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { question } = job.data;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme, job);
  
  // Calculate optimal layout
  const measurements = calculateOptimalLayout(
    ctx, 
    question.question, 
    question.options, 
    canvas.width, 
    canvas.height, 
    theme.fontFamily
  );
  
  const positions = calculateDynamicPositions(measurements, canvas.height);
  
  // Draw question with optimized font size and position
  const actualQuestionEndY = drawQuestionText(
    ctx, 
    canvas, 
    question.question, 
    theme, 
    positions.questionStartY, 
    measurements.questionFontSize
  );
  
  // Render options with dynamic positioning, ensuring proper spacing from actual question end
  const actualOptionsStartY = Math.max(actualQuestionEndY + 80, positions.optionsStartY);
  renderOptions(ctx, canvas.width, actualOptionsStartY, job, theme, false, measurements.optionsFontSize);
  drawFooter(ctx, canvas.width, canvas.height, theme);
}

// Dynamic MCQ answer frame with optimized layout
export function renderAnswerFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { question } = job.data;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme, job);
  
  // Calculate optimal layout (same as question frame)
  const measurements = calculateOptimalLayout(
    ctx, 
    question.question, 
    question.options, 
    canvas.width, 
    canvas.height, 
    theme.fontFamily
  );
  
  const positions = calculateDynamicPositions(measurements, canvas.height);
  
  // Draw question with optimized font size and position
  const actualQuestionEndY = drawQuestionText(
    ctx, 
    canvas, 
    question.question, 
    theme, 
    positions.questionStartY, 
    measurements.questionFontSize
  );
  
  // Render options with dynamic positioning and correct answer highlighted, ensuring proper spacing from actual question end
  const actualOptionsStartY = Math.max(actualQuestionEndY + 80, positions.optionsStartY);
  renderOptions(ctx, canvas.width, actualOptionsStartY, job, theme, true, measurements.optionsFontSize);
  drawFooter(ctx, canvas.width, canvas.height, theme);
}

// Dynamic explanation frame with optimized layout
export function renderExplanationFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { explanation } = job.data.question;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  
  // Draw custom header with "Explanation" instead of persona name
  ctx.fillStyle = theme.text.primary;
  ctx.font = `bold 48px ${theme.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Explanation', canvas.width / 2, 90);

  // Calculate dynamic layout for explanation
  const textMaxWidth = canvas.width - 160;
  const textStartX = (canvas.width - textMaxWidth) / 2;
  const HEADER_HEIGHT = 180;
  const FOOTER_HEIGHT = 180;
  const availableHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT;

  // Measure explanation content with larger starting font and height constraint
  const measurement = measureQuestionContent(
    ctx, 
    explanation, 
    textMaxWidth, 
    theme.fontFamily, 
    80,  // Start with larger font for explanations
    50,  // Higher minimum readable size for explanations
    availableHeight // Constrain to available height
  );

  // Center the explanation vertically, but ensure it doesn't overlap footer
  const unusedSpace = Math.max(0, availableHeight - measurement.height);
  const idealStartY = HEADER_HEIGHT + (unusedSpace / 2);
  const maxStartY = canvas.height - FOOTER_HEIGHT - measurement.height - 20; // 20px safety margin
  const startY = Math.min(idealStartY, maxStartY);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = `bold ${measurement.fontSize}px ${theme.fontFamily}`;
  
  // Draw explanation text
  measurement.lines.forEach((line, index) => {
      const lineHeight = measurement.fontSize * 1.4;
      ctx.fillText(line, textStartX, startY + index * lineHeight);
  });

  drawFooter(ctx, canvas.width, canvas.height, theme);
}

// Dynamic options rendering with variable font size
function renderOptions(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    startY: number, 
    job: QuizJob, 
    theme: Theme, 
    isAnswerFrame: boolean,
    fontSize: number = 45
) {
  const { options, answer } = job.data.question;

  const buttonWidth = width * 0.85;
  const buttonX = (width - buttonWidth) / 2;
  let optionY = startY;

  const PADDING = 40;
  const LINE_HEIGHT = fontSize * 1.4;
  const OPTION_SPACING = 40;

  Object.entries(options).forEach(([optionKey, optionText]) => {
      const fullOptionText = `${optionKey}. ${optionText}`;
      
      ctx.font = `bold ${fontSize}px ${theme.fontFamily}`;

      const maxWidth = buttonWidth - (PADDING * 2);
      const lines = wrapText(ctx, fullOptionText, maxWidth);

      const textBlockHeight = lines.length * LINE_HEIGHT;
      const dynamicButtonHeight = textBlockHeight + (PADDING * 2);

      const isCorrect = optionKey === answer;
      if (isAnswerFrame) {
          ctx.fillStyle = isCorrect ? theme.feedback.correct : theme.button.background;
      } else {
          ctx.fillStyle = theme.button.background;
      }
      
      drawRoundRect(ctx, buttonX, optionY, buttonWidth, dynamicButtonHeight, 30);
      
      if (isAnswerFrame) {
        ctx.fillStyle = isCorrect ? theme.text.onAccent : theme.text.secondary;
      } else {
        ctx.fillStyle = theme.text.secondary;
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