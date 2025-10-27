// lib/generation/core/generationService.ts
import OpenAI from 'openai';
import { createQuizJob, query } from '@/lib/database';
import { MasterPersonas } from '@/lib/personas';
import { getAccountConfig } from '@/lib/accounts';
import { generatePrompt, type JobConfig } from './promptGenerator';
import { parseAndValidateResponse, generateContentHash } from './contentValidator';
import { generateVariationMarkers } from '../shared/utils';
import { LayoutType, getLayout } from '@/lib/visuals/layouts/layoutSelector';
import { analyticsInsightsService as analyticsService } from '../../analytics/insightsService';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '@/lib/config';


const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

/**
 * Check for duplicate content in recent jobs
 */
async function checkForDuplicateContent(contentHash: string, accountId: string, persona: string): Promise<boolean> {
  try {
    // Check for content with the same hash in the last 24 hours for this account/persona
    const result = await query(`
      SELECT id
      FROM quiz_jobs
      WHERE account_id = $1
        AND persona = $2
        AND data->'variation_markers'->>'content_hash' = $3
        AND created_at > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `, [accountId, persona, contentHash]);

    return result.rows.length > 0;
  } catch (error) {
    console.warn('Failed to check for duplicate content:', error);
    return false; // If check fails, proceed with generation
  }
}


export interface GenerationJobConfig extends JobConfig {
  // Layout selection options
  preferredLayout?: LayoutType;
  previousLayouts?: LayoutType[];
  targetEngagement?: 'educational' | 'entertaining' | 'interactive' | 'practical';
}

interface LayoutWeight {
  layout: LayoutType;
  weight: number;
}

/**
 * FIX: Centralized Layout Weight Configuration
 * This should be the single source of truth for runtime layout selection.
 */
const PERSONA_LAYOUT_WEIGHTS: Record<string, LayoutWeight[]> = {
    'english_vocab_builder': [
        { layout: 'mcq', weight: 100 },
    ],
    'mental_health_tips': [
        { layout: 'mcq', weight: 60 },           
        { layout: 'quick_tip', weight: 40 },     
    ],
    'general_health_tips': [
        { layout: 'mcq', weight: 60 },
        { layout: 'quick_tip', weight: 40 },
    ],
    'ssc_shots': [
        { layout: 'mcq', weight: 70 },            
        { layout: 'quick_tip', weight: 30 },      
    ],
    'space_facts_quiz': [
        { layout: 'mcq', weight: 80 },           
        { layout: 'quick_tip', weight: 20 }
    ],
    'default': [
        { layout: 'mcq', weight: 70 },           
        { layout: 'quick_tip', weight: 30 }
    ]
};

function getLayoutDistributionForPersona(persona: string): LayoutWeight[] {
  return PERSONA_LAYOUT_WEIGHTS[persona] || PERSONA_LAYOUT_WEIGHTS.default;
}

function selectWeightedRandomLayout(weights: LayoutWeight[]): LayoutType {
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  const random = Math.random() * totalWeight;

  let currentWeight = 0;
  for (const item of weights) {
    currentWeight += item.weight;
    if (random <= currentWeight) {
      return item.layout;
    }
  }

  // Fallback to MCQ if something goes wrong
  return 'mcq';
}

