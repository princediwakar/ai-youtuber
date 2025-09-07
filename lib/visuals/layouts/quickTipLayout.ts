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
 * Quick Tip Format Layout
 * 3-frame structure: Hook → Action → Result
 * Purpose: Actionable health advice with immediate practical value
 */

// Frame 1: Hook Frame - "This 30-second habit will boost your brain"
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    
    // Draw header with persona branding
    drawHeader(ctx, canvas.width, theme, job);
    
    // Main hook text - compelling health benefit
    const hookText = job.data.content?.hook || "This simple habit will transform your health";
    
    ctx.fillStyle = '#FFFFFF'; // White text for contrast
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Large, bold text for maximum impact
    const textMaxWidth = canvas.width - 120;
    ctx.font = `900 75px ${theme.fontFamily}`; // Extra bold weight
    const lines = wrapText(ctx, hookText, textMaxWidth);
    
    const lineHeight = 75 * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (canvas.height - totalTextHeight) / 2;
    
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight) + (lineHeight / 2));
    });
    
    // Add health icon - heart or brain symbol
    ctx.fillStyle = '#EF4444'; // Health red color
    const iconSize = 80;
    const iconX = canvas.width / 2 - iconSize / 2;
    const iconY = startY - 120;
    
    // Draw heart icon
    ctx.beginPath();
    ctx.arc(iconX + iconSize * 0.3, iconY + iconSize * 0.3, iconSize * 0.15, 0, Math.PI * 2);
    ctx.arc(iconX + iconSize * 0.7, iconY + iconSize * 0.3, iconSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(iconX + iconSize * 0.5, iconY + iconSize * 0.9);
    ctx.lineTo(iconX + iconSize * 0.1, iconY + iconSize * 0.5);
    ctx.lineTo(iconX + iconSize * 0.9, iconY + iconSize * 0.5);
    ctx.closePath();
    ctx.fill();
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 2: Action Frame - "Here's exactly what to do: [step by step]"
export function renderActionFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const actionText = job.data.content?.action || "Here's what to do:";
    const steps = job.data.content?.step_details || job.data.content?.instructions || [];
    const stepsText = job.data.content?.steps;
    
    // Background color for action section
    ctx.fillStyle = '#EFF6FF'; // Light blue background
    const bgHeight = canvas.height - 200; // Leave space for header and footer
    drawRoundRect(ctx, 40, 100, canvas.width - 80, bgHeight - 100, 20);
    
    // "Here's what to do:" label
    ctx.fillStyle = '#1D4ED8'; // Blue color for action
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 50px ${theme.fontFamily}`;
    
    // Handle both string and array for action text
    const displayActionText = Array.isArray(stepsText) ? stepsText.join(' ') : actionText;
    ctx.fillText(displayActionText, canvas.width / 2, 140);
    
    // Action steps or main instruction
    ctx.fillStyle = '#1E40AF'; // Darker blue for content
    ctx.textAlign = 'left';
    ctx.font = `bold 45px ${theme.fontFamily}`;
    
    let currentY = 220;
    const textMaxWidth = canvas.width - 160;
    
    if (Array.isArray(steps) && steps.length > 0) {
        // If we have step-by-step instructions
        steps.slice(0, 4).forEach((step, index) => {
            // Step number
            ctx.fillStyle = '#3B82F6';
            ctx.textAlign = 'center';
            const stepNumX = 100;
            const stepNumY = currentY;
            const stepSize = 40;
            
            drawRoundRect(ctx, stepNumX - stepSize/2, stepNumY - stepSize/2, stepSize, stepSize, stepSize/2);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold 25px ${theme.fontFamily}`;
            ctx.fillText((index + 1).toString(), stepNumX, stepNumY + 5);
            
            // Step text
            ctx.fillStyle = '#1E40AF';
            ctx.textAlign = 'left';
            ctx.font = `600 40px ${theme.fontFamily}`;
            
            const stepLines = wrapText(ctx, step, textMaxWidth - 120);
            stepLines.forEach((line, lineIndex) => {
                ctx.fillText(line, 140, stepNumY - 15 + (lineIndex * 45));
            });
            
            currentY += Math.max(60, stepLines.length * 45 + 20);
        });
    } else {
        // Single instruction text
        const actionContent = job.data.content?.detailed_action || actionText;
        ctx.textAlign = 'center';
        const lines = wrapText(ctx, actionContent, textMaxWidth);
        const lineHeight = 50 * 1.3;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, currentY + (index * lineHeight));
        });
    }
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 3: Result Frame - "Why it works + science behind it"
export function renderResultFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const resultText = job.data.content?.result || job.data.content?.why_it_works || "Here's why it works:";
    const science = job.data.content?.science || job.data.content?.explanation || job.data.content?.answer || "Scientific backing";
    const cta = job.data.content?.cta || "Follow for more health tips!";
    
    // Main result explanation
    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 50px ${theme.fontFamily}`;
    
    const resultLines = wrapText(ctx, resultText, canvas.width - 120);
    let currentY = 140;
    
    resultLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * 60));
    });
    currentY += resultLines.length * 60 + 40;
    
    // Scientific explanation with background
    ctx.fillStyle = '#F0FDF4'; // Light green background
    const scienceBgHeight = 200;
    drawRoundRect(ctx, 40, currentY, canvas.width - 80, scienceBgHeight, 15);
    
    ctx.fillStyle = '#059669'; // Green for science
    ctx.font = `600 42px ${theme.fontFamily}`;
    
    const scienceLines = wrapText(ctx, science, canvas.width - 160);
    const scienceStartY = currentY + 30;
    
    scienceLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, scienceStartY + (index * 50));
    });
    currentY += scienceBgHeight + 40;
    
    // Add CTA button
    const buttonWidth = 450;
    const buttonHeight = 70;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = currentY;
    
    // Button shadow
    applyShadow(ctx, 'rgba(0, 0, 0, 0.3)', 10, 0, 4);
    
    // Button background - health theme gradient
    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
    gradient.addColorStop(0, '#059669');
    gradient.addColorStop(1, '#047857');
    ctx.fillStyle = gradient;
    
    drawRoundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 15);
    clearShadow(ctx);
    
    // Button text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 32px ${theme.fontFamily}`;
    ctx.fillText(cta, canvas.width / 2, buttonY + buttonHeight / 2 + 5);
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}