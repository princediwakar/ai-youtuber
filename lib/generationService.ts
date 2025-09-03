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

  if (persona === 'english_vocab_builder') {
    if (topicData) {
      // Refined the prompt with much clearer instructions for hooks and CTAs.
      prompt = `You are an expert English teacher creating a viral quiz for a YouTube Short.
Generate a single, clear English vocabulary question on the topic: "${topicData.displayName}".

CRITICAL REQUIREMENTS:
• HOOK: Create curiosity and urgency (under 55 chars). Use these high-engagement patterns:
  - "Only 1 in 10 know this word!"
  - "Think you're ready for this?"
  - "This word stumps most people!"
  - "Can you beat 90% of learners?"
  - "Advanced word challenge!"
• TARGET AUDIENCE: Intermediate English learners (B1-B2 level).
• QUESTION STYLE: Must be direct and concise. For "Fill in the Blank," provide a clear sentence. For "Synonyms/Antonyms," directly ask for the synonym/antonym of a given word.
• DIFFICULTY: The correct answer should be a useful, common word, but not too easy.
• DISTRACTORS: The incorrect options (A, B, C, D) must be plausible and relate to common learner confusions.
• EXPLANATION: The explanation MUST BE ULTRA-CONCISE (under 150 characters). Simply explain why the answer is correct in plain English.
• CTA: Simple and friendly (under 40 chars). Use these patterns:
  - "Follow for more!"
  - "Like if you got it!"
  - "More quizzes coming!"
  - "Subscribe for daily words!"
  - "Share with a friend!"

Focus on creating a high-quality, engaging question that is perfect for a quick quiz format. [${timeMarker}-${tokenMarker}]`;
    } else {
      prompt = `Generate a general intermediate (B1-B2 level) English vocabulary MCQ on the topic of "${topic}". The question must be clear and concise for a YouTube Short. The incorrect options must be plausible distractors. The explanation must be under 150 characters. Also generate a short "hook" text and a short "cta" text. [${timeMarker}-${tokenMarker}]`;
    }
  } else {
    throw new Error(`Unsupported persona: ${persona}. Only 'english_vocab_builder' is supported.`);
  }
  
  const rand = Math.random();
  const questionFormat = rand < 0.75 ? 'multiple_choice' : (rand < 1 ? 'true_false' : 'assertion_reason');

  // --- MODIFICATION START ---
  // Updated the JSON structure in all prompts to include "hook" and "cta"
    // Updated the JSON structure in all prompts to include "hook" and "cta"
    if (questionFormat === 'true_false') {
      return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "hook", "question", "options" (an object with keys "True", "False"), "answer" (either "True" or "False"), "explanation", "cta", and "question_type" (set to "true_false"). Explanation must be under 150 characters.';
    } else if (questionFormat === 'assertion_reason') {
      return prompt + `\n\nCRITICAL: Generate an Assertion/Reason question. Format your response as a single, valid JSON object with these exact keys: "hook", "assertion", "reason", "options", "answer", "explanation", "cta", and "question_type" (set to "assertion_reason"). 
  
  MANDATORY JSON STRUCTURE:
  • "hook": A short, catchy hook text.
  • "assertion": A statement of fact.
  • "reason": A statement explaining the assertion.
  • "options": Must be the standard A/B/C/D object.
  • "answer": A single letter "A", "B", "C", or "D".
  • "explanation": Max 2 short sentences (under 150 characters).
  • "cta": A short call-to-action text.`;
    }
    else {
      return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "hook", "question", "options" (an object with keys "A", "B", "C", "D"), "answer" (a single letter "A", "B", "C", or "D"), "explanation", "cta", and "question_type" (set to "multiple_choice"). Explanation must be under 150 characters.';
    }
  
  // --- MODIFICATION END ---
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

    // --- MODIFICATION START ---
    // Updated validation to check for hook, cta, and question/assertion
    const hasQuestion = data.question && typeof data.question === 'string';
    const hasAssertionReason = data.assertion && typeof data.assertion === 'string' && data.reason && typeof data.reason === 'string';
    const hasHook = data.hook && typeof data.hook === 'string';
    const hasCta = data.cta && typeof data.cta === 'string';

    if ((!hasQuestion && !hasAssertionReason) ||
      !hasHook || !hasCta || // Check for hook and cta
      !data.options || typeof data.options !== 'object' || Object.keys(data.options).length < 2 ||
      !data.answer || typeof data.answer !== 'string' || !data.options[data.answer] ||
      !data.explanation || typeof data.explanation !== 'string') {
      throw new Error('AI response missing required JSON fields (including hook/cta) or has invalid structure.');
    }
    // --- MODIFICATION END ---
    
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
