// lib/generation/shared/types.ts
/**
 * Shared TypeScript types for prompt generation system
 * Centralized type definitions for better maintainability
 */

import type { AIAnalyticsInsights, AnalyticsDataForAI } from '../../analytics/types'; // <-- Import AnalyticsDataForAI
import type { TimingContext } from './analyticsOptimizer';

export interface VariationMarkers {
  timeMarker: string;
  tokenMarker: string;
}

export interface PromptConfig {
  persona: string;
  topic: string;
  topicData: any;
  markers: VariationMarkers;
  questionFormat?: string;
  format?: string;
  formatDefinition?: any;
  // Analytics enhancement fields
  timingContext?: TimingContext;
  // FIX: Change AIAnalyticsInsights to AnalyticsDataForAI to include raw data like topPerformingTopics
  analyticsInsights?: AnalyticsDataForAI; 
}

export interface RandomizationElements {
  creativeSeed: string;
  approach: string;
  tone: string;
  perspective: string;
}

export interface ContextInjection {
  timeContext: string;
  demographic: string;
  urgency: string;
}

export interface TopicGuideline {
  focus: string;
  hook: string;
  scenarios: string[];
  engagement: string;
}

// Define strict types for routing
export type PersonaType = 
  | 'english_vocab_builder'
  | 'brain_health_tips' 
  | 'eye_health_tips'
  | 'ssc_shots'
  | 'space_facts_quiz';

export type FormatType = 
  | 'simplified_word'
  | 'mcq'
  | 'common_mistake'
  | 'quick_fix'
  | 'usage_demo'
  | 'quick_tip'

export type PromptGenerator = (config: PromptConfig) => string;