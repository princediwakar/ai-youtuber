import OpenAI from 'openai';
import { createQuizJob } from '@/lib/database';
import { MasterPersonas } from '@/lib/personas';
import { getAccountConfig } from '@/lib/accounts';
import { generatePrompt, type JobConfig } from './promptGenerator';
import { parseAndValidateResponse, generateContentHash } from './contentValidator';

const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export interface GenerationJobConfig extends JobConfig {
  // Additional config properties can be added here
}

export interface GenerationResult {
  id: string;
  accountId: string;
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
 * Now supports both English quizzes and Health tips.
 */
export async function generateAndStoreContent(
  jobConfig: GenerationJobConfig
): Promise<GenerationResult | null> {
  try {
    // Get account configuration using the provided accountId
    const account = await getAccountConfig(jobConfig.accountId);
    
    // Generate prompt and get variation markers
    const promptResult = await generatePrompt(jobConfig);
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
    const validationResult = parseAndValidateResponse(content, jobConfig.persona);
    if (!validationResult.success || !validationResult.data) {
      throw new Error(`Validation failed: ${validationResult.error}`);
    }

    const contentData = validationResult.data;

    // Construct the payload for database insertion
    const topicKey = jobConfig.topic;
    const personaData = MasterPersonas[jobConfig.persona];
    const topicData = personaData?.subCategories?.find(sub => sub.key === topicKey);

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
      account_id: account.id, // Add account tracking
      data: {
        content: contentData,
        variation_markers: {
          time_marker: timeMarker,
          token_marker: tokenMarker,
          generation_timestamp: Date.now(),
          content_hash: generateContentHash(contentData)
        }
      }
    };

    const jobId = await createQuizJob(jobPayload);

    console.log(`[Job ${jobId}] ✅ Created ${account.name} content for persona "${jobConfig.persona}" [${timeMarker}-${tokenMarker}]`);
    
    return { 
      id: jobId, 
      accountId: account.id,
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