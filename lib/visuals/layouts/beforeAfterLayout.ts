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
 * Before/After Format Layout
 * 4-frame structure: Hook → Before → After → Proof
 * Purpose: Show transformation/consequences for health behaviors
 */

// Frame 1: Hook Frame - "What happens to your eyes when you..."
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    
    // Draw header with persona branding
    drawHeader(ctx, canvas.width, theme, job);
    
    // Main hook text - compelling question about health consequences
    const hookText = job.data.content?.hook || "What happens to your health when you...";
    
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
    
    // Add question mark icon to emphasize the hook
    ctx.fillStyle = '#F59E0B'; // Amber color for question
    const iconSize = 80;
    const iconX = canvas.width / 2 - iconSize / 2;
    const iconY = startY - 120;
    
    // Draw question mark circle background
    ctx.beginPath();
    ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw question mark
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 50px ${theme.fontFamily}`;
    ctx.fillText('?', iconX + iconSize / 2, iconY + iconSize / 2 + 8);
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 2: Before Frame - "Most people damage their vision by..."
export function renderBeforeFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const beforeText = job.data.content?.before || job.data.content?.bad_habit || "Most people damage their health by...";
    const consequences = job.data.content?.negative_effects || job.data.content?.damage || "Negative health consequences";
    
    // Background color for negative/before section
    ctx.fillStyle = '#FEF2F2'; // Light red background for negative effects
    const bgHeight = canvas.height - 200; // Leave space for header and footer
    drawRoundRect(ctx, 40, 100, canvas.width - 80, bgHeight - 100, 20);
    
    // "BEFORE" label with warning styling
    ctx.fillStyle = '#DC2626'; // Red color for negative
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 55px ${theme.fontFamily}`;
    ctx.fillText("BEFORE", canvas.width / 2, 140);
    
    // Main before description
    ctx.fillStyle = '#991B1B'; // Darker red for content
    ctx.font = `600 48px ${theme.fontFamily}`;
    
    const textMaxWidth = canvas.width - 160;
    const beforeLines = wrapText(ctx, beforeText, textMaxWidth);
    let currentY = 220;
    const lineHeight = 48 * 1.3;
    
    beforeLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * lineHeight));
    });
    currentY += beforeLines.length * lineHeight + 30;
    
    // Show consequences in a darker section
    if (consequences && consequences !== beforeText) {
        ctx.fillStyle = 'rgba(220, 38, 38, 0.1)'; // Semi-transparent red overlay
        const conseqBgHeight = 120;
        drawRoundRect(ctx, 60, currentY, canvas.width - 120, conseqBgHeight, 15);
        
        ctx.fillStyle = '#7F1D1D'; // Very dark red for consequences
        ctx.font = `500 42px ${theme.fontFamily}`;
        
        const conseqLines = wrapText(ctx, consequences, textMaxWidth - 40);
        const conseqStartY = currentY + 25;
        
        conseqLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, conseqStartY + (index * 50));
        });
    }
    
    // Add warning icon
    ctx.fillStyle = '#DC2626';
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 6;
    const warnX = canvas.width / 2 + 220;
    const warnY = 180;
    const warnSize = 30;
    
    // Triangle warning shape
    ctx.beginPath();
    ctx.moveTo(warnX, warnY - warnSize);
    ctx.lineTo(warnX - warnSize * 0.8, warnY + warnSize * 0.5);
    ctx.lineTo(warnX + warnSize * 0.8, warnY + warnSize * 0.5);
    ctx.closePath();
    ctx.stroke();
    
    // Exclamation mark
    ctx.fillText('!', warnX, warnY + 5);
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 3: After Frame - "But if you do THIS instead..."
export function renderAfterFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const afterText = job.data.content?.after || job.data.content?.good_habit || "But if you do THIS instead...";
    const benefits = job.data.content?.positive_effects || job.data.content?.benefits || "Positive health outcomes";
    
    // Background color for positive/after section
    ctx.fillStyle = '#ECFDF5'; // Light green background for positive effects
    const bgHeight = canvas.height - 200;
    drawRoundRect(ctx, 40, 100, canvas.width - 80, bgHeight - 100, 20);
    
    // "AFTER" label with positive styling
    ctx.fillStyle = '#059669'; // Green color for positive
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 55px ${theme.fontFamily}`;
    ctx.fillText("AFTER", canvas.width / 2, 140);
    
    // Main after description
    ctx.fillStyle = '#047857'; // Darker green for content
    ctx.font = `600 48px ${theme.fontFamily}`;
    
    const textMaxWidth = canvas.width - 160;
    const afterLines = wrapText(ctx, afterText, textMaxWidth);
    let currentY = 220;
    const lineHeight = 48 * 1.3;
    
    afterLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * lineHeight));
    });
    currentY += afterLines.length * lineHeight + 30;
    
    // Show benefits in a highlighted section
    if (benefits && benefits !== afterText) {
        ctx.fillStyle = 'rgba(5, 150, 105, 0.1)'; // Semi-transparent green overlay
        const benefitBgHeight = 120;
        drawRoundRect(ctx, 60, currentY, canvas.width - 120, benefitBgHeight, 15);
        
        ctx.fillStyle = '#064E3B'; // Very dark green for benefits
        ctx.font = `500 42px ${theme.fontFamily}`;
        
        const benefitLines = wrapText(ctx, benefits, textMaxWidth - 40);
        const benefitStartY = currentY + 25;
        
        benefitLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, benefitStartY + (index * 50));
        });
    }
    
    // Add success checkmark
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const checkX = canvas.width / 2 + 220;
    const checkY = 180;
    const checkSize = 35;
    
    ctx.beginPath();
    ctx.moveTo(checkX - checkSize/2, checkY);
    ctx.lineTo(checkX - checkSize/6, checkY + checkSize/3);
    ctx.lineTo(checkX + checkSize/2, checkY - checkSize/3);
    ctx.stroke();
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 4: Proof Frame - "Here's the science + immediate action"
export function renderProofFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const proofText = job.data.content?.proof || job.data.content?.science || "Here's the scientific proof:";
    const evidence = job.data.content?.evidence || job.data.content?.research || job.data.content?.explanation || "Research shows...";
    const actionText = job.data.content?.immediate_action || job.data.content?.next_step || "Start today:";
    const cta = job.data.content?.cta || "Follow for more health insights!";
    
    // Science section
    ctx.fillStyle = '#1E40AF'; // Blue for science/authority
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 45px ${theme.fontFamily}`;
    
    const proofLines = wrapText(ctx, proofText, canvas.width - 120);
    let currentY = 130;
    
    proofLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * 55));
    });
    currentY += proofLines.length * 55 + 30;
    
    // Evidence background
    ctx.fillStyle = '#EFF6FF'; // Light blue background
    const evidenceBgHeight = 140;
    drawRoundRect(ctx, 40, currentY, canvas.width - 80, evidenceBgHeight, 15);
    
    ctx.fillStyle = '#1D4ED8';
    ctx.font = `500 38px ${theme.fontFamily}`;
    
    const evidenceLines = wrapText(ctx, evidence, canvas.width - 160);
    const evidenceStartY = currentY + 25;
    
    evidenceLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, evidenceStartY + (index * 45));
    });
    currentY += evidenceBgHeight + 40;
    
    // Immediate action call-out
    ctx.fillStyle = '#F59E0B'; // Amber for action
    ctx.font = `bold 40px ${theme.fontFamily}`;
    ctx.fillText(actionText, canvas.width / 2, currentY);
    currentY += 70;
    
    // Add CTA button
    const buttonWidth = 500;
    const buttonHeight = 70;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = currentY;
    
    // Button shadow
    applyShadow(ctx, 'rgba(0, 0, 0, 0.3)', 10, 0, 4);
    
    // Button background - authority blue gradient
    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
    gradient.addColorStop(0, '#3B82F6');
    gradient.addColorStop(1, '#1D4ED8');
    ctx.fillStyle = gradient;
    
    drawRoundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 15);
    clearShadow(ctx);
    
    // Button text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 30px ${theme.fontFamily}`;
    ctx.fillText(cta, canvas.width / 2, buttonY + buttonHeight / 2 + 5);
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}