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
import { ContentComponents } from '../../shared/components';

/**
 * Astronomy-specific topic guidelines
 * Moved from topicGuidelines.ts for better organization and reduced dependencies
 */
const ASTRONOMY_TOPIC_GUIDELINES: Record<string, TopicGuideline> = {
  // Astronomy Content - Mind-Blowing Space Facts
  space_scale_comparisons: {
    focus: 'One mind-blowing size comparison that puts space scale in perspective',
    hook: 'This space fact will make you feel incredibly small',
    scenarios: ['Earth vs other planets', 'Solar system vs galaxy', 'observable universe scale'],
    engagement: 'Share this fact to blow someone\'s mind'
  },
  space_speed_facts: {
    focus: 'One incredible speed in space that defies comprehension',
    hook: 'This space speed will break your brain',
    scenarios: ['planet rotation speeds', 'orbital velocities', 'cosmic phenomena speeds'],
    engagement: 'Try to imagine this speed right now'
  },
  space_temperature_extremes: {
    focus: 'One extreme temperature in space that sounds impossible',
    hook: 'This space temperature is beyond your wildest imagination',
    scenarios: ['planetary temperatures', 'stellar temperatures', 'space phenomena'],
    engagement: 'Compare this to the hottest/coldest place on Earth'
  },
  space_time_facts: {
    focus: 'One time-related space fact that sounds impossible but is true',
    hook: 'Time works differently in space - here\'s proof',
    scenarios: ['planetary day lengths', 'orbital periods', 'relativistic effects'],
    engagement: 'Think about what this means for space travel'
  },
  space_myths_busted: {
    focus: 'One popular space myth that most people believe but is completely wrong',
    hook: 'This space "fact" everyone believes is totally FALSE',
    scenarios: ['popular misconceptions', 'movie myths', 'common space beliefs'],
    engagement: 'Share this to shock your friends who believe this myth'
  },
  space_discovery_facts: {
    focus: 'One recent space discovery that changes everything we thought we knew',
    hook: 'This space discovery will change how you see the universe',
    scenarios: ['recent telescope findings', 'new planets', 'cosmic phenomena'],
    engagement: 'Research more about this discovery after the video'
  },
  space_record_numbers: {
    focus: 'One record-breaking number from space that sounds made up',
    hook: 'This space number is so big it\'s almost meaningless',
    scenarios: ['distances', 'quantities', 'measurements', 'time periods'],
    engagement: 'Try to write this number out and count the zeros'
  },
  space_coincidences: {
    focus: 'One cosmic coincidence that seems too perfect to be real',
    hook: 'This cosmic coincidence is so perfect it seems planned',
    scenarios: ['eclipse mechanics', 'orbital resonances', 'size ratios'],
    engagement: 'Wonder at the incredible precision of the universe'
  },
  planet_comparisons: {
    focus: 'One planet vs planet comparison that reveals something shocking',
    hook: 'This planet comparison will surprise you',
    scenarios: ['size differences', 'atmospheric differences', 'unique features'],
    engagement: 'Decide which planet you\'d rather visit'
  },
  space_would_you_rather: {
    focus: 'One impossible space choice that makes you think about physics',
    hook: 'This space "would you rather" has no good answer',
    scenarios: ['survival scenarios', 'physics dilemmas', 'exploration choices'],
    engagement: 'Comment your choice and explain why'
  },
  space_what_if: {
    focus: 'One "what if" space scenario with a mind-bending answer',
    hook: 'What would happen if... (the answer will shock you)',
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
 */
export function generateAstronomyPrompt(config: PromptConfig): string {
  const { topicData, topic, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getAstronomyTopicGuidelines(topic);
  const randomCTA = ContentComponents.getRandomCTA('space_facts_quiz');
  
  // Generate randomization elements for variety
  const randomization = generateRandomizationElements();
  const contextInjection = generateContextInjections();
  const promptVariation = getPromptVariation();
  const { expertRole, contentStrategy } = createBasePromptStructure(randomization, contextInjection, promptVariation);

  let basePrompt: string;

  if (topicData) {
    basePrompt = `${expertRole} creating mind-blowing space content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Mind-bending facts about the cosmos'}

VIRAL LEARNING STRATEGY:
• HOOK: ${guidelines?.hook || 'Challenge viewers with facts that sound impossible but are true'}
• SCENARIOS: Apply to ${guidelines?.scenarios?.join(', ') || 'space exploration, cosmic phenomena, and universal mysteries'}
• ENGAGEMENT: ${guidelines?.engagement || 'Create "this will blow your mind" moments'}
• CONTENT STRATEGY: ${contentStrategy}

Generate a question that targets space enthusiasts and curious learners who love mind-bending facts about the universe:

CONTENT APPROACH:
• Lead with wonder-building ("This will blow your mind!")
• Present facts that sound impossible but are scientifically accurate
• Include specific numbers, comparisons, and shocking discoveries
• Create "wow!" moments that boost sharing motivation

QUESTION CRAFTING:
• PRECISION: Direct, clear questions that test amazing space knowledge
• RELEVANCE: Focus on facts that make people rethink their understanding of space
• DIFFICULTY: Mind-blowing enough to amaze but understandable for curious minds
• DISTRACTORS: Include plausible but incorrect facts, common misconceptions, and close alternatives
• IMPACT: Provide knowledge that immediately changes how people view the cosmos
• FORMAT: All options must be SHORT (max 6 words) to fit YouTube Shorts video frames

MANDATORY OUTPUT:
• "hook": A mind-blowing fact or question to grab attention (under 70 chars)
• "content": Clear, mind-blowing space question that tests incredible cosmic facts
• "options": Object with "A", "B", "C", "D" - KEEP OPTIONS VERY SHORT (max 6 words each) for YouTube Shorts video frame - one perfect answer, three smart distractors based on misconceptions
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Why this fact is mind-blowing + cosmic context (under 120 characters)
• "cta": Use "${randomCTA}" or similar wonder-inspiring CTA (under 40 chars)

Create astronomy content that makes viewers feel amazed about the universe and eager to share. [${timeMarker}-${tokenMarker}]`;
  } else {
    basePrompt = `${expertRole} creating viral space content for YouTube Shorts.

Generate a mind-blowing astronomy question on "${topic}" that amazes viewers with incredible cosmic facts.

CONTENT STRATEGY: ${contentStrategy}

REQUIREMENTS:
• HOOK: Present facts that sound impossible but are scientifically true
• PRACTICAL: Focus on phenomena that reshape understanding of space and time
• DISTRACTORS: Include common space misconceptions and plausible alternatives
• ENGAGEMENT: Create immediate "wow factor" and sharing value
• EXPLANATION: Provide cosmic insight that expands perspective (under 120 characters)

Make viewers feel amazed about the universe and eager to share incredible knowledge. [${timeMarker}-${tokenMarker}]`;
  }

  // Add JSON format instructions based on question format
  return addJsonFormatInstructions(basePrompt, questionFormat);
}

/**
 * Generates Mind-Blowing Fact MCQ format prompt (Astronomy)
 */
export function generateMindBlowingFactPrompt(config: PromptConfig): string {
  const { topicData, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  
  // Generate randomization elements for variety
  const randomization = generateRandomizationElements();
  const contextInjection = generateContextInjections();
  const promptVariation = getPromptVariation();
  const { expertRole, contentStrategy } = createBasePromptStructure(randomization, contextInjection, promptVariation);

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
• HOOK: Create excitement about learning something unbelievable
• FACTS: Present incredible facts with specific numbers/comparisons
• AMAZEMENT: Help viewers realize how this changes their cosmic perspective
• DISTRACTORS: Include plausible but incorrect space facts

MANDATORY OUTPUT:
• "hook": An unbelievable fact to grab instant attention (under 70 chars)
• "content": Mind-blowing space question that tests incredible cosmic facts
• "options": Object with "A", "B", "C", "D" - KEEP OPTIONS VERY SHORT (max 6 words each) for YouTube Shorts video frame - one perfect answer, three smart distractors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Scientific context for why this is so amazing (under 120 chars)
• "cta": "Follow for space facts!" or similar (under 40 chars)

Create content that makes viewers say "WOW!" and immediately want to share. [${timeMarker}-${tokenMarker}]`;

  return addJsonFormatInstructions(basePrompt, questionFormat);
}

/**
 * Generates Scale Comparison MCQ format prompt (Astronomy)  
 */
export function generateScaleComparisonPrompt(config: PromptConfig): string {
  const { topicData, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  
  // Generate randomization elements for variety
  const randomization = generateRandomizationElements();
  const contextInjection = generateContextInjections();
  const promptVariation = getPromptVariation();
  const { expertRole, contentStrategy } = createBasePromptStructure(randomization, contextInjection, promptVariation);

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
• HOOK: Promise to reveal incomprehensible cosmic scales
• COMPARISONS: Use familiar objects as starting points for cosmic scale
• REVEAL: Show mind-bending scale relationships through MCQ options
• DISTRACTORS: Include plausible but incorrect scale comparisons

MANDATORY OUTPUT:
• "hook": A shocking comparison to grab attention instantly (under 70 chars)
• "content": Cosmic scale comparison question that tests space size knowledge
• "options": Object with "A", "B", "C", "D" - KEEP OPTIONS VERY SHORT (max 6 words each) for YouTube Shorts video frame - one perfect answer, three smart distractors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Why this scale comparison is so hard to grasp (under 120 chars)
• "cta": "Mind = blown! Follow!" or similar (under 40 chars)

Create content that makes people realize how impossibly vast or tiny space objects are. [${timeMarker}-${tokenMarker}]`;

  return addJsonFormatInstructions(basePrompt, questionFormat);
}

/**
 * Generates Space Myth Busted MCQ format prompt (Astronomy)
 */
export function generateSpaceMythBustedPrompt(config: PromptConfig): string {
  const { topicData, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  
  // Generate randomization elements for variety
  const randomization = generateRandomizationElements();
  const contextInjection = generateContextInjections();
  const promptVariation = getPromptVariation();
  const { expertRole, contentStrategy } = createBasePromptStructure(randomization, contextInjection, promptVariation);

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
• HOOK: Promise to destroy a widely believed space myth
• MYTH VS REALITY: Present misconception vs scientific truth through MCQ
• TRUTH: Reveal what actually happens, with scientific explanation
• DISTRACTORS: Include common space myths and misconceptions as wrong options

MANDATORY OUTPUT:
• "hook": A popular myth you probably believe is false (under 70 chars)
• "content": Space myth-busting question that tests scientific truth vs misconceptions
• "options": Object with "A", "B", "C", "D" - KEEP OPTIONS VERY SHORT (max 6 words each) for YouTube Shorts video frame - one scientifically correct answer, three common myths
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Why this myth exists and what the science actually shows (under 120 chars)
• "cta": "Science wins! Follow!" or similar (under 40 chars)

Create content that makes viewers feel smarter about space science reality. [${timeMarker}-${tokenMarker}]`;

  return addJsonFormatInstructions(basePrompt, questionFormat);
}