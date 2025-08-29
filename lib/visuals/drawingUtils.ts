import { CanvasRenderingContext2D } from 'canvas';
import { Theme, QuizJob } from '@/lib/types';
import { MasterPersonas } from '@/lib/personas';

export const drawHeader = (ctx: CanvasRenderingContext2D, width: number, theme: Theme, job: QuizJob) => {
    ctx.fillStyle = theme.text.primary; // ✨ Changed
    ctx.font = `bold 48px ${theme.fontFamily}`; // ✨ Changed
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Use category_display_name from the job data, with fallbacks
    const categoryDisplayName = job.category_display_name || 
                               job.data?.category_display_name || 
                               MasterPersonas[job.persona]?.displayName || 
                               job.persona;
    
    ctx.fillText(`${categoryDisplayName}`, width / 2, 90);
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