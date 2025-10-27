// lib/generation/personas/astronomy/prompts.ts
/**
 * Astronomy space facts prompt templates
 * All astronomy-specific content generation prompts
 */

import { 
  PromptConfig,
  TopicGuideline, 
  addJsonFormatInstructions,
  generateRandomizationElements,
  generateContextInjections,
  getPromptVariation,
  createBasePromptStructure
} from '../../shared/utils';

/**
 * Astronomy-specific topic guidelines
 * Moved from topicGuidelines.ts for better organization and reduced dependencies
 */
const ASTRONOMY_TOPIC_GUIDELINES: Record<string, TopicGuideline> = {
  // ... (guidelines remain the same, no changes needed here) ...
  // Astronomy Content - Mind-Blowing Space Facts
  space_scale_comparisons: {
    focus: 'One mind-blowing size comparison that puts space scale in perspective',
    scenarios: ['Earth vs other planets', 'Solar system vs galaxy', 'observable universe scale'],
    engagement: 'Share this fact to blow someone\'s mind'
  },
  space_speed_facts: {
    focus: 'One incredible speed in space that defies comprehension',
    scenarios: ['planet rotation speeds', 'orbital velocities', 'cosmic phenomena speeds'],
    engagement: 'Try to imagine this speed right now'
  },
  space_temperature_extremes: {
    focus: 'One extreme temperature in space that sounds impossible',
    scenarios: ['planetary temperatures', 'stellar temperatures', 'space phenomena'],
    engagement: 'Compare this to the hottest/coldest place on Earth'
  },
  space_time_facts: {
    focus: 'One time-related space fact that sounds impossible but is true',
    scenarios: ['planetary day lengths', 'orbital periods', 'relativistic effects'],
    engagement: 'Think about what this means for space travel'
  },
  space_myths_busted: {
    focus: 'One popular space myth that most people believe but is completely wrong',
    scenarios: ['popular misconceptions', 'movie myths', 'common space beliefs'],
    engagement: 'Share this to shock your friends who believe this myth'
  },
  space_discovery_facts: {
    focus: 'One recent space discovery that changes everything we thought we knew',
    scenarios: ['recent telescope findings', 'new planets', 'cosmic phenomena'],
    engagement: 'Research more about this discovery after the video'
  },
  space_record_numbers: {
    focus: 'One record-breaking number from space that sounds made up',
    scenarios: ['distances', 'quantities', 'measurements', 'time periods'],
    engagement: 'Try to write this number out and count the zeros'
  },
  space_coincidences: {
    focus: 'One cosmic coincidence that seems too perfect to be real',
    scenarios: ['eclipse mechanics', 'orbital resonances', 'size ratios'],
    engagement: 'Wonder at the incredible precision of the universe'
  },
  planet_comparisons: {
    focus: 'One planet vs planet comparison that reveals something shocking',
    scenarios: ['size differences', 'atmospheric differences', 'unique features'],
    engagement: 'Decide which planet you\'d rather visit'
  },
  space_would_you_rather: {
    focus: 'One impossible space choice that makes you think about physics',
    scenarios: ['survival scenarios', 'physics dilemmas', 'exploration choices'],
    engagement: 'Comment your choice and explain why'
  },
  space_what_if: {
    focus: 'One "what if" space scenario with a mind-bending answer',
    scenarios: ['physics thought experiments', 'astronomical events', 'cosmic changes'],
    engagement: 'Try to guess the answer before we reveal it'
  }
};

/**
 * Get astronomy-specific topic guidelines with fallback
 */
function getAstronomyTopicGuidelines(topic: string): TopicGuideline | undefined {
  return ASTRONOMY_TOPIC_GUIDELINES[topic];
}

/**
 * Generates main astronomy prompt for MCQ format
 * SIMPLIFIED & BEGINNER-FRIENDLY - Based on "Sun's true color!" (172 views - #2 video)
 */
