import OpenAI from 'openai';
import { createQuizJob } from '@/lib/database';
import { Question } from './types'; // Using strong types

const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

/**
 * Generates a highly specific AI prompt based on the job's persona and configuration.
 * @param jobConfig The configuration object for the quiz job.
 * @returns A promise resolving to the AI prompt string.
 */
async function generatePrompt(jobConfig: any): Promise<string> {
  const { persona, category, topic, context } = jobConfig;

  let prompt = '';
  switch (persona) {

    case 'english_learning':
    default:
      prompt = `Generate a medium-difficulty English ${category.displayName} question focusing on "${topic.displayName}". Provide a clear, concise explanation with an example sentence that helps learners understand the rule or meaning.`;
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
        category: jobConfig.category.key,
        topic: jobConfig.topic.key,
    };

    // Construct the payload for database insertion with strong typing.
    const jobPayload = {
        persona: jobConfig.persona,
        generation_date: jobConfig.generationDate,
        category: jobConfig.category.key,
        category_display_name: jobConfig.category.displayName,
        topic: jobConfig.topic.key,
        topic_display_name: jobConfig.topic.displayName,
        step: 2, // Next step is frame creation
        status: 'frames_pending',
        data: { question: finalQuestion }
    };

    const jobId = await createQuizJob(jobPayload);
    
    console.log(`[Job ${jobId}] ✅ Created job for persona "${jobConfig.persona}"`);
    return { id: jobId, ...jobConfig };

  } catch (error) {
    console.error(`❌ Failed to create quiz for persona "${jobConfig.persona}":`, error);
    return null;
  }
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