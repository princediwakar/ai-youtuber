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
import { ContentComponents } from '../../shared/components';

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
 */
export function generateBrainHealthPrompt(config: PromptConfig): string {
  const { topicData, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getHealthTopicGuidelines(config.topic);
  const randomCTA = ContentComponents.getRandomCTA('brain_health_tips');

  // Generate randomization elements
  const randomization = generateRandomizationElements();
  const contextInjection = generateContextInjections();
  const promptVariation = getPromptVariation();

  let expertRole = '';
  let contentStrategy = '';

  // Prompt structure variation based on time
  switch (promptVariation) {
    case 0:
      expertRole = `You are a ${randomization.perspective} brain health coach with a ${randomization.tone} approach`;
      contentStrategy = `Take a ${randomization.approach} angle focusing on ${contextInjection.demographic}`;
      break;
    case 1:
      expertRole = `As a mental health expert specializing in ${randomization.perspective} communication`;
      contentStrategy = `Use ${randomization.tone} language with ${randomization.approach} tips for ${contextInjection.timeContext}`;
      break;
    case 2:
      expertRole = `You're a brain fitness trainer with ${randomization.tone} presentation style`;
      contentStrategy = `Frame content as ${randomization.approach} insights targeting ${contextInjection.demographic} during ${contextInjection.timeContext}`;
      break;
  }

  const basePrompt = `${expertRole} creating viral brain health content for YouTube Shorts.

CREATIVE SEED: [${randomization.creativeSeed}] - Use this to ensure unique creative direction
TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Advanced brain health concepts'}

RANDOMIZED APPROACH:
• CONTENT STYLE: ${randomization.approach} with ${randomization.tone} tone from ${randomization.perspective} perspective
• CONTEXT: Target ${contextInjection.demographic} in ${contextInjection.timeContext} scenarios
• URGENCY: Position as ${contextInjection.urgency} simple brain tip

VIRAL CONTENT STRATEGY:
• HOOK: ${guidelines?.hook || 'Present surprising brain health insights that challenge common assumptions'}
• SCENARIOS: Focus on ${guidelines?.scenarios?.join(', ') || 'relatable daily brain health challenges'}
• ENGAGEMENT: ${guidelines?.engagement || 'Create immediate practical value for viewers'}

ANTI-REPETITION CONSTRAINTS:
• AVOID these overused phrases: "30-second habit", "this simple trick", "boost your brain"
• AVOID generic openings: "Did you know", "Most people don't realize"
• CREATE unique hooks using the creative seed and randomization elements above
• VARY action instructions - don't repeat common patterns like "try this now"

Generate a ${questionFormat === 'multiple_choice' ? 'multiple choice' : 'true/false'} question that:

TARGET AUDIENCE: Health-conscious adults (25-55) who want a sharper memory and better focus
CONTENT APPROACH:
• Lead with ${randomization.tone} ${randomization.approach} insights
• Present evidence-based information tailored to ${contextInjection.demographic}
• Include ${contextInjection.urgency} practical applications
• Create "I need to share this with ${contextInjection.demographic}" moments

QUESTION STRUCTURE (${questionFormat}):
${questionFormat === 'multiple_choice'
    ? `• STEM: Present scenario using ${randomization.approach} angle for ${contextInjection.demographic}\n• CORRECT ANSWER: The scientifically accurate response with ${contextInjection.urgency} practical value\n• SMART DISTRACTORS: Common misconceptions, partially correct answers, believable alternatives\n• DIFFICULTY: Challenging enough to educate but achievable for motivated viewers`
    : `• STATEMENT: Present ${randomization.approach} brain health fact targeting ${contextInjection.demographic}\n• DESIGN: Create statements that reveal ${randomization.tone} truths or challenge assumptions\n• IMPACT: Ensure the answer provides ${contextInjection.urgency} practical value`}

CRITICAL LENGTH REQUIREMENTS:
• "question": MAXIMUM 120 characters - be concise and punchy
• "options": Each option MAXIMUM 45 characters - short, clear answers only
• "explanation": MAXIMUM 120 characters - brief but valuable insight
• "cta": MAXIMUM 35 characters - short action phrase (avoid repetitive CTAs)

MANDATORY OUTPUT:
• "question": ${questionFormat === 'multiple_choice' ? 'Engaging scenario-based or fact-testing multiple choice question (MAX 120 chars)' : 'Surprising or myth-busting true/false statement (MAX 120 chars)'} 
• "options": ${questionFormat === 'multiple_choice' ? 'Object with "A", "B", "C", "D" - one correct answer, three clever distractors (each MAX 45 chars)' : 'Object with "A": "True", "B": "False"'}
• "answer": ${questionFormat === 'multiple_choice' ? 'Single letter "A", "B", "C", or "D"' : 'Either "A" or "B"'}
• "explanation": Why this matters + practical application (MAX 120 characters)
• "cta": Action-oriented CTA (MAX 35 chars) - use creative seed to avoid repetitive phrases
• "question_type": "${questionFormat}"

Create content so valuable and surprising that ${contextInjection.demographic} immediately share it. [${timeMarker}-${tokenMarker}-${randomization.creativeSeed}]`;

  return basePrompt;
}

/**
 * Generates eye health content prompt
 */
export function generateEyeHealthPrompt(config: PromptConfig): string {
  const { topicData, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getHealthTopicGuidelines(config.topic);

  // Generate randomization elements
  const randomization = generateRandomizationElements();
  const contextInjection = generateContextInjections();
  const promptVariation = getPromptVariation();

  let expertRole = '';
  let contentStrategy = '';

  // Prompt structure variation based on time
  switch (promptVariation) {
    case 0:
      expertRole = `You are a ${randomization.perspective} eye health expert with ${randomization.tone} communication style`;
      contentStrategy = `Deliver ${randomization.approach} vision tips for ${contextInjection.demographic}`;
      break;
    case 1:
      expertRole = `As a vision wellness coach focusing on ${randomization.perspective} education`;
      contentStrategy = `Present ${randomization.tone} ${randomization.approach} guidance targeting ${contextInjection.timeContext}`;
      break;
    case 2:
      expertRole = `You're an eye care specialist with ${randomization.tone} presentation approach`;
      contentStrategy = `Frame insights as ${randomization.approach} tips for ${contextInjection.demographic} in ${contextInjection.timeContext}`;
      break;
  }

  const basePrompt = `${expertRole} creating viral eye health content for YouTube Shorts.

CREATIVE SEED: [${randomization.creativeSeed}] - Use this to ensure unique creative direction
TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Advanced eye health and vision protection strategies'}

RANDOMIZED APPROACH:
• CONTENT STYLE: ${randomization.approach} with ${randomization.tone} tone from ${randomization.perspective} perspective
• CONTEXT: Target ${contextInjection.demographic} during ${contextInjection.timeContext} scenarios
• URGENCY: Position as ${contextInjection.urgency} eye care tip

VIRAL CONTENT STRATEGY:
• HOOK: ${guidelines?.hook || 'Reveal shocking truths about daily habits that damage vision'}
• SCENARIOS: Focus on ${guidelines?.scenarios?.join(', ') || 'modern vision challenges and digital eye strain'}
• ENGAGEMENT: ${guidelines?.engagement || 'Provide immediate eye health improvements viewers can implement'}

ANTI-REPETITION CONSTRAINTS:
• AVOID overused phrases: "20-20-20 rule", "30-second habit", "boost your eyes", "save your vision"
• AVOID generic hooks: "What happens to your eyes when", "This simple trick"
• CREATE unique vision-specific hooks using the creative seed and randomization elements
• VARY eye exercise instructions - don't repeat common patterns like "look away from screen"

Generate a ${questionFormat === 'multiple_choice' ? 'multiple choice' : 'true/false'} question that:

TARGET AUDIENCE: Working professionals and screen users (20-50) seeking vision protection and eye health optimization
CONTENT APPROACH:
• Start with ${randomization.tone} ${randomization.approach} eye health revelations
• Address challenges specific to ${contextInjection.demographic}
• Provide ${contextInjection.urgency} actionable prevention strategies tailored to ${contextInjection.timeContext}
• Create urgency about vision protection using ${randomization.perspective} credibility

QUESTION STRUCTURE (${questionFormat}):
${questionFormat === 'multiple_choice'
    ? `• STEM: Present eye health scenario using ${randomization.approach} angle for ${contextInjection.demographic}\n• CORRECT ANSWER: Evidence-based solution with ${contextInjection.urgency} practical application\n• SMART DISTRACTORS: Common eye care myths, partially correct advice, believable misconceptions\n• RELEVANCE: Focus on digital age challenges specific to ${contextInjection.timeContext}`
    : `• STATEMENT: Present ${randomization.approach} eye health fact that challenges ${contextInjection.demographic} assumptions\n• IMPACT: Create "I had no idea my ${contextInjection.timeContext} habits were hurting my eyes" moments\n• URGENCY: Highlight ${contextInjection.urgency} actions viewers can take to protect their vision`}

CRITICAL LENGTH REQUIREMENTS:
• "question": MAXIMUM 120 characters - be concise and punchy
• "options": Each option MAXIMUM 45 characters - short, clear answers only
• "explanation": MAXIMUM 120 characters - brief but valuable insight
• "cta": MAXIMUM 35 characters - short action phrase (avoid repetitive CTAs)

MANDATORY OUTPUT:
• "question": ${questionFormat === 'multiple_choice' ? 'Scenario-based multiple choice addressing modern vision challenges (MAX 120 chars)'
    : 'Eye-opening true/false statement about vision health (MAX 120 chars)'}
• "options": ${questionFormat === 'multiple_choice' ? 'Object with "A", "B", "C", "D" - practical solution + three plausible alternatives (each MAX 45 chars)' : 'Object with "A": "True", "B": "False"'}
• "answer": ${questionFormat === 'multiple_choice' ? 'Single letter "A", "B", "C", or "D"' : 'Either "A" or "B"'}
• "explanation": Why this protects vision + immediate action step (MAX 120 characters)
• "cta": Urgent action CTA (MAX 35 chars) - use creative seed to create unique phrases
• "question_type": "${questionFormat}"

Create content that makes ${contextInjection.demographic} immediately concerned about their eye health during ${contextInjection.timeContext} and motivated to take action. [${timeMarker}-${tokenMarker}-${randomization.creativeSeed}]`;

  return basePrompt;
}

/**
 * Generates Quick Tip format prompt (Health)
 */
export function generateQuickTipPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getHealthTopicGuidelines(config.topic);
  const randomCTA = ContentComponents.getRandomCTA('brain_health_tips');

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
• "cta": Use "${randomCTA}" or similar action CTA (under 40 chars)

Create content that viewers immediately want to try. [${timeMarker}-${tokenMarker}]`;
}


/**
 * Generates Challenge format prompt (Health)
 */
export function generateChallengePrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getHealthTopicGuidelines(config.topic);
  const randomCTA = ContentComponents.getRandomCTA('brain_health_tips');

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
• REVEAL: Solution + brain science explanation
• ENGAGEMENT: Viewers must actively participate

TARGET: People who want to train their brain and improve memory

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
• "cta": Use "${randomCTA}" or similar brain training CTA (under 40 chars)
• "encouragement": Positive reinforcement text
• "next_challenge": Teaser for next challenge
• "format_type": "challenge"

Create interactive content that viewers must engage with actively. [${timeMarker}-${tokenMarker}]`;
}