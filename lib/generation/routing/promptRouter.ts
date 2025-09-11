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
  generateSSCExamPrompt,
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
 * SIMPLIFIED: Focus on proven MCQ format only based on analytics
 * Complex formats (quick_fix, common_mistake, etc.) showed 0% engagement
 * MCQ format shows 1.26% engagement rate - our only working format
 */
const FORMAT_PERSONA_ROUTES: Record<FormatType, Partial<Record<PersonaType, PromptGenerator>> & { default: PromptGenerator }> = {
  // DISABLED: All complex formats showing 0% engagement in analytics
  common_mistake: {
    default: generateEnglishPrompt // Force MCQ fallback
  },
  quick_fix: {
    default: generateEnglishPrompt // Force MCQ fallback
  },
  usage_demo: {
    default: generateEnglishPrompt // Force MCQ fallback
  },
  challenge: {
    default: generateEnglishPrompt // Force MCQ fallback
  },
  quick_tip: {
    default: generateEnglishPrompt // Force MCQ fallback
  },
  // ENABLED: Only proven MCQ format (1.26% engagement)
  mcq: {
    brain_health_tips: generateBrainHealthPrompt,
    eye_health_tips: generateEyeHealthPrompt,
    english_vocab_builder: generateEnglishPrompt,
    ssc_shots: generateSSCExamPrompt,
    space_facts_quiz: generateAstronomyPrompt,
    default: generateEnglishPrompt
  }
};

/**
 * Main format-aware prompt generator - routes to appropriate persona functions
 * ANALYTICS-DRIVEN: Forces MCQ format based on engagement data
 * MCQ = 1.26% engagement, all other formats = 0% engagement
 */
export function generateFormatPrompt(config: PromptConfig): string {
  // FORCE MCQ FORMAT - analytics show it's the only format that works
  const format = 'mcq' as FormatType; // Override any requested format
  const persona = config.persona as PersonaType;

  console.log(`🎯 Analytics override: forcing MCQ format for ${persona} (original format: ${config.format || 'mcq'})`);

  const formatRoutes = FORMAT_PERSONA_ROUTES[format];
  if (!formatRoutes) {
    // This should never happen since we're forcing MCQ, but safety fallback
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