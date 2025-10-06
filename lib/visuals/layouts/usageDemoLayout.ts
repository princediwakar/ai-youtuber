// lib/visuals/layouts/usageDemoLayout.ts
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
 * Usage Demo Format Layout - Redesigned for Vertical Video (V3 - Flashcard Style)
 * 4-frame structure: Hook → Wrong Example → Right Example → Practice
 * Purpose: Clearly demonstrate the contextual use of a word.
 */

const HEADER_HEIGHT = 180;
const FOOTER_HEIGHT = 180;
const CONTENT_PADDING = 80; // 80px horizontal padding

// Helper to draw a title for a frame
function drawFrameTitle(ctx: CanvasRenderingContext2D, text: string, y: number, canvasWidth: number, theme: Theme, onAccent: boolean = false) {
    ctx.fillStyle = onAccent ? theme.text.onAccent : theme.text.secondary;
    if (onAccent) ctx.globalAlpha = 0.8;
    ctx.font = `bold 48px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(text.toUpperCase(), canvasWidth / 2, y);
    if (onAccent) ctx.globalAlpha = 1.0;
}

// Frame 1: Hook Frame - Introduces the word to be learned.
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const targetWord = job.data.content?.target_word || job.data.content?.target_concept || "Key Concept";
    const hookText = job.data.content?.hook || `Let's master the word:`;
    
    const textMaxWidth = canvas.width - (CONTENT_PADDING * 2);

    drawFrameTitle(ctx, 'Word in Context', HEADER_HEIGHT, canvas.width, theme);
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
    
    // --- FIX: Simplified and corrected gradient text logic ---

    // 1. Set the context's fill style to be a gradient spanning the text area.
    const totalTextHeight = measurement.lines.length * (measurement.fontSize * 1.4);
    applyFillStyle(ctx, theme.button.background, {x: 0, y: startY, w: canvas.width, h: totalTextHeight});

    // 2. Set the font and other text properties.
    ctx.font = `bold ${measurement.fontSize}px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // 3. Draw each line of the wrapped text. The canvas will automatically use the gradient fill style.
    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 2: Wrong Example Frame - "Don't use it here: [wrong example]"
export function renderWrongExampleFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const wrongExample = job.data.content?.wrong_example || job.data.content?.wrong_scenario || "This usage is incorrect";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    applyShadow(ctx, theme.button.shadow, 20, 0, 10);
    applyFillStyle(ctx, theme.header.background, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);

    const innerPadding = 40;
    drawFrameTitle(ctx, "WRONG USAGE ❌", cardY + innerPadding, canvas.width, theme);
    
    const contentY = cardY + innerPadding + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;

    const measurement = measureQuestionContent(
        ctx, `"${wrongExample}"`, textMaxWidth, theme.fontFamily, 72, 44, availableHeightForText
    );

    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = contentY + (unusedSpace / 2);
    
    ctx.fillStyle = theme.text.primary;
    ctx.font = `italic ${measurement.fontSize}px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

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
    
    const rightExample = job.data.content?.right_example || job.data.content?.right_scenario || "This usage is perfect";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    applyShadow(ctx, 'rgba(0,0,0,0.2)', 20, 0, 10);
    applyFillStyle(ctx, theme.feedback.correct, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);
    
    const innerPadding = 40;
    drawFrameTitle(ctx, "CORRECT USAGE ✅", cardY + innerPadding, canvas.width, theme, true);
    
    const contentY = cardY + innerPadding + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;

    const measurement = measureQuestionContent(
        ctx, `"${rightExample}"`, textMaxWidth, theme.fontFamily, 72, 44, availableHeightForText
    );
    
    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = contentY + (unusedSpace / 2);
    
    ctx.fillStyle = theme.text.onAccent;
    ctx.font = `italic ${measurement.fontSize}px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

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

    applyShadow(ctx, theme.button.shadow, 20, 0, 10);
    applyFillStyle(ctx, theme.button.background, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);
    
    const innerPadding = 40;
    drawFrameTitle(ctx, "PRACTICE TIME", cardY + innerPadding, canvas.width, theme, true);
    
    const contentY = cardY + innerPadding + 70;
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
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

