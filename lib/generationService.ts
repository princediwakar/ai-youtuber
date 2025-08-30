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
async function generatePrompt(jobConfig: any): Promise<string> {
  const { persona, topic } = jobConfig;
  const { timeMarker, tokenMarker } = generateVariationMarkers();

  let prompt = '';
  const personaData = MasterPersonas[persona];
  const topicData = personaData?.subCategories?.find(sub => sub.key === topic);

  // NEET Subject-Specific Generation: Three personas for better content management
  if (persona === 'neet_physics') {
    if (topicData) {
      prompt = `Generate a NEET 2026-style Physics MCQ on "${topicData.displayName}" from ${personaData.displayName}. 

CRITICAL REQUIREMENTS:
• Follow NEET's exact difficulty pattern - beginner to moderate level
• Include quantitative elements and formula applications (NEET Physics style)
• Use NCERT-based concepts with application twist (NEET's signature style)
• Create distractors that test common physics misconceptions
• Focus on concept application and problem-solving, not just memory recall
• Include units, dimensions, and numerical accuracy where applicable

PREVIOUS YEAR PATTERN INSPIRATION: Frame questions similar to NEET 2022-2026 Physics style with clear conceptual depth, practical application, and precise scientific language. Include analytical thinking and problem-solving approach.

EXPLANATION MUST BE ULTRA-CONCISE: Maximum 2 short sentences (under 150 characters total). Focus ONLY on why the answer is correct. [${timeMarker}-${tokenMarker}]`;
    } else {
      prompt = `Generate a NEET 2026 Physics MCQ on "${topic}" with authentic exam-level difficulty and NCERT alignment. Focus on application-based conceptual understanding. [${timeMarker}-${tokenMarker}]`;
    }
  } else if (persona === 'neet_chemistry') {
    if (topicData) {
      prompt = `Generate a NEET 2026-style Chemistry MCQ on "${topicData.displayName}" from ${personaData.displayName}. 

CRITICAL REQUIREMENTS:
• Follow NEET's exact difficulty pattern - moderate to challenging level
• Include chemical equations, reactions, and molecular understanding
• Use NCERT-based concepts with application twist (NEET's signature style)
• Create distractors that test common chemistry misconceptions
• Focus on concept application, reaction mechanisms, not just memory recall
• Include quantitative aspects for Physical Chemistry when appropriate

PREVIOUS YEAR PATTERN INSPIRATION: Frame questions similar to NEET 2022-2026 Chemistry style with clear conceptual depth, practical application, and precise scientific language. Include analytical thinking and chemical reasoning.

EXPLANATION MUST BE ULTRA-CONCISE: Maximum 2 short sentences (under 150 characters total). Focus ONLY on why the answer is correct. [${timeMarker}-${tokenMarker}]`;
    } else {
      prompt = `Generate a NEET 2026 Chemistry MCQ on "${topic}" with authentic exam-level difficulty and NCERT alignment. Focus on application-based conceptual understanding. [${timeMarker}-${tokenMarker}]`;
    }
  } else if (persona === 'neet_biology') {
    if (topicData) {
      prompt = `Generate a NEET 2026-style Biology MCQ on "${topicData.displayName}" from ${personaData.displayName}. 

CRITICAL REQUIREMENTS:
• Follow NEET's exact difficulty pattern - moderate to challenging level
• Include medical/healthcare relevance and clinical applications (NEET Biology specialty)
• Use NCERT-based concepts with application twist (NEET's signature style)
• Create distractors that test common biological misconceptions
• Focus on concept application, physiological processes, not just memory recall
• Include anatomical, physiological, and ecological understanding

PREVIOUS YEAR PATTERN INSPIRATION: Frame questions similar to NEET 2022-2026 Biology style with clear conceptual depth, medical relevance, and precise scientific language. Include analytical thinking and biological reasoning.

EXPLANATION MUST BE ULTRA-CONCISE: Maximum 2 short sentences (under 150 characters total). Focus ONLY on why the answer is correct. [${timeMarker}-${tokenMarker}]`;
    } else {
      prompt = `Generate a NEET 2026 Biology MCQ on "${topic}" with authentic exam-level difficulty, medical relevance, and NCERT alignment. Focus on application-based conceptual understanding. [${timeMarker}-${tokenMarker}]`;
    }
  } else {
    // Fallback - should not occur with NEET-only setup
    throw new Error(`Unsupported persona: ${persona}. Only 'neet_physics', 'neet_chemistry', and 'neet_biology' are supported in NEET-focused mode.`);
  }
  // Randomly choose question format (70% MCQ, 15% T/F, 15% A/R)
  const rand = Math.random();
  const questionFormat = rand < 0.0 ? 'multiple_choice' : (rand < 0 ? 'true_false' : 'assertion_reason');

  if (questionFormat === 'true_false') {
    return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "question", "options" (an object with keys "True", "False"), "answer" (either "True" or "False"), "explanation", and "question_type" (set to "true_false"). Create a statement that can be definitively true or false. MANDATORY: Explanation must be under 150 characters total - maximum 2 short sentences explaining why the answer is correct. No fluff!';
  } else if (questionFormat === 'assertion_reason') { // ✨ NEW BLOCK
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

// function parseAndValidateResponse(content: string): Omit<Question, 'category' | 'topic'> | null {
//   try {
//     const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
//     const data = JSON.parse(cleanedContent);
//     if (!data.question || typeof data.question !== 'string' ||
//       !data.options || typeof data.options !== 'object' || Object.keys(data.options).length < 2 ||
//       !data.answer || typeof data.answer !== 'string' || !data.options[data.answer] ||
//       !data.explanation || typeof data.explanation !== 'string') {
//       throw new Error('AI response missing required JSON fields or has invalid structure.');
//     }

//     // Enforce explanation length limit (150 characters max for good video readability)
//     if (data.explanation.length > 150) {
//       console.warn(`Explanation too long (${data.explanation.length} chars), truncating to 150 chars`);
//       data.explanation = data.explanation.substring(0, 147) + '...';
//     }

//     return data;
//   } catch (error) {
//     console.error(`Failed to parse AI JSON response. Content: "${content}"`, error);
//     return null;
//   }
// }


function parseAndValidateResponse(content: string): Omit<Question, 'category' | 'topic'> | null {
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