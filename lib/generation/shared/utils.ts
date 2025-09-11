/**
 * Shared utilities for prompt generation across all personas
 * Common functions, interfaces, and JSON formatting
 */

import { TOPIC_GUIDELINES } from './guidelines';
import { ContentComponents } from './components';
import type { 
  VariationMarkers, 
  PromptConfig, 
  RandomizationElements, 
  ContextInjection,
  TopicGuideline 
} from './types';

// Re-export types for convenience
export type { VariationMarkers, PromptConfig, RandomizationElements, ContextInjection, TopicGuideline };

/**
 * Generates unique variation markers for content diversity
 */
export function generateVariationMarkers(): VariationMarkers {
  const timestamp = Date.now();
  const timeMarker = `T${timestamp}`;
  const tokenMarker = `TK${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  return { timeMarker, tokenMarker };
}

/**
 * Generates randomization elements for prompt variation
 */
export function generateRandomizationElements(): RandomizationElements {
  const creativeSeed = Math.random().toString(36).substring(2, 8).toUpperCase();
  const approaches = ['scientific', 'practical', 'surprising', 'urgent', 'interactive'];
  const tones = ['authoritative', 'conversational', 'alarming', 'encouraging', 'investigative'];
  const perspectives = ['expert', 'researcher', 'practitioner', 'educator', 'investigator'];

  const randomApproach = approaches[Math.floor(Math.random() * approaches.length)];
  const randomTone = tones[Math.floor(Math.random() * tones.length)];
  const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];

  return {
    creativeSeed,
    approach: randomApproach,
    tone: randomTone,
    perspective: randomPerspective
  };
}

/**
 * Generates random context injections using centralized ContentComponents
 * Simplified to avoid duplication with contentComponents.ts
 */
export function generateContextInjections(persona?: string): ContextInjection {
  // Map persona patterns to standardized persona names for ContentComponents
  let standardizedPersona = 'default';
  
  if (persona?.includes('astronomy') || persona?.includes('space')) {
    standardizedPersona = 'space_facts_quiz';
  } else if (persona?.includes('health') || persona?.includes('brain')) {
    standardizedPersona = 'brain_health_tips';
  } else if (persona?.includes('eye')) {
    standardizedPersona = 'eye_health_tips';
  } else if (persona?.includes('english') || persona?.includes('vocab')) {
    standardizedPersona = 'english_vocab_builder';
  } else if (persona?.includes('ssc')) {
    standardizedPersona = 'ssc_shots';
  }

  return {
    timeContext: ContentComponents.getRandomContext(standardizedPersona),
    demographic: ContentComponents.getRandomDemographic(standardizedPersona),
    urgency: ContentComponents.getRandomUrgency(standardizedPersona)
  };
}

/**
 * Gets prompt variation based on current time
 */
export function getPromptVariation(): number {
  const hour = new Date().getHours();
  return hour % 3; // Creates 3 different prompt structures
}

/**
 * Gets topic guidelines for a given topic
 */
export function getTopicGuidelines(topic: string) {
  return TOPIC_GUIDELINES[topic];
}

/**
 * Adds JSON format instructions based on question format
 */
export function addJsonFormatInstructions(prompt: string, questionFormat: string): string {
  if (questionFormat === 'multiple_choice') {
    return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "hook", "content", "options" (an object with keys "A", "B", "C", "D"), "answer" (a single letter "A", "B", "C", or "D"), "explanation", "cta", and "content_type" (set to "multiple_choice"). Explanation must be under 120 characters.';
  } else if (questionFormat === 'true_false') {
    return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "hook", "content", "options" (an object with keys "A": "True", "B": "False"), "answer" (either "A" or "B"), "explanation", "cta", and "content_type" (set to "true_false"). Explanation must be under 120 characters.';
  } else if (questionFormat === 'assertion_reason') {
    return prompt + `\n\nCRITICAL: Generate an Assertion/Reason question. Format your response as a single, valid JSON object with these exact keys: "hook", "assertion", "reason", "options", "answer", "explanation", "cta", and "content_type" (set to "assertion_reason"). 

MANDATORY JSON STRUCTURE:
• "hook": A compelling hook to grab attention (under 25 characters).
• "assertion": A statement of fact.
• "reason": A statement explaining the assertion.
• "options": Must be the standard A/B/C/D object.
• "answer": A single letter "A", "B", "C", or "D".
• "explanation": Max 2 short sentences (under 120 characters).
• "cta": A short call-to-action text.`;
  }

  return prompt;
}

/**
 * Creates base prompt structure with role and strategy
 */
export function createBasePromptStructure(
  randomization: RandomizationElements, 
  contextInjection: ContextInjection, 
  promptVariation: number
): { expertRole: string; contentStrategy: string } {
  let expertRole = '';
  let contentStrategy = '';

  switch (promptVariation) {
    case 0:
      expertRole = `You are a ${randomization.perspective} with a ${randomization.tone} approach`;
      contentStrategy = `Take a ${randomization.approach} angle focusing on ${contextInjection.demographic}`;
      break;
    case 1:
      expertRole = `As an expert specializing in ${randomization.perspective} communication`;
      contentStrategy = `Use ${randomization.tone} language with ${randomization.approach} tips for ${contextInjection.timeContext}`;
      break;
    case 2:
      expertRole = `You're a specialist with ${randomization.tone} presentation style`;
      contentStrategy = `Focus on ${randomization.approach} methods targeting ${contextInjection.urgency} results`;
      break;
    default:
      expertRole = `You are a ${randomization.perspective} expert`;
      contentStrategy = `Use ${randomization.approach} approach with ${randomization.tone} tone`;
  }

  return { expertRole, contentStrategy };
}