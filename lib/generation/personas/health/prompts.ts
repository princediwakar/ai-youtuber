/**
 * Health-related prompt templates (Brain & Eye Health)
 * All health persona content generation prompts
 */

import { 
  PromptConfig,
  TopicGuideline, 
  generateRandomizationElements, 
  generateContextInjections, 
  getPromptVariation,
  createBasePromptStructure
} from '../../shared/utils';

/**
 * Health-specific topic guidelines
 * Moved from topicGuidelines.ts for better organization and reduced dependencies
 */
const HEALTH_TOPIC_GUIDELINES: Record<string, TopicGuideline> = {
  // Brain Health - Quick Action Focus
  memory_hacks: {
    focus: 'One simple memory technique that works in 5 seconds',
    hook: 'This 5-second trick triples your memory power',
    scenarios: ['remembering names', 'grocery lists', 'study facts'],
    engagement: 'Try it on something right now'
  },
  focus_tricks: {
    focus: 'One instant technique to regain focus when distracted',
    hook: 'This 3-second trick kills all distractions instantly',
    scenarios: ['studying', 'work tasks', 'phone addiction'],
    engagement: 'Try it the next time you get distracted'
  },
  brain_foods: {
    focus: 'One specific food that immediately boosts brain function',
    hook: 'This common food secretly makes you smarter',
    scenarios: ['study snacks', 'breakfast choices', 'brain fog'],
    engagement: 'Go eat this food right now'
  },
  brain_exercises: {
    focus: 'One 10-second mental exercise that sharpens thinking',
    hook: 'This 10-second exercise makes your brain faster',
    scenarios: ['before exams', 'work meetings', 'problem-solving'],
    engagement: 'Do the exercise during this video'
  },
  productivity_hacks: {
    focus: 'One simple change that doubles productivity instantly',
    hook: 'This productivity hack doubled my output in 1 day',
    scenarios: ['work tasks', 'studying', 'daily routines'],
    engagement: 'Apply this hack to your next task'
  },
  stress_killers: {
    focus: 'One technique to eliminate stress in 15 seconds',
    hook: 'Kill stress in 15 seconds with this ancient trick',
    scenarios: ['work pressure', 'exam anxiety', 'daily stress'],
    engagement: 'Use this technique right now if you feel stressed'
  },
  sleep_hacks: {
    focus: 'One simple change that guarantees better sleep tonight',
    hook: 'Do this tonight to sleep like a baby',
    scenarios: ['insomnia', 'restless sleep', 'morning tiredness'],
    engagement: 'Try this hack tonight and report back'
  },
  brain_myths: {
    focus: 'One shocking truth that destroys a popular brain myth',
    hook: 'This brain "fact" is completely FALSE',
    scenarios: ['popular misconceptions', 'social media claims', 'old wives tales'],
    engagement: 'Share this fact to shock your friends'
  },
  
  // Eye Health - Instant Action Focus
  screen_damage: {
    focus: 'One shocking way phones damage eyes that people ignore',
    hook: 'Your phone is secretly blinding you every day',
    scenarios: ['phone usage', 'scrolling', 'video watching'],
    engagement: 'Check your phone settings right now'
  },
  eye_exercises: {
    focus: 'One 10-second eye exercise that instantly relieves strain',
    hook: 'This 10-second trick prevents 90% of eye problems',
    scenarios: ['computer work', 'phone fatigue', 'reading'],
    engagement: 'Do this exercise right now during the video'
  },
  vision_foods: {
    focus: 'One specific food that dramatically improves eyesight',
    hook: 'This food can actually improve your vision',
    scenarios: ['poor eyesight', 'night vision', 'eye health'],
    engagement: 'Add this food to your next meal'
  },
  eye_protection: {
    focus: 'One daily habit that saves your eyes from damage',
    hook: 'Do this every morning to protect your eyes all day',
    scenarios: ['daily routine', 'computer work', 'outdoor activities'],
    engagement: 'Add this to your morning routine tomorrow'
  },
  computer_strain: {
    focus: 'One simple desk adjustment that eliminates eye strain',
    hook: 'Fix computer eye strain with this 30-second adjustment',
    scenarios: ['work from home', 'long computer sessions', 'gaming'],
    engagement: 'Adjust your screen right now'
  },
  quick_eye_care: {
    focus: 'One instant eye care hack for immediate relief',
    hook: 'This instant hack relieves any eye discomfort',
    scenarios: ['dry eyes', 'irritation', 'tiredness'],
    engagement: 'Try this hack if your eyes feel tired'
  },
  vision_myths: {
    focus: 'One shocking truth that destroys a popular eye health myth',
    hook: 'This eye health "fact" is completely WRONG',
    scenarios: ['popular beliefs', 'old advice', 'internet claims'],
    engagement: 'Share this truth to shock people'
  }
};

/**
 * Get health-specific topic guidelines with fallback
 */
