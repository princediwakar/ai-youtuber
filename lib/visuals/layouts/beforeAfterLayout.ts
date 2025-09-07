import { Canvas } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
import { 
    drawHeader, 
    drawBackground,
    drawFooter, 
    drawRoundRect,
    applyFillStyle,
    measureQuestionContent,
    calculateOptimalLayout
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
    drawHeader(ctx, canvas.width, theme, job);
    
    const hookText = job.data.content?.hook || "What happens to your health when you...";
    
    // Content area dimensions
    const HEADER_HEIGHT = 160;
    const FOOTER_HEIGHT = 140;
    const contentY = HEADER_HEIGHT + 40;
    const contentHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT - 80;
    const textMaxWidth = canvas.width - 100;
    
    // Question mark icon at top
    ctx.fillStyle = Array.isArray(theme.button.background) ? theme.button.background[0] : theme.button.background;
    const iconSize = 100;
    const iconX = canvas.width / 2;
    const iconY = contentY + 60;
    
    
    // Hook text below icon
    const textY = iconY + iconSize / 2 + 60;
    const availableHeightForText = contentHeight - (textY - contentY) - 40;
    
    // Measure and fit text
    const measurement = measureQuestionContent(
        ctx, 
        hookText, 
        textMaxWidth, 
        theme.fontFamily, 
        65,  // Start font size
        35,  // Min font size
        availableHeightForText
    );
    
    // Draw hook text centered
    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `900 ${measurement.fontSize}px ${theme.fontFamily}`;
    
    const totalTextHeight = measurement.lines.length * measurement.fontSize * 1.2;
    const textStartY = textY + (availableHeightForText - totalTextHeight) / 2;
    
    measurement.lines.forEach((line, index) => {
        const lineY = textStartY + (index * measurement.fontSize * 1.2);
        ctx.fillText(line, canvas.width / 2, lineY);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 2: Before Frame - "Most people damage their vision by..."
export function renderBeforeFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const beforeText = job.data.content?.before || job.data.content?.bad_habit || "Most people damage their health by...";
    const consequences = job.data.content?.negative_effects || job.data.content?.damage || null;
    
    // Use MCQ-style measurement for optimal layout
    const fullContent = consequences && consequences !== beforeText 
        ? `${beforeText}\n\n${consequences}`
        : beforeText;
    
    const measurements = calculateOptimalLayout(
        ctx, 
        fullContent, 
        {}, 
        canvas.width, 
        canvas.height, 
        theme.fontFamily
    );
    
    
    // Content area with proper spacing
    const HEADER_HEIGHT = 180;
    const FOOTER_HEIGHT = 180;
    const contentY = HEADER_HEIGHT + 20;
    const contentHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT - 40;
    const contentWidth = canvas.width - 80;
    const contentX = 40;
    
    // Background for entire content area
    applyFillStyle(ctx, theme.page.background, { x: contentX, y: contentY, w: contentWidth, h: contentHeight });
    drawRoundRect(ctx, contentX, contentY, contentWidth, contentHeight, 20);
    
    // Large "BEFORE" text with high contrast coloring
    const titleY = contentY + 40;
    
    // Large colored "BEFORE" text
    ctx.fillStyle = '#FF4757'; // High contrast red for warning
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `900 72px ${theme.fontFamily}`;
    ctx.fillText("BEFORE", canvas.width / 2, titleY);
    
    // Warning icon positioned next to title
    ctx.fillStyle = Array.isArray(theme.button.background) ? theme.button.background[0] : theme.button.background;
    const iconSize = 50;
    const iconX = canvas.width / 2 + 200;
    const iconY = titleY + 36; // Center with title text
    
    
    ctx.fillStyle = theme.button.text;
    ctx.font = `bold 32px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', iconX, iconY);
    
    // Main before text with dynamic sizing
    const textY = titleY + 120;
    const textMaxWidth = contentWidth - 80;
    const availableHeight = contentY + contentHeight - textY - 40;
    
    const beforeMeasurement = measureQuestionContent(
        ctx,
        beforeText,
        textMaxWidth,
        theme.fontFamily,
        measurements.questionFontSize || 42,
        28,
        consequences ? availableHeight * 0.6 : availableHeight
    );
    
    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `600 ${beforeMeasurement.fontSize}px ${theme.fontFamily}`;
    
    let currentY = textY;
    beforeMeasurement.lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY);
        currentY += beforeMeasurement.fontSize * 1.2;
    });
    
    // Consequences section if available with better spacing
    if (consequences && consequences !== beforeText && currentY + 80 < contentY + contentHeight - 40) {
        currentY += 30;
        
        // Consequence box with dynamic height
        const remainingHeight = contentY + contentHeight - currentY - 40;
        const conseqHeight = Math.min(160, Math.max(100, remainingHeight));
        
        ctx.fillStyle = theme.header.background;
        drawRoundRect(ctx, contentX + 30, currentY, contentWidth - 60, conseqHeight, 10);
        
        // Consequence text with dynamic sizing
        const conseqMeasurement = measureQuestionContent(
            ctx,
            consequences,
            textMaxWidth - 60,
            theme.fontFamily,
            Math.min(beforeMeasurement.fontSize, 36),
            24,
            conseqHeight - 50
        );
        
        ctx.fillStyle = theme.text.secondary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = `500 ${conseqMeasurement.fontSize}px ${theme.fontFamily}`;
        
        const conseqStartY = currentY + 25;
        conseqMeasurement.lines.forEach((line, index) => {
            if (conseqStartY + (index * conseqMeasurement.fontSize * 1.2) < currentY + conseqHeight - 25) {
                ctx.fillText(line, canvas.width / 2, conseqStartY + (index * conseqMeasurement.fontSize * 1.2));
            }
        });
    }
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 3: After Frame - "But if you do THIS instead..."
export function renderAfterFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const afterText = job.data.content?.after || job.data.content?.good_habit || "But if you do THIS instead...";
    const benefits = job.data.content?.positive_effects || job.data.content?.benefits || null;
    
    // Use MCQ-style measurement for optimal layout
    const fullContent = benefits && benefits !== afterText 
        ? `${afterText}\n\n${benefits}`
        : afterText;
    
    const measurements = calculateOptimalLayout(
        ctx, 
        fullContent, 
        {}, 
        canvas.width, 
        canvas.height, 
        theme.fontFamily
    );
    
    
    // Content area with proper spacing
    const HEADER_HEIGHT = 180;
    const FOOTER_HEIGHT = 180;
    const contentY = HEADER_HEIGHT + 20;
    const contentHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT - 40;
    const contentWidth = canvas.width - 80;
    const contentX = 40;
    
    // Background for entire content area  
    applyFillStyle(ctx, theme.page.background, { x: contentX, y: contentY, w: contentWidth, h: contentHeight });
    drawRoundRect(ctx, contentX, contentY, contentWidth, contentHeight, 20);
    
    // Large "AFTER" text with high contrast coloring
    const titleY = contentY + 40;
    
    // Large colored "AFTER" text
    ctx.fillStyle = '#2ED573'; // High contrast green for success
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `900 72px ${theme.fontFamily}`;
    ctx.fillText("AFTER", canvas.width / 2, titleY);

    
    const checkX = canvas.width / 2 + 180;
    const checkY = titleY + 36; // Center with title text
    const checkSize = 40;
    
    ctx.beginPath();
    ctx.moveTo(checkX - checkSize/2, checkY);
    ctx.lineTo(checkX - checkSize/6, checkY + checkSize/3);
    ctx.lineTo(checkX + checkSize/2, checkY - checkSize/3);
    ctx.stroke();
    
    // Main after text with dynamic sizing
    const textY = titleY + 120;
    const textMaxWidth = contentWidth - 80;
    const availableHeight = contentY + contentHeight - textY - 40;
    
    const afterMeasurement = measureQuestionContent(
        ctx,
        afterText,
        textMaxWidth,
        theme.fontFamily,
        measurements.questionFontSize || 42,
        28,
        benefits ? availableHeight * 0.6 : availableHeight
    );
    
    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `600 ${afterMeasurement.fontSize}px ${theme.fontFamily}`;
    
    let currentY = textY;
    afterMeasurement.lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY);
        currentY += afterMeasurement.fontSize * 1.2;
    });
    
    // Benefits section if available with better spacing
    if (benefits && benefits !== afterText && currentY + 80 < contentY + contentHeight - 40) {
        currentY += 30;
        
        // Benefits box with dynamic height
        const remainingHeight = contentY + contentHeight - currentY - 40;
        const benefitHeight = Math.min(160, Math.max(100, remainingHeight));
        
        ctx.fillStyle = theme.header.background;
        drawRoundRect(ctx, contentX + 30, currentY, contentWidth - 60, benefitHeight, 10);
        
        // Benefit text with dynamic sizing
        const benefitMeasurement = measureQuestionContent(
            ctx,
            benefits,
            textMaxWidth - 60,
            theme.fontFamily,
            Math.min(afterMeasurement.fontSize, 36),
            24,
            benefitHeight - 50
        );
        
        ctx.fillStyle = theme.text.secondary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = `500 ${benefitMeasurement.fontSize}px ${theme.fontFamily}`;
        
        const benefitStartY = currentY + 25;
        benefitMeasurement.lines.forEach((line, index) => {
            if (benefitStartY + (index * benefitMeasurement.fontSize * 1.2) < currentY + benefitHeight - 25) {
                ctx.fillText(line, canvas.width / 2, benefitStartY + (index * benefitMeasurement.fontSize * 1.2));
            }
        });
    }
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 4: Proof Frame - Clean explanation style (inspired by MCQ explanation)
export function renderProofFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    // Handle both traditional proof fields and simplified result field
    const resultText = job.data.content?.result;
    const evidence = job.data.content?.evidence || job.data.content?.research || job.data.content?.explanation || resultText || "Research shows...";
    const actionText = job.data.content?.immediate_action || job.data.content?.next_step || "";
    
    // Combine evidence and action into single explanation (like MCQ)
    const fullExplanation = actionText && actionText !== "Start today:" && actionText !== evidence
        ? `${evidence}\n\n${actionText}`
        : evidence;
    
    // Calculate dynamic layout like MCQ explanation
    const textMaxWidth = canvas.width - 160;
    const textStartX = (canvas.width - textMaxWidth) / 2;
    const HEADER_HEIGHT = 180;
    const FOOTER_HEIGHT = 180;
    const availableHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT;
    
    // Measure explanation content with larger starting font (like MCQ explanation)
    const measurement = measureQuestionContent(
        ctx, 
        fullExplanation, 
        textMaxWidth, 
        theme.fontFamily, 
        60,  // Start with larger font for explanations
        32,  // Higher minimum readable size
        availableHeight
    );
    
    // Center the explanation vertically, but ensure it doesn't overlap footer
    const unusedSpace = Math.max(0, availableHeight - measurement.height);
    const idealStartY = HEADER_HEIGHT + (unusedSpace / 2);
    const maxStartY = canvas.height - FOOTER_HEIGHT - measurement.height - 20; // 20px safety margin
    const startY = Math.min(idealStartY, maxStartY);
    
    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `600 ${measurement.fontSize}px ${theme.fontFamily}`;
    
    // Draw explanation text (same style as MCQ explanation)
    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, textStartX, startY + index * lineHeight);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}