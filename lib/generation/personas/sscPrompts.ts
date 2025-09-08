/**
 * SSC (Staff Selection Commission) exam preparation prompt templates
 * Government exam focused content for competitive exam aspirants
 */

import { 
  PromptConfig,
  getTopicGuidelines
} from '../shared/promptUtils';

/**
 * Generates main SSC exam preparation prompt for MCQ format
 */
export function generateSSCExamPrompt(config: PromptConfig): string {
  const { topicData, topic, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getTopicGuidelines(topic);

  if (topicData) {
    return `You are an expert SSC coaching instructor creating viral exam preparation content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Essential SSC exam concepts for government job preparation'}

EXAM STRATEGY:
• HOOK: ${guidelines?.hook || 'Present questions that separate successful candidates from others'}
• SCENARIOS: Focus on ${guidelines?.scenarios?.join(', ') || 'real SSC exam patterns and previous year questions'}
• ENGAGEMENT: ${guidelines?.engagement || 'Create immediate exam advantage for serious aspirants'}

Generate a question that targets SSC exam aspirants preparing for government jobs:

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
• "cta": Motivational CTA (under 40 chars): "Crack SSC!", "Follow for exam tips!", "Like if helpful!"
• "question_type": Will be set automatically

Create exam content that makes aspirants feel more confident and prepared for success. [${timeMarker}-${tokenMarker}]`;
  } else {
    return `You are an expert SSC exam coach creating viral preparation content for YouTube Shorts.

Generate an SSC exam question on "${topic}" that challenges aspirants while building exam confidence.

REQUIREMENTS:
• HOOK: Present concepts that separate successful candidates from average ones
• PRACTICAL: Focus on topics frequently tested in SSC exams
• DISTRACTORS: Include common exam mistakes and plausible alternatives
• ENGAGEMENT: Create immediate "exam preparation upgrade" value
• EXPLANATION: Provide insight that improves exam performance (under 120 characters)

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

MANDATORY OUTPUT JSON:
• "hook": Attention-grabbing opener about the mistake (under 60 chars)
• "mistake": The incorrect approach most aspirants use
• "correct": The expert strategy that ensures success
• "practice": Practice instruction with the correct approach
• "explanation": Why experts use this strategy (under 100 chars)
• "cta": "Follow for exam hacks!" or similar (under 40 chars)
• "format_type": "common_mistake"

Create content that makes aspirants feel embarrassed about their mistake but excited to fix it. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Generates Quick Tip format prompt (SSC)
 */
export function generateSSCQuickTipPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

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
• "cta": "Study smarter!" or similar (under 40 chars)
• "format_type": "quick_tip"

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

MANDATORY OUTPUT JSON:
• "hook": Promise about strategic concept mastery (under 60 chars)
• "target_concept": The SSC strategy/concept to demonstrate
• "wrong_scenario": Situation showing incorrect application
• "wrong_context": Brief explanation of why it's wrong (under 80 chars)
• "right_scenario": Situation showing perfect application
• "right_context": Brief explanation of why it's correct (under 80 chars)
• "practice": Practice instruction with scenario
• "practice_scenario": Specific SSC context for aspirant to practice
• "cta": "Master SSC strategy!" or similar (under 40 chars)
• "format_type": "usage_demo"

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

MANDATORY OUTPUT JSON:
• "hook": Challenge opener that tests preparation (under 60 chars)
• "challenge_question": The moderately difficult test question
• "time_limit": Suggested time limit (e.g., "30 seconds")
• "correct_answer": The right answer with brief explanation
• "confidence_message": Success message for those who got it right (under 80 chars)
• "learning_tip": Quick tip for those who got it wrong (under 100 chars)
• "cta": "Test yourself daily!" or similar (under 40 chars)
• "format_type": "challenge"

Create content that makes aspirants excited to test and improve their preparation. [${timeMarker}-${tokenMarker}]`;
}

