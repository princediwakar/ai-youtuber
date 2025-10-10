// lib/generation/routing/promptRouter.ts
/**
 * Prompt router for content generation
 * Routes to persona-specific prompt templates for better maintainability
 */

// Import shared utilities
import {
  VariationMarkers,
  PromptConfig,
  generateVariationMarkers,
  addJsonFormatInstructions,
  QuestionFormatType
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
} from '../personas/health/prompts';

import {
  generateSSCMCQPrompt,
  generateSSCCurrentAffairsPrompt, // Needed for async routing
  generateSSCQuickTipPrompt,
} from '../personas/ssc/prompts';

import {
  generateAstronomyPrompt
} from '../personas/astronomy/prompts';

// Import types
import type { PersonaType, FormatType, PromptGenerator } from '../shared/types';

// Re-export shared utilities and types
export type { VariationMarkers, PromptConfig, QuestionFormatType };
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
};

/**
* FIX: Centralized Format and Persona Routing Lookup Table (PROMPT_ROUTE_CONFIG)
* This is the single source of truth for mapping formats/personas to generator functions.
*/
const PROMPT_ROUTE_CONFIG: Record<FormatType, Partial<Record<PersonaType, PromptGenerator>> & { default: PromptGenerator }> = {
  simplified_word: {
      english_vocab_builder: generateSimplifiedWordPrompt,
      default: generateSimplifiedWordPrompt
  },
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

  quick_tip: {
      brain_health_tips: generateQuickTipPrompt,
      eye_health_tips: generateQuickTipPrompt,
      english_vocab_builder: generateQuickTipPrompt,
      ssc_shots: generateSSCQuickTipPrompt,
      space_facts_quiz: generateAstronomyPrompt,
      default: generateQuickTipPrompt
  },
  mcq: {
    brain_health_tips: generateBrainHealthPrompt,
    eye_health_tips: generateEyeHealthPrompt,
    english_vocab_builder: generateEnglishPrompt,
    // FIX: Handle SSC Current Affairs within the centralized routing table
    ssc_shots: async (config) => { // <--- This function returns Promise<string>
         if (config.topic === 'ssc_current_affairs') {
            return await generateSSCCurrentAffairsPrompt(config);
        }
        return generateSSCMCQPrompt(config);
    },
    space_facts_quiz: generateAstronomyPrompt,
    default: generateEnglishPrompt
}
};

/**
* SIMPLIFIED Format Rotation Strategy - ONLY formats that work
* Based on analytics: quick_tip (80 avg views) and mcq (54 avg views)
* Removed: common_mistake, quick_fix, usage_demo, simplified_word (zero engagement)
*/
const FORMAT_ROTATION: Record<PersonaType, FormatType[]> = {
  english_vocab_builder: ['mcq', 'quick_tip'],
  brain_health_tips: ['quick_tip', 'mcq'], // Quick tip performs better
  eye_health_tips: ['quick_tip', 'mcq'], // Quick tip performs better
  ssc_shots: ['mcq', 'quick_tip'],
  space_facts_quiz: ['mcq', 'quick_tip']
};

/**
* Main format-aware prompt generator - routes to appropriate persona functions
* FIX: Function is now async to support generators like generateSSCCurrentAffairsPrompt.
*/
export async function generateFormatPrompt(config: PromptConfig): Promise<string> {
  let format = config.format as FormatType;
  const persona = config.persona as PersonaType;
  
  const SIX_HOURS_IN_MS = 1000 * 60 * 60 * 6; // FIX: Constant for rotation period

  // If no format specified, use rotation strategy for balanced testing
  if (!format) {
      const rotationFormats = FORMAT_ROTATION[persona] || ['mcq', 'simplified_word'];
      const rotationIndex = Math.floor(Date.now() / SIX_HOURS_IN_MS) % rotationFormats.length; 
      format = rotationFormats[rotationIndex];
      console.log(`🔄 Format rotation: Using ${format} for ${persona} (${rotationIndex + 1}/${rotationFormats.length})`);
  } else {
      console.log(`✅ Using requested format: ${format} for ${persona}`);
  }

  const formatRoutes = PROMPT_ROUTE_CONFIG[format];
  if (!formatRoutes) {
      // Fallback to proven MCQ if format not found
      const mcqRoutes = PROMPT_ROUTE_CONFIG.mcq;
      const generator = mcqRoutes[persona] || mcqRoutes.default;
      return generator(config);
  }

  const generator = formatRoutes[persona] || formatRoutes.default;
  if (!generator) {
      // This is a configuration error: the persona is missing from the format map
      throw new Error(`No generator found for format: ${format}, persona: ${persona}`);
  }

  // FIX: Await the generator result as it might be an async function (like the SSC one)
  return await generator(config); 
}