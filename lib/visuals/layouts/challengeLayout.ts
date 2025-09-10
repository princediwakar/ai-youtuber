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
 * Challenge Format Layout - Redesigned for Vertical Video
 * 5-frame structure: Hook → Setup → Challenge → Reveal → CTA
 * Purpose: Create engaging, interactive brain-training puzzles.
 */

const HEADER_HEIGHT = 180;
const FOOTER_HEIGHT = 180;
const CONTENT_PADDING = 80; // 80px horizontal padding

// Helper to draw a title for a frame, consistent with other redesigned layouts
function drawFrameTitle(ctx: CanvasRenderingContext2D, text: string, y: number, canvasWidth: number, theme: Theme) {
    ctx.fillStyle = theme.text.secondary;
    ctx.font = `bold 48px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(text.toUpperCase(), canvasWidth / 2, y);
}

// Frame 1: Hook Frame - "Test your brain with this challenge"
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const hookText = job.data.content?.hook || "Test your brain with this challenge!";
    
    const availableHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT;
    const textMaxWidth = canvas.width - (CONTENT_PADDING * 2);

    drawFrameTitle(ctx, 'Brain Challenge', HEADER_HEIGHT, canvas.width, theme);
    const titleHeight = 80;

    // Large Puzzle Icon - Draw a simple geometric shape instead of emoji
    const iconY = HEADER_HEIGHT + titleHeight + 60;
    const iconSize = 120;
    const iconX = canvas.width / 2;
    
    // Draw a simple puzzle piece shape
    ctx.fillStyle = theme.button.background;
    ctx.strokeStyle = theme.text.primary;
    ctx.lineWidth = 4;
    
    // Main square body
    const squareSize = iconSize * 0.7;
    const squareX = iconX - squareSize / 2;
    const squareY = iconY - squareSize / 2;
    
    ctx.fillRect(squareX, squareY, squareSize, squareSize);
    ctx.strokeRect(squareX, squareY, squareSize, squareSize);
    
    // Add puzzle knobs/indentations
    const knobSize = squareSize * 0.25;
    
    // Top knob (protruding)
    ctx.fillRect(iconX - knobSize/2, squareY - knobSize/2, knobSize, knobSize/2);
    ctx.strokeRect(iconX - knobSize/2, squareY - knobSize/2, knobSize, knobSize/2);
    
    // Right indent
    ctx.clearRect(squareX + squareSize - knobSize/4, iconY - knobSize/2, knobSize/2, knobSize);
    ctx.strokeRect(squareX + squareSize - knobSize/4, iconY - knobSize/2, knobSize/2, knobSize);

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

// Frame 2: Setup Frame - "Try to remember these items..."
export function renderSetupFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const setupText = job.data.content?.setup || "Here are the rules:";
    
    const textMaxWidth = canvas.width - (CONTENT_PADDING * 2);
    drawFrameTitle(ctx, 'Get Ready!', HEADER_HEIGHT, canvas.width, theme);
    
    const contentY = HEADER_HEIGHT + 80;
    const availableHeight = canvas.height - contentY - FOOTER_HEIGHT;

    const measurement = measureQuestionContent(
        ctx, setupText, textMaxWidth, theme.fontFamily, 72, 44, availableHeight
    );

    const unusedSpace = Math.max(0, availableHeight - measurement.height);
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

// Frame 3: Challenge Frame - Present the actual test/puzzle
export function renderChallengeFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const challengeType = job.data.content?.challenge_type || "text";
    const challengeContent = job.data.content?.challenge_content || "What was the missing item?";
    const challengeItems = job.data.content?.challenge_items || [];

    const textMaxWidth = canvas.width - (CONTENT_PADDING * 2);
    drawFrameTitle(ctx, 'Challenge Time!', HEADER_HEIGHT, canvas.width, theme);
    
    const cardY = HEADER_HEIGHT + 80;
    const cardHeight = canvas.height - cardY - FOOTER_HEIGHT - 40;
    const cardWidth = canvas.width - (CONTENT_PADDING * 2);
    const cardX = CONTENT_PADDING;
    
    applyShadow(ctx, theme.button.shadow, 20, 0, 10);
    applyFillStyle(ctx, theme.button.background, {x: cardX, y: cardY, w: cardWidth, h: cardHeight});
    drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 30);
    clearShadow(ctx);

    if (challengeType === 'memory' && Array.isArray(challengeItems) && challengeItems.length > 0) {
        const maxItems = Math.min(9, challengeItems.length);
        const cols = maxItems > 4 ? 3 : 2;
        const rows = Math.ceil(maxItems / cols);
        
        const itemPadding = 20;
        const gridWidth = cardWidth - (itemPadding * 2);
        const gridHeight = cardHeight - (itemPadding * 2);

        const itemWidth = (gridWidth - (itemPadding * (cols - 1))) / cols;
        const itemHeight = (gridHeight - (itemPadding * (rows - 1))) / rows;

        for (let i = 0; i < maxItems; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            const itemX = cardX + itemPadding + col * (itemWidth + itemPadding);
            const itemY = cardY + itemPadding + row * (itemHeight + itemPadding);

            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#FFFFFF';
            drawRoundRect(ctx, itemX, itemY, itemWidth, itemHeight, 15);
            ctx.globalAlpha = 1.0;
            
            const itemText = challengeItems[i];
            const measurement = measureQuestionContent(
                ctx, itemText, itemWidth - 20, theme.fontFamily, 40, 18, itemHeight - 20
            );

            ctx.fillStyle = theme.text.onAccent;
            ctx.font = `bold ${measurement.fontSize}px ${theme.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top'; // Set baseline for multi-line drawing

            // FIX: Correctly calculate start Y for multi-line text and loop through lines
            const totalTextHeight = measurement.lines.length * (measurement.fontSize * 1.4);
            const textStartY = itemY + (itemHeight - totalTextHeight) / 2;

            measurement.lines.forEach((line, index) => {
                const lineHeight = measurement.fontSize * 1.4;
                ctx.fillText(line, itemX + itemWidth / 2, textStartY + (index * lineHeight));
            });
        }

    } else {
        const availableHeightForText = cardHeight - 80;
        const measurement = measureQuestionContent(
            ctx, challengeContent, textMaxWidth - 80, theme.fontFamily, 80, 48, availableHeightForText
        );
        
        const unusedSpace = Math.max(0, availableHeightForText - measurement.height);
        const startY = cardY + 40 + (unusedSpace / 2);
        
        ctx.fillStyle = theme.text.onAccent;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = `bold ${measurement.fontSize}px ${theme.fontFamily}`;

        measurement.lines.forEach((line, index) => {
            const lineHeight = measurement.fontSize * 1.4;
            ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
        });
    }
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 4: Reveal Frame - "How did you do? Here's the secret..."
export function renderRevealFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const answer = job.data.content?.answer || "The answer was 'Apple'!";
    const trick = job.data.content?.trick || "";
    
    const textMaxWidth = canvas.width - (CONTENT_PADDING * 2);
    drawFrameTitle(ctx, "The Reveal", HEADER_HEIGHT, canvas.width, theme);
    
    const contentY = HEADER_HEIGHT + 80;
    const contentHeight = canvas.height - contentY - FOOTER_HEIGHT;
    
    const answerMaxHeight = trick ? contentHeight * 0.6 : contentHeight * 0.9;
    const answerMeasurement = measureQuestionContent(
        ctx, answer, textMaxWidth, theme.fontFamily, 90, 50, answerMaxHeight
    );
    
    const answerUnusedSpace = Math.max(0, answerMaxHeight - answerMeasurement.height);
    const answerY = contentY + (answerUnusedSpace / 2);

    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${answerMeasurement.fontSize}px ${theme.fontFamily}`;
    answerMeasurement.lines.forEach((line, index) => {
        const lineHeight = answerMeasurement.fontSize * 1.4;
        ctx.fillText(line, canvas.width / 2, answerY + (index * lineHeight));
    });

    if (trick) {
        const trickY = contentY + answerMaxHeight + 20;
        const trickMaxHeight = contentHeight - answerMaxHeight - 40;
        
        const trickMeasurement = measureQuestionContent(
            ctx, `The Secret: ${trick}`, textMaxWidth, theme.fontFamily, 48, 36, trickMaxHeight
        );

        const trickUnusedSpace = Math.max(0, trickMaxHeight - trickMeasurement.height);
        const startY = trickY + (trickUnusedSpace / 2);
        
        ctx.fillStyle = theme.text.secondary;
        ctx.font = `italic ${trickMeasurement.fontSize}px ${theme.fontFamily}`;
        trickMeasurement.lines.forEach((line, index) => {
            const lineHeight = trickMeasurement.fontSize * 1.4;
            ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
        });
    }
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 5: CTA Frame - "Follow for more brain training!"
export function renderCtaFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const encouragement = job.data.content?.encouragement || "Great Job!";
    const cta = job.data.content?.cta || "Follow for more brain training!";
    
    drawFrameTitle(ctx, "Challenge Complete!", HEADER_HEIGHT, canvas.width, theme);
    
    const contentY = HEADER_HEIGHT + 80;
    const availableHeight = canvas.height - contentY - FOOTER_HEIGHT;
    const textMaxWidth = canvas.width - (CONTENT_PADDING * 2);

    // FIX: Combine encouragement and CTA into one text block that wraps correctly.
    // This replaces the button to avoid text overflow issues.
    const fullText = `${encouragement}\n\n${cta}`;

    const measurement = measureQuestionContent(
        ctx, fullText, textMaxWidth, theme.fontFamily, 72, 44, availableHeight
    );

    const unusedSpace = Math.max(0, availableHeight - measurement.height);
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

