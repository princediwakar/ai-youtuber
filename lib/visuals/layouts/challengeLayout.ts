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
 * Challenge Format Layout
 * 5-frame structure: Hook → Setup → Challenge → Reveal → CTA
 * Purpose: Interactive brain/eye exercises with high engagement
 */

// Frame 1: Hook Frame - "Test your brain with this challenge"
export function renderHookFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    
    // Draw header with persona branding
    drawHeader(ctx, canvas.width, theme, job);
    
    // Main hook text - exciting challenge invitation
    const hookText = job.data.content?.hook || "Test your brain with this challenge";
    
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
    
    // Add brain/challenge icon
    ctx.fillStyle = '#8B5CF6'; // Purple for brain/challenge
    const iconSize = 100;
    const iconX = canvas.width / 2 - iconSize / 2;
    const iconY = startY - 140;
    
    // Draw brain outline
    ctx.beginPath();
    // Main brain shape (simplified)
    ctx.ellipse(iconX + iconSize/2, iconY + iconSize/2, iconSize * 0.4, iconSize * 0.35, 0, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#8B5CF6';
    ctx.stroke();
    
    // Brain divisions
    ctx.beginPath();
    ctx.moveTo(iconX + iconSize/2, iconY + iconSize * 0.2);
    ctx.lineTo(iconX + iconSize/2, iconY + iconSize * 0.8);
    ctx.stroke();
    
    // Lightning bolt for "challenge"
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(iconX + iconSize * 0.7, iconY + iconSize * 0.3);
    ctx.lineTo(iconX + iconSize * 0.6, iconY + iconSize * 0.5);
    ctx.lineTo(iconX + iconSize * 0.65, iconY + iconSize * 0.5);
    ctx.lineTo(iconX + iconSize * 0.55, iconY + iconSize * 0.7);
    ctx.lineTo(iconX + iconSize * 0.65, iconY + iconSize * 0.6);
    ctx.lineTo(iconX + iconSize * 0.6, iconY + iconSize * 0.6);
    ctx.closePath();
    ctx.fill();
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 2: Setup Frame - "Try to remember these 5 items..."
export function renderSetupFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const setupText = job.data.content?.setup || "Try to remember these items...";
    const instructions = job.data.content?.instructions;
    const challengeType = job.data.content?.challenge_type || "memory";
    
    // Background color for setup section
    ctx.fillStyle = '#F3E8FF'; // Light purple background for challenge prep
    const bgHeight = canvas.height - 200;
    drawRoundRect(ctx, 40, 100, canvas.width - 80, bgHeight - 100, 20);
    
    // Setup instruction
    ctx.fillStyle = '#7C3AED'; // Purple color for challenge
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 50px ${theme.fontFamily}`;
    
    // Handle both string and array instructions
    const displayText = Array.isArray(instructions) ? instructions.join(' ') : setupText;
    const setupLines = wrapText(ctx, displayText, canvas.width - 160);
    let currentY = 140;
    
    setupLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * 60));
    });
    currentY += setupLines.length * 60 + 40;
    
    // Challenge preparation visual cue
    ctx.fillStyle = '#6D28D9'; // Darker purple for emphasis
    ctx.font = `600 45px ${theme.fontFamily}`;
    
    const preparationText = challengeType === "memory" ? "Get ready to focus!" : 
                           challengeType === "vision" ? "Focus your eyes!" :
                           "Prepare your mind!";
    
    ctx.fillText(preparationText, canvas.width / 2, currentY);
    currentY += 80;
    
    // Countdown or timer visual (3-2-1)
    const countdownSize = 80;
    const countdownSpacing = 120;
    const startX = canvas.width / 2 - countdownSpacing;
    
    for (let i = 3; i >= 1; i--) {
        ctx.fillStyle = i === 1 ? '#EF4444' : '#6D28D9'; // Red for "1", purple for others
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 4;
        
        // Circle background
        ctx.beginPath();
        ctx.arc(startX + ((3-i) * countdownSpacing), currentY, countdownSize/2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Number
        ctx.fillStyle = ctx.strokeStyle;
        ctx.font = `bold 50px ${theme.fontFamily}`;
        ctx.fillText(i.toString(), startX + ((3-i) * countdownSpacing), currentY + 8);
    }
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 3: Challenge Frame - Display the actual challenge content
export function renderChallengeFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const challengeItems = job.data.content?.challenge_items || job.data.content?.items_to_remember || [];
    const challengeContent = job.data.content?.challenge_content || job.data.content?.visual_test || "";
    const challengeType = job.data.content?.challenge_type || "memory";
    
    // Challenge background
    ctx.fillStyle = '#FEF3C7'; // Light yellow background for focus
    const bgHeight = canvas.height - 180;
    drawRoundRect(ctx, 30, 90, canvas.width - 60, bgHeight - 90, 20);
    
    // Challenge title
    ctx.fillStyle = '#D97706'; // Orange for challenge active state
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 45px ${theme.fontFamily}`;
    ctx.fillText("CHALLENGE ACTIVE", canvas.width / 2, 120);
    
    let currentY = 200;
    
    if (challengeType === "memory" && Array.isArray(challengeItems) && challengeItems.length > 0) {
        // Memory challenge - display items to remember
        ctx.fillStyle = '#92400E'; // Darker orange for items
        ctx.font = `bold 55px ${theme.fontFamily}`;
        
        const itemsPerRow = Math.min(3, challengeItems.length);
        const rows = Math.ceil(challengeItems.length / itemsPerRow);
        const itemWidth = (canvas.width - 120) / itemsPerRow;
        const itemHeight = (bgHeight - 200) / rows;
        
        challengeItems.slice(0, 9).forEach((item, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const itemX = 60 + (col * itemWidth) + (itemWidth / 2);
            const itemY = currentY + (row * itemHeight) + (itemHeight / 2);
            
            // Item background
            ctx.fillStyle = '#FFFFFF';
            const itemBgSize = Math.min(itemWidth * 0.8, itemHeight * 0.8, 120);
            drawRoundRect(ctx, itemX - itemBgSize/2, itemY - itemBgSize/2, itemBgSize, itemBgSize, 10);
            
            // Item text
            ctx.fillStyle = '#92400E';
            ctx.font = `bold 38px ${theme.fontFamily}`;
            const itemLines = wrapText(ctx, item, itemBgSize - 20);
            
            itemLines.forEach((line, lineIndex) => {
                ctx.fillText(line, itemX, itemY - (itemLines.length - 1) * 15 + (lineIndex * 30));
            });
        });
        
    } else if (challengeType === "vision" && challengeContent) {
        // Vision challenge - display visual test
        ctx.fillStyle = '#92400E';
        ctx.font = `600 48px ${theme.fontFamily}`;
        
        const contentLines = wrapText(ctx, challengeContent, canvas.width - 120);
        contentLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, currentY + (index * 60));
        });
        
    } else {
        // Generic challenge content
        const genericChallenge = challengeContent || "Focus on this challenge!";
        ctx.fillStyle = '#92400E';
        ctx.font = `600 55px ${theme.fontFamily}`;
        
        const challengeLines = wrapText(ctx, genericChallenge, canvas.width - 120);
        challengeLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, currentY + (index * 70));
        });
    }
    
    // Timer indicator
    ctx.fillStyle = '#EF4444';
    ctx.font = `bold 35px ${theme.fontFamily}`;
    ctx.fillText("⏱️ 10 seconds", canvas.width / 2, canvas.height - 120);
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 4: Reveal Frame - "How did you do? Here's the trick..."
export function renderRevealFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const revealText = job.data.content?.reveal || "How did you do?";
    const trick = job.data.content?.trick || job.data.content?.method || job.data.content?.explanation || "Here's the secret...";
    const answer = job.data.content?.answer || job.data.content?.solution || "";
    
    // Reveal section
    ctx.fillStyle = '#065F46'; // Dark green for reveal
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 50px ${theme.fontFamily}`;
    
    const revealLines = wrapText(ctx, revealText, canvas.width - 120);
    let currentY = 130;
    
    revealLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * 60));
    });
    currentY += revealLines.length * 60 + 40;
    
    // Answer/Solution background
    if (answer) {
        ctx.fillStyle = '#D1FAE5'; // Light green background
        const answerBgHeight = 100;
        drawRoundRect(ctx, 40, currentY, canvas.width - 80, answerBgHeight, 15);
        
        ctx.fillStyle = '#047857';
        ctx.font = `bold 45px ${theme.fontFamily}`;
        
        const answerLines = wrapText(ctx, `Answer: ${answer}`, canvas.width - 160);
        const answerStartY = currentY + 25;
        
        answerLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, answerStartY + (index * 50));
        });
        currentY += answerBgHeight + 30;
    }
    
    // The trick/method explanation
    ctx.fillStyle = '#F0FDF4'; // Very light green background
    const trickBgHeight = 160;
    drawRoundRect(ctx, 40, currentY, canvas.width - 80, trickBgHeight, 15);
    
    ctx.fillStyle = '#166534'; // Dark green for trick
    ctx.font = `600 42px ${theme.fontFamily}`;
    
    const trickLines = wrapText(ctx, trick, canvas.width - 160);
    const trickStartY = currentY + 25;
    
    trickLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, trickStartY + (index * 50));
    });
    
    // Add lightbulb icon for "trick revealed"
    ctx.fillStyle = '#F59E0B';
    const lightBulbX = canvas.width / 2 + 250;
    const lightBulbY = trickStartY + 30;
    const bulbSize = 35;
    
    // Lightbulb shape
    ctx.beginPath();
    ctx.arc(lightBulbX, lightBulbY, bulbSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Lightbulb base
    ctx.fillStyle = '#D97706';
    drawRoundRect(ctx, lightBulbX - bulbSize * 0.3, lightBulbY + bulbSize * 0.4, bulbSize * 0.6, bulbSize * 0.3, 3);
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}

// Frame 5: CTA Frame - "Follow for more brain training!"
export function renderCtaFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);
    
    const ctaText = job.data.content?.cta || "Follow for more brain training!";
    const encouragement = job.data.content?.encouragement || "Great job challenging yourself!";
    const nextChallenge = job.data.content?.next_challenge || "Tomorrow: Even harder challenge!";
    
    // Encouragement section
    ctx.fillStyle = '#059669'; // Green for positive reinforcement
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `bold 55px ${theme.fontFamily}`;
    
    const encouragementLines = wrapText(ctx, encouragement, canvas.width - 120);
    let currentY = 140;
    
    encouragementLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * 65));
    });
    currentY += encouragementLines.length * 65 + 50;
    
    // Next challenge teaser
    ctx.fillStyle = '#7C3AED'; // Purple for next challenge
    ctx.font = `600 45px ${theme.fontFamily}`;
    
    const nextLines = wrapText(ctx, nextChallenge, canvas.width - 120);
    nextLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * 55));
    });
    currentY += nextLines.length * 55 + 60;
    
    // Main CTA button
    const buttonWidth = 550;
    const buttonHeight = 80;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = currentY;
    
    // Button shadow
    applyShadow(ctx, 'rgba(0, 0, 0, 0.3)', 10, 0, 4);
    
    // Button background - brain training gradient
    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
    gradient.addColorStop(0, '#8B5CF6');
    gradient.addColorStop(1, '#7C3AED');
    ctx.fillStyle = gradient;
    
    drawRoundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 15);
    clearShadow(ctx);
    
    // Button text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 35px ${theme.fontFamily}`;
    ctx.fillText(ctaText, canvas.width / 2, buttonY + buttonHeight / 2 + 5);
    
    // Add brain icons around the button for emphasis
    ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
    const brainIconSize = 25;
    
    // Left brain icon
    ctx.beginPath();
    ctx.arc(buttonX - 50, buttonY + buttonHeight / 2, brainIconSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Right brain icon  
    ctx.beginPath();
    ctx.arc(buttonX + buttonWidth + 50, buttonY + buttonHeight / 2, brainIconSize, 0, Math.PI * 2);
    ctx.fill();
    
    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}