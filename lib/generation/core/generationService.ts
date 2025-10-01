import OpenAI from 'openai';
import { createQuizJob } from '@/lib/database';
import { MasterPersonas } from '@/lib/personas';
import { getAccountConfig } from '@/lib/accounts';
import { generatePrompt, type JobConfig } from './promptGenerator';
import { parseAndValidateResponse, generateContentHash } from './contentValidator';
import { LayoutType } from '@/lib/visuals/layouts/layoutSelector';
import { analyticsService, type AIAnalyticsInsights } from '../../analyticsService';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '@/lib/config';

// ANALYTICS: Track hook patterns from highest-performing videos
const HIGH_ENGAGEMENT_HOOK_PATTERNS = [
  'this 30-second habit will boost',
  'you\'ve been using this word wrong',
  '90% of people say this word wrong',
  'stop embarrassing yourself',
  'upgrade your vocabulary in 15 seconds',
  'never misspell this tricky word again'
];

/**
 * ANALYTICS-DRIVEN: Extract hook effectiveness patterns
 */
function analyzeHookEffectiveness(content: any): { hookPattern: string; estimatedEffectiveness: 'high' | 'medium' | 'low' } {
  const hookText = content.hook || content.question || '';
  const lowerHook = hookText.toLowerCase();
  
  // Check against high-performing patterns
  for (const pattern of HIGH_ENGAGEMENT_HOOK_PATTERNS) {
    if (lowerHook.includes(pattern)) {
      return { hookPattern: pattern, estimatedEffectiveness: 'high' };
    }
  }
  
  // Simple heuristics for medium/low effectiveness
  if (lowerHook.includes('did you know') || lowerHook.includes('which word')) {
    return { hookPattern: 'standard_question', estimatedEffectiveness: 'medium' };
  }
  
  return { hookPattern: 'generic', estimatedEffectiveness: 'low' };
}

const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});


export interface GenerationJobConfig extends JobConfig {
  // Layout selection options
  preferredLayout?: LayoutType;
  previousLayouts?: LayoutType[];
  targetEngagement?: 'educational' | 'entertaining' | 'interactive' | 'practical';
}

/**
 * ANALYTICS-DRIVEN: Force MCQ layout only
 * Analytics show MCQ = 1.26% engagement, all other formats = 0% engagement
 */
const PERSONA_LAYOUT_MAP: Record<string, LayoutType[]> = {
  'english_vocab_builder': ['mcq'], // ANALYTICS: Best performing format (1.26% engagement)
  'brain_health_tips': ['mcq'],     // ANALYTICS: Only format showing any engagement
  'eye_health_tips': ['mcq'],       // ANALYTICS: All other formats failed
  'ssc_shots': ['mcq'],             // ANALYTICS: Force proven format
  'space_facts_quiz': ['mcq'],      // ANALYTICS: MCQ only approach
};

/**
 * ANALYTICS-DRIVEN: Always return MCQ layout
 * Data shows it's the only format that drives engagement
 */
function selectLayoutForPersona(persona: string, preferredLayout?: LayoutType): LayoutType {
  console.log(`🎯 Analytics override: forcing MCQ layout for ${persona} (requested: ${preferredLayout || 'none'})`);
  
  // HARD-CODED: Analytics prove MCQ is the only working format
  return 'mcq';
}

export interface GenerationResult {
  id: string;
  accountId: string;
  layoutType: LayoutType;
  variationMarkers: {
    timeMarker: string;
    tokenMarker: string;
  };
}

/**
 * AI client timeout configuration
 */
const AI_TIMEOUT = 30000; // 30 seconds


/**
 * The main service function that orchestrates the generation and storage of content.
 * Enhanced with analytics-driven optimization for improved performance.
 */
