// lib/visuals/themeMap.ts

/**
 * Maps each persona to a curated list of appropriate theme names.
 * This ensures the visual style matches the content's tone for brand consistency.
 * NOTE: This map now uses the new theme names from 'appThemes.ts'.
 */
export const PersonaThemeMap: Record<string, string[]> = {
  english_learning: ['CafeAuLait', 'VintageScroll', 'SakuraGrove'],
  
  cricket_trivia: ['CosmicDawn', 'CanyonSunset', 'EmeraldSea'],
  
  psychology_facts: ['EmeraldSea', 'SakuraGrove', 'CosmicDawn'],
  
  historical_facts: ['VintageScroll', 'CafeAuLait'],
  
  geography_travel: ['EmeraldSea', 'CanyonSunset', 'PastelPlayground'],
  
  science_facts: ['EmeraldSea', 'CosmicDawn'],
  
  technology_facts: ['EmeraldSea', 'CosmicDawn'],
  
  // A default set of themes for any new persona not explicitly listed.
  default: ['CafeAuLait', 'EmeraldSea', 'CanyonSunset'],
};