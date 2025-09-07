import OpenAI from 'openai';
import { createQuizJob } from '@/lib/database';
import { MasterPersonas } from '@/lib/personas';
import { getAccountConfig } from '@/lib/accounts';
import { generatePrompt, type JobConfig } from './promptGenerator';
import { parseAndValidateResponse, generateContentHash } from './contentValidator';
import { selectFormatForContent, getFormat, type FormatSelectionContext, type FormatType } from '@/lib/formats';

const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export interface GenerationJobConfig extends JobConfig {
  // Format selection options
  preferredFormat?: FormatType;
  previousFormats?: FormatType[];
  targetEngagement?: 'educational' | 'entertaining' | 'interactive' | 'practical';
}

export interface GenerationResult {
  id: string;
  accountId: string;
  formatType: FormatType;
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
    
    // Select format for this content
    const formatSelectionContext: FormatSelectionContext = {
      accountId: jobConfig.accountId,
      persona: jobConfig.persona,
      topic: jobConfig.topic,
      previousFormats: jobConfig.previousFormats,
      targetEngagement: jobConfig.targetEngagement
    };
    
    const selectedFormat = jobConfig.preferredFormat || selectFormatForContent(formatSelectionContext);
    const formatDefinition = getFormat(selectedFormat, jobConfig.accountId, jobConfig.persona);
    
    if (!formatDefinition) {
      console.warn(`Format ${selectedFormat} not found for account ${jobConfig.accountId}, falling back to MCQ`);
    }

    // Create enhanced job config with format information
    const enhancedJobConfig: GenerationJobConfig = {
      ...jobConfig,
      preferredFormat: selectedFormat,
      formatDefinition
    };
    
    // Generate format-aware prompt and get variation markers
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

    // Parse and validate the response with format context
    const validationResult = parseAndValidateResponse(content, jobConfig.persona, selectedFormat);
    if (!validationResult.success || !validationResult.data) {
      throw new Error(`Validation failed: ${validationResult.error}`);
    }

    const contentData = validationResult.data;

    // Construct the payload for database insertion
    const topicKey = jobConfig.topic;
    const personaData = MasterPersonas[jobConfig.persona];
    const topicData = personaData?.subCategories?.find(sub => sub.key === topicKey);

    // Create frame sequence based on format
    const frameSequence = formatDefinition?.frames.map(frame => ({
      type: frame.type,
      title: frame.title,
      duration: frame.duration
    })) || [];

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
      
      // Format tracking fields
      format_type: selectedFormat,
      frame_sequence: frameSequence,
      format_metadata: {
        frameCount: formatDefinition?.frameCount || 5,
        totalDuration: formatDefinition?.timing.totalDuration || 15,
        formatVersion: '1.0',
        selectedAt: Date.now()
      },
      
      data: {
        content: contentData,
        formatType: selectedFormat, // Also store in data for compatibility
        variation_markers: {
          time_marker: timeMarker,
          token_marker: tokenMarker,
          generation_timestamp: Date.now(),
          content_hash: generateContentHash(contentData)
        }
      }
    };

    const jobId = await createQuizJob(jobPayload);

    console.log(`[Job ${jobId}] ✅ Created ${account.name} ${selectedFormat} content for persona "${jobConfig.persona}" [${timeMarker}-${tokenMarker}]`);
    
    return { 
      id: jobId, 
      accountId: account.id,
      formatType: selectedFormat,
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