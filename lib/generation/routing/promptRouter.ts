/**
 * Prompt router for content generation
 * Routes to persona-specific prompt templates for better maintainability
 */

// Import shared utilities
import { 
  VariationMarkers, 
  PromptConfig, 
  generateVariationMarkers,
  addJsonFormatInstructions
} from '../shared/utils';

// Import persona-specific prompts
import { 
  generateEnglishPrompt,
  generateSimplifiedWordPrompt,
  generateCommonMistakePrompt,
  generateQuickFixPrompt,
  generateUsageDemoPrompt
} from '../personas/english/prompts';

import { 
  generateBrainHealthPrompt,
  generateEyeHealthPrompt,
  generateQuickTipPrompt,
  generateChallengePrompt
} from '../personas/health/prompts';

import { 
  generateSSCMCQPrompt,
  generateSimplifiedSSCPrompt,
  generateSSCCommonMistakePrompt,
  generateSSCQuickTipPrompt,
  generateSSCUsageDemoPrompt,
  generateSSCChallengePrompt
} from '../personas/ssc/prompts';

import {
  generateAstronomyPrompt
} from '../personas/astronomy/prompts';

// Import types
import type { PersonaType, FormatType, PromptGenerator } from '../shared/types';

// Re-export shared utilities for backward compatibility
export type { VariationMarkers, PromptConfig };
export { generateVariationMarkers, addJsonFormatInstructions };

// Re-export persona-specific functions for backward compatibility
export { 
  generateBrainHealthPrompt,
  generateEyeHealthPrompt,
  generateEnglishPrompt,
  generateCommonMistakePrompt,
  generateQuickFixPrompt,
  generateUsageDemoPrompt,
  generateQuickTipPrompt,
  generateChallengePrompt
};

/**
 * Format and persona routing lookup table
 * ANALYTICS-DRIVEN: Simplified Word format for maximum engagement
 * Addressing 73% zero engagement by using ultra-simple single-frame format
 */
const FORMAT_PERSONA_ROUTES: Record<FormatType, Partial<Record<PersonaType, PromptGenerator>> & { default: PromptGenerator }> = {
  // NEW: Simplified Word format for maximum engagement (single frame)
  simplified_word: {
    english_vocab_builder: generateSimplifiedWordPrompt,
    default: generateSimplifiedWordPrompt
  },
  // AVAILABLE: Complex formats (0% engagement but kept for experimentation)
  common_mistake: {
    english_vocab_builder: generateCommonMistakePrompt,
    default: generateCommonMistakePrompt
  },
  quick_fix: {
    english_vocab_builder: generateQuickFixPrompt,
    default: generateQuickFixPrompt
  },
  usage_demo: {
    english_vocab_builder: generateUsageDemoPrompt,
    default: generateUsageDemoPrompt
  },
  challenge: {
    brain_health_tips: generateChallengePrompt,
    eye_health_tips: generateChallengePrompt,
    default: generateChallengePrompt
  },
  // ENABLED: Quick Tips for health personas (384 avg views, 1.2K max views)
  quick_tip: {
    brain_health_tips: generateQuickTipPrompt,
    eye_health_tips: generateQuickTipPrompt,
    english_vocab_builder: generateQuickTipPrompt, // Test for other personas
    ssc_shots: generateQuickTipPrompt,
    space_facts_quiz: generateQuickTipPrompt,
    default: generateQuickTipPrompt
  },
  // PRIMARY: MCQ format (1.26% engagement - PROVEN PERFORMER)
  mcq: {
    brain_health_tips: generateBrainHealthPrompt,
    eye_health_tips: generateEyeHealthPrompt,
    english_vocab_builder: generateEnglishPrompt, // Restore proven MCQ format
    ssc_shots: generateSSCMCQPrompt, // Restore proven MCQ format
    space_facts_quiz: generateAstronomyPrompt,
    default: generateEnglishPrompt // Default to proven MCQ
  }
};

/**
 * Main format-aware prompt generator - routes to appropriate persona functions
 * ANALYTICS-DRIVEN: Simplified Word format for maximum engagement
 * Addresses 73% zero engagement by using ultra-simple single-frame format
 */
/**
 * Format rotation strategy for balanced testing
 * Distributes different formats across personas and time for A/B testing
 */
const FORMAT_ROTATION: Record<PersonaType, FormatType[]> = {
  english_vocab_builder: ['mcq'], // Force MCQ only - proven 1.26% engagement 
  brain_health_tips: ['mcq'], // Force MCQ only - needs optimization
  eye_health_tips: ['mcq'], // Force MCQ only - needs optimization
  ssc_shots: ['mcq'], // Force MCQ only - fix 0% engagement issue
  space_facts_quiz: ['mcq'] // Force MCQ only - paused until format proven
};

export function generateFormatPrompt(config: PromptConfig): string {
  let format = config.format as FormatType;
  const persona = config.persona as PersonaType;
  
  // If no format specified, use rotation strategy for balanced testing
  if (!format) {
    const rotationFormats = FORMAT_ROTATION[persona] || ['mcq', 'simplified_word'];
    const rotationIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % rotationFormats.length; // 6-hour rotation
    format = rotationFormats[rotationIndex];
    console.log(`🔄 Format rotation: Using ${format} for ${persona} (${rotationIndex + 1}/${rotationFormats.length})`);
  } else {
    console.log(`✅ Using requested format: ${format} for ${persona}`);
  }

  const formatRoutes = FORMAT_PERSONA_ROUTES[format];
  if (!formatRoutes) {
    // Fallback to proven MCQ if format not found
    const mcqRoutes = FORMAT_PERSONA_ROUTES.mcq;
    const generator = mcqRoutes[persona] || mcqRoutes.default;
    return generator(config);
  }

  const generator = formatRoutes[persona] || formatRoutes.default;
  if (!generator) {
    throw new Error(`No generator found for format: ${format}, persona: ${persona}`);
  }

  return generator(config);
}