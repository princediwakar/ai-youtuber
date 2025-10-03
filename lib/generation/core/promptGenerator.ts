/**
 * Prompt generation service
 * Orchestrates the creation of AI prompts for different content types
 */

import { MasterPersonas } from '../../personas';
import { generateSSCMCQPrompt, generateSSCCurrentAffairsPrompt } from '../personas/ssc/prompts';
import { generateAstronomyPrompt } from '../personas/astronomy/prompts';
import {
  generateVariationMarkers,
  generateBrainHealthPrompt,
  generateEyeHealthPrompt,
  generateEnglishPrompt,
  generateFormatPrompt,
  addJsonFormatInstructions,
  type PromptConfig
} from '../routing/promptRouter';
import type { AIAnalyticsInsights } from '../../analytics/insightsService';
import { 
  generateTopicWeights, 
  getTimingContext, 
  getOptimalFormat,
  enhancePromptWithTiming,
  selectOptimalTopic,
  enhanceCTA
} from '../shared/analyticsOptimizer';

export interface JobConfig {
  persona: string;
  topic: string;
  accountId: string;
  generationDate: string | Date;
  // Format support
  preferredFormat?: string;
  formatDefinition?: any;
  // Layout support
  preferredLayout?: string;
  // Analytics enhancement
  analyticsInsights?: AIAnalyticsInsights;
  uploadHour?: number; // IST hour for timing-aware prompts
}

export interface GeneratedPrompt {
  prompt: string;
  markers: {
    timeMarker: string;
    tokenMarker: string;
  };
}

/**
 * Generates a highly specific AI prompt based on the job's persona and configuration
 * Enhanced with analytics-driven optimization for improved performance
 */
export async function generatePrompt(jobConfig: JobConfig): Promise<GeneratedPrompt> {
  const { persona, topic, analyticsInsights, uploadHour } = jobConfig;
  const markers = generateVariationMarkers();
  
  // Get timing context for prompt optimization
  const timingContext = getTimingContext(uploadHour);
  
  // Generate analytics-driven weights for topic selection
  const topicWeights = generateTopicWeights(analyticsInsights);
  
  const personaData = MasterPersonas[persona];
  let selectedTopic = topic;
  
  // If we have topic options and analytics, use weighted selection
  if (personaData?.subCategories && topicWeights.length > 0) {
    const availableTopics = personaData.subCategories.map(sub => sub.key);
    if (availableTopics.includes(topic)) {
      selectedTopic = selectOptimalTopic(availableTopics, topicWeights);
      console.log(`[Analytics] Topic selection: ${topic} -> ${selectedTopic} (${timingContext.timeOfDay})`);
    }
  }
  
  const topicData = personaData?.subCategories?.find(sub => sub.key === selectedTopic);

  let prompt = '';
  
  const promptConfig: PromptConfig = {
    persona,
    topic: selectedTopic, // Use analytics-optimized topic
    topicData,
    markers,
    format: jobConfig.preferredFormat || jobConfig.preferredLayout,
    formatDefinition: jobConfig.formatDefinition,
    // Pass timing and analytics context
    timingContext,
    analyticsInsights
  };
  
  // Use format-aware prompt generation for new formats or layouts
  // This handles the weighted layout selection from generationService.ts
  if ((jobConfig.preferredFormat && jobConfig.preferredFormat !== 'mcq') || 
      (jobConfig.preferredLayout && jobConfig.preferredLayout !== 'mcq')) {
    prompt = generateFormatPrompt(promptConfig);
    // For new formats, we don't need the legacy JSON formatting
    return { prompt, markers };
  }
  
  // Legacy format generation for MCQ
  if (persona === 'brain_health_tips' || persona === 'eye_health_tips') {
    if (!topicData) {
      throw new Error(`Topic "${topic}" not found for persona "${persona}"`);
    }
    
    // Use analytics-driven format selection or default to multiple_choice
    const questionFormat = getOptimalFormat(analyticsInsights, 'multiple_choice');
    
    promptConfig.questionFormat = questionFormat;
    
    if (persona === 'brain_health_tips') {
      prompt = generateBrainHealthPrompt(promptConfig);
    } else {
      prompt = generateEyeHealthPrompt(promptConfig);
    }
    
    prompt = addJsonFormatInstructions(prompt, questionFormat);
  }
  // English content generation
  else if (persona === 'english_vocab_builder') {
    prompt = generateEnglishPrompt(promptConfig);
    
    // Use analytics-driven format selection or default to multiple_choice
    const questionFormat = getOptimalFormat(analyticsInsights, 'multiple_choice');
    
    prompt = addJsonFormatInstructions(prompt, questionFormat);
  }
  else if (persona === 'ssc_shots') {
    // Check if this is a current affairs topic that needs RSS content
    if (selectedTopic === 'ssc_current_affairs') {
      prompt = await generateSSCCurrentAffairsPrompt(promptConfig);
    } else {
      prompt = generateSSCMCQPrompt(promptConfig);
    }
    
    // Use analytics-driven format selection or default to multiple_choice
    const questionFormat = getOptimalFormat(analyticsInsights, 'multiple_choice');
    
    prompt = addJsonFormatInstructions(prompt, questionFormat);
  }
  else if (persona === 'space_facts_quiz') {
    prompt = generateAstronomyPrompt(promptConfig);
    
    // Astronomy content uses multiple choice format
    const questionFormat = 'multiple_choice';
    
    prompt = addJsonFormatInstructions(prompt, questionFormat);
  }
  else {
    throw new Error(`Unsupported persona: ${persona}`);
  }

  // Apply timing-aware enhancements to the generated prompt
  if (timingContext) {
    prompt = enhancePromptWithTiming(prompt, timingContext);
    console.log(`[Analytics] Applied ${timingContext.timeOfDay} timing enhancements (${timingContext.energy} energy)`);
  }

  return {
    prompt,
    markers
  };
}