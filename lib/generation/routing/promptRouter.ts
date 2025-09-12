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
  generateSSCMCQPrompt,
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
 * ANALYTICS-DRIVEN: MCQ primary format (1.26% engagement) + Quick Tips for health (384 avg views)
 * Health Quick Tips showed breakthrough performance (1.2K views) - enabling for health personas only
 */
const FORMAT_PERSONA_ROUTES: Record<FormatType, Partial<Record<PersonaType, PromptGenerator>> & { default: PromptGenerator }> = {
  // DISABLED: Complex formats showing 0% engagement in analytics
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
  // ENABLED: Quick Tips for health personas only (384 avg views, 1.2K max views)
  quick_tip: {
    brain_health_tips: generateQuickTipPrompt,  // Health persona - use actual quick tip
    eye_health_tips: generateQuickTipPrompt,    // Health persona - use actual quick tip
    default: generateEnglishPrompt              // All other personas force MCQ
  },
  // ENABLED: Primary MCQ format (1.26% engagement)
  mcq: {
    brain_health_tips: generateBrainHealthPrompt,
    eye_health_tips: generateEyeHealthPrompt,
    english_vocab_builder: generateEnglishPrompt,
    ssc_shots: generateSSCMCQPrompt,
    space_facts_quiz: generateAstronomyPrompt,
    default: generateEnglishPrompt
  }
};

/**
 * Main format-aware prompt generator - routes to appropriate persona functions
 * ANALYTICS-DRIVEN: MCQ primary (1.26% engagement) + Health Quick Tips (1.2K views breakthrough)
 * Allows quick_tip format for health personas, forces MCQ for all others
 */
export function generateFormatPrompt(config: PromptConfig): string {
  const requestedFormat = config.format as FormatType || 'mcq';
  const persona = config.persona as PersonaType;
  
  // ANALYTICS LOGIC: Allow quick_tip for health personas, force MCQ for others
  let format = requestedFormat;
  
  if (requestedFormat === 'quick_tip') {
    // Check if this is a health persona
    const isHealthPersona = persona === 'brain_health_tips' || persona === 'eye_health_tips';
    
    if (isHealthPersona) {
      console.log(`✅ Allowing quick_tip format for health persona: ${persona} (1.2K views breakthrough format)`);
      // Keep quick_tip format - it works for health!
    } else {
      console.log(`🎯 Analytics override: forcing MCQ format for non-health persona: ${persona} (original format: ${requestedFormat})`);
      format = 'mcq'; // Force MCQ for non-health personas
    }
  } else if (requestedFormat !== 'mcq') {
    console.log(`🎯 Analytics override: forcing MCQ format for ${persona} (original format: ${requestedFormat})`);
    format = 'mcq'; // Force MCQ for all other non-working formats
  }

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