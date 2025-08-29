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
  const curriculumData = MasterCurriculum[persona];
  const categoryData = curriculumData?.structure?.find(cat => cat.key === category);
  const subCategoryData = categoryData?.subCategories?.find(sub => sub.key === subCategory);
  
  switch (persona) {
    case 'mathematics_10_12':
      if (subCategoryData) {
        prompt = `Generate a Class 10-12 level Mathematics question specifically focused on "${subCategoryData.displayName}" within the ${categoryData.displayName} category. Create a practical problem that tests conceptual understanding. Keep explanation concise - just the key concept and solution approach. [${timeMarker}-${tokenMarker}]`;
      } else {
        prompt = `Generate a Class 10-12 Mathematics question on "${category}" with practical applications. Include solution techniques that help in board exam preparation. [${timeMarker}-${tokenMarker}]`;
      }
      break;

    case 'physics_10_12':
      if (subCategoryData) {
        prompt = `Generate a Class 10-12 Physics question on "${subCategoryData.displayName}" within ${categoryData.displayName}. Create a real-world application problem that tests both conceptual knowledge and numerical problem-solving. Keep explanation short - just the key physics principle. [${timeMarker}-${tokenMarker}]`;
      } else {
        prompt = `Generate a Class 10-12 Physics question on "${category}" with real-world applications and clear physics principles. [${timeMarker}-${tokenMarker}]`;
      }
      break;

    case 'chemistry_10_12':
      if (subCategoryData) {
        prompt = `Generate a Class 10-12 Chemistry question on "${subCategoryData.displayName}" within ${categoryData.displayName}. Focus on conceptual understanding with practical examples. Keep explanation brief - just the key concept or reaction. [${timeMarker}-${tokenMarker}]`;
      } else {
        prompt = `Generate a Class 10-12 Chemistry question on "${category}" with conceptual clarity and practical examples. [${timeMarker}-${tokenMarker}]`;
      }
      break;

    case 'biology_10_12':
      if (subCategoryData) {
        prompt = `Generate a Class 10-12 Biology question on "${subCategoryData.displayName}" within ${categoryData.displayName}. Create a question that relates to human body, plant life, or biological processes. Keep explanation concise - just the key biological principle. [${timeMarker}-${tokenMarker}]`;
      } else {
        prompt = `Generate a Class 10-12 Biology question on "${category}" with biological processes and real-life relevance. [${timeMarker}-${tokenMarker}]`;
      }
      break;

    case 'neet_preparation':
      if (subCategoryData) {
        prompt = `Generate a NEET-level medical entrance question on "${subCategoryData.displayName}" within ${categoryData.displayName}. Create a challenging problem that tests deep conceptual understanding required for medical entrance. Focus on application-based scenarios relevant to medicine and healthcare. Keep explanation short and focused. [${timeMarker}-${tokenMarker}]`;
      } else {
        prompt = `Generate a NEET medical entrance question on "${category}" with medical relevance and deep conceptual understanding. [${timeMarker}-${tokenMarker}]`;
      }
      break;

    case 'jee_preparation':
      if (subCategoryData) {
        prompt = `Generate a JEE-level engineering entrance question on "${subCategoryData.displayName}" within ${categoryData.displayName}. Create a challenging analytical problem that requires advanced problem-solving skills. Focus on engineering applications and mathematical rigor. Keep explanation crisp and direct. [${timeMarker}-${tokenMarker}]`;
      } else {
        prompt = `Generate a JEE engineering entrance question on "${category}" with advanced problem-solving and engineering applications. [${timeMarker}-${tokenMarker}]`;
      }
      break;

    case 'english_grammar':
      if (subCategoryData) {
        prompt = `Generate an English Grammar question on "${subCategoryData.displayName}" within ${categoryData.displayName}. Create a question that tests both understanding and application of grammar rules. Include examples that help competitive exam preparation. Keep explanation short - just the key grammar rule. [${timeMarker}-${tokenMarker}]`;
      } else {
        prompt = `Generate an English Grammar question on "${category}" with competitive exam focus and practical usage. [${timeMarker}-${tokenMarker}]`;
      }
      break;

    case 'ssc_banking':
      if (subCategoryData) {
        prompt = `Generate an SSC/Banking exam question on "${subCategoryData.displayName}" within ${categoryData.displayName}. Create a problem that tests quick analytical thinking and shortcut methods. Focus on time-efficient solving techniques used in competitive exams. Keep explanation brief - just the key trick or method. [${timeMarker}-${tokenMarker}]`;
      } else {
        prompt = `Generate an SSC/Banking exam question on "${category}" with quick-solving techniques and competitive exam strategies. [${timeMarker}-${tokenMarker}]`;
      }
      break;

    case 'upsc_preparation':
      if (subCategoryData) {
        prompt = `Generate a UPSC Civil Services question on "${subCategoryData.displayName}" within ${categoryData.displayName}. Create a comprehensive question that tests analytical thinking and current affairs knowledge. Focus on Indian governance, policy, and administrative aspects. Keep explanation concise - just key facts and reasoning. [${timeMarker}-${tokenMarker}]`;
      } else {
        prompt = `Generate a UPSC Civil Services question on "${category}" with analytical depth and current relevance. [${timeMarker}-${tokenMarker}]`;
      }
      break;

    case 'general_knowledge':
      if (subCategoryData) {
        prompt = `Generate a General Knowledge question on "${subCategoryData.displayName}" within ${categoryData.displayName}. Create an interesting question that covers important facts, current developments, or cultural knowledge. Focus on information that's relevant for multiple competitive exams. Keep explanation short and informative. [${timeMarker}-${tokenMarker}]`;
      } else {
        prompt = `Generate a General Knowledge question on "${category}" with broad applicability and interesting facts. [${timeMarker}-${tokenMarker}]`;
      }
      break;

    case 'english_learning':
    default:
      // Fallback for backward compatibility
      if (subCategoryData) {
        prompt = `Generate a medium-difficulty English ${categoryData.displayName} question specifically focused on "${subCategoryData.displayName}" within the ${categoryData.displayName} category. Use a fresh approach. Keep explanation very brief - just the key rule and one example. [${timeMarker}-${tokenMarker}]`;
      } else {
        prompt = `Generate a medium-difficulty English ${category} question focusing on "${topic}" with a varied approach. Provide a clear, concise explanation with an example sentence that helps learners understand the rule or meaning. [${timeMarker}-${tokenMarker}]`;
      }
      break;
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