function selectLayoutForPersona(persona: string, preferredLayout?: LayoutType): LayoutType {
  // If a specific layout is requested, use it
  if (preferredLayout) {
    console.log(`✅ Using requested layout: ${preferredLayout} for ${persona}`);
    return preferredLayout;
  }

  // Get persona-specific layout distribution
  const layoutWeights = getLayoutDistributionForPersona(persona);
  const selectedLayout = selectWeightedRandomLayout(layoutWeights);

  const weightInfo = layoutWeights.find(w => w.layout === selectedLayout)?.weight || 0;
  console.log(`✅ Randomly selected ${selectedLayout} layout for ${persona} (${weightInfo}% weight)`);

  return selectedLayout;
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

    // Get analytics insights for this persona
    let analyticsInsights: any | undefined;
    try {
      const analyticsPromise = analyticsService.analyzePerformanceWithAI(jobConfig.accountId, jobConfig.persona);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Analytics query timeout')), 10000)
      );

      const analyticsResult = await Promise.race([analyticsPromise, timeoutPromise]) as any;
      analyticsInsights = analyticsResult.aiInsights;
      console.log(`[Analytics] Loaded insights for ${jobConfig.persona}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`[Analytics] Skipping insights for ${jobConfig.persona}: ${errorMessage}`);
      // Continue without analytics insights - graceful degradation
    }

    // Determine upload timing for prompt optimization
    const now = new Date();
    const istDateString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istTime = new Date(istDateString);

    const uploadHour = istTime.getHours();

    // Select appropriate layout for this persona
    const preferredLayout = jobConfig.preferredLayout || jobConfig.preferredFormat as LayoutType;
    const selectedLayout: LayoutType = selectLayoutForPersona(jobConfig.persona, preferredLayout);

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

    console.log(`[DEBUG] AI response for ${jobConfig.persona}:`, content.substring(0, 500) + '...');

    // Parse and validate the response
    const validationResult = parseAndValidateResponse(content, jobConfig.persona, selectedLayout);
    if (!validationResult.success || !validationResult.data) {
      console.log(`[DEBUG] Validation failed for ${jobConfig.persona}. Raw content:`, content);
      throw new Error(`Validation failed: ${validationResult.error}`);
    }

    const contentData = validationResult.data;

    // Check for duplicate content
    const contentHash = generateContentHash(contentData);
    const isDuplicate = await checkForDuplicateContent(contentHash, jobConfig.accountId, jobConfig.persona);

    if (isDuplicate) {
      console.warn(`⚠️ Duplicate content detected (hash: ${contentHash}) for ${jobConfig.persona} - ${jobConfig.topic}. Regenerating...`);

      // Try one more time with different variation markers
      const retryPromptResult = await generatePrompt({
        ...jobConfig
      });

      const retryResponse = await deepseekClient.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: retryPromptResult.prompt }],
        temperature: 0.9, // Increase temperature for more variation
      }, {
        timeout: AI_TIMEOUT,
      });

      const retryContent = retryResponse.choices[0].message.content;
      if (!retryContent) {
        throw new Error('AI returned no content on retry.');
      }

      const retryValidationResult = parseAndValidateResponse(retryContent, jobConfig.persona, selectedLayout);
      if (!retryValidationResult.success || !retryValidationResult.data) {
        console.warn(`Retry validation failed, using original content: ${retryValidationResult.error}`);
      } else {
        const retryContentHash = generateContentHash(retryValidationResult.data);
        if (retryContentHash !== contentHash) {
          console.log(`✅ Successfully generated unique content on retry (new hash: ${retryContentHash})`);
          Object.assign(contentData, retryValidationResult.data);
        } else {
          console.warn(`⚠️ Retry still produced duplicate content, proceeding with original`);
        }
      }
    }


    const enhancedContentData = {
      ...contentData,
      layoutType: selectedLayout, // Ensure layout type is tracked
    };

    // Construct the payload for database insertion
    const topicKey = jobConfig.topic;
    const personaData = MasterPersonas[jobConfig.persona];
    const topicData = personaData?.subCategories?.find(sub => sub.key === topicKey);

    // FIX: Explicitly set the frame sequence based on the selected layout
    const layoutDefinition = getLayout(selectedLayout);
    const frameSequence = layoutDefinition.frames; 

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
      format_type: selectedLayout, 
      frame_sequence: frameSequence, // <-- NOW CORRECTLY SET
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

    console.log(`🔄 [DEBUG] About to create job with payload:`, {
      persona: jobPayload.persona,
      account_id: jobPayload.account_id,
      topic: jobPayload.topic,
      status: jobPayload.status,
      step: jobPayload.step,
      frame_sequence: jobPayload.frame_sequence
    });

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
    console.error(`❌ Error stack:`, error instanceof Error ? error.stack : 'No stack trace available');
    console.error(`❌ Error details:`, JSON.stringify(error, null, 2));
    console.error(`❌ Job config:`, JSON.stringify(jobConfig, null, 2));
    return null;
  }
}

