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
} from './shared/promptUtils';

// Import persona-specific prompts
import { 
  generateEnglishPrompt,
  generateCommonMistakePrompt,
  generateQuickFixPrompt,
  generateUsageDemoPrompt
} from './personas/englishPrompts';

import { 
  generateBrainHealthPrompt,
  generateEyeHealthPrompt,
  generateQuickTipPrompt,
  generateBeforeAfterPrompt,
  generateChallengePrompt
} from './personas/healthPrompts';

import { 
  generateSSCExamPrompt,
  generateSSCCommonMistakePrompt,
  generateSSCQuickTipPrompt,
  generateSSCUsageDemoPrompt,
  generateSSCChallengePrompt
} from './personas/sscPrompts';

import {
  generateAstronomyPrompt
} from './personas/astronomyPrompts';

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
  generateBeforeAfterPrompt,
  generateChallengePrompt
};

/**
 * Main format-aware prompt generator - routes to appropriate persona functions
 */
export function generateFormatPrompt(config: PromptConfig): string {
  const format = config.format || 'mcq';
  const persona = config.persona;

  switch (format) {
    case 'common_mistake':
      if (persona === 'ssc_shots') {
        return generateSSCCommonMistakePrompt(config);
      } else {
        return generateCommonMistakePrompt(config);
      }
    case 'quick_fix':
      return generateQuickFixPrompt(config);
    case 'usage_demo':
      if (persona === 'ssc_shots') {
        return generateSSCUsageDemoPrompt(config);
      } else {
        return generateUsageDemoPrompt(config);
      }
    case 'challenge':
      if (persona === 'ssc_shots') {
        return generateSSCChallengePrompt(config);
      } else {
        return generateChallengePrompt(config);
      }
    case 'quick_tip':
      if (persona === 'ssc_shots') {
        return generateSSCQuickTipPrompt(config);
      } else {
        return generateQuickTipPrompt(config);
      }
    case 'before_after':
      return generateBeforeAfterPrompt(config);
    case 'mcq':
    default:
      // Route to appropriate persona for MCQ format
      if (config.persona === 'brain_health_tips') {
        return generateBrainHealthPrompt(config);
      } else if (config.persona === 'eye_health_tips') {
        return generateEyeHealthPrompt(config);
      } else if (config.persona === 'english_vocab_builder') {
        return generateEnglishPrompt(config);
      } else if (config.persona === 'ssc_shots') {
        return generateSSCExamPrompt(config);
      } else if (config.persona === 'space_facts_quiz') {
        return generateAstronomyPrompt(config);
      } else {
        return generateEnglishPrompt(config); // Default fallback
      }
  }
}