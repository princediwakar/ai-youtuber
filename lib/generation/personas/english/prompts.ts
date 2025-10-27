// lib/generation/personas/english/prompts.ts
/**
 * English vocabulary prompt templates
 * All English-specific content generation prompts
 */

import { 
  PromptConfig,
  TopicGuideline,
  addJsonFormatInstructions // <-- FIX: IMPORT THIS
} from '../../shared/utils';

/**
 * English-specific topic guidelines
 * Moved from topicGuidelines.ts for better organization and reduced dependencies
 */
// ... (ENGLISH_TOPIC_GUIDELINES remains the same) ...
const ENGLISH_TOPIC_GUIDELINES: Record<string, TopicGuideline> = {
  // English Learning - Optimized for 15s Videos
  eng_common_mistakes: {
    focus: 'One grammar/usage mistake that sounds right but is wrong',
    scenarios: ['emails', 'texts', 'speaking'],
    engagement: 'Check if you make this mistake too'
  },
  eng_grammar_hacks: {
    focus: 'One simple grammar rule that fixes multiple mistakes instantly',
    scenarios: ['writing', 'speaking', 'exams'],
    engagement: 'Use this rule in your next sentence'
  },
  eng_spelling_tricks: {
    focus: 'One memorable trick to spell difficult words correctly',
    scenarios: ['writing', 'texting', 'professional communication'],
    engagement: 'Try spelling it without looking'
  },
  
  // English Vocabulary - Quick Wins
  eng_vocab_word_meaning: {
    focus: 'One word that 90% of people use incorrectly with simple fix',
    scenarios: ['daily conversations', 'texting', 'work emails'],
    engagement: 'Use the word correctly in your next sentence'
  },
  eng_vocab_fill_blanks: {
    focus: 'One perfect word that completes a tricky sentence',
    scenarios: ['writing', 'speaking', 'exams'],
    engagement: 'Pause and guess before the reveal'
  },
  eng_vocab_synonyms: {
    focus: 'Two words that seem the same but have one crucial difference',
    scenarios: ['writing', 'speaking', 'exams'],
    engagement: 'Test if you know the difference'
  },
  eng_vocab_antonyms: {
    focus: 'One word pair with a surprising opposite that tricks everyone',
    scenarios: ['conversations', 'writing', 'vocabulary tests'],
    engagement: 'Guess the opposite before we reveal it'
  },
  eng_vocab_register: {
    focus: 'One word that changes meaning from formal to casual contexts',
    scenarios: ['work emails', 'job interviews', 'presentations'],
    engagement: 'Check if you use this word correctly'
  }
};

/**
 * Get English-specific topic guidelines with fallback
 */
function getEnglishTopicGuidelines(topic: string): TopicGuideline | undefined {
  return ENGLISH_TOPIC_GUIDELINES[topic];
}

/**
 * Generates simplified word format prompt for single-frame videos
 * ENHANCED: Added MCQ-style variability and topic-specific guidelines
 */
