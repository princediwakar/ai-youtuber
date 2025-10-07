// lib/visuals/layouts/commonMistakeLayout.ts
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
 * Common Mistake Format Layout - Redesigned for Vertical Video (V2)
 * 6-frame structure: Hook → Mistake → Correct → Practice → Explanation → CTA (as defined in layoutSelector.ts)
 */

const HEADER_HEIGHT = 180;
const FOOTER_HEIGHT = 180;
const CONTENT_PADDING = 80;

// Helper to draw a title for a frame, consistent with other redesigned layouts
function drawFrameTitle(ctx: CanvasRenderingContext2D, text: string, y: number, canvasWidth: number, theme: Theme, onAccent: boolean = false) {
    // Determine title color based on where it's drawn
    ctx.fillStyle = onAccent ? theme.text.onAccent : theme.text.secondary; 
    ctx.globalAlpha = onAccent ? 1.0 : 0.8; // Ensure full opacity on colored cards
    
    ctx.font = `bold 48px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(text.toUpperCase(), canvasWidth / 2, y);
    ctx.globalAlpha = 1.0;
}

// Frame 1: Hook Frame - "Stop making this common mistake!"
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const hookText = job.data.content?.hook || "Stop making this common English mistake!";
    
    const availableHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT;
    const textMaxWidth = canvas.width - (CONTENT_PADDING * 2);

    drawFrameTitle(ctx, 'Common Mistake', HEADER_HEIGHT, canvas.width, theme, false);
    const titleHeight = 70; // Adjusted for font size 48px

    ctx.font = '120px sans-serif';
    ctx.textAlign = 'center';
    // Position icon slightly lower
    const iconY = HEADER_HEIGHT + titleHeight + 40; 
    ctx.fillText('🤔', canvas.width / 2, iconY);

    const textY = iconY + 120; // Start content text below the icon
    const availableHeightForText = availableHeight - (textY - HEADER_HEIGHT);
    
    const measurement = measureQuestionContent(
        ctx, hookText, textMaxWidth, theme.fontFamily, 80, 48, availableHeightForText
    );
    
    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = textY + (unusedSpace / 2);
    
    ctx.fillStyle = theme.text.primary; // Primary text color for visibility on the main background
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${measurement.fontSize}px ${theme.fontFamily}`;
    
    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 2: Mistake Frame - Shows the incorrect usage.
export function renderMistakeFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const mistakeText = job.data.content?.mistake || "Most people say this incorrectly";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    // FIX: Provide a robust fallback for the INCORRECT color (often dark red/brown)
    const incorrectColor = theme.feedback?.incorrect || 'rgba(200, 50, 50, 0.9)';

    applyShadow(ctx, 'rgba(0,0,0,0.2)', 20, 0, 10);
    applyFillStyle(ctx, incorrectColor, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);
    
    const innerPadding = 40;

    // Title inside the card - use onAccent to contrast with the red/dark-red card
    drawFrameTitle(ctx, "Don't Say This", cardY + innerPadding, canvas.width, theme, true);
    
    const contentY = cardY + innerPadding + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;
    
    const measurement = measureQuestionContent(
        ctx, mistakeText, textMaxWidth, theme.fontFamily, 90, 48, availableHeightForText
    );
    
    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = contentY + (unusedSpace / 2);
    
    // FIX: Use theme.text.onAccent for text on the colored card background
    ctx.fillStyle = theme.text.onAccent || theme.button.text || '#FFFFFF'; // Ensure light color for contrast
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${measurement.fontSize}px ${theme.fontFamily}`;
    
    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 3: Correct Frame - Shows the correct usage.
export function renderCorrectFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const correctText = job.data.content?.correct || "Here's the right way";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    // FIX: Use theme.feedback.correct, which is usually light green/blue or contrasting
    const correctColor = theme.feedback?.correct || 'rgba(100, 200, 100, 0.9)'; 

    applyShadow(ctx, 'rgba(0,0,0,0.2)', 20, 0, 10);
    applyFillStyle(ctx, correctColor, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);
    
    const innerPadding = 40;

    // Title inside the card - Use text.onAccent for text on the correct card background
    drawFrameTitle(ctx, "Say This Instead", cardY + innerPadding, canvas.width, theme, true); 
    
    const contentY = cardY + innerPadding + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;
    
    const measurement = measureQuestionContent(
        ctx, correctText, textMaxWidth, theme.fontFamily, 90, 48, availableHeightForText
    );
    
    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = contentY + (unusedSpace / 2);
    
    // FIX: Use theme.text.onAccent for text on the colored card background
    ctx.fillStyle = theme.text.onAccent || theme.button.text || '#FFFFFF'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${measurement.fontSize}px ${theme.fontFamily}`;

    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 4: Practice Frame - "Try it now!"
export function renderPracticeFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const practiceText = job.data.content?.practice || "Now you try!";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    // This frame uses the theme's button background, which usually contrasts with the text.
    applyShadow(ctx, theme.button.shadow, 20, 0, 10);
    applyFillStyle(ctx, theme.button.background, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);
    
    const innerPadding = 40;

    // Title inside the card - use onAccent to contrast with the button background
    drawFrameTitle(ctx, "Practice Time", cardY + innerPadding, canvas.width, theme, true);
    
    const contentY = cardY + innerPadding + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;
    
    const measurement = measureQuestionContent(
        ctx, practiceText, textMaxWidth, theme.fontFamily, 72, 44, availableHeightForText
    );
    
    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = contentY + (unusedSpace / 2);

    ctx.fillStyle = theme.button.text; // Text color is usually light/white on button background
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `600 ${measurement.fontSize}px ${theme.fontFamily}`;
    
    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}