/**
 * Prompt generation service
 * Orchestrates the creation of AI prompts for different content types
 */

import { MasterPersonas } from '../personas';
import {
  generateVariationMarkers,
  generateBrainHealthPrompt,
  generateEyeHealthPrompt,
  generateEnglishPrompt,
  addJsonFormatInstructions,
  type PromptConfig
} from './promptTemplates';

export interface JobConfig {
  persona: string;
  topic: string;
  accountId: string;
  generationDate: string | Date;
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
 */
export async function generatePrompt(jobConfig: JobConfig): Promise<GeneratedPrompt> {
  const { persona, topic } = jobConfig;
  const markers = generateVariationMarkers();
  
  const personaData = MasterPersonas[persona];
  const topicData = personaData?.subCategories?.find(sub => sub.key === topic);

  let prompt = '';
  
  const promptConfig: PromptConfig = {
    persona,
    topic,
    topicData,
    markers
  };
  
  // Health content generation
  if (persona === 'brain_health_tips' || persona === 'eye_health_tips') {
    if (!topicData) {
      throw new Error(`Topic "${topic}" not found for persona "${persona}"`);
    }
    
    // Add format randomization for health content (70% multiple choice, 30% true/false)
    const rand = Math.random();
    const questionFormat = rand < 0.7 ? 'multiple_choice' : 'true_false';
    
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
    
    const rand = Math.random();
    const questionFormat = rand < 0.85 ? 'multiple_choice' : (rand < 1 ? 'true_false' : 'assertion_reason');
    
    prompt = addJsonFormatInstructions(prompt, questionFormat);
  }
  else {
    throw new Error(`Unsupported persona: ${persona}`);
  }

  return {
    prompt,
    markers
  };
}