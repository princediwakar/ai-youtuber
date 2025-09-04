import { Canvas, CanvasRenderingContext2D } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
import { 
    drawHeader, 
    drawBackground,
    drawFooter, 
    wrapText, 
    drawRoundRect,
    drawOutlinedRoundRect,
    calculateOptimalLayout,
    calculateDynamicPositions,
    measureQuestionContent,
    ContentMeasurements,
    LayoutPositions,
    applyShadow,
    applyFillStyle,
    clearShadow

} from '../drawingUtils';



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

/**
 * ✨ NEW: Draws Assertion and Reason text blocks with proper formatting and spacing.
 */
function drawAssertionReasonText(
    ctx: CanvasRenderingContext2D, 
    canvas: Canvas, 
    question: any, // Contains assertion and reason properties
    theme: Theme,
    startY: number,
    fontSize: number
): number {
    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'left'; // Align left for a cleaner block look
    ctx.textBaseline = 'top';
    
    const textMaxWidth = canvas.width - 160;
    const textStartX = (canvas.width - textMaxWidth) / 2;
    const lineHeight = fontSize * 1.4;
    let currentY = startY;

    // 1. Draw Assertion
    ctx.font = `bold ${fontSize}px ${theme.fontFamily}`;
    const assertionText = `Assertion (A): ${question.assertion}`;
    const assertionLines = wrapText(ctx, assertionText, textMaxWidth);
    assertionLines.forEach((line, index) => {
        ctx.fillText(line, textStartX, currentY + index * lineHeight);
    });
    currentY += assertionLines.length * lineHeight;

    // Add vertical space between Assertion and Reason
    currentY += 40; // 40px gap is a good starting point

    // 2. Draw Reason
    const reasonText = `Reason (R): ${question.reason}`;
    const reasonLines = wrapText(ctx, reasonText, textMaxWidth);
    reasonLines.forEach((line, index) => {
        ctx.fillText(line, textStartX, currentY + index * lineHeight);
    });
    currentY += reasonLines.length * lineHeight;

    return currentY; // Return the final Y position after drawing
}

// Dynamic MCQ question frame with optimized layout
export function renderQuestionFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { question } = job.data;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme, job);

  // ✨ MODIFIED: Determine the full text for measurement purposes
  const layoutQuestionText = question.question_type === 'assertion_reason'
    ? `Assertion (A): ${question.assertion}\n\nReason (R): ${question.reason}`
    : question.question;
  
  // Calculate optimal layout based on the full text
  const measurements = calculateOptimalLayout(
    ctx, 
    layoutQuestionText, 
    question.options, 
    canvas.width, 
    canvas.height, 
    theme.fontFamily
  );

  // ✨ FIX: Adjust measurement for the hardcoded 40px gap in drawAssertionReasonText
  if (question.question_type === 'assertion_reason') {
    measurements.questionHeight += 40;
    measurements.totalContentHeight += 40;
  }
  
  const positions = calculateDynamicPositions(measurements, canvas.height);
  
  // ✨ MODIFIED: Conditionally draw either standard question or assertion/reason
  let actualQuestionEndY;
  if (question.question_type === 'assertion_reason') {
      actualQuestionEndY = drawAssertionReasonText(
          ctx, canvas, question, theme, positions.questionStartY, measurements.questionFontSize
      );
  } else {
      actualQuestionEndY = drawQuestionText(
          ctx, canvas, question.question, theme, positions.questionStartY, measurements.questionFontSize
      );
  }
  
  // Render options with dynamic positioning, ensuring proper spacing from actual question end
  const actualOptionsStartY = Math.max(actualQuestionEndY + 80, positions.optionsStartY);
  renderOptions(ctx, canvas.width, actualOptionsStartY, job, theme, false, measurements.optionsFontSize);
  drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Dynamic MCQ answer frame with optimized layout
