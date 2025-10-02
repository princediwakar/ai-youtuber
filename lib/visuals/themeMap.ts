// lib/visuals/themeMap.ts

/**
 * Maps each persona to a curated list of appropriate theme names.
 * UPDATED: Now includes premium video-optimized themes for maximum engagement
 * Focus on high-contrast, vibrant themes that perform well in social media videos.
 */
export const PersonaThemeMap: Record<string, string[]> = {

  // English vocabulary - premium themes optimized for video engagement
  english_vocab_builder: [
    'ElectricPurple',   // Bold and attention-grabbing ⚡
    'NeonCyber',        // High contrast for social media 💫
    'GoldenHour',       // Premium, luxurious feel 🌟
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
    'GoldenHour',       // Premium wellness vibe 🌟
    'SakuraGrove',      // Natural and trustworthy
    'CanyonSunset'      // Warm earth tones
  ],
  
  // Eye health - high-contrast themes optimized for visual content
  eye_health_tips: [
    'ElectricPurple',   // Bold contrast for eye health ⚡
    'NeonCyber',        // High visibility 💫
    'ArcticGlow',       // Clean, eye-friendly ❄️
    'GoldenHour',       // Luxurious health appeal 🌟
    'SunsetVibes',      // Warm, approachable 🌅
    'MintyFresh'        // Clean medical aesthetic
  ],
  
  // SSC exam preparation - authoritative yet engaging themes for education
  ssc_shots: [
    'ElectricPurple',   // Bold authority ⚡
    'GoldenHour',       // Premium education feel 🌟
    'ArcticGlow',       // Clean, focused study ❄️
    'NeonCyber',        // Modern exam prep 💫
    'MintyFresh',       // Clean academic look
    'CanyonSunset'      // Warm institutional feel
  ],

  // Astronomy content - cosmic themes optimized for space wonder
  space_facts_quiz: [
    'NeonCyber',        // Perfect for space content 💫
    'CosmicDawn',       // Cosmic gradients for space
    'ElectricPurple',   // Universe mystery ⚡
    'EnchantedForest',  // Dark space backdrop
    'ArcticGlow',       // Stellar clarity ❄️
    'GoldenHour'        // Solar system gold 🌟
  ],
  
  // Default set optimized for maximum video engagement
  default: ['ElectricPurple', 'NeonCyber', 'GoldenHour'],
};