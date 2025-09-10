import { Canvas, CanvasRenderingContext2D } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
import { 
    drawHeader, 
    drawBackground,
    drawFooter, 
    drawRoundRect,
    applyFillStyle,
    applyShadow,
    clearShadow,
    measureQuestionContent
} from '../drawingUtils';

/**
 * Quick Tip Format Layout - Redesigned for Vertical Video (V2 - Card Style)
 * 3-frame structure: Hook → Action → Result
 * Purpose: Deliver concise, high-impact tips.
 */

const HEADER_HEIGHT = 180;
const FOOTER_HEIGHT = 180;
const CONTENT_PADDING = 80;

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

// Frame 1: Hook Frame
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const hookText = job.data.content?.hook || "Here's a quick brain tip!";
    
    const availableHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT;
    const textMaxWidth = canvas.width - (CONTENT_PADDING * 2);

    drawFrameTitle(ctx, 'Quick Tip', HEADER_HEIGHT, canvas.width, theme);
    const titleHeight = 80;

    ctx.font = '120px sans-serif';
    ctx.textAlign = 'center';
    const iconY = HEADER_HEIGHT + titleHeight + 60;
    ctx.fillText('💡', canvas.width / 2, iconY);

    const textY = iconY + 80;
    const availableHeightForText = availableHeight - (textY - HEADER_HEIGHT);
    
    const measurement = measureQuestionContent(
        ctx, hookText, textMaxWidth, theme.fontFamily, 80, 48, availableHeightForText
    );
    
    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = textY + (unusedSpace / 2);
    
    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${measurement.fontSize}px ${theme.fontFamily}`;
    
    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 2: Action Frame - The "how-to" part of the tip.
export function renderActionFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const actionText = job.data.content?.action || job.data.content?.traditional_approach || "Do this one simple thing.";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    applyShadow(ctx, 'rgba(0,0,0,0.2)', 20, 0, 10);
    applyFillStyle(ctx, theme.header.background, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);
    
    const innerPadding = 40;
    drawFrameTitle(ctx, "The Action", cardY + innerPadding, canvas.width, theme);
    
    const contentY = cardY + innerPadding + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;

    const measurement = measureQuestionContent(
        ctx, actionText, textMaxWidth, theme.fontFamily, 72, 44, availableHeightForText
    );
    
    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = contentY + (unusedSpace / 2);
    
    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `600 ${measurement.fontSize}px ${theme.fontFamily}`;

    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 3: Result Frame - The benefit or outcome.
export function renderResultFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const resultText = job.data.content?.result || job.data.content?.smart_shortcut || "You will see amazing results.";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    applyShadow(ctx, 'rgba(0,0,0,0.2)', 20, 0, 10);
    applyFillStyle(ctx, theme.feedback.correct, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);
    
    const innerPadding = 40;
    drawFrameTitle(ctx, "The Result", cardY + innerPadding, canvas.width, theme, true);
    
    const contentY = cardY + innerPadding + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;

    const measurement = measureQuestionContent(
        ctx, resultText, textMaxWidth, theme.fontFamily, 72, 44, availableHeightForText
    );
    
    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = contentY + (unusedSpace / 2);
    
    ctx.fillStyle = theme.text.onAccent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `600 ${measurement.fontSize}px ${theme.fontFamily}`;

    // FIX: The x-coordinate for drawing text is now correctly centered.
    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}