// ... (generateSimplifiedWordPrompt remains the same) ...
export function generateSimplifiedWordPrompt(config: PromptConfig): string {
  const { topicData, topic, markers, timingContext, analyticsInsights } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getEnglishTopicGuidelines(topic);
  
  const primaryAudience = 'English learners';
  const timingPrefix = timingContext ? `${timingContext.timeOfDay.toUpperCase()} LEARNING` : 'VIRAL LEARNING';
  const audienceContext = timingContext?.audience || primaryAudience;
  
  // Add variability patterns inspired by MCQ prompts
  const variabilityPatterns = [
    {
      approach: 'confidence_building',
      focus: 'Master vocabulary that makes you sound instantly more professional',
      criteria: 'Choose words that separate confident speakers from hesitant ones',
      engagement: 'Use this word in your next conversation to sound fluent'
    },
    {
      approach: 'mistake_avoidance', 
      focus: 'Learn words that 90% of people mispronounce or misuse',
      criteria: 'Target common vocabulary errors that embarrass learners',
      engagement: 'Stop making this vocabulary mistake that everyone notices'
    },
    {
      approach: 'upgrade_language',
      focus: 'Replace basic words with sophisticated alternatives',
      criteria: 'Find elevated vocabulary that transforms communication',
      engagement: 'Upgrade your vocabulary and sound more educated'
    },
    {
      approach: 'contextual_precision',
      focus: 'Master words that show deep English understanding',
      criteria: 'Choose vocabulary that demonstrates advanced fluency',
      engagement: 'Use precise vocabulary that impresses native speakers'
    }
  ];
  
  // Select random pattern for variability
  const selectedPattern = variabilityPatterns[Math.floor(Math.random() * variabilityPatterns.length)];
  
  // Add topic-specific word categories for more variety
  const wordCategories = {
    'eng_pronunciation_fails': ['commonly mispronounced words', 'tricky pronunciation patterns', 'silent letter words'],
    'eng_vocab_word_meaning': ['misused words', 'confused word pairs', 'formal vs casual vocabulary'],
    'eng_vocab_synonyms': ['nuanced synonyms', 'near-similar words', 'register-specific alternatives'],
    'eng_grammar_hacks': ['grammar-improving vocabulary', 'structure-changing words', 'clarity-enhancing terms'],
    'eng_common_mistakes': ['commonly confused words', 'false friends', 'similar-sounding pairs']
  };
  
  const categoryList = wordCategories[topic] || ['professional vocabulary', 'academic terms', 'advanced expressions'];
  const selectedCategory = categoryList[Math.floor(Math.random() * categoryList.length)];
  
  // ANALYTICS INTEGRATION: Push for better performing topics if data is available
  const topTopicHint = analyticsInsights?.topPerformingTopics?.[0]?.topic ? 
    ` (HINT: Your audience loves content on "${analyticsInsights.topPerformingTopics[0].topic}")` : '';

  if (topicData) {
    return `You are a **VIRAL ENGLISH HUSTLER** creating highly addictive, 15-second vocabulary fixes for YouTube Shorts. Your goal is MAX engagement and growth.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Essential English vocabulary mastery'}

${timingPrefix} STRATEGY:
• APPROACH: **HIGH-IMPACT UPGRADE** - ${selectedPattern.focus}
• PSYCHOLOGY: Leverage social proof (90% statistics) + **FEAR OF SOUNDING DUMB** + guarantee a quick confidence fix.
• SCENARIOS: Make it immediately relevant to **CAREER ADVANCEMENT** in ${guidelines?.scenarios?.join(', ')}
• ENGAGEMENT: **DEMAND** action: ${selectedPattern.engagement}
• TIMING: Perfect for **MAX SCROLL-STOPPING** during ${timingContext?.timeOfDay || 'daily'} learning sessions.
• CATEGORY FOCUS: Prioritize **HIGH-VALUE, LOW-FREQUENCY** words in ${selectedCategory}${topTopicHint}

Generate vocabulary content that targets ${audienceContext} who want to **sound fluent, educated, and professional INSTANTLY**:

ENHANCED WORD SELECTION:
• PRECISION: **Choose a WORD THAT SEPARATES NATIVE FROM NON-NATIVE SPEAKERS.** ${selectedPattern.criteria}
• RELEVANCE: Focus on vocabulary that is an **IMMEDIATE COMMUNICATIVE POWER UP**.
• DIFFICULTY: Challenging enough to be a teaching moment, but easy to master in 15 seconds.
• IMPACT: Provide vocabulary that immediately **IMPRESSES COLLEAGUES/PROFESSORS**.
• SCENARIOS: Must be usable in a **HIGH-STAKES professional context**.
• VARIABILITY: Avoid common/basic words - choose **DISTINCTIVE, MEMORABLE, STATUS-ELEVATING** vocabulary.

CONTENT APPROACH VARIATION:
• Lead with a statement that makes the viewer feel like they are **LITERALLY UPGRADING THEIR BRAIN**.
• Create **"AHA!" MOMENTS** that are easy to screenshot and share.
• Focus on ${selectedCategory} to provide topic-specific value.

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "word": "vocabulary_word_here",
  "pronunciation": "phonetic_guide_here", 
  "part_of_speech": "noun/verb/adjective/etc",
  "definition": "clear_definition_under_100_chars",
  "usage": "example_sentence_under_120_chars",
  "format_type": "simplified_word"
}

CRITICAL: Return EXACTLY ONE JSON object as shown above. Do NOT return an array. Do NOT return multiple objects. The format_type MUST be "simplified_word" exactly. Do NOT use markdown formatting (no triple backticks). Return ONLY the single JSON object above. No markdown, no explanations, no additional content.

[${timeMarker}-${tokenMarker}]`;
  } else {
    // Fallback prompt (less detailed but still high-impact)
    return `You are an expert English educator creating viral vocabulary content for YouTube Shorts.

ENHANCED GENERATION APPROACH: **VIRAL GROWTH HACK** - ${selectedPattern.approach.replace('_', ' ').toUpperCase()}
• FOCUS: ${selectedPattern.focus}
• CRITERIA: **HIGH-STATUS VOCABULARY**. ${selectedPattern.criteria}
• ENGAGEMENT: **CREATE A SENSE OF URGENCY**. ${selectedPattern.engagement}

Generate vocabulary content for ${primaryAudience} on "${topic}" that delivers a powerful, immediate language upgrade.

ENHANCED REQUIREMENTS:
• WORD FOCUS: Choose ONE vocabulary word that directly addresses the topic "${topic}" with **high career/academic impact**.
• PRACTICAL: Focus on words used in **boardrooms and academic papers**.
• ENGAGEMENT: Create immediate "vocabulary upgrade" value that feels like a secret cheat code.
• DEFINITION: Provide a **shockingly clear** explanation that elevates communication (under 100 characters).
• USAGE: Include a **powerful, professional example** that shows expert application (under 120 characters).
• VARIABILITY: Avoid repetitive word choices - select **distinctive, memorable, high-value** vocabulary.
• CATEGORY: Target ${selectedCategory} specifically within this topic area.

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "word": "vocabulary_word_here",
  "pronunciation": "phonetic_guide_here",
  "part_of_speech": "noun/verb/adjective/etc", 
  "definition": "clear_definition",
  "usage": "professional_context_example",
  "format_type": "simplified_word"
}

CRITICAL: Return EXACTLY ONE JSON object as shown above. Do NOT return an array. Do NOT return multiple objects. The format_type MUST be "simplified_word" exactly. Do NOT use markdown formatting (no triple backticks). Return ONLY the single JSON object above. No markdown, no explanations, no additional content.

[${timeMarker}-${tokenMarker}]`;
  }
}

