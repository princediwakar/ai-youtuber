/**
 * Maps each persona to a curated list of appropriate theme names.
 * This ensures the visual style matches the content's tone for brand consistency.
 */
export const PersonaThemeMap: Record<string, string[]> = {
    upsc_prep: ['slateGold', 'charcoalOrange'],
    current_affairs: ['charcoalOrange', 'warmPaper'],
    english_learning: ['midnightGarden', 'warmPaper', 'desertBloom'],
    
    // A default set of themes for any new persona not explicitly listed.
    default: ['slateGold', 'midnightGarden', 'warmPaper'],
  };