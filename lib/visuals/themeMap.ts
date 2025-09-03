// lib/visuals/themeMap.ts

/**
 * Maps each persona to a curated list of appropriate theme names.
 * This ensures the visual style matches the content's tone for brand consistency.
 * NOTE: This map now uses the new theme names from 'appThemes.ts'.
 */
export const PersonaThemeMap: Record<string, string[]> = {

  english_vocab_builder: ['CafeAuLait', 'VintageScroll', 'SakuraGrove', 'CanyonSunset', 'MintyFresh', 'SunsetBeach'],
  // Removed dark themes (EnchantedForest, EmeraldSea, CosmicDawn) for better mobile visibility
  // A default set of themes for any new persona not explicitly listed.
  default: ['CafeAuLait'],
};