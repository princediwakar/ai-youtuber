/**
 * Main entry point for the prompt generation system
 * Clean exports for external consumption
 */

// Core functionality
export { generateAndStoreContent, type GenerationResult, type GenerationJobConfig } from './core/generationService';
export { generatePrompt, type JobConfig } from './core/promptGenerator';
export { parseAndValidateResponse, generateContentHash } from './core/contentValidator';

// Routing system
export { generateFormatPrompt } from './routing/promptRouter';

// Shared utilities and types
export * from './shared/types';
export { generateVariationMarkers, addJsonFormatInstructions } from './shared/utils';
export { ContentComponents } from './shared/components';

// Persona-specific exports (for direct access if needed)
export * from './personas/english/prompts';
export * from './personas/health/prompts';
export * from './personas/ssc/prompts';
export * from './personas/astronomy/prompts';