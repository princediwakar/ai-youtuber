/**
 * Prompt templates for content generation
 * Separates prompt logic from main service for better maintainability
 */

import { TOPIC_GUIDELINES } from './topicGuidelines';

export interface VariationMarkers {
  timeMarker: string;
  tokenMarker: string;
}

export interface PromptConfig {
  persona: string;
  topic: string;
  topicData: any;
  markers: VariationMarkers;
  questionFormat?: string;
  format?: string;
  formatDefinition?: any;
}

/**
 * Generates unique variation markers for content diversity
 */
export function generateVariationMarkers(): VariationMarkers {
  const timestamp = Date.now();
  const timeMarker = `T${timestamp}`;
  const tokenMarker = `TK${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  return { timeMarker, tokenMarker };
}

/**
 * Generates brain health content prompt
 */
export function generateBrainHealthPrompt(config: PromptConfig): string {
  const { topicData, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = TOPIC_GUIDELINES[config.topic];
  
  return `You are a renowned neuroscientist and brain health expert creating viral educational content for YouTube Shorts.

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
}

/**
 * Generates eye health content prompt
 */
export function generateEyeHealthPrompt(config: PromptConfig): string {
  const { topicData, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = TOPIC_GUIDELINES[config.topic];
  
  return `You are a leading optometrist and vision health expert creating viral educational content for YouTube Shorts.

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
}

/**
 * Generates English vocabulary content prompt
 */
export function generateEnglishPrompt(config: PromptConfig): string {
  const { topicData, topic, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = TOPIC_GUIDELINES[topic];
  
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
 * Adds JSON formatting instructions to a prompt
 */
export function addJsonFormatInstructions(prompt: string, questionFormat: string): string {
  if (questionFormat === 'multiple_choice') {
    return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "content", "options" (an object with keys "A", "B", "C", "D"), "answer" (a single letter "A", "B", "C", or "D"), "explanation", "cta", and "content_type" (set to "multiple_choice"). Explanation must be under 150 characters.';
  } else if (questionFormat === 'true_false') {
    return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "content", "options" (an object with keys "A": "True", "B": "False"), "answer" (either "A" or "B"), "explanation", "cta", and "content_type" (set to "true_false"). Explanation must be under 150 characters.';
  } else if (questionFormat === 'assertion_reason') {
    return prompt + `\n\nCRITICAL: Generate an Assertion/Reason question. Format your response as a single, valid JSON object with these exact keys: "assertion", "reason", "options", "answer", "explanation", "cta", and "question_type" (set to "assertion_reason"). 

MANDATORY JSON STRUCTURE:
• "assertion": A statement of fact.
• "reason": A statement explaining the assertion.
• "options": Must be the standard A/B/C/D object.
• "answer": A single letter "A", "B", "C", or "D".
• "explanation": Max 2 short sentences (under 150 characters).
• "cta": A short call-to-action text.`;
  }
  
  return prompt;
}

// =================================================================
// FORMAT-SPECIFIC PROMPT GENERATORS
// =================================================================

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
 * Generates Quick Tip format prompt (Health)
 */
export function generateQuickTipPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = TOPIC_GUIDELINES[config.topic];
  
  return `You are a health expert creating viral "Quick Tip" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Immediate health improvements'}

FORMAT: Quick Tip (3 frames)
Frame 1 (Hook): "This 30-second habit will boost your [brain/eyes]"
Frame 2 (Action): "Here's exactly what to do: [step by step]"  
Frame 3 (Result): "Why it works + science behind it"

CONTENT REQUIREMENTS:
• HOOK: Promise specific timeframe and health benefit
• ACTION: Clear, actionable steps anyone can do immediately
• RESULT: Scientific explanation + motivating outcome
• Focus on immediate practical value

TARGET: Health-conscious adults seeking quick wins

MANDATORY OUTPUT JSON:
• "hook": Specific promise with timeframe (under 60 chars)
• "action": 2-3 specific steps combined into one actionable instruction
• "result": Scientific reason + immediate benefit combined
• "cta": "Try this now!" or similar (under 40 chars)

Create content that viewers immediately want to try. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Generates Before/After format prompt (Health)
 */
export function generateBeforeAfterPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = TOPIC_GUIDELINES[config.topic];
  
  return `You are a health expert creating viral "Before/After" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Health consequences and transformations'}

FORMAT: Before/After (4 frames)
Frame 1 (Hook): "What happens to your [brain/eyes] when you..."
Frame 2 (Before): "Most people damage their [health] by..."
Frame 3 (After): "But if you do THIS instead..."
Frame 4 (Proof): "Here's the science + immediate action"

CONTENT REQUIREMENTS:
• HOOK: Create curiosity about health consequences  
• BEFORE: Common harmful behavior most people do
• AFTER: Simple alternative behavior/habit
• PROOF: Scientific backing + actionable next step

TARGET: People unaware of daily health damage they're causing

MANDATORY OUTPUT JSON:
• "hook": Curiosity-driven opener (under 60 chars)
• "before": What most people do wrong (harmful behavior)
• "after": The healthier alternative (better behavior) 
• "result": Research-backed explanation + immediate benefit
• "cta": "Protect your health!" or similar (under 40 chars)

Create content that makes viewers realize they need to change immediately. [${timeMarker}-${tokenMarker}]`;
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

/**
 * Generates Challenge format prompt (Health)
 */
export function generateChallengePrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = TOPIC_GUIDELINES[config.topic];
  
  return `You are a brain training expert creating viral "Challenge" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Interactive brain/memory challenges'}

FORMAT: Challenge (5 frames)
Frame 1 (Hook): "Test your brain with this challenge"
Frame 2 (Setup): "Try to remember these items..."
Frame 3 (Challenge): Present the actual test/puzzle
Frame 4 (Reveal): "How did you do? Here's the secret..."
Frame 5 (CTA): "Follow for more brain training!"

CONTENT REQUIREMENTS:
• HOOK: Exciting challenge invitation 
• SETUP: Clear instructions for the challenge
• CHALLENGE: Interactive test (memory, visual, logic)
• REVEAL: Solution + cognitive science explanation
• ENGAGEMENT: Viewers must actively participate

TARGET: People seeking brain training and cognitive improvement

MANDATORY OUTPUT JSON:
• "hook": Exciting challenge invitation (under 60 chars)
• "setup": Clear challenge instructions
• "instructions": Specific steps for the challenge
• "challenge_type": "memory" or "visual" or "logic"
• "challenge_items": Array of items to remember/observe (if memory challenge)
• "challenge_content": The actual challenge content/puzzle
• "reveal": Result reveal text (under 60 chars)
• "trick": The method/science behind the challenge
• "answer": The correct solution/explanation
• "cta": "Follow for brain training!" or similar (under 40 chars)
• "encouragement": Positive reinforcement text
• "next_challenge": Teaser for next challenge
• "format_type": "challenge"

Create interactive content that viewers must engage with actively. [${timeMarker}-${tokenMarker}]`;
}

/**
 * Main format-aware prompt generator  
 */
export function generateFormatPrompt(config: PromptConfig): string {
  const format = config.format || 'mcq';
  
  switch (format) {
    case 'common_mistake':
      return generateCommonMistakePrompt(config);
    case 'quick_fix':
      return generateQuickFixPrompt(config);
    case 'usage_demo':
      return generateUsageDemoPrompt(config);
    case 'challenge':
      return generateChallengePrompt(config);
    case 'quick_tip':
      return generateQuickTipPrompt(config);
    case 'before_after':
      return generateBeforeAfterPrompt(config);
    case 'mcq':
    default:
      // Fall back to existing MCQ logic based on persona
      if (config.persona === 'brain_health_tips') {
        return generateBrainHealthPrompt(config);
      } else if (config.persona === 'eye_health_tips') {
        return generateEyeHealthPrompt(config);
      } else if (config.persona === 'english_vocab_builder') {
        return generateEnglishPrompt(config);
      } else {
        return generateEnglishPrompt(config); // Default fallback
      }
  }
}