export function renderAnswerFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
  const { question } = job.data;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, canvas.width, canvas.height, theme);
  drawHeader(ctx, canvas.width, theme, job);
  
  // ✨ MODIFIED: Determine the full text for measurement purposes
  const layoutQuestionText = question.question_type === 'assertion_reason'
    ? `Assertion (A): ${question.assertion}\n\nReason (R): ${question.reason}`
    : question.question;

  // Calculate optimal layout (same as question frame)
  const measurements = calculateOptimalLayout(
    ctx, 
    layoutQuestionText,
    question.options, 
    canvas.width, 
    canvas.height, 
    theme.fontFamily
  );

  // ✨ FIX: Adjust measurement for the hardcoded 40px gap in drawAssertionReasonText
  if (question.question_type === 'assertion_reason') {
    measurements.questionHeight += 40;
    measurements.totalContentHeight += 40;
  }
  
  const positions = calculateDynamicPositions(measurements, canvas.height);
  
  // ✨ MODIFIED: Conditionally draw either standard question or assertion/reason
  let actualQuestionEndY;
  if (question.question_type === 'assertion_reason') {
      actualQuestionEndY = drawAssertionReasonText(
          ctx, canvas, question, theme, positions.questionStartY, measurements.questionFontSize
      );
  } else {
      actualQuestionEndY = drawQuestionText(
          ctx, canvas, question.question, theme, positions.questionStartY, measurements.questionFontSize
      );
  }
  
  // Render options with dynamic positioning and correct answer highlighted
  const actualOptionsStartY = Math.max(actualQuestionEndY + 80, positions.optionsStartY);
  renderOptions(ctx, canvas.width, actualOptionsStartY, job, theme, true, measurements.optionsFontSize);
  drawFooter(ctx, canvas.width, canvas.height, theme, job);
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

  drawFooter(ctx, canvas.width, canvas.height, theme, job);
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
    
    // 1. Apply shadow for a cool pop-out effect
    applyShadow(ctx, theme.button.shadow);

    // 2. Determine the fill style (correct answer vs. normal button vs. incorrect answer)
    let fillStyle = theme.button.background;
    if (isAnswerFrame && isCorrect) {
        fillStyle = theme.feedback.correct;
    } else if (isAnswerFrame && !isCorrect) {
        // Make incorrect answers visually muted in answer frame
        fillStyle = 'rgba(128, 128, 128, 0.3)';
    }

    // 3. Apply the gradient/solid color and draw the button
    const bounds = { x: buttonX, y: optionY, w: buttonWidth, h: dynamicButtonHeight };
    applyFillStyle(ctx, fillStyle, bounds);
    drawRoundRect(ctx, buttonX, optionY, buttonWidth, dynamicButtonHeight, 30);
    
    // 4. Clear shadow before drawing text so the text isn't blurry
    clearShadow(ctx);
    
    // 5. Set text color and draw the text
    if (isAnswerFrame && isCorrect) {
        ctx.fillStyle = theme.text.onAccent;
    } else if (isAnswerFrame && !isCorrect) {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.7)'; // Muted text for incorrect answers
    } else {
        ctx.fillStyle = theme.button.text;
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const textStartY = optionY + PADDING;
    
    // Add checkmark for correct answer in answer frame
    if (isAnswerFrame && isCorrect) {
      const checkmarkSize = fontSize * 0.6;
      const checkmarkX = buttonX + buttonWidth - PADDING - checkmarkSize;
      const checkmarkY = optionY + (dynamicButtonHeight - checkmarkSize) / 2;
      
      // Draw checkmark background circle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(checkmarkX + checkmarkSize/2, checkmarkY + checkmarkSize/2, checkmarkSize/2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw checkmark
      const strokeColor = Array.isArray(theme.feedback.correct) ? theme.feedback.correct[0] : theme.feedback.correct;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = checkmarkSize * 0.15;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(checkmarkX + checkmarkSize * 0.25, checkmarkY + checkmarkSize * 0.5);
      ctx.lineTo(checkmarkX + checkmarkSize * 0.45, checkmarkY + checkmarkSize * 0.7);
      ctx.lineTo(checkmarkX + checkmarkSize * 0.75, checkmarkY + checkmarkSize * 0.3);
      ctx.stroke();
    }
    
    lines.forEach((line, lineIndex) => {
      const textX = buttonX + PADDING;
      const textY = textStartY + (lineIndex * LINE_HEIGHT);
      ctx.fillText(line, textX, textY);
    });

    optionY += dynamicButtonHeight + OPTION_SPACING;
});
}

