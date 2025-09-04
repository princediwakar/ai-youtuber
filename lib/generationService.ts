import OpenAI from 'openai';
import { createQuizJob } from '@/lib/database';
import { Question } from './types';
import { MasterPersonas } from './personas';
import { getAccountConfig } from './accounts';

const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

/**
 * Generates unique variation markers for content diversity
 */
function generateVariationMarkers(): { timeMarker: string; tokenMarker: string; } {
  const timestamp = Date.now();
  const timeMarker = `T${timestamp}`;
  const tokenMarker = `TK${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  return { timeMarker, tokenMarker };
}

/**
 * Topic-specific guidelines for enhanced content generation
 */
const TOPIC_GUIDELINES = {
  // Brain Health Categories
  memory_techniques: {
    focus: 'Practical memory improvement strategies, mnemonics, and scientifically-proven techniques',
    hook: 'Reveal a surprising memory technique that viewers can master in minutes',
    scenarios: ['studying for exams', 'remembering names at events', 'recalling important information'],
    engagement: 'Challenge viewers to test the technique immediately'
  },
  focus_tips: {
    focus: 'Modern attention challenges and actionable concentration techniques',
    hook: 'Address the epidemic of digital distraction with proven focus methods',
    scenarios: ['working from home', 'studying with distractions', 'staying focused during meetings'],
    engagement: 'Promise immediate focus improvement'
  },
  brain_food: {
    focus: 'Specific nutrients, foods, and dietary patterns with measurable brain benefits',
    hook: 'Reveal surprising foods that dramatically boost brain power',
    scenarios: ['exam preparation meals', 'brain-boosting breakfast', 'foods that prevent memory loss'],
    engagement: 'Make viewers want to try the food today'
  },
  mental_exercises: {
    focus: 'Engaging cognitive challenges and neuroplasticity concepts',
    hook: 'Present a fun brain exercise that reveals cognitive abilities',
    scenarios: ['daily brain training', 'preventing cognitive decline', 'sharpening mental agility'],
    engagement: 'Include a mini-exercise viewers can try'
  },
  brain_lifestyle: {
    focus: 'Lifestyle factors that significantly impact cognitive function',
    hook: 'Expose how daily habits secretly damage or boost brain health',
    scenarios: ['morning routines', 'weekend activities', 'social interactions'],
    engagement: 'Motivate immediate lifestyle changes'
  },
  stress_management: {
    focus: 'Stress-brain connection with practical cortisol-reducing techniques',
    hook: 'Reveal how stress literally shrinks the brain and how to reverse it',
    scenarios: ['work stress', 'relationship anxiety', 'financial worries'],
    engagement: 'Offer instant stress relief techniques'
  },
  sleep_brain: {
    focus: 'Sleep-memory consolidation and optimal sleep habits for brain performance',
    hook: 'Expose the shocking truth about what happens to your brain during sleep',
    scenarios: ['pulling all-nighters', 'improving memory overnight', 'sleep quality optimization'],
    engagement: 'Promise better sleep and sharper thinking'
  },
  brain_myths: {
    focus: 'Debunking popular brain myths with surprising scientific truths',
    hook: 'Shatter a belief that 90% of people think is true but science proves wrong',
    scenarios: ['common misconceptions', 'things parents taught wrong', 'viral health claims'],
    engagement: 'Create "I had no idea!" moments'
  },
  
  // Eye Health Categories
  screen_protection: {
    focus: 'Digital eye strain prevention and blue light protection strategies',
    hook: 'Reveal what hours of screen time are actually doing to your eyes',
    scenarios: ['working from home', 'gaming sessions', 'late-night phone use'],
    engagement: 'Offer immediate relief from eye strain'
  },
  eye_exercises: {
    focus: 'Practical eye exercises and vision training techniques',
    hook: 'Teach a simple eye exercise that improves vision in 30 seconds',
    scenarios: ['computer work breaks', 'driving long distances', 'reading for hours'],
    engagement: 'Guide viewers through the exercise'
  },
  vision_nutrition: {
    focus: 'Foods and nutrients that directly support eye health and vision',
    hook: 'Reveal foods that can literally improve your eyesight',
    scenarios: ['preventing macular degeneration', 'foods for night vision', 'protecting aging eyes'],
    engagement: 'Make viewers want to eat these foods today'
  },
  eye_care_habits: {
    focus: 'Daily routines and habits that protect and improve eye health',
    hook: 'Expose daily habits that are secretly damaging your vision',
    scenarios: ['morning eye care', 'makeup and contacts', 'environmental protection'],
    engagement: 'Motivate immediate habit changes'
  },
  workplace_vision: {
    focus: 'Optimizing work environment and habits for eye health',
    hook: 'Reveal how your workspace setup is destroying your vision',
    scenarios: ['office lighting', 'monitor positioning', 'break strategies'],
    engagement: 'Offer instant workspace improvements'
  },
  eye_safety: {
    focus: 'Protection strategies for various activities and environments',
    hook: 'Show shocking eye injury statistics and how to prevent them',
    scenarios: ['sports activities', 'home improvement', 'outdoor adventures'],
    engagement: 'Create urgency about eye protection'
  },
  vision_myths: {
    focus: 'Debunking eye health myths with evidence-based facts',
    hook: 'Shatter common beliefs about vision that are completely wrong',
    scenarios: ['carrots improving vision', 'reading in dark', 'eye exercise limitations'],
    engagement: 'Create surprise and disbelief moments'
  },
  eye_fatigue: {
    focus: 'Preventing and treating digital eye strain and fatigue',
    hook: 'Reveal the hidden cause of your constant eye tiredness',
    scenarios: ['end-of-day eye strain', 'headaches from screens', 'tired eyes driving'],
    engagement: 'Promise immediate relief techniques'
  },
  
  // English Vocabulary Categories
  eng_vocab_word_meaning: {
    focus: 'Essential word definitions with memorable contexts and usage',
    hook: 'Test knowledge of a word that sounds simple but most people misuse',
    scenarios: ['job interviews', 'academic writing', 'professional communication'],
    engagement: 'Challenge viewers to use the word correctly'
  },
  eng_vocab_fill_blanks: {
    focus: 'Context-based vocabulary application and sentence completion',
    hook: 'Present a sentence that stumps even native speakers',
    scenarios: ['writing emails', 'giving presentations', 'casual conversations'],
    engagement: 'Test their sentence completion skills'
  },
  eng_spelling_bee: {
    focus: 'Challenging spelling with commonly misspelled words',
    hook: 'Challenge viewers with words that 80% of people spell wrong',
    scenarios: ['writing resumes', 'sending professional emails', 'taking tests'],
    engagement: 'Make them spell it out loud'
  },
  eng_vocab_word_forms: {
    focus: 'Grammar and word form variations (noun/verb/adjective)',
    hook: 'Test whether they know the correct form that even advanced learners miss',
    scenarios: ['formal writing', 'academic papers', 'business communications'],
    engagement: 'Challenge their grammar precision'
  },
  eng_vocab_synonyms: {
    focus: 'Word relationships and precise synonym usage',
    hook: 'Reveal synonym pairs that seem identical but have crucial differences',
    scenarios: ['avoiding repetition', 'upgrading vocabulary', 'expressing nuance'],
    engagement: 'Help them choose the perfect word'
  },
  eng_vocab_antonyms: {
    focus: 'Opposite word relationships and contrasting meanings',
    hook: 'Test antonym knowledge with words that have surprising opposites',
    scenarios: ['debates and arguments', 'creative writing', 'expressing contrast'],
    engagement: 'Challenge their opposite-word knowledge'
  },
  eng_vocab_shades_of_meaning: {
    focus: 'Subtle differences between similar words and precise usage',
    hook: 'Reveal why choosing the wrong "similar" word can change everything',
    scenarios: ['professional writing', 'expressing emotions', 'precise communication'],
    engagement: 'Help them master subtle distinctions'
  },
  eng_vocab_confusing_words: {
    focus: 'Commonly mixed-up word pairs and how to use them correctly',
    hook: 'Expose the word mistake that makes you sound less intelligent',
    scenarios: ['affect vs effect', 'complement vs compliment', 'principal vs principle'],
    engagement: 'Help them avoid embarrassing mistakes'
  },
  eng_vocab_collocations: {
    focus: 'Natural word partnerships and native-like expressions',
    hook: 'Reveal word combinations that instantly make you sound fluent',
    scenarios: ['business meetings', 'social situations', 'academic discussions'],
    engagement: 'Help them sound more natural'
  },
  eng_vocab_thematic_words: {
    focus: 'Topic-specific vocabulary for professional and academic contexts',
    hook: 'Master vocabulary that instantly elevates your expertise',
    scenarios: ['job interviews', 'industry discussions', 'academic presentations'],
    engagement: 'Help them speak like an expert'
  },
  eng_vocab_register: {
    focus: 'Appropriate formality levels and context-specific language',
    hook: 'Learn when casual language makes you look unprofessional',
    scenarios: ['business emails', 'social media', 'academic writing'],
    engagement: 'Help them match tone to context'
  },
  eng_vocab_phrasal_verbs: {
    focus: 'Essential phrasal verbs with multiple meanings and usage',
    hook: 'Master phrasal verbs that native speakers use 20 times per day',
    scenarios: ['casual conversations', 'business discussions', 'everyday situations'],
    engagement: 'Help them sound like a native speaker'
  },
  eng_vocab_idioms: {
    focus: 'Common idiomatic expressions and their cultural contexts',
    hook: 'Decode expressions that confuse non-native speakers',
    scenarios: ['movies and TV shows', 'casual conversations', 'cultural understanding'],
    engagement: 'Help them understand hidden meanings'
  },
  eng_vocab_prefixes_suffixes: {
    focus: 'Word building through roots, prefixes, and suffixes',
    hook: 'Unlock the secret to understanding thousands of words instantly',
    scenarios: ['reading comprehension', 'vocabulary building', 'test taking'],
    engagement: 'Teach them word-building superpowers'
  }
};

/**
 * Generates health content prompt based on persona, topic, and question format
 */
function generateHealthPrompt(persona: string, topic: string, topicData: any, markers: any, questionFormat: string): string {
  const { timeMarker, tokenMarker } = markers;
  const guidelines = TOPIC_GUIDELINES[topic as keyof typeof TOPIC_GUIDELINES];
  
  if (persona === 'brain_health_tips') {
    const basePrompt = `You are a renowned neuroscientist and brain health expert creating viral educational content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Advanced brain health concepts'}

VIRAL CONTENT STRATEGY:
• HOOK: ${guidelines?.hook || 'Present surprising brain health insights that challenge common assumptions'}
• SCENARIOS: Focus on ${guidelines?.scenarios?.join(', ') || 'relatable daily brain health challenges'}
• ENGAGEMENT: ${guidelines?.engagement || 'Create immediate practical value for viewers'}

Generate a ${questionFormat === 'multiple_choice' ? 'multiple choice' : 'true/false'} question that:

TARGET AUDIENCE: Health-conscious adults (25-55) seeking cognitive enhancement and brain longevity
CONTENT APPROACH:
• Lead with curiosity ("Did you know...?", "Most people don't realize...")
• Present evidence-based insights without medical jargon
• Include immediate practical applications
• Create "I need to share this" moments

QUESTION STRUCTURE (${questionFormat}):
${questionFormat === 'multiple_choice' 
  ? '• STEM: Present the scenario/fact as an engaging setup\n• CORRECT ANSWER: The scientifically accurate response with practical value\n• SMART DISTRACTORS: Common misconceptions, partially correct answers, believable alternatives\n• DIFFICULTY: Challenging enough to educate but achievable for motivated viewers' 
  : '• STATEMENT: Present a surprising, counterintuitive brain health fact\n• DESIGN: Create statements that reveal hidden truths or challenge assumptions\n• IMPACT: Ensure the answer provides immediate practical value'}

MANDATORY OUTPUT:
• "question": ${questionFormat === 'multiple_choice' ? 'Engaging scenario-based or fact-testing multiple choice question' : 'Surprising or myth-busting true/false statement'} 
• "options": ${questionFormat === 'multiple_choice' ? 'Object with "A", "B", "C", "D" - one correct answer, three clever distractors' : 'Object with "A": "True", "B": "False"'}
• "answer": ${questionFormat === 'multiple_choice' ? 'Single letter "A", "B", "C", or "D"' : 'Either "A" or "B"'}
• "explanation": Why this matters + practical application (under 150 characters)
• "cta": Action-oriented CTA (under 40 chars): "Try this now!", "Test your brain!", "Follow for brain hacks!"
• "question_type": "${questionFormat}"

Create content so valuable and surprising that viewers immediately share it. [${timeMarker}-${tokenMarker}]`;
    
    return basePrompt;
  }
  
  if (persona === 'eye_health_tips') {
    const basePrompt = `You are a leading optometrist and vision health expert creating viral educational content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Advanced eye health and vision protection strategies'}

VIRAL CONTENT STRATEGY:
• HOOK: ${guidelines?.hook || 'Reveal shocking truths about daily habits that damage vision'}
• SCENARIOS: Focus on ${guidelines?.scenarios?.join(', ') || 'modern vision challenges and digital eye strain'}
• ENGAGEMENT: ${guidelines?.engagement || 'Provide immediate eye health improvements viewers can implement'}

Generate a ${questionFormat === 'multiple_choice' ? 'multiple choice' : 'true/false'} question that:

TARGET AUDIENCE: Working professionals and screen users (20-50) seeking vision protection and eye health optimization
CONTENT APPROACH:
• Start with alarming or surprising eye health facts
• Address modern challenges (screens, blue light, digital lifestyle)
• Provide immediate, actionable prevention strategies
• Create urgency about long-term vision protection

QUESTION STRUCTURE (${questionFormat}):
${questionFormat === 'multiple_choice' 
  ? '• STEM: Present eye health scenario, myth, or surprising fact that resonates with screen users\n• CORRECT ANSWER: Evidence-based solution with immediate practical application\n• SMART DISTRACTORS: Common eye care myths, partially correct advice, believable misconceptions\n• RELEVANCE: Focus on digital age eye challenges and modern vision problems' 
  : '• STATEMENT: Present counterintuitive or surprising eye health fact that challenges assumptions\n• IMPACT: Create "I had no idea my habits were hurting my eyes" moments\n• URGENCY: Highlight immediate actions viewers can take to protect their vision'}

MANDATORY OUTPUT:
• "question": ${questionFormat === 'multiple_choice' ? 'Scenario-based multiple choice addressing modern vision challenges' : 'Eye-opening true/false statement about vision health'}
• "options": ${questionFormat === 'multiple_choice' ? 'Object with "A", "B", "C", "D" - practical solution + three plausible alternatives' : 'Object with "A": "True", "B": "False"'}
• "answer": ${questionFormat === 'multiple_choice' ? 'Single letter "A", "B", "C", or "D"' : 'Either "A" or "B"'}
• "explanation": Why this protects vision + immediate action step (under 150 characters)
• "cta": Urgent action CTA (under 40 chars): "Save your vision!", "Try this now!", "Protect your eyes!"
• "question_type": "${questionFormat}"

Create content that makes viewers immediately concerned about their eye health and motivated to take action. [${timeMarker}-${tokenMarker}]`;
    
    return basePrompt;
  }
  
  return '';
}

/**
 * Generates English quiz prompt based on topic
 */
function generateEnglishPrompt(topicData: any, topic: string, markers: any): string {
  const { timeMarker, tokenMarker } = markers;
  const guidelines = TOPIC_GUIDELINES[topic as keyof typeof TOPIC_GUIDELINES];
  
  if (topicData) {
    return `You are a viral English education expert creating addictive vocabulary content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Essential English vocabulary mastery'}

VIRAL LEARNING STRATEGY:
• HOOK: ${guidelines?.hook || 'Challenge viewers with vocabulary that separates fluent from intermediate speakers'}
• SCENARIOS: Apply to ${guidelines?.scenarios?.join(', ') || 'professional and academic communication'}
• ENGAGEMENT: ${guidelines?.engagement || 'Create immediate vocabulary upgrade opportunities'}

Generate a question that targets intermediate English learners (B1-B2 level) who want to sound more fluent and professional:

CONTENT APPROACH:
• Lead with confidence-building ("Master this and sound fluent!")
• Present vocabulary that elevates communication skills
• Include practical, immediate application opportunities
• Create "aha!" moments that boost learning motivation

QUESTION CRAFTING:
• PRECISION: Direct, clear questions that test practical usage
• RELEVANCE: Focus on words learners encounter in real situations
• DIFFICULTY: Challenging enough to teach but achievable for motivated learners
• DISTRACTORS: Include common mistakes, close alternatives, and learner confusions
• IMPACT: Provide vocabulary that immediately improves communication

MANDATORY OUTPUT:
• "question": Clear, practical vocabulary question that tests real-world usage
• "options": Object with "A", "B", "C", "D" - one perfect answer, three smart distractors based on common errors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Why this answer elevates communication + usage tip (under 150 characters)
• "cta": Motivational CTA (under 40 chars): "Follow for fluency!", "Like if you got it!", "Level up your English!"
• "question_type": Will be set automatically

Create vocabulary content that makes learners feel smarter and more confident immediately. [${timeMarker}-${tokenMarker}]`;
  } else {
    return `You are an expert English educator creating viral vocabulary content for YouTube Shorts.

Generate an intermediate (B1-B2 level) English vocabulary question on "${topic}" that challenges learners while building confidence.

REQUIREMENTS:
• HOOK: Present vocabulary that separates intermediate from advanced speakers
• PRACTICAL: Focus on words used in professional and academic contexts
• DISTRACTORS: Include common learner mistakes and plausible alternatives
• ENGAGEMENT: Create immediate "vocabulary upgrade" value
• EXPLANATION: Provide usage insight that elevates communication (under 150 characters)

Make learners feel accomplished and eager to share their new knowledge. [${timeMarker}-${tokenMarker}]`;
  }
}

/**
 * Generates a highly specific AI prompt based on the job's persona and configuration.
 */
async function generatePrompt(jobConfig: any): Promise<string> {
  const { persona, topic } = jobConfig;
  const markers = generateVariationMarkers();
  
  const personaData = MasterPersonas[persona];
  const topicData = personaData?.subCategories?.find(sub => sub.key === topic);

  let prompt = '';
  
  // Health content generation
  if (persona === 'brain_health_tips' || persona === 'eye_health_tips') {
    if (!topicData) {
      throw new Error(`Topic "${topic}" not found for persona "${persona}"`);
    }
    
    // Add format randomization for health content (70% multiple choice, 30% true/false)
    const rand = Math.random();
    const questionFormat = rand < 0.7 ? 'multiple_choice' : 'true_false';
    
    prompt = generateHealthPrompt(persona, topic, topicData, markers, questionFormat);
    
    if (questionFormat === 'multiple_choice') {
      return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "question", "options" (an object with keys "A", "B", "C", "D"), "answer" (a single letter "A", "B", "C", or "D"), "explanation", "cta", and "question_type" (set to "multiple_choice"). Explanation must be under 150 characters.';
    } else {
      return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "question", "options" (an object with keys "A": "True", "B": "False"), "answer" (either "A" or "B"), "explanation", "cta", and "question_type" (set to "true_false"). Create a true/false question about the health tip. Explanation must be under 150 characters.';
    }
  }
  
  // English content generation
  if (persona === 'english_vocab_builder') {
    prompt = generateEnglishPrompt(topicData, topic, markers);
    
    const rand = Math.random();
    const questionFormat = rand < 0.85 ? 'multiple_choice' : (rand < 1 ? 'true_false' : 'assertion_reason');

    if (questionFormat === 'true_false') {
      return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "question", "options" (an object with keys "A": "True", "B": "False"), "answer" (either "A" or "B"), "explanation", "cta", and "question_type" (set to "true_false"). Explanation must be under 150 characters.';
    } else if (questionFormat === 'assertion_reason') {
      return prompt + `\n\nCRITICAL: Generate an Assertion/Reason question. Format your response as a single, valid JSON object with these exact keys: "assertion", "reason", "options", "answer", "explanation", "cta", and "question_type" (set to "assertion_reason"). 
  
MANDATORY JSON STRUCTURE:
• "assertion": A statement of fact.
• "reason": A statement explaining the assertion.
• "options": Must be the standard A/B/C/D object.
• "answer": A single letter "A", "B", "C", or "D".
• "explanation": Max 2 short sentences (under 150 characters).
• "cta": A short call-to-action text.`;
    } else {
      return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "question", "options" (an object with keys "A", "B", "C", "D"), "answer" (a single letter "A", "B", "C", or "D"), "explanation", "cta", and "question_type" (set to "multiple_choice"). Explanation must be under 150 characters.';
    }
  }
  
  throw new Error(`Unsupported persona: ${persona}`);
}

/**
 * The main service function that orchestrates the generation and storage of content.
 * Now supports both English quizzes and Health tips.
 */
export async function generateAndStoreContent(jobConfig: any): Promise<any | null> {
  try {
    // Get account configuration using the provided accountId
    const account = await getAccountConfig(jobConfig.accountId);
    
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

    const contentData = parseAndValidateResponse(content, jobConfig.persona);
    if (!contentData) {
      throw new Error('Failed to parse or validate AI response.');
    }

    // Construct the payload for database insertion
    const topicKey = typeof jobConfig.topic === 'string' ? jobConfig.topic : jobConfig.topic?.key || 'unknown';
    const personaData = MasterPersonas[jobConfig.persona];
    const topicData = personaData?.subCategories?.find(sub => sub.key === topicKey);

    const jobPayload = {
      persona: jobConfig.persona,
      generation_date: jobConfig.generationDate,
      topic: topicKey,
      topic_display_name: topicData?.displayName || topicKey,
      question_format: contentData.question_type || 'multiple_choice',
      step: 2, // Next step is frame creation
      status: 'frames_pending',
      account_id: account.id, // Add account tracking
      data: {
        content: contentData,
        variation_markers: {
          time_marker: timeMarker,
          token_marker: tokenMarker,
          generation_timestamp: Date.now(),
          content_hash: generateContentHash(contentData)
        }
      }
    };

    const jobId = await createQuizJob(jobPayload);

    console.log(`[Job ${jobId}] ✅ Created ${account.name} content for persona "${jobConfig.persona}" [${timeMarker}-${tokenMarker}]`);
    return { 
      id: jobId, 
      ...jobConfig, 
      accountId: account.id,
      variationMarkers: { timeMarker, tokenMarker } 
    };

  } catch (error) {
    console.error(`❌ Failed to create content for persona "${jobConfig.persona}":`, error);
    return null;
  }
}

/**
 * Legacy wrapper function for backward compatibility
 * @deprecated Use generateAndStoreContent instead
 */
export async function generateAndStoreQuiz(jobConfig: any): Promise<any | null> {
  return generateAndStoreContent(jobConfig);
}

/**
 * Generates a content hash for duplicate detection and tracking
 */
function generateContentHash(content: any): string {
  const contentString = JSON.stringify({
    main: content.question,
    options: content.options,
    answer: content.answer,
    content_type: content.question_type
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

/**
 * Parse and validate AI response based on content type
 */
function parseAndValidateResponse(content: string, persona: string): any | null {
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);

    // Health content validation (supports both true_false and multiple_choice)
    if (persona === 'brain_health_tips' || persona === 'eye_health_tips') {
      if (!data.question || typeof data.question !== 'string' ||
          !data.options || typeof data.options !== 'object' ||
          !data.answer || typeof data.answer !== 'string' ||
          !data.explanation || typeof data.explanation !== 'string' ||
          !data.cta || typeof data.cta !== 'string' ||
          !data.question_type || 
          (data.question_type !== 'true_false' && data.question_type !== 'multiple_choice')) {
        throw new Error('Health question response missing required fields');
      }
      
      // Validate options structure based on question type
      if (data.question_type === 'true_false') {
        if (!data.options.A || !data.options.B || data.options.A !== 'True' || data.options.B !== 'False') {
          throw new Error('True/false health question must have options A: "True", B: "False"');
        }
      } else if (data.question_type === 'multiple_choice') {
        if (!data.options.A || !data.options.B || !data.options.C || !data.options.D) {
          throw new Error('Multiple choice health question must have options A, B, C, and D');
        }
        if (!['A', 'B', 'C', 'D'].includes(data.answer)) {
          throw new Error('Multiple choice health question answer must be A, B, C, or D');
        }
      }
      
      if (data.explanation.length > 150) {
        console.warn(`Health explanation too long (${data.explanation.length} chars), truncating`);
        data.explanation = data.explanation.substring(0, 147) + '...';
      }
      
      return data;
    }

    // English quiz validation
    if (persona === 'english_vocab_builder') {
      const hasQuestion = data.question && typeof data.question === 'string';
      const hasAssertionReason = data.assertion && typeof data.assertion === 'string' && 
                                data.reason && typeof data.reason === 'string';
      const hasCta = data.cta && typeof data.cta === 'string';

      if ((!hasQuestion && !hasAssertionReason) ||
          !hasCta ||
          !data.options || typeof data.options !== 'object' || Object.keys(data.options).length < 2 ||
          !data.answer || typeof data.answer !== 'string' || !data.options[data.answer] ||
          !data.explanation || typeof data.explanation !== 'string') {
        throw new Error('English quiz response missing required JSON fields');
      }
      
      if (data.explanation.length > 150) {
        console.warn(`English explanation too long (${data.explanation.length} chars), truncating`);
        data.explanation = data.explanation.substring(0, 147) + '...';
      }

      return data;
    }

    throw new Error(`Unsupported persona for validation: ${persona}`);
    
  } catch (error) {
    console.error(`Failed to parse AI JSON response for persona ${persona}. Content: "${content}"`, error);
    return null;
  }
}