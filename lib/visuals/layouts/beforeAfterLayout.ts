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
 * Before/After Format Layout - Redesigned for Vertical Video (V3 - Flashcard Style)
 * 4-frame structure: Hook → Before → After → Proof
 * Purpose: Show transformation/consequences for health behaviors
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


// Frame 1: Hook Frame - "What happens when you..."
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const hookText = job.data.content?.hook || "What happens to your health when you...";
    
    const availableHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT;
    const textMaxWidth = canvas.width - (CONTENT_PADDING * 2);

    drawFrameTitle(ctx, 'Before & After', HEADER_HEIGHT, canvas.width, theme);
    const titleHeight = 80;

    ctx.font = '120px sans-serif';
    ctx.textAlign = 'center';
    const iconY = HEADER_HEIGHT + titleHeight + 60;
    ctx.fillText('⏳', canvas.width / 2, iconY);

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

// Frame 2: Before Frame - Shows the negative state/habit.
export function renderBeforeFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const beforeText = job.data.content?.before || "The common habit";
    const consequences = job.data.content?.negative_effects || "";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    applyShadow(ctx, 'rgba(0,0,0,0.2)', 20, 0, 10);
    applyFillStyle(ctx, theme.header.background, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);
    
    const innerPadding = 40;
    drawFrameTitle(ctx, "BEFORE ❌", cardY + innerPadding, canvas.width, theme);
    
    const contentY = cardY + innerPadding + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;

    // --- NEW: Improved text hierarchy ---
    const mainTextHeight = availableHeightForText * (consequences ? 0.5 : 1.0);
    const mainMeasurement = measureQuestionContent(ctx, beforeText, textMaxWidth, theme.fontFamily, 72, 44, mainTextHeight);
    
    const mainUnusedSpace = Math.max(0, mainTextHeight - mainMeasurement.height);
    const mainStartY = contentY + (mainUnusedSpace / 2);

    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${mainMeasurement.fontSize}px ${theme.fontFamily}`;
    mainMeasurement.lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, mainStartY + i * (mainMeasurement.fontSize * 1.4)));

    if (consequences) {
        const subTextY = contentY + mainTextHeight + 20;
        const subTextHeight = availableHeightForText - mainTextHeight - 20;
        const subMeasurement = measureQuestionContent(ctx, consequences, textMaxWidth, theme.fontFamily, 48, 36, subTextHeight);

        const subUnusedSpace = Math.max(0, subTextHeight - subMeasurement.height);
        const subStartY = subTextY + (subUnusedSpace / 2);
        
        ctx.fillStyle = theme.text.secondary;
        ctx.font = `500 ${subMeasurement.fontSize}px ${theme.fontFamily}`;
        subMeasurement.lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, subStartY + i * (subMeasurement.fontSize * 1.4)));
    }
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 3: After Frame - Shows the positive state/habit.
export function renderAfterFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const afterText = job.data.content?.after || "The better habit";
    const benefits = job.data.content?.positive_effects || "";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    applyShadow(ctx, 'rgba(0,0,0,0.2)', 20, 0, 10);
    applyFillStyle(ctx, theme.feedback.correct, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);
    
    const innerPadding = 40;
    drawFrameTitle(ctx, "AFTER ✅", cardY + innerPadding, canvas.width, theme, true);
    
    const contentY = cardY + innerPadding + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;

    // --- NEW: Improved text hierarchy ---
    const mainTextHeight = availableHeightForText * (benefits ? 0.5 : 1.0);
    const mainMeasurement = measureQuestionContent(ctx, afterText, textMaxWidth, theme.fontFamily, 72, 44, mainTextHeight);
    
    const mainUnusedSpace = Math.max(0, mainTextHeight - mainMeasurement.height);
    const mainStartY = contentY + (mainUnusedSpace / 2);

    ctx.fillStyle = theme.text.onAccent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${mainMeasurement.fontSize}px ${theme.fontFamily}`;
    mainMeasurement.lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, mainStartY + i * (mainMeasurement.fontSize * 1.4)));

    if (benefits) {
        const subTextY = contentY + mainTextHeight + 20;
        const subTextHeight = availableHeightForText - mainTextHeight - 20;
        const subMeasurement = measureQuestionContent(ctx, benefits, textMaxWidth, theme.fontFamily, 48, 36, subTextHeight);

        const subUnusedSpace = Math.max(0, subTextHeight - subMeasurement.height);
        const subStartY = subTextY + (subUnusedSpace / 2);
        
        ctx.globalAlpha = 0.9;
        ctx.font = `500 ${subMeasurement.fontSize}px ${theme.fontFamily}`;
        subMeasurement.lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, subStartY + i * (subMeasurement.fontSize * 1.4)));
        ctx.globalAlpha = 1.0;
    }

    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 4: Proof Frame - Clean explanation style.
export function renderProofFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const evidence = job.data.content?.evidence || job.data.content?.explanation || "Here's why it works.";
    
    // --- NEW: Content is now inside a card for consistency ---
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    applyShadow(ctx, 'rgba(0,0,0,0.2)', 20, 0, 10);
    applyFillStyle(ctx, theme.header.background, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);

    const innerPadding = 40;
    drawFrameTitle(ctx, "The Science", cardY + innerPadding, canvas.width, theme);
    
    const contentY = cardY + innerPadding + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;

    const measurement = measureQuestionContent(
        ctx, evidence, textMaxWidth, theme.fontFamily, 60, 38, availableHeightForText
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

