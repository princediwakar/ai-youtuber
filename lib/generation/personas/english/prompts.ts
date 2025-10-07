// lib/generation/personas/english/prompts.ts
/**
 * English vocabulary prompt templates
 * All English-specific content generation prompts
 */

import { 
  PromptConfig,
  TopicGuideline
} from '../../shared/utils';

/**
 * English-specific topic guidelines
 * Moved from topicGuidelines.ts for better organization and reduced dependencies
 */
const ENGLISH_TOPIC_GUIDELINES: Record<string, TopicGuideline> = {
  // English Learning - Optimized for 15s Videos
  eng_pronunciation_fails: {
    focus: 'One commonly mispronounced word with correct pronunciation and memory trick',
    hook: '90% of people say this word wrong (are you one of them?)',
    scenarios: ['job interviews', 'presentations', 'daily conversations'],
    engagement: 'Say the word out loud right now'
  },
  eng_common_mistakes: {
    focus: 'One grammar/usage mistake that sounds right but is wrong',
    hook: 'Stop embarrassing yourself with this common mistake',
    scenarios: ['emails', 'texts', 'speaking'],
    engagement: 'Check if you make this mistake too'
  },
  eng_grammar_hacks: {
    focus: 'One simple grammar rule that fixes multiple mistakes instantly',
    hook: 'This 5-second rule fixes your English forever',
    scenarios: ['writing', 'speaking', 'exams'],
    engagement: 'Use this rule in your next sentence'
  },
  eng_spelling_tricks: {
    focus: 'One memorable trick to spell difficult words correctly',
    hook: 'Never misspell this tricky word again',
    scenarios: ['writing', 'texting', 'professional communication'],
    engagement: 'Try spelling it without looking'
  },
  
  // English Vocabulary - Quick Wins
  eng_vocab_word_meaning: {
    focus: 'One word that 90% of people use incorrectly with simple fix',
    hook: 'You\'ve been using this word wrong your whole life',
    scenarios: ['daily conversations', 'texting', 'work emails'],
    engagement: 'Use the word correctly in your next sentence'
  },
  eng_vocab_fill_blanks: {
    focus: 'One perfect word that completes a tricky sentence',
    hook: 'Can you fill this blank that stumps English experts?',
    scenarios: ['writing', 'speaking', 'exams'],
    engagement: 'Pause and guess before the reveal'
  },
  eng_vocab_synonyms: {
    focus: 'Two words that seem the same but have one crucial difference',
    hook: 'These twin words are NOT the same (here\'s why)',
    scenarios: ['writing', 'speaking', 'exams'],
    engagement: 'Test if you know the difference'
  },
  eng_vocab_antonyms: {
    focus: 'One word pair with a surprising opposite that tricks everyone',
    hook: 'The opposite of this word will shock you',
    scenarios: ['conversations', 'writing', 'vocabulary tests'],
    engagement: 'Guess the opposite before we reveal it'
  },
  eng_vocab_register: {
    focus: 'One word that changes meaning from formal to casual contexts',
    hook: 'Using this word casually makes you sound unprofessional',
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
• PATTERN: Use a **1-LINE, DRAMATIC HOOK** + immediate confidence fix.
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
 */
export function generateEnglishPrompt(config: PromptConfig): string {
  const { topicData, topic, markers, timingContext, analyticsInsights } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getEnglishTopicGuidelines(topic);
  
  const primaryAudience = 'English learners';
  const timingPrefix = timingContext ? `${timingContext.timeOfDay.toUpperCase()} LEARNING` : 'VIRAL LEARNING';
  const audienceContext = timingContext?.audience || primaryAudience;
  
  // ANALYTICS INTEGRATION: Suggest testing the best performing format if available
  const bestFormatHint = analyticsInsights?.formatInsights?.bestFormat && analyticsInsights.formatInsights.bestFormat !== 'mcq' ?
    ` (NOTE: Your audience strongly prefers the **${analyticsInsights.formatInsights.bestFormat.toUpperCase()}** format - tailor the tone for maximum engagement).` : '';

  if (topicData) {
    return `You are a **HYPER-ENGAGING VOCABULARY QUIZ MASTER** creating highly viral, 15-second multiple-choice challenges for YouTube Shorts. Your goal is to maximize shares and comments.

TOPIC: "${topicData.displayName}" - **DRAMATICALLY** improve English fluency via ${guidelines?.focus || 'Essential English vocabulary mastery'}

${timingPrefix} STRATEGY:
• HOOK: Generate a **SINGLE-LINE, HYPER-CURIOUS, CONTEXTUAL QUESTION** (15-25 chars, use emojis like '🤯', '🔥', '🤔', '🚨'). The hook must create an immediate sense of **"I MUST KNOW THIS ANSWER."**
• PSYCHOLOGY: Leverage **FOMO (Fear of Missing Out)** + the competitive nature of a quiz. Guarantee a quick fix that feels like a cheat code.
• SCENARIOS: Apply to high-stakes moments like **JOB INTERVIEWS or UNIVERSITY ESSAYS**.
• ENGAGEMENT: **FORCE THE VIEWER TO PAUSE AND GUESS**. ${guidelines?.engagement || 'Create immediate vocabulary upgrade opportunities'}
• PATTERN: **DRAMA HOOK** + challenging question + quick confidence fix.
• TIMING: Maximize **INTERACTION**. ${timingContext?.timeOfDay || 'daily'} learning sessions.

Generate a question that targets ${audienceContext} who want to **stop sounding basic** and start sounding **fluent and authoritative**:

QUESTION CRAFTING:
• PRECISION: Direct, clear questions that test **HIGH-VALUE, NUANCED** usage.
• RELEVANCE: Focus on words that are common pitfalls or **STATUS SYMBOLS** in English.
• DIFFICULTY: Must feel challenging, but the explanation should be a massive "aha!" moment.
• DISTRACTORS: Include extremely plausible errors (the mistakes 90% of educated people make).
• IMPACT: Provide vocabulary that immediately **ELEVATES THE VIEWER'S SOCIAL STATUS**.

MANDATORY OUTPUT:
• "hook": Generate a **HYPER-ENGAGING HOOK** (15-25 chars, use emojis, reference actual word/concept). Examples: "Affect or Effect? The TRUE Test! 🔥", "This word is a lie! 🤯", "The 1% know this... 🤫"
• "question": Clear, practical vocabulary question that tests real-world usage (NO hook text in question)
• "options": Object with "A", "B", "C", "D" - one perfect answer, three **SMART, PLAUSIBLE** distractors based on common errors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": **The ultimate mic-drop explanation.** Explain *why* the answer is correct and *how* using it correctly makes the speaker sound superior (under 120 characters)
• "cta": Generate an engaging, **URGENT** English learning CTA (under 80 chars - make it compelling and action-oriented, e.g., "Hit FOLLOW to stop sounding basic!").
• "content_type": "multiple_choice"

Create vocabulary content that makes learners feel like they've just unlocked an English superpower. ${bestFormatHint} [${timeMarker}-${tokenMarker}]`;
  } else {
    return `You are an expert English educator creating viral vocabulary content for YouTube Shorts.

Generate a question for ${primaryAudience} on "${topic}" that challenges while building confidence.

REQUIREMENTS:
• HOOK: Generate a **HIGH-IMPACT, CONTEXTUAL HOOK** (15-25 chars, reference actual word/concept)
• QUESTION: Present vocabulary that separates intermediate from **ADVANCED, HIGH-STATUS** speakers (NO hook text in question)
• PRACTICAL: Focus on words used in **professional and academic contexts**
• DISTRACTORS: Include common learner mistakes and plausible alternatives
• ENGAGEMENT: Create immediate "vocabulary upgrade" value
• EXPLANATION: Provide **high-value usage insight** that elevates communication (under 120 characters)
• CTA: Generate an engaging vocabulary CTA that **demands a follow** (under 80 chars - make it compelling and action-oriented)

OUTPUT FORMAT:
• "hook": Contextual hook referencing the specific word/concept being tested
• "question": Clean vocabulary question without hook elements

Make learners feel accomplished and eager to share their new knowledge. [${timeMarker}-${tokenMarker}]`;
  }
}

/**
 * Generates Common Mistake format prompt (English)
 */
export function generateCommonMistakePrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

  return `You are a native English speaker creating viral "Common Mistake" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - Focus on mistakes that **99% of learners make and sound unprofessional**

FORMAT: Common Mistake (4 frames)
Frame 1 (Hook): "**STOP EMBARRASSING YOURSELF** with this word!"  
Frame 2 (Mistake): "99% say: [incorrect pronunciation/usage] (Sounds Basic)"
Frame 3 (Correct): "**Natives say:** [correct version] (Sound Fluent)"
Frame 4 (Practice): "Try it now! Repeat after me..."

CONTENT REQUIREMENTS:
• HOOK: Create **MAXIMUM URGENCY** about a common error most learners make.
• MISTAKE: Show the wrong way that sounds natural but isn't correct—label it as 'Basic' or 'Unprofessional'.
• CORRECT: Provide the native speaker version with clear difference—label it as 'Fluent' or 'Expert'.
• PRACTICE: Give **immediate practice opportunity for confidence boost**.

TARGET: Intermediate English learners who want to sound **more native and less clumsy**.

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "hook": "contextual_hook_based_on_mistake_under_25_chars",
  "mistake": "incorrect_version_most_learners_use",
  "correct": "native_speaker_version",
  "practice": "practice_instruction_with_correct_form",
  "explanation": "why_natives_use_this_version_under_100_chars",
  "cta": "engaging_English_learning_CTA_under_80_chars",
  "format_type": "common_mistake"
}

IMPORTANT: Return ONLY the JSON object above. No markdown, no explanations, no additional content.

Create content that makes learners feel embarrassed about their mistake but **excited to fix it and gain social status**. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Generates Quick Fix format prompt (English)  
 */
export function generateQuickFixPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

  return `You are an English fluency coach creating viral "Quick Fix" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - **Instant Vocabulary Status Upgrades**

FORMAT: Quick Fix (3 frames)
Frame 1 (Hook): "**STOP SOUNDING BASIC** - Upgrade now!"
Frame 2 (Before): "Instead of saying [basic word] (The Basic Way)..."  
Frame 3 (After): "**SOUND SMARTER** with [advanced word] (The Expert Way)"

CONTENT REQUIREMENTS:
• HOOK: Promise **immediate vocabulary improvement and social status gain**.
• BEFORE: Common basic word that sounds childish/unprofessional—label it clearly as the "Basic Way."
• AFTER: Advanced alternative that sounds sophisticated—label it clearly as the "Expert Way."
• Include **impactful usage example** in professional/academic context.

TARGET: Intermediate learners who want to **sound more powerful and professional**.

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "hook": "contextual_hook_based_on_vocabulary_upgrade_under_25_chars",
  "basic_word": "simple_word_to_replace",
  "advanced_word": "sophisticated_alternative",
  "usage_example": "professional_context_example",
  "explanation": "why_advanced_word_is_better_under_100_chars",
  "cta": "engaging_English_upgrade_CTA_under_80_chars",
  "format_type": "quick_fix"
}

IMPORTANT: Return ONLY the JSON object above. No markdown, no explanations, no additional content.

Create content that makes learners immediately feel **empowered and superior**. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Generates Usage Demo format prompt (English)
 */
export function generateUsageDemoPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

  return `You are an English fluency expert creating viral "Usage Demo" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - **Mastering the Contextual Nuances of High-Value Words**

FORMAT: Usage Demo (4 frames)
Frame 1 (Hook): "**STOP GUESSING** - Use this word like a native."
Frame 2 (Wrong): "❌ **NOPE** Don't use it here: [wrong example]"
Frame 3 (Right): "✅ **EXPERT** Perfect usage: [correct example]"  
Frame 4 (Practice): "Your turn to try!"

CONTENT REQUIREMENTS:
• HOOK: Promise to show **CONTEXTUAL MASTERY** of an advanced, tricky word.
• WRONG: Common misuse that sounds plausible but is incorrect—clearly marked with '❌ NOPE'.
• RIGHT: Perfect contextual usage that sounds natural and professional—clearly marked with '✅ EXPERT'.
• PRACTICE: Interactive challenge for viewer engagement.

TARGET: Advanced learners who want **contextual precision and zero mistakes**.

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "hook": "contextual_hook_based_on_word_usage_under_25_chars",
  "target_word": "advanced_vocabulary_word_to_demonstrate",
  "wrong_example": "sentence_showing_incorrect_contextual_usage",
  "wrong_context": "brief_explanation_why_wrong_under_80_chars",
  "right_example": "sentence_showing_perfect_contextual_usage",
  "right_context": "brief_explanation_why_correct_under_80_chars",
  "practice": "practice_instruction_with_scenario",
  "practice_scenario": "specific_context_for_learner_to_practice",
  "cta": "engaging_vocabulary_mastery_CTA_under_80_chars",
  "format_type": "usage_demo"
}

IMPORTANT: Return ONLY the JSON object above. No markdown, no explanations, no additional content.

Create content that makes learners **confident and detail-oriented** about contextual word usage. [${timeMarker}-${tokenMarker}]`;
}