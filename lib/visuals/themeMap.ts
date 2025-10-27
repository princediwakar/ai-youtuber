// lib/visuals/themeMap.ts

/**
 * Maps each persona to a curated list of appropriate theme names.
 * UPDATED: 2025 Educational Retention-Optimized Themes
 * Focus: Eye comfort for 30-60 sec videos + Strategic attention (buttons/CTAs)
 * Key: Soft backgrounds, dark gray text (not black), vibrant CTAs
 */
export const PersonaThemeMap: Record<string, string[]> = {

  // English vocabulary - Focus on readability + learning retention
  english_vocab_builder: [
    'FocusBlue',        // 🎓 Soft blue reduces eye strain, boosts concentration
    'SoftYellow',       // 💡 Muted yellow for alertness without fatigue
    'ArcticGlow',       // ❄️ Clean, modern readability
    'CanyonSunset',     // Warm, approachable
  ],

  // Brain health - Calm, trustworthy, easy on eyes
  mental_health_tips: [
    'LearnGreen',       // 📚 Green promotes calm, boosts focus
    'FocusBlue',        // 🎓 Soft blue for concentration
    'MintyFresh',       // Fresh, clean medical
    'ArcticGlow',       // ❄️ Clean health aesthetic
  ],

  // Eye health - Absolutely NO harsh colors for eye health content
  general_health_tips: [
    'LearnGreen',       // 📚 Easiest on eyes, natural calm
    'FocusBlue',        // 🎓 Soft blue, comfortable reading
    'MintyFresh',       // Clean, soothing medical
    'ArcticGlow',       // ❄️ Gentle, eye-friendly
  ],

  // SSC exam preparation - Authoritative + readable for long study sessions
  ssc_shots: [
    'DeepPurple',       // 🎯 Authoritative for exam prep
    'FocusBlue',        // 🎓 Concentration and focus
    'ArcticGlow',       // ❄️ Clean, focused study
  ],

  // Astronomy content - Cosmic wonder with readability
  space_facts_quiz: [
    'CosmicDawn',       // Cosmic gradients for space
    'EnchantedForest',  // Dark space backdrop
    'FocusBlue',        // 🎓 Stellar clarity
    'GoldenHour'        // 🌟 Solar system gold
  ],

  // Default set - Educational retention priority
  default: ['FocusBlue', 'LearnGreen'],
};