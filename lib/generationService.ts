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
  const { persona, category, topic, subCategory } = jobConfig;
  const { timeMarker, tokenMarker } = generateVariationMarkers();
  
  let prompt = '';
  switch (persona) {

    case 'english_learning':
    default:
      // Use the full curriculum structure for more specific prompts
      const curriculumData = MasterCurriculum[persona];
      const categoryData = curriculumData?.structure?.find(cat => cat.key === category);
      const subCategoryData = categoryData?.subCategories?.find(sub => sub.key === subCategory);
      
      
      if (subCategoryData) {
        prompt = `Generate a medium-difficulty English ${categoryData.displayName} question specifically focused on "${subCategoryData.displayName}" within the ${categoryData.displayName} category. Use a fresh approach. Provide a clear, concise explanation with an example sentence that helps learners understand the rule or meaning. [${timeMarker}-${tokenMarker}]`;
      } else {
        // Fallback to original behavior if subcategory not found
        prompt = `Generate a medium-difficulty English ${category} question focusing on "${topic}" with a varied approach. Provide a clear, concise explanation with an example sentence that helps learners understand the rule or meaning. [${timeMarker}-${tokenMarker}]`;
      }
      break;
  }
  return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "question", "options" (an object with keys "A", "B", "C", "D"), "answer" (a single letter "A", "B", "C", or "D"), and "explanation".';
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