export function generateAstronomyPrompt(config: PromptConfig): string {
  const { topicData, topic, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getAstronomyTopicGuidelines(topicData?.key || topic); // Use topicData.key

  // --- Dynamic Variation ---
  const randomization = generateRandomizationElements(topic); // 'topic' is personaID
  const context = generateContextInjections(topic);
  const variation = getPromptVariation();
  const { expertRole, contentStrategy } = createBasePromptStructure(randomization, context, variation);
  // --- End Dynamic Variation ---

  const topicInstruction = topicData
    ? `TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Cool facts about space'}`
    : `TOPIC: "${topic}" - Cool space facts`;

  // --- FIX: Create a stronger, combined novelty instruction ---
  const noveltyInstruction = `• NOVELTY: MUST generate a *different* question. Do NOT repeat common examples. The content MUST take a "${randomization.approach}" angle. Use this seed for variation: ${timeMarker}`;

  let basePrompt: string;

  basePrompt = `You are a friendly space enthusiast. ${expertRole}.
${contentStrategy}.

${topicInstruction}

TONE: Curious, exciting, beginner-friendly (NO complex jargon, focus on WONDER and FUN)

CONTENT STYLE:
• Make it feel like discovering cool space trivia
• Use simple, everyday comparisons (Earth, Moon, Sun - things people know)
• Focus on "wow" facts that are fun to share
• Keep it short and punchy - no complicated science terms

QUESTION REQUIREMENTS:
${noveltyInstruction}
• "content": Clear space question anyone can understand (MAX 120 chars, NO hook text)
• "options": A, B, C, D - VERY short answers (max 6 words each)
• "answer": Correct letter (A, B, C, or D)
• "explanation": Why this is cool in simple terms (MAX 120 chars)
• "cta": Fun space CTA under 80 chars
• "content_type": "${questionFormat}"

TARGET: Space-curious beginners who love fun facts

Create content that makes people say "wow, that's cool!" and want to share. [${timeMarker}-${tokenMarker}]`;
  
  // Add JSON format instructions based on question format
  return addJsonFormatInstructions(basePrompt, questionFormat);
}

/**
 * Generates Mind-Blowing Fact MCQ format prompt (Astronomy)
 */
export function generateMindBlowingFactPrompt(config: PromptConfig): string {
  const { topicData, topic, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  
  // Generate randomization elements for variety
  const randomization = generateRandomizationElements(topic); // Pass persona
  const contextInjection = generateContextInjections(topic);
  const promptVariation = getPromptVariation();
  const { expertRole, contentStrategy } = createBasePromptStructure(randomization, contextInjection, promptVariation);

  // --- FIX: Create a stronger, combined novelty instruction ---
  const noveltyInstruction = `• NOVELTY: MUST generate a *different* question. Do NOT repeat common examples. The content MUST take a "${randomization.approach}" angle. Use this seed for variation: ${timeMarker}`;

  const basePrompt = `${expertRole} creating viral "Mind-Blowing Fact" MCQ content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - Focus on facts that sound impossible but are true

CONTENT STRATEGY: ${contentStrategy}

MCQ FORMAT REQUIREMENTS:
• Create a multiple choice question about an incredible space fact
• Question should challenge what people think they know about space
• Present mind-blowing facts with specific numbers/comparisons
• Make viewers realize how this changes their cosmic perspective
• All options must be SHORT (max 6 words) to fit YouTube Shorts video frames

TARGET: Space enthusiasts and curious minds who love being amazed

CONTENT REQUIREMENTS:
${noveltyInstruction}
• FACTS: Present incredible facts with specific numbers/comparisons
• AMAZEMENT: Help viewers realize how this changes their cosmic perspective
• DISTRACTORS: Include plausible but incorrect space facts

MANDATORY OUTPUT:
• "content": Mind-blowing space question that tests incredible cosmic facts
• "options": Object with "A", "B", "C", "D" - KEEP OPTIONS VERY SHORT (max 6 words each) for YouTube Shorts video frame - one perfect answer, three smart distractors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Scientific context for why this is so amazing (under 120 chars)
• "cta": "Follow for space facts!" or similar (under 80 chars - make it compelling and action-oriented)
• "content_type": "${questionFormat}"

Create content that makes viewers say "WOW!" and immediately want to share. [${timeMarker}-${tokenMarker}]`;

  return addJsonFormatInstructions(basePrompt, questionFormat);
}

/**
 * Generates Scale Comparison MCQ format prompt (Astronomy)  
 */
export function generateScaleComparisonPrompt(config: PromptConfig): string {
  const { topicData, topic, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  
  // Generate randomization elements for variety
  const randomization = generateRandomizationElements(topic); // Pass persona
  const contextInjection = generateContextInjections(topic);
  const promptVariation = getPromptVariation();
  const { expertRole, contentStrategy } = createBasePromptStructure(randomization, contextInjection, promptVariation);

  // --- FIX: Create a stronger, combined novelty instruction ---
  const noveltyInstruction = `• NOVELTY: MUST generate a *different* question. Do NOT repeat common examples. The content MUST take a "${randomization.approach}" angle. Use this seed for variation: ${timeMarker}`;

  const basePrompt = `${expertRole} creating viral "Scale Comparison" MCQ content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - Making cosmic scales comprehensible through MCQ format

CONTENT STRATEGY: ${contentStrategy}

MCQ FORMAT REQUIREMENTS:
• Create a multiple choice question about cosmic scale comparisons
• Use familiar objects as reference points (marble, football field, grain of sand)
• Present mind-bending scale relationships that are hard to believe
• Test understanding of how impossibly vast or tiny space objects are
• All options must be SHORT (max 6 words) to fit YouTube Shorts video frames

TARGET: Anyone curious about how big/small things really are in space

CONTENT REQUIREMENTS:
${noveltyInstruction}
• COMPARISONS: Use familiar objects as starting points for cosmic scale
• REVEAL: Show mind-bending scale relationships through MCQ options
• DISTRACTORS: Include plausible but incorrect scale comparisons

MANDATORY OUTPUT:
• "content": Cosmic scale comparison question that tests space size knowledge
• "options": Object with "A", "B", "C", "D" - KEEP OPTIONS VERY SHORT (max 6 words each) for YouTube Shorts video frame - one perfect answer, three smart distractors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Why this scale comparison is so hard to grasp (under 120 chars)
• "cta": "Mind = blown! Follow!" or similar (under 80 chars - make it compelling and action-oriented)
• "content_type": "${questionFormat}"

Create content that makes people realize how impossibly vast or tiny space objects are. [${timeMarker}-${tokenMarker}]`;

  return addJsonFormatInstructions(basePrompt, questionFormat);
}

/**
 * Generates Space Myth Busted MCQ format prompt (Astronomy)
 */
export function generateSpaceMythBustedPrompt(config: PromptConfig): string {
  const { topicData, topic, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  
  // Generate randomization elements for variety
  const randomization = generateRandomizationElements(topic); // Pass persona
  const contextInjection = generateContextInjections(topic);
  const promptVariation = getPromptVariation();
  const { expertRole, contentStrategy } = createBasePromptStructure(randomization, contextInjection, promptVariation);

  // --- FIX: Create a stronger, combined novelty instruction ---
  const noveltyInstruction = `• NOVELTY: MUST generate a *different* question. Do NOT repeat common examples. The content MUST take a "${randomization.approach}" angle. Use this seed for variation: ${timeMarker}`;

  const basePrompt = `${expertRole} creating viral "Space Myth Busted" MCQ content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - Destroying popular space misconceptions through MCQ format

CONTENT STRATEGY: ${contentStrategy}

MCQ FORMAT REQUIREMENTS:
• Create a multiple choice question that busts a popular space myth
• Question should challenge common misconceptions people believe
• Present scientific truth vs widespread misconceptions
• Test understanding of actual space science vs popular myths
• All options must be SHORT (max 6 words) to fit YouTube Shorts video frames

TARGET: Space enthusiasts who want to separate fact from fiction

CONTENT REQUIREMENTS:
${noveltyInstruction}
• MYTH VS REALITY: Present misconception vs scientific truth through MCQ
• TRUTH: Reveal what actually happens, with scientific explanation
• DISTRACTORS: Include common space myths and misconceptions as wrong options

MANDATORY OUTPUT:
• "content": Space myth-busting question that tests scientific truth vs misconceptions
• "options": Object with "A", "B", "C", "D" - KEEP OPTIONS VERY SHORT (max 6 words each) for YouTube Shorts video frame - one scientifically correct answer, three common myths
• "answer": Single letter "A", "B", "C", "D"
• "explanation": Why this myth exists and what the science actually shows (under 120 chars)
• "cta": "Science wins! Follow!" or similar (under 80 chars - make it compelling and action-oriented)
• "content_type": "${questionFormat}"

Create content that makes viewers feel smarter about space science reality. [${timeMarker}-${tokenMarker}]`;

  return addJsonFormatInstructions(basePrompt, questionFormat);
}