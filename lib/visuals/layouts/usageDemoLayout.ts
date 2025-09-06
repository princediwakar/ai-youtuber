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
 * Usage Demo Format Layout
 * 4-frame structure: Hook → Wrong → Right → Practice
 * Purpose: Contextual word usage demonstration
 */

// Frame 1: Hook Frame - "When to use this advanced word"
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const hookText = job.data.question.hook || "When to use this advanced word";
    const targetWord = job.data.question.target_word || job.data.question.advanced_word || "";
    
    // Main hook text
    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 65px ${theme.fontFamily}`;
    
    const textMaxWidth = canvas.width - 120;
    const lines = wrapText(ctx, hookText, textMaxWidth);
    let currentY = 180;
    
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * 75));
    });
    currentY += lines.length * 75 + 60;
    
    // Highlight the target word in a styled box
    if (targetWord) {
        const wordBoxWidth = 400;
        const wordBoxHeight = 90;
        const wordBoxX = (canvas.width - wordBoxWidth) / 2;
        const wordBoxY = currentY;
        
        // Word box with gradient
        const gradient = ctx.createLinearGradient(wordBoxX, wordBoxY, wordBoxX, wordBoxY + wordBoxHeight);
        gradient.addColorStop(0, '#1E40AF');
        gradient.addColorStop(1, '#1E3A8A');
        
        applyShadow(ctx, 'rgba(0, 0, 0, 0.3)', 10, 0, 5);
        ctx.fillStyle = gradient;
        drawRoundRect(ctx, wordBoxX, wordBoxY, wordBoxWidth, wordBoxHeight, 15);
        clearShadow(ctx);
        
        // Target word text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold 50px ${theme.fontFamily}`;
        ctx.fillText(`"${targetWord}"`, canvas.width / 2, wordBoxY + wordBoxHeight / 2 + 8);
        
        currentY += wordBoxHeight + 40;
    }
    
    // Subtext
    ctx.fillStyle = theme.text.secondary;
    ctx.font = `normal 40px ${theme.fontFamily}`;
    ctx.fillText("Let me show you how", canvas.width / 2, currentY);
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 2: Wrong Frame - "Don't use it here: [example]"
export function renderWrongFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const wrongExample = job.data.question.wrong_example || job.data.question.incorrect_usage || "Wrong usage example";
    const wrongContext = job.data.question.wrong_context || "";
    
    // Red background to indicate wrong usage
    ctx.fillStyle = '#FEF2F2';
    const bgHeight = canvas.height - 200;
    drawRoundRect(ctx, 40, 120, canvas.width - 80, bgHeight - 120, 20);
    
    // "Don't use it here:" label
    ctx.fillStyle = '#DC2626';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 50px ${theme.fontFamily}`;
    ctx.fillText("Don't use it here:", canvas.width / 2, 180);
    
    // Wrong example text
    ctx.fillStyle = '#991B1B';
    ctx.font = `italic 55px ${theme.fontFamily}`;
    
    const textMaxWidth = canvas.width - 120;
    const exampleLines = wrapText(ctx, `"${wrongExample}"`, textMaxWidth);
    let currentY = 280;
    
    exampleLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * 65));
    });
    currentY += exampleLines.length * 65 + 40;
    
    // Add context explanation if provided
    if (wrongContext) {
        ctx.fillStyle = '#DC2626';
        ctx.font = `normal 35px ${theme.fontFamily}`;
        const contextLines = wrapText(ctx, wrongContext, textMaxWidth);
        
        contextLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, currentY + (index * 42));
        });
        currentY += contextLines.length * 42 + 30;
    }
    
    // Add large X mark
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    
    const xSize = 60;
    const xX = canvas.width / 2;
    const xY = currentY;
    
    ctx.beginPath();
    ctx.moveTo(xX - xSize/2, xY - xSize/2);
    ctx.lineTo(xX + xSize/2, xY + xSize/2);
    ctx.moveTo(xX + xSize/2, xY - xSize/2);
    ctx.lineTo(xX - xSize/2, xY + xSize/2);
    ctx.stroke();
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 3: Right Frame - "Perfect usage: [example]"
export function renderRightFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const rightExample = job.data.question.right_example || job.data.question.correct_usage || job.data.question.answer;
    const rightContext = job.data.question.right_context || job.data.question.explanation;
    
    // Green background to indicate correct usage
    ctx.fillStyle = '#ECFDF5';
    const bgHeight = canvas.height - 200;
    drawRoundRect(ctx, 40, 120, canvas.width - 80, bgHeight - 120, 20);
    
    // "Perfect usage:" label
    ctx.fillStyle = '#059669';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 50px ${theme.fontFamily}`;
    ctx.fillText("Perfect usage:", canvas.width / 2, 180);
    
    // Correct example text
    ctx.fillStyle = '#047857';
    ctx.font = `italic 55px ${theme.fontFamily}`;
    
    const textMaxWidth = canvas.width - 120;
    const exampleLines = wrapText(ctx, `"${rightExample}"`, textMaxWidth);
    let currentY = 280;
    
    exampleLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * 65));
    });
    currentY += exampleLines.length * 65 + 40;
    
    // Add context explanation if provided
    if (rightContext) {
        ctx.fillStyle = '#059669';
        ctx.font = `normal 35px ${theme.fontFamily}`;
        const contextLines = wrapText(ctx, rightContext, textMaxWidth);
        
        contextLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, currentY + (index * 42));
        });
        currentY += contextLines.length * 42 + 30;
    }
    
    // Add checkmark
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const checkX = canvas.width / 2;
    const checkY = currentY;
    const checkSize = 45;
    
    ctx.beginPath();
    ctx.moveTo(checkX - checkSize/2, checkY);
    ctx.lineTo(checkX - checkSize/6, checkY + checkSize/3);
    ctx.lineTo(checkX + checkSize/2, checkY - checkSize/3);
    ctx.stroke();
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 4: Practice Frame - "Your turn to try!"
export function renderPracticeFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const practicePrompt = job.data.question.practice || job.data.question.cta || "Your turn to try!";
    const targetWord = job.data.question.target_word || job.data.question.advanced_word || "";
    const practiceScenario = job.data.question.practice_scenario || "";
    
    // Main practice instruction
    ctx.fillStyle = theme.text.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 55px ${theme.fontFamily}`;
    
    const instructionLines = wrapText(ctx, practicePrompt, canvas.width - 120);
    let currentY = 180;
    
    instructionLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * 65));
    });
    currentY += instructionLines.length * 65 + 50;
    
    // Practice scenario box
    if (practiceScenario) {
        const scenarioBoxWidth = canvas.width - 80;
        const scenarioBoxHeight = 120;
        const scenarioBoxX = 40;
        const scenarioBoxY = currentY;
        
        // Scenario box background
        ctx.fillStyle = '#F3F4F6';
        drawRoundRect(ctx, scenarioBoxX, scenarioBoxY, scenarioBoxWidth, scenarioBoxHeight, 15);
        
        // Scenario text
        ctx.fillStyle = '#374151';
        ctx.font = `normal 38px ${theme.fontFamily}`;
        ctx.textAlign = 'left';
        
        const scenarioLines = wrapText(ctx, practiceScenario, scenarioBoxWidth - 40);
        const textStartY = scenarioBoxY + 30;
        
        scenarioLines.forEach((line, index) => {
            ctx.fillText(line, scenarioBoxX + 20, textStartY + (index * 45));
        });
        
        currentY += scenarioBoxHeight + 40;
    }
    
    // Target word reminder
    if (targetWord) {
        ctx.fillStyle = '#1E40AF';
        ctx.font = `bold 45px ${theme.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(`Use: "${targetWord}"`, canvas.width / 2, currentY);
        currentY += 60;
    }
    
    // CTA button
    const buttonWidth = 380;
    const buttonHeight = 75;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = Math.min(currentY, canvas.height - 180);
    
    // Button gradient
    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
    gradient.addColorStop(0, '#1E40AF');
    gradient.addColorStop(1, '#1E3A8A');
    
    applyShadow(ctx, 'rgba(0, 0, 0, 0.3)', 12, 0, 4);
    ctx.fillStyle = gradient;
    drawRoundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 12);
    clearShadow(ctx);
    
    // Button text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 32px ${theme.fontFamily}`;
    ctx.fillText("Follow for word mastery!", canvas.width / 2, buttonY + buttonHeight / 2 + 5);
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}