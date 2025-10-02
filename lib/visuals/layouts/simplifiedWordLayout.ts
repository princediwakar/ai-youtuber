// lib/visuals/layouts/wordLayout.v7.ts
import { Canvas, CanvasRenderingContext2D } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
import { 
    drawBackground,
    drawHeader,
    drawFooter,
    applyFillStyle,
    applyShadow,
    clearShadow,
    wrapText,
} from '../drawingUtils';

// --- SELF-CONTAINED HELPER FUNCTIONS ---


const isHexColor = (hex: string): boolean => /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(hex);

function getLuminance(hex: string): number {
    if (!isHexColor(hex)) return 128;
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

function drawTopRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function drawBottomRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y);
    ctx.closePath();
}

/**
 * Redesigned Word Frame (v7 - Color Logic Restored)
 * Restores the superior color selection logic from v5 while keeping the
 * state management fix from v6.
 */
export function renderWordFrame(canvas: Canvas, job: QuizJob, theme: Theme): void {
    const ctx = canvas.getContext('2d');
    
    drawBackground(ctx, canvas.width, canvas.height, theme);
    drawHeader(ctx, canvas.width, theme, job);

    ctx.save();

    const content = job.data.content as any || {};
    const word = content.word || "Word";
    const pronunciation = content.pronunciation || "";
    const partOfSpeech = content.part_of_speech || "";
    const definition = content.definition || "Definition not available.";
    const example = content.usage || content.example || "";
    
    const CARD_MARGIN_X = 60;
    const cardX = CARD_MARGIN_X;
    const cardWidth = canvas.width - (CARD_MARGIN_X * 2);
    const cardY = 220;
    const cardHeight = canvas.height - cardY - 180 - 40;
    const CARD_RADIUS = 35;
    const PADDING = 45;

    let wordFontSize = 110;
    ctx.font = `900 ${wordFontSize}px ${theme.fontFamily}`;
    while (ctx.measureText(word).width > cardWidth - (PADDING * 2) && wordFontSize > 30) {
        wordFontSize -= 3;
        ctx.font = `900 ${wordFontSize}px ${theme.fontFamily}`;
    }
    
    // Ensure minimum readable size
    if (wordFontSize < 40) {
        wordFontSize = 40;
        ctx.font = `900 ${wordFontSize}px ${theme.fontFamily}`;
    }
    let requiredHeaderHeight = PADDING + wordFontSize + 40; // Increase gap after word to 40px
    if (pronunciation || partOfSpeech) { 
        requiredHeaderHeight += 60; // Increase space for pronunciation to 60px
    }
    requiredHeaderHeight += PADDING;
    const cardHeaderHeight = Math.max(240, requiredHeaderHeight); // Increase minimum height

    applyShadow(ctx, theme.button.shadow || 'rgba(0,0,0,0.2)', 30, 0, 15);

    const headerBg = theme.feedback.correct;
    applyFillStyle(ctx, headerBg, { x: cardX, y: cardY, w: cardWidth, h: cardHeaderHeight });
    drawTopRoundRect(ctx, cardX, cardY, cardWidth, cardHeaderHeight, CARD_RADIUS);
    ctx.fill();

    const cardBodyY = cardY + cardHeaderHeight;
    const cardBodyHeight = cardHeight - cardHeaderHeight;
    ctx.fillStyle = theme.header.background;
    drawBottomRoundRect(ctx, cardX, cardBodyY, cardWidth, cardBodyHeight, CARD_RADIUS);
    ctx.fill();
    clearShadow(ctx);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // ** IMPROVED COLOR LOGIC FOR THEME COMPATIBILITY **
    // For gradient headers, always use onAccent for good contrast
    const headerTextColor = Array.isArray(headerBg) ? theme.text.onAccent : 
        // For solid headers, check luminance to determine contrast
        getLuminance(headerBg) > 140 ? theme.text.onAccent : theme.text.primary;

    let headerContentY = cardY + PADDING;
    ctx.fillStyle = headerTextColor;
    ctx.font = `900 ${wordFontSize}px ${theme.fontFamily}`;
    ctx.fillText(word, cardX + PADDING, headerContentY);
    headerContentY += wordFontSize + 40; // Increase gap after word to 40px

    if (pronunciation || partOfSpeech) {
        const metaText = pronunciation ? `/${pronunciation}/  •  ${partOfSpeech}` : partOfSpeech;
        ctx.font = `500 42px ${theme.fontFamily}`; // Increase font size
        ctx.globalAlpha = 0.85;
        ctx.fillText(metaText, cardX + PADDING, headerContentY);
        ctx.globalAlpha = 1.0;
    }

    let totalBodyContentHeight = 0;
    let definitionFontSize = 56; // Increase from 48 to 56
    let exampleFontSize = 52; // Increase from 42 to 52
    const maxDefinitionLines = 3; // Reduce lines to accommodate larger text
    const maxExampleLines = 2; // Reduce lines to accommodate larger text

    // Adjust definition font size if content is too long
    ctx.font = `400 ${definitionFontSize}px ${theme.fontFamily}`;
    let definitionLines = wrapText(ctx, definition, cardWidth - (PADDING * 2));
    
    while (definitionLines.length > maxDefinitionLines && definitionFontSize > 44) {
        definitionFontSize -= 2;
        ctx.font = `400 ${definitionFontSize}px ${theme.fontFamily}`;
        definitionLines = wrapText(ctx, definition, cardWidth - (PADDING * 2));
    }
    
    // Truncate if still too long
    if (definitionLines.length > maxDefinitionLines) {
        definitionLines = definitionLines.slice(0, maxDefinitionLines);
        definitionLines[maxDefinitionLines - 1] = definitionLines[maxDefinitionLines - 1].slice(0, -3) + '...';
    }
    
    totalBodyContentHeight += definitionLines.length * (definitionFontSize * 1.5);

    let exampleLines: string[] = [];
    if (example) {
        totalBodyContentHeight += PADDING;
        
        // Adjust example font size if needed
        ctx.font = `italic ${exampleFontSize}px ${theme.fontFamily}`;
        exampleLines = wrapText(ctx, `"${example}"`, cardWidth - (PADDING * 2));
        
        while (exampleLines.length > maxExampleLines && exampleFontSize > 40) {
            exampleFontSize -= 2;
            ctx.font = `italic ${exampleFontSize}px ${theme.fontFamily}`;
            exampleLines = wrapText(ctx, `"${example}"`, cardWidth - (PADDING * 2));
        }
        
        // Truncate if still too long
        if (exampleLines.length > maxExampleLines) {
            exampleLines = exampleLines.slice(0, maxExampleLines);
            exampleLines[maxExampleLines - 1] = exampleLines[maxExampleLines - 1].slice(0, -4) + '..."';
        }
        
        totalBodyContentHeight += exampleLines.length * (exampleFontSize * 1.4);
    }

    const bodyAvailableHeight = cardBodyHeight - (PADDING * 2);
    const bodyContentYStart = cardBodyY + PADDING + (bodyAvailableHeight - totalBodyContentHeight) / 2;
    let currentBodyY = bodyContentYStart;
    
    ctx.fillStyle = theme.text.primary;
    ctx.font = `400 ${definitionFontSize}px ${theme.fontFamily}`;
    definitionLines.forEach((line) => {
        ctx.fillText(line, cardX + PADDING, currentBodyY);
        currentBodyY += definitionFontSize * 1.5;
    });

    if (example && exampleLines.length > 0) {
        currentBodyY += PADDING * 0.75; // Increase spacing before divider
        ctx.fillStyle = theme.text.secondary;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(cardX + PADDING, currentBodyY, cardWidth - (PADDING * 2), 3); // Make divider slightly thicker
        ctx.globalAlpha = 1.0;
        currentBodyY += PADDING * 0.75; // Increase spacing after divider
        ctx.fillStyle = theme.text.secondary;
        ctx.font = `italic ${exampleFontSize}px ${theme.fontFamily}`;
        exampleLines.forEach((line) => {
             ctx.fillText(line, cardX + PADDING, currentBodyY);
             currentBodyY += exampleFontSize * 1.4;
        });
    }

    ctx.restore();

    drawFooter(ctx, canvas.width, canvas.height, theme, job);
}