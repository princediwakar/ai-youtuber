/**
 * Generic topic guidelines for content generation
 * NOTE: Most topic guidelines have been moved to individual persona files for better organization.
 * This file now contains only shared/fallback guidelines.
 */

export interface TopicGuideline {
  focus: string;
  hook: string;
  scenarios: string[];
  engagement: string;
}

/**
 * Generic fallback guidelines for topics not found in persona-specific files
 * Most content has been moved to individual persona files for better maintainability
 */
export const TOPIC_GUIDELINES: Record<string, TopicGuideline> = {
  // Generic fallback patterns for any topic that doesn't have specific guidelines
  default: {
    focus: 'Core concepts that provide immediate practical value',
    hook: 'Learn something new that makes a difference',
    scenarios: ['daily application', 'practical use', 'real-world situations'],
    engagement: 'Apply this knowledge immediately'
  },

  // Keep only truly shared patterns that might be used across multiple personas
  quick_tip_generic: {
    focus: 'One actionable tip that provides immediate results',
    hook: 'This simple change makes a big difference',
    scenarios: ['daily routine', 'immediate application', 'practical use'],
    engagement: 'Try this tip right now'
  },

  myth_buster_generic: {
    focus: 'One popular belief that is actually completely wrong',
    hook: 'This "fact" everyone believes is totally false',
    scenarios: ['common misconceptions', 'popular beliefs', 'widespread myths'],
    engagement: 'Share this truth to surprise others'
  }
};