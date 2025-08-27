// app/api/jobs/generate-quiz/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createQuizJob } from '@/lib/database';

// --- CONFIGURATION ---

// Use a more descriptive name to avoid confusion with the official OpenAI client.
const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

const BATCH_SIZE = 5; // **FIX**: Generate 5 quizzes per cron run for efficiency.

// --- VOCABULARY PERSONA CONSTANTS ---
const VOCABULARY_CATEGORIES = {
  'word_meaning': ['Advanced Academic Vocabulary', 'Business & Professional Terms', 'Scientific & Technical Words', 'Literary & Artistic Terms', 'Common SAT/GRE Words'],
  'synonyms_antonyms': ['Common Word Pairs', 'Academic Synonyms', 'Emotional & Descriptive Words', 'Action & Movement Words'],
  'word_usage': ['Commonly Confused Words', 'Formal vs Informal Usage', 'Idiomatic Expressions', 'Collocations'],
  'etymology': ['Greek & Latin Roots', 'Word Origins & History', 'Prefix & Suffix Patterns'],
  'contextual_vocabulary': ['Reading Comprehension Vocabulary', 'Subject-Specific Terms', 'Inferring Meaning']
};
const QUESTION_FORMATS = ['multiple_choice', 'fill_blank', 'context_clues', 'synonym_selection', 'antonym_identification'];
const VOCABULARY_STYLES = ["a straightforward definition question", "a context-based sentence question", "a synonym/antonym challenge", "a commonly confused words scenario"];

// Helper function to get a random element from an array
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


/**
 * API endpoint to generate a batch of vocabulary quiz jobs.
 * Triggered by a cron job.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authorization Check
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log(`Starting vocabulary quiz generation batch of ${BATCH_SIZE}...`);

    // **FIX**: Create an array of promises to generate quizzes concurrently.
    const generationPromises = Array(BATCH_SIZE).fill(null).map(() => {
        // 2. Generate a unique configuration for each job in the batch
        const category = getRandomElement(Object.keys(VOCABULARY_CATEGORIES));
        const questionFormat = getRandomElement(QUESTION_FORMATS);
        const difficulty = getRandomElement(['easy', 'medium', 'hard'] as const);
        const targetAudience = getRandomElement(['general', 'students', 'professionals']);
        
        const jobConfig = {
          persona: 'vocabulary' as const,
          category: 'english',
          question_format: questionFormat,
          difficulty,
          target_audience: targetAudience,
          tags: ['vocabulary', 'english', 'education', category]
        };

        // Return the promise for generating and storing this specific quiz
        return generateAndStoreQuiz(jobConfig);
    });

    // 3. Wait for all quiz generation promises to settle
    const results = await Promise.allSettled(generationPromises);
    
    const createdJobs = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => (result as PromiseFulfilledResult<any>).value);

    console.log(`Vocabulary job creation completed. Created ${createdJobs.length} jobs.`);

    return NextResponse.json({ 
      success: true,
      created: createdJobs.length,
      jobs: createdJobs
    });

  } catch (error) {
    console.error('❌ Vocabulary quiz generation batch failed:', error);
    return NextResponse.json(
      { success: false, error: 'Batch generation failed' },
      { status: 500 }
    );
  }
}

/**
 * Generates, parses, and stores a single vocabulary quiz job.
 * @param jobConfig - The configuration for the job.
 * @returns The created job data or null if it fails.
 */
async function generateAndStoreQuiz(jobConfig: any) {
    try {
        const questionData = await generateVocabularyQuestion(
            jobConfig.question_format, 
            jobConfig.difficulty
        );
      
        if (questionData) {
            const jobId = await createQuizJob({
              ...jobConfig,
              step: 2,
              status: 'frames_pending',
              data: { question: questionData }
            });
            
            console.log(`✅ Created vocabulary quiz job ${jobId}`);
            return { id: jobId, ...jobConfig, ...questionData };
        }
        return null;
    } catch (error) {
        console.error(`❌ Failed to create vocabulary quiz for config:`, jobConfig, error);
        return null;
    }
}


/**
 * Generates a vocabulary question using the AI model, requesting a JSON response.
 * @param questionFormat - The format of the question.
 * @param difficulty - The difficulty level.
 * @returns The parsed vocabulary question data or null if generation fails.
 */
async function generateVocabularyQuestion(
  questionFormat: string,
  difficulty: 'easy' | 'medium' | 'hard'
) {
  const category = getRandomElement(Object.keys(VOCABULARY_CATEGORIES));
  const topicOptions = VOCABULARY_CATEGORIES[category as keyof typeof VOCABULARY_CATEGORIES];
  const selectedTopic = getRandomElement(topicOptions);
  const selectedStyle = getRandomElement(VOCABULARY_STYLES);

  // **FIX**: The prompt now explicitly asks for a JSON object. This is far more robust than string parsing.
  const fullPrompt = `Generate a ${difficulty} level English vocabulary question.

Focus on the topic: **${selectedTopic}**.
Frame it as: **${selectedStyle}**.

CRITICAL REQUIREMENTS FOR VIDEO:
- Question text: 50-300 characters.
- Each option: 10-80 characters.
- Explanation: 50-400 characters, providing educational value (e.g., etymology, usage).

Format your response as a single, valid JSON object with these exact keys: "question", "options", "answer", "explanation".
The "options" key must be an object with keys "A", "B", "C", "D".
The "answer" key must be a single uppercase letter: "A", "B", "C", or "D".
Do not include any other text, markdown, or commentary outside of the JSON object.`;

  try {
    const response = await deepseekClient.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0.95,
      max_tokens: 600,
      // **FIX**: Instruct the model to return a JSON object.
      // Note: This is an OpenAI-specific feature. If DeepSeek's API supports a similar `response_format` parameter, it should be used here.
      // If not, the prompt-based instruction is the next best thing.
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content generated from AI');
    }

    // **FIX**: Parse the JSON response instead of manual string splitting.
    return parseAndValidateResponse(content, selectedTopic, category, questionFormat);
  } catch (error) {
    console.error('AI vocabulary generation error:', error);
    return null;
  }
}

/**
 * Parses and validates the JSON response from the AI.
 * @param content - The raw string response from the AI.
 * @returns A structured vocabulary question object or null if parsing fails.
 */
function parseAndValidateResponse(
  content: string, 
  categoryTopic: string, 
  category: string, 
  questionFormat: string
) {
  try {
    // Clean the content in case the AI wraps it in markdown
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);

    // Enhanced validation for the JSON structure
    if (!data.question || typeof data.question !== 'string' || data.question.length > 300) {
      throw new Error('Invalid or missing "question" field.');
    }
    if (!data.options || typeof data.options !== 'object' || Object.keys(data.options).length !== 4) {
      throw new Error('Invalid or missing "options" field.');
    }
    if (!data.answer || !['A', 'B', 'C', 'D'].includes(data.answer)) {
      throw new Error('Invalid or missing "answer" field.');
    }
    if (!data.explanation || typeof data.explanation !== 'string' || data.explanation.length > 400) {
      throw new Error('Invalid or missing "explanation" field.');
    }
    
    return {
      question: data.question,
      options: data.options,
      answer: data.answer,
      explanation: data.explanation,
      category_topic: categoryTopic,
      category,
      question_type: questionFormat,
    };
  } catch (error) {
    console.error(`Failed to parse AI JSON response. Content: "${content}"`, error);
    return null; 
  }
}

export const runtime = 'nodejs';
export const maxDuration = 120;
