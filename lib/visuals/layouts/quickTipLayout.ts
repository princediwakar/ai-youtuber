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
    measureQuestionContent,
    calculateOptimalLayout,
    calculateDynamicPositions
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
    drawHeader(ctx, canvas.width, theme, job);
    
    const hookText = job.data.content?.hook || "This simple habit will transform your health";
    
    // Content area dimensions
    const HEADER_HEIGHT = 160;
    const FOOTER_HEIGHT = 140;
    const contentY = HEADER_HEIGHT + 40;
    const contentHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT - 80;
    const textMaxWidth = canvas.width - 100;
    
    // Health icon at top
    ctx.fillStyle = Array.isArray(theme.button.background) ? theme.button.background[0] : theme.button.background;
    const iconSize = 100;
    const iconX = canvas.width / 2;
    const iconY = contentY + 60;
    
    // Draw heart icon
    ctx.beginPath();
    ctx.arc(iconX - iconSize * 0.2, iconY - iconSize * 0.1, iconSize * 0.15, 0, Math.PI * 2);
    ctx.arc(iconX + iconSize * 0.2, iconY - iconSize * 0.1, iconSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(iconX, iconY + iconSize * 0.3);
    ctx.lineTo(iconX - iconSize * 0.35, iconY - iconSize * 0.05);
    ctx.lineTo(iconX + iconSize * 0.35, iconY - iconSize * 0.05);
    ctx.closePath();
    ctx.fill();
    
    // Hook text below icon
    const textY = iconY + iconSize / 2 + 60;
    const availableHeightForText = contentHeight - (textY - contentY) - 40;
    
    // Measure and fit text dynamically
    const measurement = measureQuestionContent(
        ctx, 
        hookText, 
        textMaxWidth, 
        theme.fontFamily, 
        60,  // Start font size
        32,  // Min font size
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

// Frame 2: Action Frame - "Here's exactly what to do: [step by step]"
export function renderActionFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const actionText = job.data.content?.action || "Here's what to do:";
    const steps = job.data.content?.step_details || job.data.content?.instructions || [];
    const stepsText = job.data.content?.steps;
    
    // Use MCQ-style dynamic layout calculation
    const displayActionText = Array.isArray(stepsText) ? stepsText.join(' ') : actionText;
    const contentForMeasurement = Array.isArray(steps) && steps.length > 0 
        ? steps.join('\n') 
        : (job.data.content?.detailed_action || displayActionText);
    
    const measurements = calculateOptimalLayout(
        ctx, 
        contentForMeasurement, 
        {}, 
        canvas.width, 
        canvas.height, 
        theme.fontFamily
    );
    
    const positions = calculateDynamicPositions(measurements, canvas.height);
    
    // Content area with clean layout (no background box)
    const HEADER_HEIGHT = 180;
    const FOOTER_HEIGHT = 180;
    const contentY = HEADER_HEIGHT + 40;
    const contentHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT - 80;
    const textMaxWidth = canvas.width - 100;
    
    // Start directly with content (no badge/header)
    const stepsY = contentY;
    const availableHeight = contentHeight;
    
    if (Array.isArray(steps) && steps.length > 0) {
        // Step-by-step instructions with dynamic sizing
        let currentY = stepsY;
        const maxSteps = Math.min(4, steps.length);
        const stepHeight = Math.max(80, Math.min(120, (availableHeight - (maxSteps * 15)) / maxSteps));
        
        steps.slice(0, maxSteps).forEach((step, index) => {
            if (currentY + stepHeight <= contentY + contentHeight - 40) {
                // Step number circle
                ctx.fillStyle = Array.isArray(theme.feedback.correct) ? theme.feedback.correct[0] : theme.feedback.correct;
                const stepNumX = 80;
                const stepNumY = currentY + 30;
                const stepSize = 40;
                
                ctx.beginPath();
                ctx.arc(stepNumX, stepNumY, stepSize / 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = theme.text.onAccent;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `bold ${Math.min(24, stepSize * 0.6)}px ${theme.fontFamily}`;
                ctx.fillText((index + 1).toString(), stepNumX, stepNumY);
                
                // Step text with dynamic sizing
                const stepTextHeight = stepHeight - 20;
                const stepMeasurement = measureQuestionContent(
                    ctx,
                    step,
                    textMaxWidth - 120,
                    theme.fontFamily,
                    measurements.optionsFontSize || 36,
                    28,
                    stepTextHeight
                );
                
                ctx.fillStyle = theme.text.primary;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.font = `600 ${stepMeasurement.fontSize}px ${theme.fontFamily}`;
                
                const stepTextStartY = currentY + 10;
                stepMeasurement.lines.forEach((line, lineIndex) => {
                    if (stepTextStartY + (lineIndex * stepMeasurement.fontSize * 1.2) < currentY + stepHeight - 10) {
                        ctx.fillText(line, stepNumX + 50, stepTextStartY + (lineIndex * stepMeasurement.fontSize * 1.2));
                    }
                });
                
                currentY += stepHeight + 20;
            }
        });
    } else {
        // Single instruction text with proper measurement (like MCQ explanation style)
        const actionContent = job.data.content?.detailed_action || displayActionText;
        const textMeasurement = measureQuestionContent(
            ctx,
            actionContent,
            textMaxWidth,
            theme.fontFamily,
            measurements.questionFontSize || 50,
            32,
            availableHeight
        );
        
        ctx.fillStyle = theme.text.primary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = `600 ${textMeasurement.fontSize}px ${theme.fontFamily}`;
        
        const totalTextHeight = textMeasurement.lines.length * textMeasurement.fontSize * 1.2;
        const textStartY = stepsY + (availableHeight - totalTextHeight) / 2;
        
        textMeasurement.lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, textStartY + (index * textMeasurement.fontSize * 1.2));
        });
    }
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 3: Result Frame - "Why it works + science behind it" (MCQ explanation style)
export function renderResultFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const resultText = job.data.content?.result || job.data.content?.why_it_works || "Here's why it works:";
    const science = job.data.content?.science || job.data.content?.explanation || job.data.content?.answer || "";
    
    // Combine both texts for single explanation display (like MCQ)
    const fullExplanation = science && science !== "Scientific backing" && science !== resultText
        ? `${resultText}\n\n${science}`
        : resultText;
    
    // Calculate dynamic layout like MCQ explanation
    const textMaxWidth = canvas.width - 160;
    const textStartX = (canvas.width - textMaxWidth) / 2;
    const HEADER_HEIGHT = 180;
    const FOOTER_HEIGHT = 180;
    const availableHeight = canvas.height - HEADER_HEIGHT - FOOTER_HEIGHT;
    
    // Measure explanation content with larger starting font
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
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `600 ${measurement.fontSize}px ${theme.fontFamily}`;
    
    // Draw explanation text (same style as MCQ explanation)
    measurement.lines.forEach((line, index) => {
        const lineHeight = measurement.fontSize * 1.4;
        ctx.fillText(line, textStartX, startY + index * lineHeight);
    });
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}