/**
 * Generates main English vocabulary prompt for MCQ format
 * SIMPLIFIED & BEGINNER-FRIENDLY - Based on "90% Say This WRONG" (176 views - best performer)
 */
export function generateEnglishPrompt(config: PromptConfig): string {
  const { topicData, topic, markers, questionFormat = 'multiple_choice' } = config; // <-- FIX: Added questionFormat
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getEnglishTopicGuidelines(topicData?.key || topic); // <-- FIX: Use topicData.key

  let basePrompt: string; // <-- FIX: Declare basePrompt

  if (topicData) {
    basePrompt = `You are a friendly English teacher creating fun vocabulary quizzes for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Common English mistakes and word usage'}

TONE: Curious, inviting, beginner-friendly (NO shame, NO "stop sounding basic", focus on LEARNING)

CONTENT STYLE:
• Make it feel like learning a fun fact, not fixing embarrassment
• Focus on common mistakes everyone makes
• Use simple explanations
• Make people want to share because it's interesting, not because they're scared

QUESTION REQUIREMENTS:
• "question": Clear vocab question anyone can understand (MAX 120 chars, NO hook text)
• "options": A, B, C, D - short, clear options (each MAX 45 chars)
• "answer": Correct letter (A, B, C, or D)
• "explanation": Why this matters in simple terms (MAX 120 chars)
• "cta": Friendly learning CTA under 80 chars
• "content_type": "${questionFormat}"

TARGET: English learners who want to improve without feeling judged

Create content that makes learners feel smart and curious. [${timeMarker}-${tokenMarker}]`;
  } else {
    basePrompt = `You are a friendly English teacher creating vocabulary quizzes for YouTube Shorts.

TOPIC: "${topic}" - Common English mistakes and word usage

TONE: Curious, inviting, beginner-friendly

Make questions that feel like fun discoveries, not tests. [${timeMarker}-${tokenMarker}]`;
  }

  // --- FIX: Apply the JSON formatting instructions ---
  return addJsonFormatInstructions(basePrompt, questionFormat);
}