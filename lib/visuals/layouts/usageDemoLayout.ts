import { Canvas, CanvasRenderingContext2D } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
import { 
    drawHeader, 
    drawBackground,
    drawFooter, 
    wrapText,
    drawRoundRect,
    applyShadow,
    applyFillStyle,
    clearShadow,
    measureQuestionContent
} from '../drawingUtils';

/**
 * Usage Demo Format Layout - Redesigned for Vertical Video (V2)
 * 4-frame structure: Hook → Wrong Example → Right Example → Practice
 * Purpose: Clearly demonstrate the contextual use of a word.
 */

const HEADER_HEIGHT = 180;
const FOOTER_HEIGHT = 180;
const CONTENT_PADDING = 80; // 80px horizontal padding

// Frame 1: Hook Frame - Introduces the word to be learned.
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const targetWord = job.data.content?.target_word || "Ephemeral";
    const hookText = job.data.content?.hook || `Let's master the word:`;
    
    const textMaxWidth = canvas.width - (CONTENT_PADDING * 2);

    // Title text remains outside for the hook frame for impact
    ctx.fillStyle = theme.text.secondary;
    ctx.font = `bold 48px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('WORD IN CONTEXT', canvas.width / 2, HEADER_HEIGHT);
    const titleHeight = 80;

    ctx.fillStyle = theme.text.primary;
    ctx.font = `500 48px ${theme.fontFamily}`;
    const hookY = HEADER_HEIGHT + titleHeight;
    ctx.fillText(hookText, canvas.width / 2, hookY);
    
    const wordY = hookY + 80;
    const availableHeightForWord = canvas.height - wordY - FOOTER_HEIGHT - 40;
    
    const measurement = measureQuestionContent(
        ctx, `"${targetWord}"`, textMaxWidth, theme.fontFamily, 150, 70, availableHeightForWord
    );
    
    const unusedSpace = Math.max(0, availableHeightForWord - measurement.height);
    const startY = wordY + (unusedSpace / 2);
    
    // --- FIX START: Gradient text effect logic corrected ---

    // 1. Draw the text that will be used as a mask.
    ctx.font = `bold ${measurement.fontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = theme.text.primary; // Use a solid color for the mask
    ctx.fillText(measurement.lines.join('\n'), canvas.width / 2, startY);

    // 2. Set the composite operation to clip subsequent drawings to the existing pixels (the text).
    ctx.globalCompositeOperation = 'source-in';

    // 3. Define the gradient fill over the exact area of the text.
    const textHeight = measurement.height;
    applyFillStyle(ctx, theme.button.background, {x:0, y:startY, w:canvas.width, h: textHeight});

    // 4. Draw a rectangle with the gradient. It will only appear where the text was.
    ctx.fillRect(0, startY, canvas.width, textHeight);

    // 5. Reset the composite operation to default for all future drawings.
    ctx.globalCompositeOperation = 'source-over';
    
    // --- FIX END ---
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 2: Wrong Example Frame - "Don't use it here: [wrong example]"
export function renderWrongExampleFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const wrongExample = job.data.content?.wrong_example || "This usage is incorrect";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    // Use a muted card for the incorrect example
    applyShadow(ctx, theme.button.shadow, 20, 0, 10);
    applyFillStyle(ctx, theme.header.background, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);

    const innerPadding = 40;
    
    // Title INSIDE the card
    ctx.fillStyle = theme.text.secondary;
    ctx.font = `bold 48px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const titleY = cardY + innerPadding;
    ctx.fillText("WRONG USAGE ❌", canvas.width / 2, titleY);
    
    // Content area below the title
    const contentY = titleY + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;

    const measurement = measureQuestionContent(
        ctx, `"${wrongExample}"`, textMaxWidth, theme.fontFamily, 72, 44, availableHeightForText
    );

    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = contentY + (unusedSpace / 2);
    
    ctx.fillStyle = theme.text.primary;
    ctx.font = `italic ${measurement.fontSize}px ${theme.fontFamily}`;

    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 3: Right Example Frame - "Perfect usage: [correct example]"
export function renderRightExampleFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const rightExample = job.data.content?.right_example || "This usage is perfect";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    // Use a vibrant, positive card for the correct example
    applyShadow(ctx, 'rgba(0,0,0,0.2)', 20, 0, 10);
    applyFillStyle(ctx, theme.feedback.correct, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);
    
    const innerPadding = 40;
    
    // Title INSIDE the card
    ctx.fillStyle = theme.text.onAccent;
    ctx.globalAlpha = 0.8;
    ctx.font = `bold 48px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const titleY = cardY + innerPadding;
    ctx.fillText("CORRECT USAGE ✅", canvas.width / 2, titleY);
    ctx.globalAlpha = 1.0;
    
    // Content area below the title
    const contentY = titleY + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;

    const measurement = measureQuestionContent(
        ctx, `"${rightExample}"`, textMaxWidth, theme.fontFamily, 72, 44, availableHeightForText
    );
    
    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = contentY + (unusedSpace / 2);
    
    ctx.fillStyle = theme.text.onAccent;
    ctx.font = `italic ${measurement.fontSize}px ${theme.fontFamily}`;

    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 4: Practice Frame - "Your turn to try!"
export function renderPracticeFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const practiceText = job.data.content?.practice || "Now, your turn to try!";
    const practiceScenario = job.data.content?.practice_scenario || "";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    // Use the main button color for an engaging practice card
    applyShadow(ctx, theme.button.shadow, 20, 0, 10);
    applyFillStyle(ctx, theme.button.background, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);
    
    const innerPadding = 40;
    
    // Title INSIDE the card
    ctx.fillStyle = theme.text.onAccent;
    ctx.globalAlpha = 0.8;
    ctx.font = `bold 48px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const titleY = cardY + innerPadding;
    ctx.fillText("PRACTICE TIME", canvas.width / 2, titleY);
    ctx.globalAlpha = 1.0;
    
    // FIX: Content area is now correctly calculated below the title, preventing overlap
    const contentY = titleY + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;

    const fullText = practiceScenario ? `${practiceText}\n\n${practiceScenario}` : practiceText;
    
    const measurement = measureQuestionContent(
        ctx, fullText, textMaxWidth, theme.fontFamily, 64, 40, availableHeightForText
    );

    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = contentY + (unusedSpace / 2);

    ctx.fillStyle = theme.text.onAccent;
    ctx.font = `600 ${measurement.fontSize}px ${theme.fontFamily}`;
    
    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

