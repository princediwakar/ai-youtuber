/**
 * Maps each persona to a curated list of appropriate theme names.
 * This ensures the visual style matches the content's tone for brand consistency.
 */
export const PersonaThemeMap: Record<string, string[]> = {
    english_learning: ['charcoalOrange'],
    
    // A default set of themes for any new persona not explicitly listed.
    default: ['charcoalOrange'],
  };