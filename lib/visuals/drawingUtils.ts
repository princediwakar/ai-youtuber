import { CanvasRenderingContext2D } from 'canvas';
import { Theme } from '@/lib/types';
import { MasterCurriculum } from '../curriculum';

export const drawHeader = (ctx: CanvasRenderingContext2D, width: number, theme: Theme) => {
    ctx.fillStyle = theme.COLOR_TEXT_PRIMARY;
    ctx.font = `bold 48px ${theme.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`QUIZ TIME`, width / 2, 80);
};

export const drawFooter = (ctx: CanvasRenderingContext2D, width: number, height: number, theme: Theme, persona: string) => {
    const personaDisplayName = MasterCurriculum[persona]?.displayName || '';
    ctx.fillStyle = theme.COLOR_TEXT_PRIMARY;
    ctx.font = `bold 36px ${theme.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.globalAlpha = 0.8;
    ctx.fillText(personaDisplayName, width / 2, height - 120);
    ctx.font = `32px ${theme.FONT_FAMILY}`;
    ctx.fillText('@gibbiai', width / 2, height - 60);
    ctx.globalAlpha = 1.0;
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