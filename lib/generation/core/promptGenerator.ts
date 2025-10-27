// lib/generation/core/promptGenerator.ts
/**
 * Prompt generation service
 * Orchestrates the creation of AI prompts for different content types
 */

import { MasterPersonas } from '../../personas';
// NOTE: Only generateFormatPrompt and utils are imported as they handle all routing/formatting.
import {
    generateVariationMarkers,
    generateFormatPrompt,
    addJsonFormatInstructions,
    type PromptConfig,
    type QuestionFormatType
} from '../routing/promptRouter';
import type { AIAnalyticsInsights } from '../../analytics/types';
import {
    generateTopicWeights,
    getTimingContext,
    getOptimalFormat,
    enhancePromptWithTiming,
    selectOptimalTopic,
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

    // Determine the optimal question format (e.g., 'multiple_choice')
    const questionFormat: QuestionFormatType = getOptimalFormat(analyticsInsights, 'multiple_choice');

    const promptConfig: PromptConfig = {
        persona,
        topic: selectedTopic, // Use analytics-optimized topic
        topicData,
        markers,
        format: jobConfig.preferredFormat || jobConfig.preferredLayout, // Format or Layout
        formatDefinition: jobConfig.formatDefinition,
        timingContext,
        questionFormat, // Pass questionFormat for analytics-driven prompt tailoring
    };

    // --- FIX: Unified Prompt Generation using the router ---
    // ALL prompt generation is now handled by generateFormatPrompt, which includes the logic
    // for legacy MCQ types like SSC and Health Quizzes in its internal routing table.
    let prompt = await generateFormatPrompt(promptConfig); 


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