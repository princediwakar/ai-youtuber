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
 * Common Mistake Format Layout
 * 4-frame structure: Hook → Mistake → Correct → Practice
 * Purpose: Address common English errors with correction
 */

// Frame 1: Hook Frame - "Stop saying this word wrong!"
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    
    // Draw header with persona branding
    drawHeader(ctx, canvas.width, theme, job);
    
    // Main hook text - attention-grabbing and urgent
    const hookText = job.data.content?.hook || "Stop saying this word wrong!";
    
    ctx.fillStyle = '#FFFFFF'; // White text for contrast
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Large, bold text for maximum impact
    const textMaxWidth = canvas.width - 120;
    ctx.font = `900 85px ${theme.fontFamily}`; // Extra bold weight
    const lines = wrapText(ctx, hookText, textMaxWidth);
    
    const lineHeight = 85 * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (canvas.height - totalTextHeight) / 2;
    
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight) + (lineHeight / 2));
    });
    
    // Optional: Add warning icon or exclamation mark
    ctx.fillStyle = '#FEE2E2'; // Light red background for emphasis
    const iconSize = 60;
    const iconX = canvas.width / 2 - iconSize / 2;
    const iconY = startY - 100;
    
    drawRoundRect(ctx, iconX, iconY, iconSize, iconSize, 15);
    ctx.fillStyle = '#DC2626';
    ctx.font = `bold 40px ${theme.fontFamily}`;
    ctx.fillText('!', canvas.width / 2, iconY + iconSize / 2 + 5);
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 2: Mistake Frame - "99% say: [incorrect pronunciation/usage]"
export function renderMistakeFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const mistakeText = job.data.content?.mistake || job.data.content?.incorrect_usage || "Most people say it wrong";
    const percentage = job.data.content?.mistake_percentage || "99%";
    
    // Background color for mistake section
    ctx.fillStyle = '#FEF2F2'; // Light red background
    const bgHeight = canvas.height - 200; // Leave space for header and footer
    drawRoundRect(ctx, 40, 100, canvas.width - 80, bgHeight - 100, 20);
    
    // "99% say:" label
    ctx.fillStyle = '#DC2626'; // Red color for mistake
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 55px ${theme.fontFamily}`;
    ctx.fillText(`${percentage} say:`, canvas.width / 2, 180);
    
    // The incorrect version
    ctx.fillStyle = '#991B1B'; // Darker red for the mistake
    ctx.font = `bold 65px ${theme.fontFamily}`;
    
    const textMaxWidth = canvas.width - 160;
    const lines = wrapText(ctx, mistakeText, textMaxWidth);
    const lineHeight = 65 * 1.3;
    const startY = 280;
    
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
    });
    
    // Add X mark to emphasize it's wrong
    ctx.fillStyle = '#DC2626';
    const xSize = 40;
    const xX = canvas.width / 2 + 200;
    const xY = startY + (lines.length * lineHeight) / 2 - xSize / 2;
    
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(xX - xSize/2, xY - xSize/2);
    ctx.lineTo(xX + xSize/2, xY + xSize/2);
    ctx.moveTo(xX + xSize/2, xY - xSize/2);
    ctx.lineTo(xX - xSize/2, xY + xSize/2);
    ctx.stroke();
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 3: Correct Frame - "Natives say: [correct version]"
export function renderCorrectFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const correctText = job.data.content?.correct || job.data.content?.correct_usage || job.data.content?.answer || "Correct version";
    
    // Background color for correct section
    ctx.fillStyle = '#ECFDF5'; // Light green background
    const bgHeight = canvas.height - 200;
    drawRoundRect(ctx, 40, 100, canvas.width - 80, bgHeight - 100, 20);
    
    // "Natives say:" label
    ctx.fillStyle = '#059669'; // Green color for correct
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 55px ${theme.fontFamily}`;
    ctx.fillText("Natives say:", canvas.width / 2, 180);
    
    // The correct version
    ctx.fillStyle = '#047857'; // Darker green for the correct answer
    ctx.font = `bold 65px ${theme.fontFamily}`;
    
    const textMaxWidth = canvas.width - 160;
    const lines = wrapText(ctx, correctText, textMaxWidth);
    const lineHeight = 65 * 1.3;
    const startY = 280;
    
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
    });
    
    // Add checkmark to emphasize it's correct
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const checkX = canvas.width / 2 + 200;
    const checkY = startY + (lines.length * lineHeight) / 2;
    const checkSize = 30;
    
    ctx.beginPath();
    ctx.moveTo(checkX - checkSize/2, checkY);
    ctx.lineTo(checkX - checkSize/6, checkY + checkSize/3);
    ctx.lineTo(checkX + checkSize/2, checkY - checkSize/3);
    ctx.stroke();
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 4: Practice Frame - "Try it now! Repeat after me..."
export function renderPracticeFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const practiceText = job.data.content?.practice || job.data.content?.cta || "Try it now!";
    const correctText = job.data.content?.correct || job.data.content?.correct_usage || job.data.content?.answer || "Correct version";
    
    // Main practice instruction
    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 60px ${theme.fontFamily}`;
    
    const instructionLines = wrapText(ctx, practiceText, canvas.width - 120);
    let currentY = 180;
    
    instructionLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * 70));
    });
    currentY += instructionLines.length * 70 + 60;
    
    // Show the correct pronunciation/usage again for practice
    ctx.fillStyle = '#059669';
    ctx.font = `bold 70px ${theme.fontFamily}`;
    
    const practiceLines = wrapText(ctx, `"${correctText}"`, canvas.width - 120);
    practiceLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * 80));
    });
    currentY += practiceLines.length * 80 + 40;
    
    // Add CTA button
    const buttonWidth = 400;
    const buttonHeight = 80;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = currentY;
    
    // Button shadow
    applyShadow(ctx, 'rgba(0, 0, 0, 0.3)', 10, 0, 4);
    
    // Button background
    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
    gradient.addColorStop(0, '#7C3AED');
    gradient.addColorStop(1, '#5B21B6');
    ctx.fillStyle = gradient;
    
    drawRoundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 15);
    clearShadow(ctx);
    
    // Button text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 35px ${theme.fontFamily}`;
    ctx.fillText("Follow for more tips!", canvas.width / 2, buttonY + buttonHeight / 2 + 5);
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}