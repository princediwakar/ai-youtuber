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
    return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "question", "options" (an object with keys "A", "B", "C", "D"), "answer" (a single letter "A", "B", "C", or "D"), "explanation", "cta", and "question_type" (set to "multiple_choice"). Explanation must be under 150 characters.';
  } else if (questionFormat === 'true_false') {
    return prompt + '\n\nCRITICAL: Format your entire response as a single, valid JSON object with these exact keys: "question", "options" (an object with keys "A": "True", "B": "False"), "answer" (either "A" or "B"), "explanation", "cta", and "question_type" (set to "true_false"). Explanation must be under 150 characters.';
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