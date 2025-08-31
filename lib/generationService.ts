import OpenAI from 'openai';
import { createQuizJob } from '@/lib/database';
import { Question } from './types'; // Using strong types
import { MasterPersonas } from './personas';

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
  const tokenMarker = `TK${Math.random().toString(36).substring(2, 8).toUpperCase()}`;


  return { timeMarker, tokenMarker };
}

/**
 * Generates a highly specific AI prompt based on the job's persona and configuration.
 * @param jobConfig The configuration object for the quiz job.
 * @returns A promise resolving to the AI prompt string.
 */

// No changes needed for imports or other functions

/**
 * Generates a highly specific AI prompt based on the job's persona and configuration.
 * @param jobConfig The configuration object for the quiz job.
 * @returns A promise resolving to the AI prompt string.
 */
async function generatePrompt(jobConfig: any): Promise<string> {
  const { persona, topic } = jobConfig;
  const { timeMarker, tokenMarker } = generateVariationMarkers();

  let prompt = '';
  const personaData = MasterPersonas[persona];
  const topicData = personaData?.subCategories?.find(sub => sub.key === topic);

  // NEET Subject-Specific Generation
  if (persona === 'neet_physics') {
    if (topicData) {
      prompt = `Generate a NEET 2026-style Physics MCQ on "${topicData.displayName}" from ${personaData.displayName}.

CRITICAL REQUIREMENTS:
• PRIORITY: The question must be solvable mentally in 5-10 seconds. Focus on core concepts, not lengthy calculations.
• Difficulty should be beginner to moderate, testing foundational knowledge.
• If a formula is needed, it must be a direct, single-step application. Avoid multi-step problems.
• Use NCERT-based concepts with a clever conceptual twist (NEET's signature style).
• Create distractors that target common conceptual misunderstandings, not calculation errors.
• Focus on conceptual application and direct problem-solving.

PREVIOUS YEAR PATTERN INSPIRATION: Frame questions similar to the conceptual and single-step formula questions from NEET 2022-2026. Avoid the lengthy, multi-step calculation-based questions.

EXPLANATION MUST BE ULTRA-CONCISE: Maximum 2 short sentences (under 150 characters total). Focus ONLY on why the answer is correct. [${timeMarker}-${tokenMarker}]`;
    } else {
      prompt = `Generate a fast, conceptual NEET 2026 Physics MCQ on "${topic}" that can be answered in under 10 seconds. Focus on NCERT-aligned core concepts. [${timeMarker}-${tokenMarker}]`;
    }
  }

  else if (persona === 'neet_chemistry') {
    if (topicData) {
      prompt = `Generate a NEET 2026-style Chemistry MCQ on "${topicData.displayName}" from ${personaData.displayName}.

CRITICAL REQUIREMENTS:
• PRIORITY: The question must be solvable mentally in 5-10 seconds. Focus on core concepts, reaction names, or properties, not complex stoichiometry.
• Difficulty should be moderate, testing foundational knowledge.
• Prioritize conceptual understanding (e.g., trends, definitions, reaction products) over complex calculations.
• Use NCERT-based concepts with a clever conceptual twist (NEET's signature style).
• Create distractors that target common chemical misconceptions.
• Focus on conceptual application and chemical reasoning.

PREVIOUS YEAR PATTERN INSPIRATION: Frame questions similar to the conceptual and direct-recall questions from NEET 2022-2026. Avoid questions requiring extensive calculations.

EXPLANATION MUST BE ULTRA-CONCISE: Maximum 2 short sentences (under 150 characters total). Focus ONLY on why the answer is correct. [${timeMarker}-${tokenMarker}]`;
    }

    else {
      prompt = `Generate a fast, conceptual NEET 2026 Chemistry MCQ on "${topic}" that can be answered in under 10 seconds. Focus on NCERT-aligned core concepts. [${timeMarker}-${tokenMarker}]`;
    }
  }

  else if (persona === 'neet_biology') {
    if (topicData) {
      prompt = `Generate a NEET 2026-style Biology MCQ on "${topicData.displayName}" from ${personaData.displayName}.

CRITICAL REQUIREMENTS:
• PRIORITY: The question must be solvable mentally in 5-10 seconds. Focus on direct recall and core concepts.
• Difficulty should be moderate to challenging, testing specific NCERT details.
• Include medical/healthcare relevance where appropriate, but keep the question direct.
• Use NCERT-based concepts with a clever conceptual twist (NEET's signature style).
• Create distractors that are plausible and test common biological misconceptions.
• Focus on direct concept application, physiological facts, and biological reasoning.

PREVIOUS YEAR PATTERN INSPIRATION: Frame questions similar to the direct, knowledge-based questions from NEET 2022-2026 that test precise understanding of NCERT lines.

EXPLANATION MUST BE ULTRA-CONCISE: Maximum 2 short sentences (under 150 characters total). Focus ONLY on why the answer is correct. [${timeMarker}-${tokenMarker}]`;
    } else {
      prompt = `Generate a fast, conceptual NEET 2026 Biology MCQ on "${topic}" that can be answered in under 10 seconds. Focus on specific, NCERT-aligned facts. [${timeMarker}-${tokenMarker}]`;
    }
  }

  else {
    // Fallback
    throw new Error(`Unsupported persona: ${persona}. Only 'neet_physics', 'neet_chemistry', and 'neet_biology' are supported in NEET-focused mode.`);
  }
  
  // No changes to the format selection logic below this line
  const rand = Math.random();
  const questionFormat = rand < 0.7 ? 'multiple_choice' : (rand < 0.85 ? 'true_false' : 'assertion_reason');

  if (questionFormat === 'true_false') {
    return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "question", "options" (an object with keys "True", "False"), "answer" (either "True" or "False"), "explanation", and "question_type" (set to "true_false"). Create a statement that can be definitively true or false. MANDATORY: Explanation must be under 150 characters total - maximum 2 short sentences explaining why the answer is correct. No fluff!';
  } else if (questionFormat === 'assertion_reason') {
    return prompt + `\n\nCRITICAL: Generate an Assertion/Reason question. Format your response as a single, valid JSON object with these exact keys: "assertion", "reason", "options", "answer", "explanation", and "question_type" (set to "assertion_reason"). 

MANDATORY JSON STRUCTURE:
• "assertion": A statement of fact.
• "reason": A statement explaining the assertion.
• "options": This MUST be the following object with concise options:
    {
        "A": "Both are true, R explains A.",
        "B": "Both are true, R doesn't explain A.",
        "C": "A is true, R is false.",
        "D": "A is false, but R is true."
    }
• "answer": A single letter "A", "B", "C", or "D".
• "explanation": Max 2 short sentences (under 150 characters) explaining the correct relationship between A and R. No fluff!`;
  }
  else {
    return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "question", "options" (an object with keys "A", "B", "C", "D"), "answer" (a single letter "A", "B", "C", or "D"), "explanation", and "question_type" (set to "multiple_choice"). MANDATORY: Explanation must be under 150 characters total - maximum 2 short sentences explaining why the answer is correct. No fluff!';
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
    }, {
      timeout: 30000, // 30 second timeout
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
      topic: jobConfig.topic,
    };

    // Construct the payload for database insertion with strong typing.
    // Ensure all fields are strings, not objects
    const topicKey = typeof jobConfig.topic === 'string' ? jobConfig.topic : jobConfig.topic?.key || 'unknown';

    const personaData = MasterPersonas[jobConfig.persona];
    const topicData = personaData?.subCategories?.find(sub => sub.key === topicKey);

    const jobPayload = {
      persona: jobConfig.persona,
      generation_date: jobConfig.generationDate,
      topic: topicKey,
      topic_display_name: topicData?.displayName || topicKey,
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


function parseAndValidateResponse(content: string): Omit<Question, 'topic'> | null {
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);

    // ✨ Updated validation to check for either 'question' or 'assertion'/'reason'
    const hasQuestion = data.question && typeof data.question === 'string';
    const hasAssertionReason = data.assertion && typeof data.assertion === 'string' && data.reason && typeof data.reason === 'string';

    if ((!hasQuestion && !hasAssertionReason) ||
      !data.options || typeof data.options !== 'object' || Object.keys(data.options).length < 2 ||
      !data.answer || typeof data.answer !== 'string' || !data.options[data.answer] ||
      !data.explanation || typeof data.explanation !== 'string') {
      throw new Error('AI response missing required JSON fields or has invalid structure.');
    }
    // Enforce explanation length limit (150 characters max for good video readability)
    if (data.explanation.length > 150) {
      console.warn(`Explanation too long (${data.explanation.length} chars), truncating to 150 chars`);
      data.explanation = data.explanation.substring(0, 147) + '...';
    }

    return data;
  } catch (error) {
    console.error(`Failed to parse AI JSON response. Content: "${content}"`, error);
    return null;
  }
}