// lib/generation/personas/ssc/prompts.ts
/**
 * SSC (Staff Selection Commission) exam preparation prompt templates
 * Government exam focused content for competitive exam aspirants
 */

import { 
  PromptConfig,
  TopicGuideline
} from '../../shared/utils';
import { getDynamicContext } from '../../core/contentSource';

/**
 * SSC-specific topic guidelines
 * Moved from topicGuidelines.ts for better organization and reduced dependencies
 */
const SSC_TOPIC_GUIDELINES: Record<string, TopicGuideline> = {
  // GENERAL AWARENESS - History
  ssc_ancient_history: {
    focus: 'One ancient Indian history fact with dynasty/period details',
    hook: 'This ancient history fact appears in 90% of SSC papers',
    scenarios: ['SSC CGL Tier-1', 'CHSL', 'MTS General Awareness'],
    engagement: 'Memorize this for ancient history section'
  },
  ssc_medieval_history: {
    focus: 'One medieval period fact about rulers, battles, or architecture',
    hook: 'This medieval fact is asked in every SSC exam',
    scenarios: ['Mughal period', 'Delhi Sultanate', 'architecture questions'],
    engagement: 'Remember this for medieval history questions'
  },
  ssc_modern_history: {
    focus: 'One modern Indian history fact about freedom struggle',
    hook: 'This freedom struggle fact appears in all government exams',
    scenarios: ['independence movement', 'national leaders', 'important events'],
    engagement: 'Essential for modern history section'
  },
  
  // GENERAL AWARENESS - Geography  
  ssc_physical_geography: {
    focus: 'One physical geography fact about landforms, climate, or rivers',
    hook: 'This geography fact helps crack multiple questions',
    scenarios: ['Indian rivers', 'mountain ranges', 'climate zones'],
    engagement: 'Use this for geography section preparation'
  },
  ssc_indian_geography: {
    focus: 'One Indian geography fact about states, capitals, or boundaries',
    hook: 'This trick helps remember 10+ geography facts instantly',
    scenarios: ['state capitals', 'boundaries', 'important locations'],
    engagement: 'Master this for static GK questions'
  },
  
  // GENERAL AWARENESS - Polity
  ssc_constitution: {
    focus: 'One constitutional article, amendment, or fundamental right',
    hook: 'This constitution fact appears in every SSC polity section',
    scenarios: ['fundamental rights', 'directive principles', 'constitutional articles'],
    engagement: 'Crucial for Indian polity questions'
  },
  ssc_government: {
    focus: 'One fact about government structure, posts, or procedures',
    hook: 'This government fact is essential for all SSC exams',
    scenarios: ['constitutional posts', 'parliament procedures', 'government structure'],
    engagement: 'Remember this for polity section'
  },
  
  // GENERAL AWARENESS - Current Affairs
  ssc_current_affairs: {
    focus: 'One 2024-2025 current affairs fact about appointments/schemes/summits',
    hook: 'This 2025 update will definitely be in your SSC exam',
    scenarios: ['recent appointments', 'new schemes', 'international summits'],
    engagement: 'Note this down for current affairs preparation'
  },
  
  // GENERAL AWARENESS - Science
  ssc_physics: {
    focus: 'One physics concept, formula, or unit with practical application',
    hook: 'This physics fact appears in every SSC science section',
    scenarios: ['units and measurements', 'basic concepts', 'everyday physics'],
    engagement: 'Essential for general science questions'
  },
  ssc_chemistry: {
    focus: 'One chemistry fact about elements, compounds, or reactions',
    hook: 'This chemistry fact helps solve multiple science questions',
    scenarios: ['chemical reactions', 'elements', 'everyday chemistry'],
    engagement: 'Remember this for chemistry section'
  },
  ssc_biology: {
    focus: 'One biology fact about human body, plants, or diseases',
    hook: 'This biology fact is asked in all SSC science sections',
    scenarios: ['human body', 'plant biology', 'diseases and health'],
    engagement: 'Crucial for biology questions'
  },
  
  // ENGLISH COMPREHENSION
  ssc_grammar: {
    focus: 'One grammar rule for tenses, voice, or error detection',
    hook: 'Master this rule to crack SSC English section',
    scenarios: ['error spotting', 'sentence improvement', 'fill-in-blanks'],
    engagement: 'Apply this rule to practice questions immediately'
  },
  ssc_vocabulary: {
    focus: 'One SSC word with synonym, antonym, and one-word substitution',
    hook: 'This word appears in every SSC vocabulary section',
    scenarios: ['synonyms', 'antonyms', 'one-word substitutions'],
    engagement: 'Practice using this word in context'
  },
  
  // QUANTITATIVE APTITUDE
  ssc_number_system: {
    focus: 'One number system trick for divisibility, LCM, or HCF',
    hook: 'This math trick saves 2 minutes per question',
    scenarios: ['number properties', 'divisibility rules', 'calculation shortcuts'],
    engagement: 'Practice this shortcut for faster calculations'
  },
  ssc_percentage: {
    focus: 'One percentage/ratio trick for quick mental calculation',
    hook: 'This percentage trick works for 90% of SSC math questions',
    scenarios: ['percentage problems', 'profit-loss', 'ratio-proportion'],
    engagement: 'Use this trick in your next practice session'
  },
  
  // GENERAL INTELLIGENCE & REASONING
  ssc_reasoning: {
    focus: 'One reasoning pattern for series, coding, or logical puzzles',
    hook: 'This reasoning trick solves multiple question types',
    scenarios: ['number series', 'coding-decoding', 'pattern recognition'],
    engagement: 'Apply this pattern to solve similar questions'
  }
};

