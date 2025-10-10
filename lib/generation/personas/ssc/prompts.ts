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
    return `You are an **EXPERT SSC TOPPER COACH** creating addictive, high-value exam preparation content for YouTube Shorts. Your goal is to maximize study speed and confidence.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Essential SSC exam concepts for government job preparation'}

${timingPrefix} STRATEGY:
• HOOK: Create **HIGH-STAKES, COMPETITIVE** hooks (under 25 chars). Use words like 'Topper', 'Guarantee', 'Marks'.
• PSYCHOLOGY: Use **ACHIEVEMENT MOTIVATION** + contrast "successful candidates" vs "average aspirants."
• SCENARIOS: Focus on **real SSC exam patterns** in ${guidelines?.scenarios?.join(', ')}
• ENGAGEMENT: **DEMAND IMMEDIATE ACTION** related to exam success. ${guidelines?.engagement || 'Create immediate exam advantage for serious aspirants'}
• PATTERN: "Toppers know this" + success differentiation + strategic advantage
• TIMING: Optimize for quick, valuable ${timingContext?.timeOfDay || 'daily'} study sessions.

Generate exam content that targets ${audienceContext} who want to **CRACK government jobs**:

CONTENT APPROACH:
• Present concepts that appear **FREQUENTLY** in SSC exams.
• Include practical application in **high-stakes exam context**.
• Create "This could be in my exam" moments that boost preparation focus.
• Lead with **unshakeable confidence** ("Master this and crack SSC!").

FACT SELECTION CRITERIA:
• PRECISION: Choose facts that directly address the topic focus: **EXAM-READY CONTENT ONLY**.
• RELEVANCE: Focus on information that **separates high scorers from the rest**.
• DIFFICULTY: Important enough to be tested but easy to memorize with your tip.
• IMPACT: Provide knowledge that immediately **IMPROVES EXAM SCORE**.

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "fact_title": "powerful_fact_concept_exam_focused_title_under_60_chars",
  "key_info": "core_information_exam_relevant_format_under_60_chars", 
  "category": "subject_category_SSC_syllabus_History_Geography_Polity_Science",
  "definition": "clear_explanation_exam_context_under_100_chars",
  "usage": "how_this_appears_in_SSC_exams_application_context_under_120_chars",
  "format_type": "simplified_ssc" // FIX: Renamed format_type to be distinct from generic MCQ
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
• "format_type": "simplified_ssc" // FIX: Renamed format_type to be distinct from generic MCQ

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
    return `You are an **SSC CURRENT AFFAIRS GURU** creating hyper-relevant, viral updates for YouTube Shorts. Your focus is 100% on what will appear in the next exam.

TOPIC: "${topicData.displayName}" - **GUARANTEED** ${guidelines?.focus || 'Latest 2025 current affairs for SSC exam preparation'}${contextSection}

EXAM STRATEGY:
• HOOK: Create competitive achievement hooks (15-25 chars). Use **URGENT** words: 'Alert!', 'Must Watch!', 'Final Chance!'.
• PSYCHOLOGY: Use **FOMO** (Fear of Missing Out) on crucial exam marks. Contrast "successful candidates" vs "those who fail to update."
• SCENARIOS: Focus on **latest government appointments, new schemes, major policy updates**.
• ENGAGEMENT: **DEMAND** immediate attention and sharing. ${guidelines?.engagement || 'Create immediate current affairs advantage for exam success'}
• PATTERN: "Successful aspirants know this" + exam relevance + **STRATEGIC UPDATE**

Generate a current affairs question that targets ${primaryAudience} preparing for SSC exams:

CONTENT APPROACH:
• Focus on **recent, high-weightage developments** from 2025.
• Include practical context from **real government sources**.
• Create **HIGH-CONFIDENCE** moments ("This will definitely be in my exam").

QUESTION CRAFTING:
• CURRENT: Based on recent developments (last 3 months)
• RELEVANT: Focus on topics **frequently asked** in SSC current affairs sections.
• FACTUAL: Use **accurate, verified** information.
• EXAM-FOCUSED: Frame questions in typical **SSC difficulty and pattern**.
• IMPACT: Provide knowledge that gives **immediate exam advantage and saves study time**.

