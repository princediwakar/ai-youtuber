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
 * Quick Fix Format Layout
 * 3-frame structure: Hook → Before → After
 * Purpose: Instant vocabulary upgrades
 */

// Frame 1: Hook Frame - "Upgrade your English in 15 seconds"
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const hookText = job.data?.question?.hook || "Upgrade your English in 15 seconds";
    
    // Create purple gradient background for the hook
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#7C3AED');
    gradient.addColorStop(1, '#5B21B6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Re-draw header over the gradient
    drawHeader(ctx, canvas.width, theme, job);
    
    // Main hook text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textMaxWidth = canvas.width - 100;
    ctx.font = `900 75px ${theme.fontFamily}`;
    const lines = wrapText(ctx, hookText, textMaxWidth);
    
    const lineHeight = 75 * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (canvas.height - totalTextHeight) / 2;
    
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight) + (lineHeight / 2));
    });
    
    // Add sparkle/upgrade icon
    ctx.fillStyle = '#FED7E2';
    const sparkles = [
        { x: canvas.width / 2 - 180, y: startY - 50, size: 20 },
        { x: canvas.width / 2 + 180, y: startY + totalTextHeight + 30, size: 25 },
        { x: canvas.width / 2 + 120, y: startY - 30, size: 15 },
        { x: canvas.width / 2 - 150, y: startY + totalTextHeight + 50, size: 18 }
    ];
    
    sparkles.forEach(sparkle => {
        drawStar(ctx, sparkle.x, sparkle.y, sparkle.size);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 2: Before Frame - "Instead of saying [basic word]..."
export function renderBeforeFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const basicWord = job.data?.question?.basic_word || job.data?.question?.before || "basic word";
    const context = job.data?.question?.context || "";
    
    // Light gray background to show "basic/old" concept
    ctx.fillStyle = '#F9FAFB';
    const bgHeight = canvas.height - 200;
    drawRoundRect(ctx, 40, 120, canvas.width - 80, bgHeight - 120, 20);
    
    // "Instead of saying..." label
    ctx.fillStyle = '#6B7280';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 45px ${theme.fontFamily}`;
    ctx.fillText("Instead of saying...", canvas.width / 2, 180);
    
    // The basic word (larger, center focus)
    ctx.fillStyle = '#374151';
    ctx.font = `bold 80px ${theme.fontFamily}`;
    
    const textMaxWidth = canvas.width - 120;
    const basicLines = wrapText(ctx, `"${basicWord}"`, textMaxWidth);
    const lineHeight = 80 * 1.2;
    let currentY = 280;
    
    basicLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * lineHeight));
    });
    currentY += basicLines.length * lineHeight + 40;
    
    // Add context if provided
    if (context) {
        ctx.fillStyle = '#9CA3AF';
        ctx.font = `normal 35px ${theme.fontFamily}`;
        const contextLines = wrapText(ctx, context, textMaxWidth);
        
        contextLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, currentY + (index * 40));
        });
    }
    
    // Add downward arrow to show "upgrade coming"
    drawUpgradeArrow(ctx, canvas.width / 2, currentY + 60);
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 3: After Frame - "Sound smarter with [advanced word]"
export function renderAfterFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    
    // Create purple gradient background for the "after" upgrade
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#7C3AED');
    gradient.addColorStop(1, '#5B21B6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawHeader(ctx, canvas.width, theme, job);
    
    const advancedWord = job.data?.question?.advanced_word || job.data?.question?.after || job.data?.question?.answer || "advanced word";
    const definition = job.data?.question?.definition || job.data?.question?.explanation || "";
    
    // "Sound smarter with..." label
    ctx.fillStyle = '#E9D5FF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 45px ${theme.fontFamily}`;
    ctx.fillText("Sound smarter with...", canvas.width / 2, 180);
    
    // The advanced word (hero text)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 85px ${theme.fontFamily}`;
    
    const textMaxWidth = canvas.width - 100;
    const advancedLines = wrapText(ctx, `"${advancedWord}"`, textMaxWidth);
    const lineHeight = 85 * 1.2;
    let currentY = 280;
    
    advancedLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * lineHeight));
    });
    currentY += advancedLines.length * lineHeight + 50;
    
    // Add definition/explanation if provided
    if (definition) {
        ctx.fillStyle = '#DDD6FE';
        ctx.font = `normal 32px ${theme.fontFamily}`;
        const defLines = wrapText(ctx, definition, textMaxWidth);
        
        defLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, currentY + (index * 38));
        });
        currentY += defLines.length * 38 + 40;
    }
    
    // Add CTA button
    const buttonWidth = 350;
    const buttonHeight = 70;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = Math.min(currentY, canvas.height - 200);
    
    // Button with white background for contrast
    applyShadow(ctx, 'rgba(0, 0, 0, 0.4)', 15, 0, 5);
    ctx.fillStyle = '#FFFFFF';
    drawRoundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 12);
    clearShadow(ctx);
    
    // Button text in purple
    ctx.fillStyle = '#7C3AED';
    ctx.font = `bold 32px ${theme.fontFamily}`;
    ctx.fillText("Follow for more upgrades!", canvas.width / 2, buttonY + buttonHeight / 2 + 5);
    
    // Add sparkles around the advanced word
    ctx.fillStyle = '#FED7E2';
    const sparkles = [
        { x: canvas.width / 2 - 200, y: 250, size: 18 },
        { x: canvas.width / 2 + 200, y: 320, size: 22 },
        { x: canvas.width / 2 + 150, y: 240, size: 15 },
        { x: canvas.width / 2 - 170, y: 350, size: 20 }
    ];
    
    sparkles.forEach(sparkle => {
        drawStar(ctx, sparkle.x, sparkle.y, sparkle.size);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Helper function to draw a star/sparkle
// Helper function to draw a star/sparkle
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, points: number = 5): void {
    const outerRadius = size;
    const innerRadius = size / 2.5; // Controls how "pointy" the star is
    
    // Start drawing from the top point
    let rotation = Math.PI / 2 * 3;
    
    ctx.save();
    ctx.translate(cx, cy); // Move to the center of where the star should be
    ctx.beginPath();
    
    // Start at the first outer point
    ctx.moveTo(0, -outerRadius);

    for (let i = 0; i < points; i++) {
        // Calculate the position of the next outer point
        rotation += Math.PI / points;
        const x_outer = Math.cos(rotation) * outerRadius;
        const y_outer = Math.sin(rotation) * outerRadius;
        ctx.lineTo(x_outer, y_outer);

        // Calculate the position of the next inner point
        rotation += Math.PI / points;
        const x_inner = Math.cos(rotation) * innerRadius;
        const y_inner = Math.sin(rotation) * innerRadius;
        ctx.lineTo(x_inner, y_inner);
    }
    
    ctx.closePath(); // Connects the last point to the first
    ctx.fill();
    ctx.restore();
}

// Helper function to draw upgrade arrow
function drawUpgradeArrow(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const arrowSize = 30;
    
    ctx.fillStyle = '#7C3AED';
    ctx.beginPath();
    // Arrow pointing down/forward
    ctx.moveTo(x - arrowSize/2, y);
    ctx.lineTo(x + arrowSize/2, y);
    ctx.lineTo(x, y + arrowSize);
    ctx.closePath();
    ctx.fill();
    
    // Arrow shaft
    ctx.fillRect(x - 3, y - arrowSize, 6, arrowSize);
}