/**
 * Get SSC-specific topic guidelines with fallback
 */
function getSSCTopicGuidelines(topic: string): TopicGuideline | undefined {
  return SSC_TOPIC_GUIDELINES[topic];
}

/**
 * Generates simplified SSC prompt for single-frame format
 * REIMPLEMENTED: Based on SSC MCQ format logic for better content generation
 */
export function generateSimplifiedSSCPrompt(config: PromptConfig): string {
  const { topicData, topic, markers, timingContext, analyticsInsights } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getSSCTopicGuidelines(topic);
  
  const primaryAudience = 'SSC exam aspirants';
  const timingPrefix = timingContext ? `${timingContext.timeOfDay.toUpperCase()} STUDY` : 'VIRAL STUDY';
  const audienceContext = timingContext?.audience || primaryAudience;
  
  if (topicData) {
    return `You are an expert SSC coaching instructor creating addictive exam preparation content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Essential SSC exam concepts for government job preparation'}

${timingPrefix} STRATEGY:
• HOOK: Create competitive achievement hooks - under 25 chars, topper-focused + success differentiation
• PSYCHOLOGY: Use achievement motivation + social proof (what successful candidates know vs failed candidates)
• SCENARIOS: Focus on ${guidelines?.scenarios?.join(', ') || 'real SSC exam patterns and previous year questions'}
• ENGAGEMENT: ${guidelines?.engagement || 'Create immediate exam advantage for serious aspirants'}
• PATTERN: "Toppers know this" + success differentiation + strategic advantage
• TIMING: Perfect for ${timingContext?.timeOfDay || 'daily'} study sessions

Generate exam content that targets ${audienceContext} preparing for government jobs:

CONTENT APPROACH:
• Present concepts that appear frequently in SSC exams
• Include practical application in government job context  
• Create "This could be in my exam" moments that boost preparation focus
• Lead with confidence-building ("Master this and crack SSC!")

FACT SELECTION CRITERIA:
• PRECISION: Choose facts that directly address the topic focus: "${guidelines?.focus}"
• RELEVANCE: Focus on information that ${audienceContext} encounter in actual exams
• DIFFICULTY: Important enough to be tested but achievable for motivated aspirants
• IMPACT: Provide knowledge that immediately improves exam performance
• SCENARIOS: Perfect for ${guidelines?.scenarios?.join(', ') || 'SSC exam contexts'}

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "fact_title": "powerful_fact_concept_exam_focused_title",
  "key_info": "core_information_exam_relevant_format_under_60_chars", 
  "category": "subject_category_SSC_syllabus_History_Geography_Polity_Science",
  "definition": "clear_explanation_exam_context_under_100_chars",
  "usage": "how_this_appears_in_SSC_exams_application_context_under_120_chars",
  "format_type": "mcq"
}

IMPORTANT: Return ONLY the JSON object above. No markdown, no explanations, no additional content.

Create exam content that makes aspirants feel more confident and prepared for success. Focus specifically on: ${guidelines?.focus || 'SSC exam preparation'}

Target the specific challenge: ${guidelines?.engagement || 'Upgrade your exam preparation'}

[${timeMarker}-${tokenMarker}]`;
  } else {
    return `You are an expert SSC exam coach creating viral preparation content for YouTube Shorts.

Generate exam content for ${primaryAudience} on "${topic}" that challenges while building exam confidence.

REQUIREMENTS:
• FACT FOCUS: Choose information that directly addresses the topic "${topic}"
• PRACTICAL: Focus on facts frequently tested in SSC exams
• ENGAGEMENT: Create immediate "exam preparation upgrade" value
• DEFINITION: Provide clear explanation that improves exam readiness (under 100 characters)
• USAGE: Include practical example that shows exam application (under 120 characters)

OUTPUT FORMAT:
• "fact_title": Exam-relevant fact/concept specifically relevant to "${topic}"
• "key_info": Core information in exam format (dates, numbers, names)
• "category": Subject category from SSC syllabus
• "definition": Clear, exam-focused explanation
• "usage": SSC exam context example
• "format_type": "mcq"

Make aspirants feel accomplished and ready to tackle their government job exam. [${timeMarker}-${tokenMarker}]`;
  }
}