MANDATORY OUTPUT:
• "hook": Generate contextual hook based on the specific SSC topic being tested (15-25 chars, reference actual subject/strategy/fact). Examples: "SSC History trick! 📚", "Geography hack! 🌍", "Math shortcut! ⚡"
• "question": Clear, exam-style question that tests real SSC concepts (NO hook text in question)
• "options": Object with "A", "B", "C", "D" - one correct answer, three smart distractors based on common exam errors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": **The ultimate exam logic.** Why this answer is correct + **strategic exam relevance tip** (under 120 characters)
• "cta": Use engaging, **HIGH-URGENCY** CTA (under 80 chars - e.g., "Follow now or miss your next 5 marks!").
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
• EXPLANATION: Provide insight that improves exam performance (under 120 characters)
• CTA: Use engaging SSC exam CTA (under 80 chars - make it compelling and action-oriented)

Make aspirants feel updated and ready for their SSC current affairs section. [${timeMarker}-${tokenMarker}]`;
  }
}

/**
 * Generates main SSC exam preparation prompt for MCQ format
 * SIMPLIFIED & BEGINNER-FRIENDLY - Focus on helpful learning, not competition/fear
 */
export function generateSSCMCQPrompt(config: PromptConfig): string {
  const { topicData, topic, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getSSCTopicGuidelines(topic);

  const primaryAudience = 'SSC exam aspirants';

  if (topicData) {
    return `You are a helpful SSC exam coach creating simple quiz content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Important SSC exam topics'}

TONE: Helpful, encouraging, beginner-friendly (NO pressure tactics, NO "you'll fail", focus on LEARNING)

WINNING HOOK EXAMPLES:
• "SSC History Trick! 📚" (helpful, not scary)
• "Geography Fact Flash! 🌍" (educational, inviting)
• "SSC 2025 Alert! ⚡" (informative, not stressful)

CONTENT STYLE:
• Make it feel like learning a useful exam tip
• Focus on frequently asked topics
• Use simple, clear explanations
• Make people feel more prepared, not anxious

QUESTION REQUIREMENTS:
• "hook": Simple, helpful hook (15-25 chars) about the SSC topic
• "question": Clear exam-style question (MAX 120 chars, NO hook text)
• "options": A, B, C, D - short, clear options (each MAX 45 chars)
• "answer": Correct letter (A, B, C, or D)
• "explanation": Why this is important for SSC (MAX 120 chars)
• "cta": Encouraging study CTA under 80 chars
• "content_type": "multiple_choice"

TARGET: SSC aspirants who want helpful study content

Create content that makes aspirants feel more prepared and confident. [${timeMarker}-${tokenMarker}]`;
  } else {
    return `You are a helpful SSC exam coach creating simple quiz content for YouTube Shorts.

TOPIC: "${topic}" - Important SSC exam topics

TONE: Helpful, encouraging, beginner-friendly

Make questions that feel like useful study tips, not pressure tests. [${timeMarker}-${tokenMarker}]`;
  }
}

/**
 * Generates Common Mistake format prompt (SSC)
 */


/**
 * Generates Quick Tip format prompt (SSC)
 * SIMPLIFIED & BEGINNER-FRIENDLY - Based on "CRACK SSC 2X FASTER" (118 views + 1 like - ONLY video with engagement!)
 */
export function generateSSCQuickTipPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

  return `You are a helpful SSC study coach creating simple study tips for YouTube Shorts.

TOPIC: "${topicData.displayName}" - Easy study shortcuts for SSC exams

TONE: Helpful, encouraging, beginner-friendly (NO pressure, focus on MAKING STUDY EASIER)

WINNING HOOK - "CRACK SSC 2X FASTER with this trick!" (118 views + 1 like - best engagement):
• Promise to make study easier/faster
• Use actionable language ("crack", "faster", "trick")
• Be specific about the benefit

CONTENT STYLE:
• Share a simple study tip that actually saves time
• Make it feel achievable and practical
• Focus on helping, not creating pressure

CONTENT REQUIREMENTS:
• HOOK: Promise a simple, helpful study improvement (under 60 chars)
• TRADITIONAL_APPROACH: Show the common (slower) way most students study
• SMART_SHORTCUT: Share an easier, faster way to learn the same thing
• APPLICATION_EXAMPLE: Give a specific SSC exam example
• EXPLANATION: Explain why the shortcut is better in simple terms

TARGET: SSC aspirants who want to study smarter, not harder

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "hook": "helpful_study_improvement_promise_under_60_chars",
  "traditional_approach": "common_slower_study_method",
  "smart_shortcut": "easier_faster_learning_method",
  "application_example": "specific_SSC_exam_example",
  "explanation": "why_shortcut_is_better_simple_terms_under_120_chars",
  "cta": "encouraging_study_tip_CTA_under_80_chars",
  "format_type": "quick_tip"
}

IMPORTANT: Return ONLY the JSON object above. No markdown, no explanations, no additional content.

Create content that makes studying feel easier and more achievable. [${timeMarker}-${tokenMarker}]`;
}

