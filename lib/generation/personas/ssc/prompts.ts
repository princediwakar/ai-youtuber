/**
 * SSC (Staff Selection Commission) exam preparation prompt templates
 * Government exam focused content for competitive exam aspirants
 */

import { 
  PromptConfig,
  TopicGuideline
} from '../../shared/utils';
import { ContentComponents } from '../../shared/components';
import { getDynamicContext } from '../../core/contentSource';

/**
 * SSC-specific topic guidelines
 * Moved from topicGuidelines.ts for better organization and reduced dependencies
 */
const SSC_TOPIC_GUIDELINES: Record<string, TopicGuideline> = {
  // SSC Exam Preparation - High-Frequency Facts
  ssc_history: {
    focus: 'One historical fact that appears in every government exam',
    hook: 'This history fact appears in 90% of SSC exams',
    scenarios: ['SSC CGL', 'CHSL', 'state exams'],
    engagement: 'Memorize this fact for your next exam'
  },
  ssc_geography: {
    focus: 'One geography fact or memory trick that saves exam time',
    hook: 'This geography trick helps you remember 20+ facts instantly',
    scenarios: ['state capitals', 'river origins', 'mountain peaks'],
    engagement: 'Use this trick for your geography preparation'
  },
  ssc_grammar: {
    focus: 'One grammar rule that solves 90% of SSC English questions',
    hook: 'Master this rule to crack SSC English section',
    scenarios: ['error spotting', 'sentence improvement', 'fill-in-blanks'],
    engagement: 'Apply this rule to practice questions immediately'
  },
  ssc_vocab: {
    focus: 'One SSC word with synonym, antonym, and usage in 15 seconds',
    hook: 'This word appears in every SSC vocabulary section',
    scenarios: ['synonyms', 'antonyms', 'one-word substitutions'],
    engagement: 'Practice using this word in a sentence'
  },
  ssc_current_affairs: {
    focus: 'One 2025 current affairs fact that will be in your next exam',
    hook: 'This 2025 update will definitely be in your SSC exam',
    scenarios: ['recent appointments', 'new schemes', 'major events'],
    engagement: 'Note this down for your current affairs preparation'
  },
  ssc_important_dates: {
    focus: 'One crucial date with memory trick that appears in all exams',
    hook: 'Never forget this date that appears in every government exam',
    scenarios: ['independence movement', 'constitution dates', 'historical events'],
    engagement: 'Use the memory trick to remember this date'
  },
  ssc_states_capitals: {
    focus: 'One state-capital trick that helps remember multiple pairs',
    hook: 'This trick helps you remember 10+ state capitals instantly',
    scenarios: ['SSC geography section', 'static GK questions', 'quick revision'],
    engagement: 'Use this trick to memorize state capitals now'
  },
  ssc_govt_schemes: {
    focus: 'One government scheme name, purpose, and launch year in 15 seconds',
    hook: 'This government scheme will definitely be in your exam',
    scenarios: ['scheme-based questions', 'current affairs', 'policy knowledge'],
    engagement: 'Remember the scheme name and purpose for exams'
  },
  ssc_gk_tricks: {
    focus: 'One memory trick that helps remember multiple GK facts instantly',
    hook: 'This GK trick will save you 10 minutes in every exam',
    scenarios: ['static GK', 'quick revision', 'exam shortcuts'],
    engagement: 'Use this trick for your GK preparation immediately'
  },
  ssc_numbers: {
    focus: 'One important number (year, count, percentage) with memorable context',
    hook: 'This number appears in 80% of SSC questions',
    scenarios: ['statistical questions', 'numerical facts', 'data queries'],
    engagement: 'Memorize this number for your next exam'
  },
  ssc_shortcuts: {
    focus: 'One exam-solving shortcut that saves crucial seconds',
    hook: 'This shortcut saves 30 seconds per question',
    scenarios: ['time management', 'quick elimination', 'calculation tricks'],
    engagement: 'Practice this shortcut right now'
  }
};

/**
 * Get SSC-specific topic guidelines with fallback
 */
