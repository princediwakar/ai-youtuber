import { Theme } from '@/lib/types';

/**
 * A centralized library of all available visual themes.
 * Each theme provides a distinct and consistent color palette and font.
 */
export const themes: Record<string, Theme> = {
  lightCoffee: {
    name: 'lightCoffee',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#fff4e6',
    COLOR_BG_LIGHT: '#fff4e6',
    COLOR_TEXT_PRIMARY: '#3c2f2f',
    COLOR_BUTTON_BG: '#be9b7b',
    COLOR_CORRECT_BG: '#854442',
    COLOR_CORRECT_TEXT: '#fff4e6',
    MUTED_TEXT_COLOR: 'rgba(60, 47, 47, 0.5)',
  },
  charcoalOrange: {
    name: 'charcoalOrange',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#252422',
    COLOR_BG_LIGHT: '#403D39',
    COLOR_TEXT_PRIMARY: '#FFFCF2',
    COLOR_BUTTON_BG: '#403D39',
    COLOR_CORRECT_BG: '#EB5E28',
    COLOR_CORRECT_TEXT: '#252422',
    MUTED_TEXT_COLOR: 'rgba(255, 252, 242, 0.6)',
  },
  midnightGarden: {
    name: 'midnightGarden',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#3D405B',
    COLOR_BG_LIGHT: '#3D405B',
    COLOR_TEXT_PRIMARY: '#F4F1DE',
    COLOR_BUTTON_BG: '#81B29A',
    COLOR_CORRECT_BG: '#F2CC8F',
    COLOR_CORRECT_TEXT: '#3D405B',
    MUTED_TEXT_COLOR: 'rgba(244, 241, 222, 0.6)',
  },
  warmPaper: {
    name: 'warmPaper',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#FFFCF2',
    COLOR_BG_LIGHT: '#FFFCF2',
    COLOR_TEXT_PRIMARY: '#252422',
    COLOR_BUTTON_BG: '#CCC5B9',
    COLOR_CORRECT_BG: '#EB5E28',
    COLOR_CORRECT_TEXT: '#FFFCF2',
    MUTED_TEXT_COLOR: 'rgba(37, 36, 34, 0.5)',
  },
  desertBloom: {
    name: 'desertBloom',
    FONT_FAMILY: 'Poppins',
    COLOR_BG_DARK: '#F4F1DE',
    COLOR_BG_LIGHT: '#F4F1DE',
    COLOR_TEXT_PRIMARY: '#3D405B',
    COLOR_BUTTON_BG: '#E07A5F',
    COLOR_CORRECT_BG: '#81B29A',
    COLOR_CORRECT_TEXT: '#F4F1DE',
    MUTED_TEXT_COLOR: 'rgba(61, 64, 91, 0.5)',
  },
};