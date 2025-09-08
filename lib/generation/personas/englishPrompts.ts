/**
 * English vocabulary prompt templates
 * All English-specific content generation prompts
 */

import { 
  PromptConfig, 
  generateRandomizationElements, 
  generateContextInjections, 
  getPromptVariation,
  getTopicGuidelines 
} from '../shared/promptUtils';

/**
 * Generates main English vocabulary prompt for MCQ format
 */
export function generateEnglishPrompt(config: PromptConfig): string {
  const { topicData, topic, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getTopicGuidelines(topic);

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
• "explanation": Why this answer elevates communication + usage tip (under 120 characters)
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
• EXPLANATION: Provide usage insight that elevates communication (under 120 characters)

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
• "hook": Attention-grabbing opener about the mistake (under 60 chars)
• "mistake": The incorrect version most learners use  
• "correct": The native speaker version
• "practice": Practice instruction with the correct form
• "explanation": Why natives use this version (under 100 chars)
• "cta": "Follow for native tips!" or similar (under 40 chars)
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
• "hook": Promise of quick vocabulary upgrade (under 60 chars)
• "basic_word": The simple word to replace
• "advanced_word": The sophisticated alternative
• "usage_example": Professional context example
• "explanation": Why the advanced word is better (under 100 chars)
• "cta": "Level up your English!" or similar (under 40 chars)  
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
• "hook": Promise about contextual word mastery (under 60 chars)
• "target_word": The advanced vocabulary word to demonstrate
• "wrong_example": Sentence showing incorrect contextual usage
• "wrong_context": Brief explanation of why it's wrong (under 80 chars)
• "right_example": Sentence showing perfect contextual usage
• "right_context": Brief explanation of why it's correct (under 80 chars) 
• "practice": Practice instruction with scenario
• "practice_scenario": Specific context for learner to practice
• "cta": "Master word usage!" or similar (under 40 chars)
• "format_type": "usage_demo"

Create content that makes learners confident about contextual word usage. [${timeMarker}-${tokenMarker}]`;
}