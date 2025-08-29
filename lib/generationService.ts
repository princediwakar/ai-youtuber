import OpenAI from 'openai';
import { createQuizJob } from '@/lib/database';
import { Question } from './types'; // Using strong types
import { MasterCurriculum } from './curriculum';

const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

/**
 * Generates unique variation markers for content diversity
 * @param jobConfig The configuration object for the quiz job.
 * @returns Object with variation markers
 */
function generateVariationMarkers(): { timeMarker: string; tokenMarker: string; } {
  const timestamp = Date.now();
  const timeMarker = `T${timestamp}`;
  const tokenMarker = `TK${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  
  return { timeMarker, tokenMarker };
}

/**
 * Generates a highly specific AI prompt based on the job's persona and configuration.
 * @param jobConfig The configuration object for the quiz job.
 * @returns A promise resolving to the AI prompt string.
 */
async function generatePrompt(jobConfig: any): Promise<string> {
  const { persona, category, subCategory } = jobConfig;
  const { timeMarker, tokenMarker } = generateVariationMarkers();
  
  let prompt = '';
  const curriculumData = MasterCurriculum[persona];
  const categoryData = curriculumData?.structure?.find(cat => cat.key === category);
  const subCategoryData = categoryData?.subCategories?.find(sub => sub.key === subCategory);
  
  // NEET-ONLY Generation: Single persona focus for #1 channel dominance
  if (persona === 'neet_preparation') {
    if (subCategoryData) {
      prompt = `Generate a NEET 2025-style medical entrance MCQ on "${subCategoryData.displayName}" from ${categoryData.displayName}. 

CRITICAL REQUIREMENTS:
• Follow NEET's exact difficulty pattern - moderate to challenging level
• Include medical/healthcare relevance where applicable (especially for Biology)
• Use NCERT-based concepts with application twist (NEET's signature style)
• Create distractors that test common misconceptions (like actual NEET)
• Include quantitative elements for Physics/Chemistry when appropriate
• Focus on concept application, not just memory recall

PREVIOUS YEAR PATTERN INSPIRATION: Frame questions similar to NEET 2022-2025 style with clear conceptual depth, practical application, and precise scientific language. Avoid overly complex calculations but include analytical thinking.

Keep explanation CONCISE (2-3 lines maximum) focusing on the key concept and why other options are incorrect. [${timeMarker}-${tokenMarker}]`;
    } else {
      prompt = `Generate a NEET 2025 medical entrance MCQ on "${category}" with authentic exam-level difficulty, medical relevance, and NCERT alignment. Focus on application-based conceptual understanding. [${timeMarker}-${tokenMarker}]`;
    }
  } else {
    // Fallback - should not occur with NEET-only setup
    throw new Error(`Unsupported persona: ${persona}. Only 'neet_preparation' is supported in NEET-focused mode.`);
  }
  // Randomly choose question format (80% MCQ, 20% True/False)
  const questionFormat = Math.random() < 0.8 ? 'multiple_choice' : 'true_false';
  
  if (questionFormat === 'true_false') {
    return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "question", "options" (an object with keys "True", "False"), "answer" (either "True" or "False"), "explanation", and "question_type" (set to "true_false"). Create a statement that can be definitively true or false. IMPORTANT: Keep the explanation SHORT and CRISP - maximum 2-3 sentences that directly explain why the statement is true or false. This is for video format, so be concise!';
  } else {
    return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "question", "options" (an object with keys "A", "B", "C", "D"), "answer" (a single letter "A", "B", "C", or "D"), "explanation", and "question_type" (set to "multiple_choice"). IMPORTANT: Keep the explanation SHORT and CRISP - maximum 2-3 sentences that directly explain why the answer is correct. This is for video format, so be concise!';
  }
}

/**
 * The main service function that orchestrates the generation and storage of a single quiz job.
 * @param jobConfig The configuration object for the job.
 * @returns The created job data or null on failure.
 */
export async function generateAndStoreQuiz(jobConfig: any): Promise<any | null> {
  try {
    const prompt = await generatePrompt(jobConfig);
    const { timeMarker, tokenMarker } = generateVariationMarkers();

    const response = await deepseekClient.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('AI returned no content.');
    }

    const questionData = parseAndValidateResponse(content);
    if (!questionData) {
      throw new Error('Failed to parse or validate AI response.');
    }
    
    const finalQuestion: Question = {
        ...questionData,
        category: jobConfig.category,
        topic: jobConfig.subCategory || jobConfig.topic,
    };

    // Construct the payload for database insertion with strong typing.
    // Ensure all fields are strings, not objects
    const categoryKey = typeof jobConfig.category === 'string' ? jobConfig.category : jobConfig.category?.key || 'unknown';
    const topicKey = typeof jobConfig.subCategory === 'string' ? jobConfig.subCategory : jobConfig.subCategory?.key || jobConfig.topic || 'unknown';
    
    const curriculumData = MasterCurriculum[jobConfig.persona];
    const categoryData = curriculumData?.structure?.find(cat => cat.key === categoryKey);
    const subCategoryData = categoryData?.subCategories?.find(sub => sub.key === topicKey);
    
    const jobPayload = {
        persona: jobConfig.persona,
        generation_date: jobConfig.generationDate,
        category: categoryKey,
        category_display_name: categoryData?.displayName || categoryKey,
        topic: topicKey,
        topic_display_name: subCategoryData?.displayName || topicKey,
        question_format: finalQuestion.question_type || 'multiple_choice',
        step: 2, // Next step is frame creation
        status: 'frames_pending',
        data: { 
            question: finalQuestion,
            variation_markers: {
                time_marker: timeMarker,
                token_marker: tokenMarker,
                generation_timestamp: Date.now(),
                content_hash: generateContentHash(finalQuestion)
            }
        }
    };

    const jobId = await createQuizJob(jobPayload);
    
    console.log(`[Job ${jobId}] ✅ Created job for persona "${jobConfig.persona}" [${timeMarker}-${tokenMarker}]`);
    return { id: jobId, ...jobConfig, variationMarkers: { timeMarker, tokenMarker } };

  } catch (error) {
    console.error(`❌ Failed to create quiz for persona "${jobConfig.persona}":`, error);
    return null;
  }
}

/**
 * Generates a content hash for duplicate detection and tracking
 * @param question The question object
 * @returns A hash string for the content
 */
function generateContentHash(question: any): string {
  const contentString = JSON.stringify({
    question: question.question,
    options: question.options,
    answer: question.answer
  });
  
  // Simple hash function (for production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < contentString.length; i++) {
    const char = contentString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `CH${Math.abs(hash).toString(36).toUpperCase()}`;
}

function parseAndValidateResponse(content: string): Omit<Question, 'category' | 'topic'> | null {
    try {
        const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
        const data = JSON.parse(cleanedContent);
        if (!data.question || typeof data.question !== 'string' ||
            !data.options || typeof data.options !== 'object' || Object.keys(data.options).length < 2 ||
            !data.answer || typeof data.answer !== 'string' || !data.options[data.answer] ||
            !data.explanation || typeof data.explanation !== 'string') {
            throw new Error('AI response missing required JSON fields or has invalid structure.');
        }
        return data;
    } catch (error) {
        console.error(`Failed to parse AI JSON response. Content: "${content}"`, error);
        return null; 
    }
}