export async function generateAndStoreContent(
  jobConfig: GenerationJobConfig
): Promise<GenerationResult | null> {
  try {
    console.log(`🔄 [DEBUG] generateAndStoreContent called with:`, {
      persona: jobConfig.persona,
      accountId: jobConfig.accountId,
      topic: jobConfig.topic,
      preferredFormat: jobConfig.preferredFormat
    });
    
    // Get account configuration using the provided accountId
    const account = await getAccountConfig(jobConfig.accountId);
    
    // Get analytics insights for this persona (with fallback)
    let analyticsInsights: AIAnalyticsInsights | undefined;
    try {
      const analyticsResult = await analyticsService.analyzePerformanceWithAI(jobConfig.accountId, jobConfig.persona);
      analyticsInsights = analyticsResult.aiInsights;
      console.log(`[Analytics] Loaded insights for ${jobConfig.persona} (${jobConfig.accountId})`);
    } catch (error) {
      console.warn(`[Analytics] Could not load insights for ${jobConfig.persona}:`, error);
      // Continue without analytics insights
    }

    // Determine upload timing for prompt optimization
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC + 5:30
    const istTime = new Date(now.getTime() + istOffset);
    const uploadHour = istTime.getHours();
    
    // Select appropriate layout for this persona
    const selectedLayout: LayoutType = selectLayoutForPersona(jobConfig.persona, jobConfig.preferredLayout);
    
    // Create enhanced job config with layout and analytics information
    const enhancedJobConfig: GenerationJobConfig = {
      ...jobConfig,
      preferredLayout: selectedLayout,
      analyticsInsights,
      uploadHour,
    };
    
    // Generate prompt and get variation markers
    const promptResult = await generatePrompt(enhancedJobConfig);
    const { timeMarker, tokenMarker } = promptResult.markers;

    // Call AI service
    const response = await deepseekClient.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: promptResult.prompt }],
      temperature: 0.8,
    }, {
      timeout: AI_TIMEOUT,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('AI returned no content.');
    }

    // Parse and validate the response
    const validationResult = parseAndValidateResponse(content, jobConfig.persona, selectedLayout);
    if (!validationResult.success || !validationResult.data) {
      throw new Error(`Validation failed: ${validationResult.error}`);
    }

    const contentData = validationResult.data;

    // ANALYTICS: Track hook effectiveness for optimization
    const hookAnalysis = analyzeHookEffectiveness(contentData);
    console.log(`🎯 Hook analysis for ${jobConfig.persona}: ${hookAnalysis.hookPattern} (${hookAnalysis.estimatedEffectiveness} effectiveness)`);
    
    // Add hook analysis to content data for future reference
    const enhancedContentData = {
      ...contentData,
      hookAnalysis: hookAnalysis,
      layoutType: selectedLayout, // Ensure layout type is tracked
    };

    // Construct the payload for database insertion
    const topicKey = jobConfig.topic;
    const personaData = MasterPersonas[jobConfig.persona];
    const topicData = personaData?.subCategories?.find(sub => sub.key === topicKey);

    // Frame sequence will be determined by layout detection in frameService
    const frameSequence: any[] = [];

    const jobPayload = {
      persona: jobConfig.persona,
      generation_date: jobConfig.generationDate instanceof Date 
        ? jobConfig.generationDate.toISOString() 
        : jobConfig.generationDate,
      topic: topicKey,
      topic_display_name: topicData?.displayName || topicKey,
      question_format: contentData.content_type || contentData.question_type || selectedLayout,
      step: 2, // Next step is frame creation
      status: 'frames_pending',
      account_id: account.id,
      
      // Layout tracking fields
      format_type: selectedLayout, // Keep for compatibility
      frame_sequence: frameSequence,
      layout_metadata: {
        layoutType: selectedLayout,
        detectedAtGeneration: true,
        generatedAt: Date.now()
      },
      
      data: {
        content: enhancedContentData,
        layoutType: selectedLayout, // Store layout type for compatibility
        variation_markers: {
          time_marker: timeMarker,
          token_marker: tokenMarker,
          generation_timestamp: Date.now(),
          content_hash: generateContentHash(contentData)
        }
      }
    };

    const jobId = await createQuizJob(jobPayload);

    console.log(`[Job ${jobId}] ✅ Created ${account.name} ${selectedLayout} content for persona "${jobConfig.persona}" [${timeMarker}-${tokenMarker}]`);
    
    return { 
      id: jobId, 
      accountId: account.id,
      layoutType: selectedLayout,
      variationMarkers: { timeMarker, tokenMarker } 
    };

  } catch (error) {
    console.error(`❌ Failed to create content for persona "${jobConfig.persona}":`, error);
    return null;
  }
}

/**
 * Legacy wrapper function for backward compatibility
 * @deprecated Use generateAndStoreContent instead
 */
export async function generateAndStoreQuiz(jobConfig: GenerationJobConfig): Promise<GenerationResult | null> {
  return generateAndStoreContent(jobConfig);
}