function getHealthTopicGuidelines(topic: string): TopicGuideline | undefined {
  return HEALTH_TOPIC_GUIDELINES[topic];
}

/**
 * Generates brain health content prompt
 * SIMPLIFIED & BEGINNER-FRIENDLY - Focus on curious learning, not fear/shame
 */
export function generateBrainHealthPrompt(config: PromptConfig): string {
  const { topicData, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getHealthTopicGuidelines(config.topic);

  const basePrompt = `You are a friendly brain health coach creating fun quiz content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Simple brain health tips'}

TONE: Curious, friendly, beginner-friendly (NO aggressive language, NO fear tactics, NO "you're doing it wrong")

WINNING HOOK EXAMPLES:
• "Brain fog? Zap it! ⚡" (simple, inviting)
• "Memory hack alert! 🧠" (curious, not scary)
• "Focus in 3 seconds? ⚡" (question-based, achievable)

CONTENT STYLE:
• Make it feel like discovering a fun life hack, not fixing a problem
• Use simple, everyday language
• Focus on what TO DO, not what NOT to do
• Keep explanations short and actionable

QUESTION REQUIREMENTS:
• "hook": Simple, curious hook (15-25 chars) referencing the actual tip
• "question": Clear question anyone can understand (MAX 120 chars)
• "options": A, B, C, D - short answers (each MAX 45 chars)
• "answer": Correct letter (A, B, C, or D)
• "explanation": Why this helps in simple terms (MAX 120 chars)
• "cta": Friendly CTA under 80 chars
• "content_type": "${questionFormat}"

TARGET: Busy adults who want simple brain health wins

Create content that feels like a helpful friend sharing a cool tip. [${timeMarker}-${tokenMarker}]`;

  return basePrompt;
}

/**
 * Generates eye health content prompt
 * SIMPLIFIED & BEGINNER-FRIENDLY - Focus on helpful tips, not scare tactics
 */
export function generateEyeHealthPrompt(config: PromptConfig): string {
  const { topicData, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getHealthTopicGuidelines(config.topic);

  const basePrompt = `You are a friendly eye health coach creating helpful quiz content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Simple eye care tips'}

TONE: Helpful, encouraging, beginner-friendly (NO scare tactics, NO "your eyes are damaged", focus on PROTECTION)

WINNING HOOK EXAMPLES:
• "Eye strain fix! ✨" (solution-focused)
• "Screen damage test! 📱" (educational, not scary)
• "20-20-20 rule works! 👁️" (positive, actionable)

CONTENT STYLE:
• Focus on simple eye protection tips anyone can do
• Use positive language about protecting vision
• Make it feel achievable and practical
• Avoid doom and gloom - focus on prevention

QUESTION REQUIREMENTS:
• "hook": Simple, helpful hook (15-25 chars) about eye care
• "question": Clear question about eye protection (MAX 120 chars)
• "options": A, B, C, D - short, clear answers (each MAX 45 chars)
• "answer": Correct letter (A, B, C, or D)
• "explanation": Why this protects your eyes (MAX 120 chars)
• "cta": Encouraging CTA under 80 chars
• "content_type": "${questionFormat}"

TARGET: Screen users who want to protect their vision

Create content that feels like helpful advice from a caring friend. [${timeMarker}-${tokenMarker}]`;

  return basePrompt;
}

/**
 * Generates Quick Tip format prompt (Health)
 * SIMPLIFIED & BEGINNER-FRIENDLY - Based on 80 avg views performance
 */
export function generateQuickTipPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getHealthTopicGuidelines(config.topic);

  return `You are a friendly health coach creating simple, helpful tips for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Simple health improvements anyone can do'}

TONE: Friendly, encouraging, beginner-friendly (NO aggressive language, NO shame, NO "stop doing X")

WINNING HOOK STYLE:
• Use curious, inviting language: "This 30-second habit will boost your..." (NOT "STOP doing X")
• Promise a specific, achievable benefit
• Keep it simple and approachable

CONTENT REQUIREMENTS:
• HOOK: Friendly promise with specific timeframe (e.g., "This 30-second habit will boost your sleep quality")
• ACTION: Super simple steps anyone can do right now (max 2-3 steps)
• RESULT: Quick explanation of why it helps (keep it simple, not overly scientific)
• Make it feel easy and achievable, not scary or complicated

TARGET: Beginners who want easy health wins

RESPONSE FORMAT - OUTPUT ONLY VALID JSON (no other text):
{
  "hook": "friendly_specific_promise_under_60_chars",
  "action": "simple_clear_steps_anyone_can_do",
  "result": "why_it_helps_in_simple_terms",
  "cta": "encouraging_health_CTA_under_80_chars"
}

IMPORTANT: Return ONLY the JSON object above. No markdown, no explanations, no additional content.

Create content that makes viewers feel motivated and capable. [${timeMarker}-${tokenMarker}]`;
}


