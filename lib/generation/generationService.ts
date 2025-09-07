import OpenAI from 'openai';
import { createQuizJob } from '@/lib/database';
import { MasterPersonas } from '@/lib/personas';
import { getAccountConfig } from '@/lib/accounts';
import { generatePrompt, type JobConfig } from './promptGenerator';
import { parseAndValidateResponse, generateContentHash } from './contentValidator';
import { LayoutType } from '@/lib/visuals/layouts/layoutSelector';

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
 * Maps personas to their appropriate layout types
 */
const PERSONA_LAYOUT_MAP: Record<string, LayoutType[]> = {
  'english_vocab_builder': ['mcq'],
  'brain_health_tips': ['quick_tip', 'before_after'],
  'eye_health_tips': ['quick_tip', 'before_after'],
};

/**
 * Selects an appropriate layout for the given persona
 */
function selectLayoutForPersona(persona: string, preferredLayout?: LayoutType): LayoutType {
  const availableLayouts = PERSONA_LAYOUT_MAP[persona] || ['mcq'];
  
  // If a preferred layout is specified and it's valid for this persona, use it
  if (preferredLayout && availableLayouts.includes(preferredLayout)) {
    return preferredLayout;
  }
  
  // Otherwise, randomly select from available layouts for this persona
  const randomIndex = Math.floor(Math.random() * availableLayouts.length);
  return availableLayouts[randomIndex];
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
 * Now supports both English quizzes and Health tips with format selection.
 */
export async function generateAndStoreContent(
  jobConfig: GenerationJobConfig
): Promise<GenerationResult | null> {
  try {
    // Get account configuration using the provided accountId
    const account = await getAccountConfig(jobConfig.accountId);
    
    // Select appropriate layout for this persona
    const selectedLayout: LayoutType = selectLayoutForPersona(jobConfig.persona, jobConfig.preferredLayout);
    
    // Create enhanced job config with layout information
    const enhancedJobConfig: GenerationJobConfig = {
      ...jobConfig,
      preferredLayout: selectedLayout,
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
      question_format: contentData.question_type || 'multiple_choice',
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
        content: contentData,
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