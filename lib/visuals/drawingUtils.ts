//lib/visuals/drawingUtils.ts
import { CanvasRenderingContext2D } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
import { MasterPersonas } from '@/lib/personas';

export const drawHeader = (ctx: CanvasRenderingContext2D, width: number, theme: Theme, job: QuizJob) => {
    ctx.fillStyle = theme.text.primary; // ✨ Changed
    ctx.font = `bold 48px ${theme.fontFamily}`; // ✨ Changed
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Use category_display_name from the job data, with fallbacks
    const personaDisplayName = 
                               MasterPersonas[job.persona]?.displayName || 
                               job.persona;
    
    ctx.fillText(`${personaDisplayName}`, width / 2, 90);
};

export const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, theme: Theme) => {
    ctx.fillStyle = theme.page.background;
    ctx.fillRect(0, 0, width, height);
};


export const drawFooter = (ctx: CanvasRenderingContext2D, width: number, height: number, theme: Theme) => {
    ctx.fillStyle = theme.text.secondary; // ✨ Changed to use secondary text color
    ctx.font = `bold 48px ${theme.fontFamily}`; // ✨ Changed
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    // No need for globalAlpha, as the color itself has transparency
    ctx.font = `48px ${theme.fontFamily}`; // ✨ Changed
    ctx.fillText('@gibbiai', width / 2, height - 90);
};

export const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    let lines: string[] = [];
    if (!words.length) return [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        const testLine = `${currentLine} ${words[i]}`;
        if (ctx.measureText(testLine).width > maxWidth) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    return lines;
};

export const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
};

export const drawOutlinedRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, lineWidth: number = 3) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.lineWidth = lineWidth;
    ctx.stroke();
};

// Content measurement utilities for dynamic layout
export interface ContentMeasurements {
    questionHeight: number;
    optionsHeight: number;
    totalContentHeight: number;
    questionFontSize: number;
    optionsFontSize: number;
}

export const measureQuestionContent = (
    ctx: CanvasRenderingContext2D, 
    text: string, 
    maxWidth: number, 
    fontFamily: string,
    startFontSize = 70,
    minFontSize = 45,
    maxHeight?: number
): { height: number; fontSize: number; lines: string[] } => {
    let fontSize = startFontSize;
    let lines: string[];
    let lineHeight: number;
    let totalHeight: number;
    
    do {
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        lines = wrapText(ctx, text, maxWidth);
        lineHeight = fontSize * 1.4;
        totalHeight = lines.length * lineHeight;
        
        // If no height constraint or content fits, use this size
        if (!maxHeight || totalHeight <= maxHeight || fontSize <= minFontSize) {
            break;
        }
        
        fontSize -= 2;
    } while (fontSize > minFontSize);
    
    return { height: totalHeight, fontSize, lines };
};

export const measureOptionsContent = (
    ctx: CanvasRenderingContext2D,
    options: Record<string, string>,
    maxWidth: number,
    fontFamily: string,
    fontSize = 45
): { height: number; optionHeights: number[] } => {
    const PADDING = 40;
    const OPTION_SPACING = 40;
    const LINE_HEIGHT = fontSize * 1.4;
    
    let totalHeight = 0;
    const optionHeights: number[] = [];
    
    Object.entries(options).forEach(([optionKey, optionText]) => {
        const fullOptionText = `${optionKey}. ${optionText}`;
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        
        const lines = wrapText(ctx, fullOptionText, maxWidth - (PADDING * 2));
        const textHeight = lines.length * LINE_HEIGHT;
        const optionHeight = textHeight + (PADDING * 2);
        
        optionHeights.push(optionHeight);
        totalHeight += optionHeight + OPTION_SPACING;
    });
    
    // Remove the last spacing
    totalHeight -= OPTION_SPACING;
    
    return { height: totalHeight, optionHeights };
};

export const calculateOptimalLayout = (
    ctx: CanvasRenderingContext2D,
    questionText: string,
    options: Record<string, string>,
    canvasWidth: number,
    canvasHeight: number,
    fontFamily: string
): ContentMeasurements => {
    const HEADER_HEIGHT = 180; // Header + margin
    const FOOTER_HEIGHT = 180; // Footer + margin
    const QUESTION_OPTION_SPACING = 80;
    const CONTENT_MARGIN = 160; // 80px margin on each side
    
    const availableHeight = canvasHeight - HEADER_HEIGHT - FOOTER_HEIGHT;
    const contentWidth = canvasWidth - CONTENT_MARGIN;
    
    // Start with larger question font size
    let questionFontSize = 70;
    let questionMeasurement = measureQuestionContent(ctx, questionText, contentWidth, fontFamily, questionFontSize);
    
    // Measure options at standard size
    const optionsFontSize = 45;
    const optionsMeasurement = measureOptionsContent(ctx, options, contentWidth, fontFamily, optionsFontSize);
    
    // Calculate total needed space
    let totalNeededHeight = questionMeasurement.height + QUESTION_OPTION_SPACING + optionsMeasurement.height;
    
    // If content doesn't fit, optimize question font size
    while (totalNeededHeight > availableHeight && questionFontSize > 45) {
        questionFontSize -= 2;
        questionMeasurement = measureQuestionContent(ctx, questionText, contentWidth, fontFamily, questionFontSize);
        totalNeededHeight = questionMeasurement.height + QUESTION_OPTION_SPACING + optionsMeasurement.height;
    }
    
    return {
        questionHeight: questionMeasurement.height,
        optionsHeight: optionsMeasurement.height,
        totalContentHeight: totalNeededHeight,
        questionFontSize,
        optionsFontSize
    };
};

export interface LayoutPositions {
    questionStartY: number;
    questionEndY: number;
    optionsStartY: number;
    contentCenterY: number;
}

export const calculateDynamicPositions = (
    measurements: ContentMeasurements,
    canvasHeight: number
): LayoutPositions => {
    const HEADER_HEIGHT = 180;
    const FOOTER_HEIGHT = 180;
    const QUESTION_OPTION_SPACING = 80;
    
    const availableHeight = canvasHeight - HEADER_HEIGHT - FOOTER_HEIGHT;
    const unusedSpace = availableHeight - measurements.totalContentHeight;
    
    // Center the content vertically in the available space
    const contentStartY = HEADER_HEIGHT + (unusedSpace / 2);
    
    const questionStartY = contentStartY;
    const questionEndY = questionStartY + measurements.questionHeight;
    const optionsStartY = questionEndY + QUESTION_OPTION_SPACING;
    const contentCenterY = contentStartY + (measurements.totalContentHeight / 2);
    
    return {
        questionStartY,
        questionEndY,
        optionsStartY,
        contentCenterY
    };
};