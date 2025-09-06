/**
 * Format Selection Rules for Multi-Account System
 * Defines which formats are available for each account/persona combination
 * and their selection weights
 */

import { AccountFormatRules, FormatType } from './types';

export const formatRules: AccountFormatRules = {
  'english_shots': {
    'english_vocab_builder': {
      formats: ['mcq', 'common_mistake', 'quick_fix'],
      weights: { 
        mcq: 0.5,              // 50% - Keep MCQ as primary format for stability
        common_mistake: 0.3,    // 30% - High engagement, addresses pain points
        quick_fix: 0.2         // 20% - Quick wins, vocabulary upgrades
      },
      fallback: 'mcq'
    }
  },
  'health_shots': {
    'brain_health_tips': {
      formats: ['mcq', 'quick_tip', 'before_after'],
      weights: { 
        mcq: 0.4,              // 40% - Educational foundation
        quick_tip: 0.4,        // 40% - High practical value
        before_after: 0.2      // 20% - Emotional engagement
      },
      fallback: 'mcq'
    },
    'eye_health_tips': {
      formats: ['mcq', 'quick_tip', 'before_after'],
      weights: { 
        mcq: 0.5,              // 50% - More educational focus for eye health
        quick_tip: 0.3,        // 30% - Practical tips
        before_after: 0.2      // 20% - Consequence awareness
      },
      fallback: 'mcq'
    }
  }
};

// Topic-to-format preference mapping
export const topicFormatPreferences: { [topic: string]: FormatType[] } = {
  // English topics that work well with specific formats
  'eng_vocab_confusing_words': ['common_mistake', 'mcq'],
  'eng_vocab_register': ['quick_fix', 'common_mistake', 'mcq'],
  'eng_vocab_synonyms': ['quick_fix', 'mcq'],
  'eng_vocab_shades_of_meaning': ['quick_fix', 'mcq'],
  'eng_vocab_antonyms': ['mcq', 'quick_fix'],
  'eng_vocab_phrases': ['common_mistake', 'mcq'],
  'eng_vocab_idioms': ['mcq'],

  // Health topics that work well with specific formats
  'memory_techniques': ['quick_tip', 'mcq'],
  'focus_tips': ['quick_tip', 'before_after', 'mcq'],
  'brain_food': ['mcq', 'quick_tip'],
  'mental_exercises': ['quick_tip', 'mcq'],
  'brain_lifestyle': ['before_after', 'quick_tip', 'mcq'],
  'screen_protection': ['before_after', 'quick_tip', 'mcq'],
  'eye_exercises': ['quick_tip', 'mcq'],
  'vision_nutrition': ['mcq', 'quick_tip'],
  'eye_care_habits': ['before_after', 'quick_tip', 'mcq'],
  'workplace_vision': ['before_after', 'quick_tip', 'mcq']
};

// Get format preferences for a specific topic
export function getTopicFormatPreferences(topic: string): FormatType[] {
  return topicFormatPreferences[topic] || [];
}

// Check if a format is suitable for a topic
export function isFormatSuitableForTopic(format: FormatType, topic: string): boolean {
  const preferences = getTopicFormatPreferences(topic);
  return preferences.length === 0 || preferences.includes(format);
}

// Get account rules for a specific persona
export function getAccountRulesForPersona(accountId: string, persona: string) {
  return formatRules[accountId]?.[persona];
}

// Validate format selection against rules
export function validateFormatSelection(accountId: string, persona: string, format: FormatType): boolean {
  const rules = getAccountRulesForPersona(accountId, persona);
  return rules ? rules.formats.includes(format) : false;
}