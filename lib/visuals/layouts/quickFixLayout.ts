// lib/visuals/layouts/quickFixLayout.ts
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
 * Quick Fix Format Layout - Redesigned for Vertical Video (V2)
 * 3-frame structure: Hook → Basic Word → Advanced Word  
 * Purpose: Provide quick, high-impact vocabulary upgrades.
 */

const HEADER_HEIGHT = 180;
const FOOTER_HEIGHT = 180;
const CONTENT_PADDING = 80; // 80px horizontal padding

// Helper to draw a title for a frame, consistent with other redesigned layouts
function drawFrameTitle(ctx: CanvasRenderingContext2D, text: string, y: number, canvasWidth: number, theme: Theme, onAccent: boolean = false) {
    ctx.fillStyle = onAccent ? theme.text.onAccent : theme.text.secondary;
    if (onAccent) ctx.globalAlpha = 0.8;
    ctx.font = `bold 48px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(text.toUpperCase(), canvasWidth / 2, y);
    if (onAccent) ctx.globalAlpha = 1.0;
}

// Frame 1: Hook Frame - "Upgrade your English in 15 seconds"
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const hookText = job.data.content?.hook || "Upgrade your English in 15 seconds!";
    
    // Content area
    const availableHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT;
    const textMaxWidth = canvas.width - (CONTENT_PADDING * 2);

    // Title remains outside on the hook frame for impact
    drawFrameTitle(ctx, 'Quick Fix', HEADER_HEIGHT, canvas.width, theme);
    
    const titleHeight = 60;
    const textY = HEADER_HEIGHT + titleHeight;
    const availableHeightForText = availableHeight - titleHeight;
    
    const measurement = measureQuestionContent(
        ctx, hookText, textMaxWidth, theme.fontFamily, 90, 48, availableHeightForText
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

// Frame 2: Basic Word Frame - Presents the word to be replaced.
export function renderBasicWordFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const basicWord = job.data.content?.basic_word || "very good";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    // FIX: Use a neutral or light color for the 'Before' card
    const basicColor = theme.header.background || theme.page.background; 

    applyShadow(ctx, theme.button.shadow, 20, 0, 10);
    applyFillStyle(ctx, basicColor, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);

    const innerPadding = 40;

    // Title is drawn INSIDE the card. Use primary text color.
    drawFrameTitle(ctx, "Instead of Saying...", cardY + innerPadding, canvas.width, theme);
    
    const contentY = cardY + innerPadding + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    const availableHeightForText = cardHeight - (contentY - cardY) - innerPadding;

    const measurement = measureQuestionContent(
        ctx, basicWord, textMaxWidth, theme.fontFamily, 120, 60, availableHeightForText
    );

    const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
    const startY = contentY + (unusedSpace / 2);
    
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

// Frame 3: Advanced Word Frame - Reveals the upgraded word.
export function renderAdvancedWordFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const advancedWord = job.data.content?.advanced_word || "excellent";
    const usageExample = job.data.content?.usage_example || "";
    
    const cardY = HEADER_HEIGHT + 20;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 20;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;

    applyShadow(ctx, 'rgba(0,0,0,0.2)', 20, 0, 10);
    // Use the theme's main accent color (button) for the 'After' card
    applyFillStyle(ctx, theme.button.background, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);
    
    const innerPadding = 40;

    // Title is drawn INSIDE the card. Use onAccent color.
    drawFrameTitle(ctx, 'Try Saying This!', cardY + innerPadding, canvas.width, theme, true);
    
    const contentY = cardY + innerPadding + 70;
    const textMaxWidth = cardWidth - (innerPadding * 2);
    // Estimate space for the word based on whether an example exists
    const mainWordHeight = cardHeight - (contentY - cardY) - innerPadding - (usageExample ? 120 : 0);

    const measurement = measureQuestionContent(
        ctx, advancedWord, textMaxWidth, theme.fontFamily, 120, 60, mainWordHeight
    );
    
    const wordUnusedSpace = Math.max(0, mainWordHeight - measurement.height);
    const wordStartY = contentY + (wordUnusedSpace / 2);
    
    ctx.fillStyle = theme.button.text; // Use button text color for the main word
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${measurement.fontSize}px ${theme.fontFamily}`;

    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, wordStartY + index * lineHeight);
    });

    if (usageExample) {
        const exampleY = contentY + mainWordHeight;
        ctx.fillStyle = theme.button.text; 
        ctx.font = `500 48px ${theme.fontFamily}`; 
        ctx.globalAlpha = 0.9; 
        const exampleLines = wrapText(ctx, `e.g., "${usageExample}"`, textMaxWidth);
        exampleLines.forEach((line, index) => {
             ctx.fillText(line, canvas.width / 2, exampleY + (index * 50));
        });
        ctx.globalAlpha = 1.0;
    }

    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}