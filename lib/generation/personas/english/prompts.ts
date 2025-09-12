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
 * Generates main English vocabulary prompt for MCQ format
 */
export function generateEnglishPrompt(config: PromptConfig): string {
  const { topicData, topic, markers, timingContext, analyticsInsights } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getEnglishTopicGuidelines(topic);
  
  const primaryAudience = 'English learners';
  const timingPrefix = timingContext ? `${timingContext.timeOfDay.toUpperCase()} LEARNING` : 'VIRAL LEARNING';
  const audienceContext = timingContext?.audience || primaryAudience;
  
  if (topicData) {
    return `You are a viral English education expert creating addictive vocabulary content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Essential English vocabulary mastery'}

${timingPrefix} STRATEGY:
• HOOK: Generate contextual hooks based on the specific vocabulary being tested (15-25 chars, reference actual word/concept)
• PSYCHOLOGY: Use social proof (90% statistics) + embarrassment avoidance + high self-efficacy (you can quickly fix this)
• SCENARIOS: Apply to ${guidelines?.scenarios?.join(', ') || 'professional and academic communication'}
• ENGAGEMENT: ${guidelines?.engagement || 'Create immediate vocabulary upgrade opportunities'}
• PATTERN: Social proof statistic + "Are you making this mistake?" + quick confidence fix
• TIMING: Perfect for ${timingContext?.timeOfDay || 'daily'} learning sessions

Generate a question that targets ${audienceContext} who want to sound more fluent and professional:

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
• "hook": Generate a contextual hook based on the specific vocabulary being tested (15-25 chars, curious/empowering, reference the actual word/concept). Examples: "Historic vs Historical? 🤔", "Affect or Effect? 💭", "Literally shocking! ⚡"
• "question": Clear, practical vocabulary question that tests real-world usage (NO hook text in question)
• "options": Object with "A", "B", "C", "D" - one perfect answer, three smart distractors based on common errors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Why this answer elevates communication + usage tip (under 120 characters)
• "cta": Generate an engaging English learning CTA (under 80 chars - make it compelling and action-oriented)
• "content_type": Will be set automatically

Create vocabulary content that makes learners feel smarter and more confident immediately. [${timeMarker}-${tokenMarker}]`;
  } else {
    return `You are an expert English educator creating viral vocabulary content for YouTube Shorts.

Generate a question for ${primaryAudience} on "${topic}" that challenges while building confidence.

REQUIREMENTS:
• HOOK: Generate contextual hook based on the specific vocabulary (15-25 chars, reference actual word/concept)
• QUESTION: Present vocabulary that separates intermediate from advanced speakers (NO hook text in question)
• PRACTICAL: Focus on words used in professional and academic contexts
• DISTRACTORS: Include common learner mistakes and plausible alternatives
• ENGAGEMENT: Create immediate "vocabulary upgrade" value
• EXPLANATION: Provide usage insight that elevates communication (under 120 characters)
• CTA: Generate an engaging vocabulary CTA (under 80 chars - make it compelling and action-oriented)

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

TOPIC: "${topicData.displayName}" - Focus on mistakes that 99% of learners make

FORMAT: Common Mistake (4 frames)
Frame 1 (Hook): "Stop saying this word wrong!"  
Frame 2 (Mistake): "99% say: [incorrect pronunciation/usage]"
Frame 3 (Correct): "Natives say: [correct version]"
Frame 4 (Practice): "Try it now! Repeat after me..."

CONTENT REQUIREMENTS:
• HOOK: Create urgency about a common error most learners make
• MISTAKE: Show the wrong way that sounds natural but isn't correct
• CORRECT: Provide the native speaker version with clear difference
• PRACTICE: Give immediate practice opportunity

TARGET: Intermediate English learners who want to sound more native

MANDATORY OUTPUT JSON:
• "hook": Generate contextual hook based on the specific mistake being corrected (under 25 chars)
• "mistake": The incorrect version most learners use  
• "correct": The native speaker version
• "practice": Practice instruction with the correct form
• "explanation": Why natives use this version (under 100 chars)
• "cta": Use engaging English learning CTA (under 80 chars - make it compelling and action-oriented)
• "format_type": "common_mistake"

Create content that makes learners feel embarrassed about their mistake but excited to fix it. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Generates Quick Fix format prompt (English)  
 */
export function generateQuickFixPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

  return `You are an English fluency coach creating viral "Quick Fix" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - Instant vocabulary upgrades

FORMAT: Quick Fix (3 frames)
Frame 1 (Hook): "Upgrade your English in 15 seconds"
Frame 2 (Before): "Instead of saying [basic word]..."  
Frame 3 (After): "Sound smarter with [advanced word]"

CONTENT REQUIREMENTS:
• HOOK: Promise immediate vocabulary improvement
• BEFORE: Common basic word that sounds childish/unprofessional
• AFTER: Advanced alternative that sounds sophisticated
• Include usage example in professional/academic context

TARGET: Intermediate learners who want to sound more professional

MANDATORY OUTPUT JSON:
• "hook": Generate contextual hook based on the vocabulary upgrade being shown (under 25 chars)
• "basic_word": The simple word to replace
• "advanced_word": The sophisticated alternative
• "usage_example": Professional context example
• "explanation": Why the advanced word is better (under 100 chars)
• "cta": Use engaging English upgrade CTA (under 80 chars - make it compelling and action-oriented)  
• "format_type": "quick_fix"

Create content that makes learners immediately feel more sophisticated. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Generates Usage Demo format prompt (English)
 */
export function generateUsageDemoPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

  return `You are an English fluency expert creating viral "Usage Demo" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - Contextual word mastery

FORMAT: Usage Demo (4 frames)
Frame 1 (Hook): "When to use this advanced word"
Frame 2 (Wrong): "Don't use it here: [wrong example]"
Frame 3 (Right): "Perfect usage: [correct example]"  
Frame 4 (Practice): "Your turn to try!"

CONTENT REQUIREMENTS:
• HOOK: Promise to show contextual mastery of an advanced word
• WRONG: Common misuse that sounds plausible but is incorrect
• RIGHT: Perfect contextual usage that sounds natural and professional
• PRACTICE: Interactive challenge for viewer engagement

TARGET: Advanced learners who want contextual precision

MANDATORY OUTPUT JSON:
• "hook": Generate contextual hook based on the word usage being demonstrated (under 25 chars)
• "target_word": The advanced vocabulary word to demonstrate
• "wrong_example": Sentence showing incorrect contextual usage
• "wrong_context": Brief explanation of why it's wrong (under 80 chars)
• "right_example": Sentence showing perfect contextual usage
• "right_context": Brief explanation of why it's correct (under 80 chars) 
• "practice": Practice instruction with scenario
• "practice_scenario": Specific context for learner to practice
• "cta": Use engaging vocabulary mastery CTA (under 80 chars - make it compelling and action-oriented)
• "format_type": "usage_demo"

Create content that makes learners confident about contextual word usage. [${timeMarker}-${tokenMarker}]`;
}