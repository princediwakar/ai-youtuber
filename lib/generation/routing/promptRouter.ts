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
 * Cleaner approach than nested if-else statements with flexible typing
 * Not all personas support all formats, so we use Partial for flexibility
 */
const FORMAT_PERSONA_ROUTES: Record<FormatType, Partial<Record<PersonaType, PromptGenerator>> & { default: PromptGenerator }> = {
  common_mistake: {
    ssc_shots: generateSSCCommonMistakePrompt,
    default: generateCommonMistakePrompt
  },
  quick_fix: {
    default: generateQuickFixPrompt
  },
  usage_demo: {
    ssc_shots: generateSSCUsageDemoPrompt,
    default: generateUsageDemoPrompt
  },
  challenge: {
    ssc_shots: generateSSCChallengePrompt,
    default: generateChallengePrompt
  },
  quick_tip: {
    ssc_shots: generateSSCQuickTipPrompt,
    default: generateQuickTipPrompt
  },
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
 * Now uses lookup table with strict typing for better maintainability and type safety
 */
export function generateFormatPrompt(config: PromptConfig): string {
  const format = (config.format || 'mcq') as FormatType;
  const persona = config.persona as PersonaType;

  const formatRoutes = FORMAT_PERSONA_ROUTES[format];
  if (!formatRoutes) {
    // Fallback to MCQ if format not found
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