/**
 * Generates SSC current affairs prompt with RSS content
 */
export async function generateSSCCurrentAffairsPrompt(config: PromptConfig): Promise<string> {
  const { topicData, topic, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getSSCTopicGuidelines(topic);
  
  // Use shared demographics from contentComponents
  const primaryAudience = 'SSC exam aspirants';
  
  // Get dynamic RSS content for current affairs
  const dynamicContext = await getDynamicContext('ssc_current_affairs', topic);
  const contextSection = dynamicContext ? `\n\nRECENT DEVELOPMENTS:\n${dynamicContext}\n` : '';

  if (topicData) {
    return `You are an expert SSC coaching instructor creating viral current affairs content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Latest 2025 current affairs for SSC exam preparation'}${contextSection}

EXAM STRATEGY:
• HOOK: Create competitive achievement hooks like motivating exam hooks - under 25 chars, topper-focused + success differentiation  
• PSYCHOLOGY: Use achievement motivation + social proof (what successful candidates know vs what failed candidates miss)
• SCENARIOS: Focus on ${guidelines?.scenarios?.join(', ') || 'recent government appointments, new schemes, major policy updates'}
• ENGAGEMENT: ${guidelines?.engagement || 'Create immediate current affairs advantage for exam success'}
• PATTERN: "Successful aspirants know this" + exam relevance + strategic update

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
• "hook": Generate contextual hook based on the specific current affairs topic (15-25 chars, reference actual event/update/policy). Examples: "Budget 2025 update! 📊", "New policy alert! 🚨", "Current affairs! 📰"
• "question": Current affairs question based on recent 2025 developments (NO hook text in question)
• "options": Object with "A", "B", "C", "D" - one correct answer based on facts, three plausible distractors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Why this answer is correct + current affairs relevance (under 120 characters)
• "cta": Use engaging current affairs CTA (under 80 chars - make it compelling and action-oriented)
• "content_type": "multiple_choice"

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
• CTA: Use engaging current affairs CTA (under 80 chars - make it compelling and action-oriented)

Make aspirants feel updated and ready for their SSC current affairs section. [${timeMarker}-${tokenMarker}]`;
  }
}

/**
 * Generates main SSC exam preparation prompt for MCQ format
 */
export function generateSSCMCQPrompt(config: PromptConfig): string {
  const { topicData, topic, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getSSCTopicGuidelines(topic);
  
  // Use shared demographics from contentComponents
  const primaryAudience = 'SSC exam aspirants';

  if (topicData) {
    return `You are an expert SSC coaching instructor creating viral exam preparation content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Essential SSC exam concepts for government job preparation'}

EXAM STRATEGY:
• HOOK: Create competitive achievement hooks like motivating exam hooks - under 25 chars, topper-focused + success differentiation
• PSYCHOLOGY: Use achievement motivation + social proof (what successful candidates do vs failed candidates)
• SCENARIOS: Focus on ${guidelines?.scenarios?.join(', ') || 'real SSC exam patterns and previous year questions'}
• ENGAGEMENT: ${guidelines?.engagement || 'Create immediate exam advantage for serious aspirants'}
• PATTERN: "Toppers know this" + success differentiation + strategic advantage

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
• "hook": Generate contextual hook based on the specific SSC topic being tested (15-25 chars, reference actual subject/strategy/fact). Examples: "SSC History trick! 📚", "Geography hack! 🌍", "Math shortcut! ⚡"
• "question": Clear, exam-style question that tests real SSC concepts (NO hook text in question)
• "options": Object with "A", "B", "C", "D" - one correct answer, three smart distractors based on common exam errors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Why this answer is correct + exam relevance tip (under 120 characters)
• "cta": Use engaging exam preparation CTA (under 80 chars - make it compelling and action-oriented)
• "content_type": "multiple_choice"

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
• CTA: Use engaging SSC exam CTA (under 80 chars - make it compelling and action-oriented)

Make aspirants feel accomplished and ready to tackle their government job exam. [${timeMarker}-${tokenMarker}]`;
  }
}

/**
 * Generates Common Mistake format prompt (SSC)
 */
export function generateSSCCommonMistakePrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

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

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "hook": "attention_grabbing_opener_about_mistake_under_60_chars",
  "mistake": "incorrect_approach_most_aspirants_use",
  "correct": "expert_strategy_that_ensures_success",
  "practice": "practice_instruction_with_correct_approach",
  "explanation": "why_experts_use_this_strategy_under_100_chars",
  "cta": "engaging_SSC_exam_hack_CTA_under_80_chars",
  "format_type": "common_mistake"
}

IMPORTANT: Return ONLY the JSON object above. No markdown, no explanations, no additional content.

Create content that makes aspirants feel embarrassed about their mistake but excited to fix it. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Generates Quick Tip format prompt (SSC)
 */
/**
 * Generates Quick Tip format prompt (SSC)
 */
export function generateSSCQuickTipPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

  return `You are an SSC exam expert creating viral "Quick Tip" content for YouTube Shorts. Your sole focus is on strategies for the Indian SSC (Staff Selection Commission) government exams.

TOPIC: "${topicData.displayName}" - Instant exam performance upgrades

FORMAT: Quick Tip (3 frames)
Frame 1 (Hook): "Crack SSC faster with this trick"
Frame 2 (Before): "Traditional Approach: [Time-consuming method]"
Frame 3 (After): "Smart Shortcut: [Faster, more effective method]"

CONTENT REQUIREMENTS:
• The tip MUST be a concrete study or problem-solving shortcut for the given SSC topic.
• ABSOLUTELY NO health, wellness, exercise, or generic "brain-boosting" advice.
• HOOK: Promise an immediate exam advantage.
• TRADITIONAL_APPROACH: Describe a time-consuming method most aspirants use for the specific SSC topic.
• SMART_SHORTCUT: Provide an efficient, alternative strategy that saves time and improves accuracy.
• APPLICATION_EXAMPLE: Show how to apply the shortcut in a specific SSC exam context.

TARGET: SSC aspirants who want to study smarter, not harder.

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "hook": "promise_of_quick_exam_advantage_under_60_chars",
  "traditional_approach": "time_consuming_method_most_use_for_ssc_topic",
  "smart_shortcut": "efficient_alternative_strategy_for_ssc_topic",
  "application_example": "specific_SSC_exam_context_example",
  "explanation": "why_shortcut_works_better_under_120_chars",
  "cta": "engaging_SSC_exam_study_improvement_CTA_under_80_chars",
  "format_type": "quick_tip"
}

IMPORTANT: Return ONLY the JSON object above. No markdown, no explanations, no additional content.

Create content that makes aspirants immediately feel more strategic about their preparation. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Generates Usage Demo format prompt (SSC)
 */
export function generateSSCUsageDemoPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

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

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "hook": "promise_about_strategic_concept_mastery_under_60_chars",
  "target_concept": "SSC_strategy_concept_to_demonstrate",
  "wrong_scenario": "situation_showing_incorrect_application",
  "wrong_context": "brief_explanation_why_wrong_under_80_chars",
  "right_scenario": "situation_showing_perfect_application",
  "right_context": "brief_explanation_why_correct_under_80_chars",
  "practice": "practice_instruction_with_scenario",
  "practice_scenario": "specific_SSC_context_for_aspirant_to_practice",
  "explanation": "why_strategic_usage_matters_for_exam_success_under_120_chars",
  "cta": "engaging_SSC_exam_strategy_mastery_CTA_under_80_chars",
  "format_type": "usage_demo"
}

IMPORTANT: Return ONLY the JSON object above. No markdown, no explanations, no additional content.

Create content that makes aspirants confident about strategic concept application. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Generates Challenge format prompt (SSC)
 */
export function generateSSCChallengePrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

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

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "hook": "challenge_opener_that_tests_preparation_under_60_chars",
  "challenge_question": "moderately_difficult_test_question",
  "time_limit": "suggested_time_limit_eg_30_seconds",
  "correct_answer": "right_answer_with_brief_explanation",
  "confidence_message": "success_message_for_those_who_got_it_right_under_80_chars",
  "learning_tip": "quick_tip_for_those_who_got_it_wrong_under_100_chars",
  "cta": "engaging_SSC_exam_daily_testing_CTA_under_80_chars",
  "format_type": "challenge"
}

IMPORTANT: Return ONLY the JSON object above. No markdown, no explanations, no additional content.

Create content that makes aspirants excited to test and improve their preparation. [${timeMarker}-${tokenMarker}]`;
}

