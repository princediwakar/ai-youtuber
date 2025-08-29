// lib/visuals/themeMap.ts

/**
 * Maps each persona to a curated list of appropriate theme names.
 * This ensures the visual style matches the content's tone for brand consistency.
 * NOTE: This map now uses the new theme names from 'appThemes.ts'.
 */
export const PersonaThemeMap: Record<string, string[]> = {

  neet_preparation: ['EmeraldSea', 'CosmicDawn', 'CafeAuLait'],
  
  // A default set of themes for any new persona not explicitly listed.
  default: ['CafeAuLait'],
};