function getSSCTopicGuidelines(topic: string): TopicGuideline | undefined {
  return SSC_TOPIC_GUIDELINES[topic];
}

/**
 * Generates SSC current affairs prompt with RSS content
 */
export async function generateSSCCurrentAffairsPrompt(config: PromptConfig): Promise<string> {
  const { topicData, topic, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getSSCTopicGuidelines(topic);
  
  // Use shared demographics from contentComponents
  const primaryAudience = ContentComponents.getPrimaryAudience('ssc_shots');
  const randomCTA = ContentComponents.getRandomCTA('ssc_shots');
  
  // Get dynamic RSS content for current affairs
  const dynamicContext = await getDynamicContext('ssc_current_affairs', topic);
  const contextSection = dynamicContext ? `\n\nRECENT DEVELOPMENTS:\n${dynamicContext}\n` : '';

  if (topicData) {
    return `You are an expert SSC coaching instructor creating viral current affairs content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Latest 2025 current affairs for SSC exam preparation'}${contextSection}

EXAM STRATEGY:
• HOOK: ${guidelines?.hook || 'Present 2025 updates that will definitely be in SSC exams'}
• SCENARIOS: Focus on ${guidelines?.scenarios?.join(', ') || 'recent government appointments, new schemes, major policy updates'}
• ENGAGEMENT: ${guidelines?.engagement || 'Create immediate current affairs advantage for exam success'}

Generate a current affairs question that targets ${primaryAudience} preparing for SSC exams:

CONTENT APPROACH:
• Focus on 2025 developments and recent government updates
• Include practical context from real news and government announcements
• Create "This will definitely be in my exam" moments based on recent events

QUESTION CRAFTING:
• CURRENT: Based on recent developments from 2025 (last 3 months)
• RELEVANT: Focus on topics frequently asked in SSC current affairs sections
• FACTUAL: Use accurate information from government sources and reliable news
• EXAM-FOCUSED: Frame questions in typical SSC current affairs pattern
• IMPACT: Provide knowledge that gives immediate exam advantage

MANDATORY OUTPUT:
• "question": Current affairs question based on recent 2025 developments
• "options": Object with "A", "B", "C", "D" - one correct answer based on facts, three plausible distractors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Why this answer is correct + current affairs relevance (under 120 characters)
• "cta": Use "${randomCTA}" or similar current affairs update CTA (under 40 chars)
• "question_type": Will be set automatically

Create current affairs content that makes aspirants confident about 2025 updates. [${timeMarker}-${tokenMarker}]`;
  } else {
    return `You are an expert SSC exam coach creating viral current affairs content for YouTube Shorts.${contextSection}

Generate an SSC current affairs question for ${primaryAudience} on "${topic}" that builds exam confidence with 2025 updates.

REQUIREMENTS:
• CURRENT: Focus on 2025 developments and recent government updates
• EXAM-RELEVANT: Present topics frequently tested in SSC current affairs
• FACTUAL: Use accurate information from reliable government and news sources
• ENGAGING: Create immediate "current affairs upgrade" value for aspirants
• EXPLANATION: Provide current affairs insight that improves exam readiness (under 120 characters)
• CTA: Use "${randomCTA}" or similar current affairs CTA (under 40 chars)

Make aspirants feel updated and ready for their SSC current affairs section. [${timeMarker}-${tokenMarker}]`;
  }
}

/**
 * Generates main SSC exam preparation prompt for MCQ format
 */
export function generateSSCExamPrompt(config: PromptConfig): string {
  const { topicData, topic, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getSSCTopicGuidelines(topic);
  
  // Use shared demographics from contentComponents
  const primaryAudience = ContentComponents.getPrimaryAudience('ssc_shots');
  const randomCTA = ContentComponents.getRandomCTA('ssc_shots');

  if (topicData) {
    return `You are an expert SSC coaching instructor creating viral exam preparation content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Essential SSC exam concepts for government job preparation'}

EXAM STRATEGY:
• HOOK: ${guidelines?.hook || 'Present questions that separate successful candidates from others'}
• SCENARIOS: Focus on ${guidelines?.scenarios?.join(', ') || 'real SSC exam patterns and previous year questions'}
• ENGAGEMENT: ${guidelines?.engagement || 'Create immediate exam advantage for serious aspirants'}

Generate a question that targets ${primaryAudience} preparing for government jobs:

CONTENT APPROACH:
• Present concepts that appear frequently in SSC exams
• Include practical application in government job context
• Create "This could be in my exam" moments that boost preparation focus

QUESTION CRAFTING:
• PRECISION: Direct, exam-style questions matching SSC pattern
• RELEVANCE: Focus on topics with high probability in actual exams
• DIFFICULTY: Challenging enough to teach but achievable for motivated aspirants
• DISTRACTORS: Include common exam mistakes, close alternatives, and typical confusions
• IMPACT: Provide knowledge that immediately improves exam performance

MANDATORY OUTPUT:
• "question": Clear, exam-style question that tests real SSC concepts
• "options": Object with "A", "B", "C", "D" - one correct answer, three smart distractors based on common exam errors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Why this answer is correct + exam relevance tip (under 120 characters)
• "cta": Use "${randomCTA}" or similar exam preparation CTA (under 40 chars)
• "question_type": Will be set automatically

Create exam content that makes aspirants feel more confident and prepared for success. [${timeMarker}-${tokenMarker}]`;
  } else {
    return `You are an expert SSC exam coach creating viral preparation content for YouTube Shorts.

Generate an SSC exam question for ${primaryAudience} on "${topic}" that challenges while building exam confidence.

REQUIREMENTS:
• HOOK: Present concepts that separate successful candidates from average ones
• PRACTICAL: Focus on topics frequently tested in SSC exams
• DISTRACTORS: Include common exam mistakes and plausible alternatives
• ENGAGEMENT: Create immediate "exam preparation upgrade" value
• EXPLANATION: Provide insight that improves exam performance (under 120 characters)
• CTA: Use "${randomCTA}" or similar (under 40 chars)

Make aspirants feel accomplished and ready to tackle their government job exam. [${timeMarker}-${tokenMarker}]`;
  }
}

/**
 * Generates Common Mistake format prompt (SSC)
 */
export function generateSSCCommonMistakePrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const randomCTA = ContentComponents.getRandomCTA('ssc_shots');

  return `You are an expert SSC coaching instructor creating viral "Common Mistake" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - Focus on mistakes that 99% of aspirants make

FORMAT: Common Mistake (4 frames)
Frame 1 (Hook): "Stop answering this question wrong!"
Frame 2 (Mistake): "99% choose: [incorrect option/approach]"
Frame 3 (Correct): "SSC toppers know: [correct answer/approach]"
Frame 4 (Practice): "Try it now! Apply this strategy..."

CONTENT REQUIREMENTS:
• HOOK: Create urgency about a common exam error most aspirants make
• MISTAKE: Show the wrong approach that seems logical but isn't correct
• CORRECT: Provide the expert strategy that toppers use
• PRACTICE: Give immediate practice opportunity

TARGET: SSC aspirants who want to avoid common exam pitfalls

MANDATORY OUTPUT JSON:
• "hook": Attention-grabbing opener about the mistake (under 60 chars)
• "mistake": The incorrect approach most aspirants use
• "correct": The expert strategy that ensures success
• "practice": Practice instruction with the correct approach
• "explanation": Why experts use this strategy (under 100 chars)
• "cta": Use "${randomCTA}" or similar exam hack CTA (under 40 chars)
• "format_type": "common_mistake"

Create content that makes aspirants feel embarrassed about their mistake but excited to fix it. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Generates Quick Tip format prompt (SSC)
 */
export function generateSSCQuickTipPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const randomCTA = ContentComponents.getRandomCTA('ssc_shots');

  return `You are an SSC exam expert creating viral "Quick Tip" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - Instant exam performance upgrades

FORMAT: Quick Tip (3 frames)
Frame 1 (Hook): "Crack SSC faster with this trick"
Frame 2 (Before): "Instead of memorizing everything..."
Frame 3 (After): "Use this smart shortcut"

CONTENT REQUIREMENTS:
• HOOK: Promise immediate exam advantage
• BEFORE: Time-consuming traditional approach that most aspirants use
• AFTER: Smart shortcut that saves time and improves accuracy
• Include specific application in SSC exam context

TARGET: SSC aspirants who want to study smarter, not harder

MANDATORY OUTPUT JSON:
• "hook": Promise of quick exam advantage (under 60 chars)
• "traditional_approach": The time-consuming method most use
• "smart_shortcut": The efficient alternative strategy
• "application_example": Specific SSC exam context example
• "explanation": Why the shortcut works better (under 100 chars)
• "cta": Use "${randomCTA}" or similar study improvement CTA (under 40 chars)
• "format_type": "quick_tip"

Create content that makes aspirants immediately feel more strategic about their preparation. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Generates Usage Demo format prompt (SSC)
 */
export function generateSSCUsageDemoPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const randomCTA = ContentComponents.getRandomCTA('ssc_shots');

  return `You are an SSC exam strategy expert creating viral "Usage Demo" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - Strategic concept application

FORMAT: Usage Demo (4 frames)
Frame 1 (Hook): "When to use this SSC strategy"
Frame 2 (Wrong): "Don't use it here: [wrong scenario]"
Frame 3 (Right): "Perfect for: [correct scenario]"
Frame 4 (Practice): "Your turn to identify!"

CONTENT REQUIREMENTS:
• HOOK: Promise to show strategic application of an SSC concept
• WRONG: Common misapplication that seems plausible but is incorrect
• RIGHT: Perfect strategic usage that ensures exam success
• PRACTICE: Interactive challenge for viewer engagement

TARGET: Advanced SSC aspirants who want strategic precision

MANDATORY OUTPUT JSON:
• "hook": Promise about strategic concept mastery (under 60 chars)
• "target_concept": The SSC strategy/concept to demonstrate
• "wrong_scenario": Situation showing incorrect application
• "wrong_context": Brief explanation of why it's wrong (under 80 chars)
• "right_scenario": Situation showing perfect application
• "right_context": Brief explanation of why it's correct (under 80 chars)
• "practice": Practice instruction with scenario
• "practice_scenario": Specific SSC context for aspirant to practice
• "cta": Use "${randomCTA}" or similar strategy mastery CTA (under 40 chars)
• "format_type": "usage_demo"

Create content that makes aspirants confident about strategic concept application. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Generates Challenge format prompt (SSC)
 */
export function generateSSCChallengePrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const randomCTA = ContentComponents.getRandomCTA('ssc_shots');

  return `You are an SSC exam challenge creator making viral "Challenge" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - Test your SSC preparation level

FORMAT: Challenge (3 frames)
Frame 1 (Hook): "Only SSC toppers can solve this"
Frame 2 (Challenge): "Can you crack this in 30 seconds?"
Frame 3 (Answer): "If you got it, you're ready!"

CONTENT REQUIREMENTS:
• HOOK: Create urgency and challenge the viewer's preparation level
• CHALLENGE: Present a moderately difficult question that tests real understanding
• ANSWER: Provide solution with brief explanation and confidence boost
• Include timer pressure typical of SSC exams

TARGET: SSC aspirants who want to test their preparation level

MANDATORY OUTPUT JSON:
• "hook": Challenge opener that tests preparation (under 60 chars)
• "challenge_question": The moderately difficult test question
• "time_limit": Suggested time limit (e.g., "30 seconds")
• "correct_answer": The right answer with brief explanation
• "confidence_message": Success message for those who got it right (under 80 chars)
• "learning_tip": Quick tip for those who got it wrong (under 100 chars)
• "cta": Use "${randomCTA}" or similar daily testing CTA (under 40 chars)
• "format_type": "challenge"

Create content that makes aspirants excited to test and improve their preparation. [${timeMarker}-${tokenMarker}]`;
}

