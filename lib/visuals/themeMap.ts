// lib/visuals/themeMap.ts

/**
 * Maps each persona to a curated list of appropriate theme names.
 * This ensures the visual style matches the content's tone for brand consistency.
 * NOTE: This map now uses the new theme names from 'appThemes.ts'.
 */
export const PersonaThemeMap: Record<string, string[]> = {

  // English vocabulary - educational themes with good readability
  english_vocab_builder: [
    'VintageScroll',    // Classic scholarly feel
    'SakuraGrove',      // Clean and focused
    'CanyonSunset',     // Warm and welcoming
    'MintyFresh',       // Clean and modern
    'SunsetBeach'       // Vibrant and engaging
  ],
  
  // Brain health - calming and professional themes for wellness content
  brain_health_tips: [
    'VintageScroll',    // Professional and trustworthy
    'SakuraGrove',      // Natural and calming
    'CanyonSunset',     // Warm earth tones
    'MintyFresh',       // Clean health aesthetic
    'SunsetBeach',      // Positive energy
    'EmeraldSea'        // Deep, thoughtful colors for brain health
  ],
  
  // Eye health - themes with good contrast and eye-friendly colors
  eye_health_tips: [
    'VintageScroll',    // Easy on the eyes
    'SakuraGrove',      // Gentle natural colors
    'CanyonSunset',     // Warm, comfortable tones
    'MintyFresh',       // Clean and soothing
    'SunsetBeach',      // Bright but not harsh
    'CosmicDawn'        // Dramatic but eye-conscious gradients
  ],
  
  // SSC exam preparation - professional and authoritative themes for government exam content
  ssc_shots: [
    'VintageScroll',    // Professional scholarly feel
    'MintyFresh',       // Clean and focused  
    'SakuraGrove',      // Calm and trustworthy
    'CanyonSunset',     // Warm institutional colors
  ],

  // Astronomy content - cosmic and space-themed visuals for wonder and amazement
  space_facts_quiz: [
    'CosmicDawn',       // Perfect for space content with cosmic gradients
    'EmeraldSea',       // Deep space colors
    // Removed shared themes to ensure complete isolation from other content
  ],
  
  // A default set of themes for any new persona not explicitly listed.
  default: ['MintyFresh', 'VintageScroll', 'SakuraGrove'],
};