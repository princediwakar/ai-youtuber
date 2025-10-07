// lib/visuals/themeMap.ts

/**
 * Maps each persona to a curated list of appropriate theme names.
 * UPDATED: Now includes premium video-optimized themes for maximum engagement
 * Focus on high-contrast, vibrant themes that perform well in social media videos.
 */
export const PersonaThemeMap: Record<string, string[]> = {

  // English vocabulary - premium themes optimized for video engagement
  english_vocab_builder: [
    'SunsetVibes',      // Warm and engaging 🌅
    'ArcticGlow',       // Clean, modern, crisp ❄️
    'CosmicDawn',       // Dramatic gradients for impact
    'CanyonSunset'      // Warm and approachable (backup)
  ],
  
  // Brain health - wellness themes with video appeal
  brain_health_tips: [
    'ArcticGlow',       // Clean, modern health aesthetic ❄️
    'SunsetVibes',      // Positive, calming energy 🌅
    'MintyFresh',       // Fresh health feel
    'SakuraGrove',      // Natural and trustworthy
    'CanyonSunset'      // Warm earth tones
  ],
  
  // Eye health - high-contrast themes optimized for visual content
  eye_health_tips: [
    'ArcticGlow',       // Clean, eye-friendly ❄️
    'SunsetVibes',      // Warm, approachable 🌅
    'MintyFresh'        // Clean medical aesthetic
  ],
  
  // SSC exam preparation - authoritative yet engaging themes for education
  ssc_shots: [
    'ArcticGlow',       // Clean, focused study ❄️
    'MintyFresh',       // Clean academic look
    'CanyonSunset'      // Warm institutional feel
  ],

  // Astronomy content - cosmic themes optimized for space wonder
  space_facts_quiz: [
    'CosmicDawn',       // Cosmic gradients for space
    'EnchantedForest',  // Dark space backdrop
    'ArcticGlow',       // Stellar clarity ❄️
    'GoldenHour'        // Solar system gold 🌟
  ],
  
  // Default set optimized for maximum video engagement
  default: ['GoldenHour'],
};