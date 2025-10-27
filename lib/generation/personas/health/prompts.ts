// lib/generation/personas/health/prompts.ts
/**
 * Health-related prompt templates (Mental & General Health)
 * All health persona content generation prompts
 */

import { 
  PromptConfig,
  TopicGuideline, 
  generateRandomizationElements, 
  generateContextInjections, 
  getPromptVariation,
  createBasePromptStructure,
  addJsonFormatInstructions
} from '../../shared/utils';

/**
 * Health-specific topic guidelines
 * Provides specific focus, scenarios, and engagement hooks for each sub-topic.
 */
const HEALTH_TOPIC_GUIDELINES: Record<string, TopicGuideline> = {
  // --- Mental Health Topics ---
  'stress_management': {
    focus: 'One simple, 2-minute technique to lower stress right now',
    scenarios: ['feeling overwhelmed at work', 'quick grounding exercise', 'breathing techniques'],
    engagement: 'Try this simple trick the next time you feel stressed'
  },
  'focus_boost': {
    focus: 'One "brain hack" to instantly improve focus on a task',
    scenarios: ['procrastination', 'distractions', 'study tips', 'Pomodoro technique variation'],
    engagement: 'Use this hack to get more done in less time'
  },
  'mood_enhancers': {
    focus: 'One small, science-backed action to quickly boost your mood',
    scenarios: ['getting sunlight', 'quick stretch', 'posture change', 'listening to music'],
    engagement: 'Feeling down? Try this 1-minute mood booster!'
  },
  'mindfulness_hacks': {
    focus: 'A 30-second mindfulness exercise for beginners',
    scenarios: ['mindful breathing', '5 senses technique', 'body scan'],
    engagement: 'You don\'t need hours. Try this 30-second reset.'
  },
  'sleep_quality': {
    focus: 'One surprising tip to improve your sleep quality tonight',
    scenarios: ['blue light', 'room temperature', 'evening routine', 'sleep myths'],
    engagement: 'Want better sleep? Don\'t forget this one thing.'
  },
  'cognitive_habits': {
    focus: 'One simple daily habit that can help protect brain health long-term',
    scenarios: ['learning new skills', 'brain-training', 'neurobics', 'nutrition for brain'],
    engagement: 'Keep your brain sharp with this simple habit.'
  },
  'anxiety_relief': {
    focus: 'A simple grounding technique to calm anxiety quickly',
    scenarios: ['5-4-3-2-1 method', 'box breathing', 'sensory grounding'],
    engagement: 'Feeling anxious? Use this simple trick to calm down.'
  },
  'digital_detox': {
    focus: 'One easy rule to reduce screen time and improve mental clarity',
    scenarios: ['no phones in bedroom', 'app limits', 'social media breaks'],
    engagement: 'Try this one simple change to your phone habits.'
  },
  'gratitude_practice': {
    focus: 'A 1-minute gratitude exercise that can rewire your brain',
    scenarios: ['gratitude journaling', 'three good things', 'thankfulness'],
    engagement: 'Boost your happiness with this 1-minute practice.'
  },
  'positive_affirmations': {
    focus: 'One common mistake people make with positive affirmations',
    scenarios: ['how to phrase affirmations', 'why they work', 'science of self-talk'],
    engagement: 'Make your affirmations actually work with this tip.'
  },
  'memory_tricks': {
    focus: 'One simple mnemonic or trick to remember things better',
    scenarios: ['remembering names', 'shopping lists', 'study hacks', 'memory palace'],
    engagement: 'Forgetful? Try this easy memory hack.'
  },
  'emotional_intelligence': {
    focus: 'One simple way to start boosting your emotional intelligence (EQ)',
    scenarios: ['naming emotions', 'active listening', 'empathy'],
    engagement: 'Boost your EQ with this simple exercise.'
  },
  'burnout_prevention': {
    focus: 'One early warning sign of burnout everyone misses',
    scenarios: ['cynicism', 'exhaustion', 'micro-boundaries', 'work-life balance'],
    engagement: 'Are you ignoring this early sign of burnout?'
  },
  'social_connection': {
    focus: 'A small way to build social connection (that isn\'t awkward)',
    scenarios: ['reaching out', 'community', 'loneliness', 'friendship'],
    engagement: 'Feeling lonely? Try this simple connection tip.'
  },
  'self_care_ideas': {
    focus: 'A 5-minute self-care idea that isn\'t a bubble bath',
    scenarios: ['micro-breaks', 'stretching', 'hydration', 'quick wins'],
    engagement: 'Self-care doesn\'t have to take all day. Try this.'
  },
  'morning_routine': {
    focus: 'One 5-minute addition to your morning for a better day',
    scenarios: ['hydration', 'stretching', 'no phone', 'sunlight'],
    engagement: 'Win your morning with this 5-minute habit.'
  },
  'laughter_therapy': {
    focus: 'One surprising health benefit of a good laugh',
    scenarios: ['endorphins', 'stress relief', 'immune system', 'social bonding'],
    engagement: 'Did you know laughing does this for your body?'
  },

  // --- General Health Topics ---
  'heart_health': {
    focus: 'One small food swap for a healthier heart',
    scenarios: ['salt reduction', 'healthy fats', 'fiber', 'snack ideas'],
    engagement: 'Protect your heart with this easy food swap.'
  },
  'digestive_wellness': {
    focus: 'One simple tip for better digestion and gut health',
    scenarios: ['fiber intake', 'probiotics', 'hydration', 'chewing food'],
    engagement: 'Improve your gut health with this simple daily tip.'
  },
  'skin_health': {
    focus: 'One surprising fact about skin health (that isn\'t just "drink water")',
    scenarios: ['sunscreen myths', 'nutrition for skin', 'sleep', 'over-washing'],
    engagement: 'Want glowing skin? Don\'t ignore this one fact.'
  },
  'joint_support': {
    focus: 'One simple stretch to do at your desk for joint health',
    scenarios: ['mobility', 'stretching', 'desk exercises', 'arthritis prevention'],
    engagement: 'Stiff joints? Try this 30-second desk stretch.'
  },
  'immune_boosters': {
    focus: 'One science-backed tip to support your immune system',
    scenarios: ['Vitamin D', 'Zinc', 'gut health', 'sleep'],
    engagement: 'Help your immune system with this simple tip.'
  },
  'hydration_facts': {
    focus: 'One dehydration myth most people still believe',
    scenarios: ['how much water', 'coffee/tea myths', 'signs of dehydration'],
    engagement: 'Are you *actually* hydrated? Busting this myth.'
  },
  'energy_boosts': {
    focus: 'A 2-minute energy boost that isn\'t caffeine',
    scenarios: ['quick stretch', 'hydration', 'healthy snack (e.g., apple)', 'breathing'],
    engagement: 'Feeling that afternoon slump? Try this quick fix.'
  },
  'lung_health': {
    focus: 'One simple breathing exercise for better lung capacity',
    scenarios: ['diaphragmatic breathing', 'pursed-lip breathing', 'posture'],
    engagement: 'Show your lungs some love with this exercise.'
  },
  'eye_care': {
    focus: 'The "20-20-20 Rule" to prevent digital eye strain',
    scenarios: ['computer vision syndrome', 'screen time', 'protecting vision'],
    engagement: 'Staring at a screen? Remember the 20-20-20 rule!'
  },
  'posture_tips': {
    focus: 'One quick fix for better posture while sitting',
    scenarios: ['desk setup', 'chin tucks', 'shoulder rolls', '"text neck"'],
    engagement: 'Fix your posture right now with this simple move.'
  },
  'nutrition_hacks': {
    focus: 'One simple "rule" to make eating healthier easier',
    scenarios: ['add one vegetable', 'plate method', 'food swaps', 'reading labels'],
    engagement: 'Eating healthy is hard. Make it easier with this rule.'
  },
  'fitness_motivation': {
    focus: 'One mental trick to get motivated for a workout',
    scenarios: ['tiny habits', 'identity-based habits', '5-minute rule', 'temptation bundling'],
    engagement: 'Don\'t feel like working out? Try this mental trick.'
  },
  'metabolism_myths': {
    focus: 'One common metabolism myth that is scientifically false',
    scenarios: ['spicy foods', 'eating at night', 'meal frequency', 'muscle vs fat'],
    engagement: 'Stop believing this metabolism myth!'
  },
  'sun_safety': {
    focus: 'One critical sunscreen mistake almost everyone makes',
    scenarios: ['not reapplying', 'missing spots', 'SPF numbers', 'cloudy days'],
    engagement: 'You might be using sunscreen wrong. Here\'s why.'
  },
  'gut_microbiome': {
    focus: 'The difference between Probiotics and Prebiotics',
    scenarios: ['gut health', 'yogurt', 'fiber', 'microbiome'],
    engagement: 'Feed your gut! Do you know the difference?'
  },
  'oral_health': {
    focus: 'One surprising fact about your oral health',
    scenarios: ['flossing myths', 'brushing too hard', 'gums', 'bacteria'],
    engagement: 'This oral health fact might surprise you!'
  },
  'healthy_aging': {
    focus: 'One simple habit linked to healthier aging',
    scenarios: ['walking', 'social connection', 'mobility', 'nutrition'],
    engagement: 'Want to age well? Start this simple habit today.'
  }
};

/**
 * Get health-specific topic guidelines with fallback
 */
function getHealthTopicGuidelines(topic: string): TopicGuideline | undefined {
  return HEALTH_TOPIC_GUIDELINES[topic];
}


/**
 * Generates mental health content prompt
 * SIMPLIFIED & BEGINNER-FRIENDLY - Focus on curious learning, not fear/shame
 */
export function generateMentalHealthPrompt(config: PromptConfig): string {
  // *** FIX: Route to the correct prompt function based on the selected format ***
  if (config.format === 'quick_tip') {
    console.log(`[Health Prompt] Routing to Quick Tip format for ${config.topic}`);
    return generateQuickTipPrompt(config);
  }
  // *** END FIX ***

  const { topic, topicData, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;

  // --- Dynamic Variation ---
  const randomization = generateRandomizationElements(topic); 
  const context = generateContextInjections(topic);
  const variation = getPromptVariation();
  const { expertRole, contentStrategy } = createBasePromptStructure(randomization, context, variation);
  // --- End Dynamic Variation ---

  // --- FIX: Get specific guidelines ---
  const guidelines = getHealthTopicGuidelines(topicData?.key || topic);

  const specificTopicInstruction = `TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Cool facts about mental health'}`;

  const noveltyInstruction = `• NOVELTY: MUST generate a *different* question/tip. Do NOT repeat common examples. The content MUST take a "${randomization.approach}" angle. Use this seed for variation: ${timeMarker}`;


  const promptCore = `
ROLE: You are a friendly mental health coach.
${expertRole}. ${contentStrategy}.

TONE: Curious, friendly, beginner-friendly.
• GUARDRAILS: NO aggressive language, NO fear tactics, NO "you're doing it wrong".

CONTENT STYLE:
• Make it feel like discovering a fun life hack, not fixing a problem.
• Use simple, everyday language.
• Focus on what TO DO, not what NOT to do.
• Keep explanations short and actionable.

QUESTION REQUIREMENTS:
• ${specificTopicInstruction}
• GUIDELINE: ${guidelines?.focus || 'A specific mental health tip.'}
• ENGAGEMENT: ${guidelines?.engagement || 'A friendly call to action.'}
${noveltyInstruction}
• "question": Clear question anyone can understand (MAX 120 chars)
• "options": A, B, C, D - short answers (each MAX 45 chars)
• "answer": Correct letter (A, B, C, or D)
• "explanation": Why this helps in simple terms (MAX 120 chars)
• "cta": Friendly CTA under 80 chars
• "content_type": "${questionFormat}"

TARGET: Busy adults who want simple mental health wins.

Create content that feels like a helpful friend sharing a cool tip. [${timeMarker}-${tokenMarker}]`;

  // Use the utility to add the correct JSON formatting rules
  return addJsonFormatInstructions(promptCore, questionFormat);
}

/**
 * Generates general health content prompt
 * SIMPLIFIED & BEGINNER-FRIENDLY - Focus on helpful tips, not scare tactics
 */
export function generateGeneralHealthPrompt(config: PromptConfig): string {
  // *** FIX: Route to the correct prompt function based on the selected format ***
  if (config.format === 'quick_tip') {
    console.log(`[Health Prompt] Routing to Quick Tip format for ${config.topic}`);
    return generateQuickTipPrompt(config);
  }
  // *** END FIX ***

  const { topic, topicData, markers, questionFormat = 'multiple_choice' } = config;
  const { timeMarker, tokenMarker } = markers;

  // --- Dynamic Variation ---
  const randomization = generateRandomizationElements(topic);
  const context = generateContextInjections(topic);
  const variation = getPromptVariation();
  const { expertRole, contentStrategy } = createBasePromptStructure(randomization, context, variation);
  // --- End Dynamic Variation ---

  // --- FIX: Get specific guidelines ---
  const guidelines = getHealthTopicGuidelines(topicData?.key || topic);

  const specificTopicInstruction = `TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Cool facts about general health'}`;

  const noveltyInstruction = `• NOVELTY: MUST generate a *different* question/tip. Do NOT repeat common examples. The content MUST take a "${randomization.approach}" angle. Use this seed for variation: ${timeMarker}`;

  const promptCore = `
ROLE: You are a friendly physical health coach.
${expertRole}. ${contentStrategy}.

TONE: Helpful, encouraging, beginner-friendly.
• GUARDRAILS: NO scare tactics, NO "your body is damaged", focus on PREVENTION & WELLNESS.

CONTENT STYLE:
• Focus on simple health tips for different body parts anyone can do.
• Use positive language about overall wellness.
• Make it feel achievable and practical.
• Avoid doom and gloom - focus on prevention.

QUESTION REQUIREMENTS:
• ${specificTopicInstruction}
• GUIDELINE: ${guidelines?.focus || 'A specific general health tip.'}
• ENGAGEMENT: ${guidelines?.engagement || 'A friendly call to action.'}
${noveltyInstruction}
• "question": Clear question about the specific topic (MAX 120 chars)
• "options": A, B, C, D - short, clear answers (each MAX 45 chars)
• "answer": Correct letter (A, B, C, or D)
• "explanation": Why this helps your body/health (MAX 120 chars)
• "cta": Encouraging CTA under 80 chars
• "content_type": "${questionFormat}"

TARGET: Adults who want simple, practical health tips for their whole body.

Create content that feels like helpful advice from a caring friend. [${timeMarker}-${tokenMarker}]`;

  // Use the utility to add the correct JSON formatting rules
  return addJsonFormatInstructions(promptCore, questionFormat);
}

/**
 * Generates Quick Tip format prompt (Health)
 * SIMPLIFIED & BEGINNER-FRIENDLY - Based on 80 avg views performance
 */
export function generateQuickTipPrompt(config: PromptConfig): string {
  const { topic, topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

  // --- Dynamic Variation ---
  const randomization = generateRandomizationElements(topic);
  const context = generateContextInjections(topic);
  const variation = getPromptVariation();
  const { expertRole, contentStrategy } = createBasePromptStructure(randomization, context, variation);
  // --- End Dynamic Variation ---

  // --- FIX: Get specific guidelines ---
  const guidelines = getHealthTopicGuidelines(topicData?.key || topic);

  let topicInstruction = `TOPIC: "${topicData?.displayName || topic}" - ${guidelines?.focus || 'A specific health tip.'}`;

  if (topic === 'general_health') {
    topicInstruction += '\n• BODY PART DIVERSITY: The tip should relate to a specific body part (e.g., heart, skin, joints, lungs, digestion).';
  } else if (topic === 'mental_health') {
    topicInstruction += '\n• TOPIC FOCUS: The tip must be about mental health (e.g., stress, focus, mood).';
  }

  const noveltyInstruction = `• NOVELTY: MUST generate a *different* tip. Do NOT repeat common examples (e.g., "drink water," "sleep more"). The tip MUST take a "${randomization.approach}" angle. Be specific. Use this seed for variation: ${timeMarker}`;

  return `${expertRole}. ${contentStrategy}.

ROLE: You are a friendly health coach creating simple, helpful tips for YouTube Shorts.

TONE: Friendly, encouraging, beginner-friendly.
• GUARDRAILS: NO aggressive language, NO shame, NO "stop doing X".

CONTENT REQUIREMENTS:
• ${topicInstruction}
• GUIDELINE: ${guidelines?.focus || 'A specific health tip.'}
• ENGAGEMENT: ${guidelines?.engagement || 'A friendly call to action.'}
${noveltyInstruction}
• ACTION: Super simple steps anyone can do right now (max 2-3 steps)
• RESULT: Quick explanation of why it helps (keep it simple, not overly scientific)
• Make it feel easy and achievable, not scary or complicated

TARGET: Beginners who want easy health wins

RESPONSE FORMAT - OUTPUT ONLY VALIDJSON (no other text):
{
  "action": "simple_clear_steps_anyone_can_do",
  "result": "why_it_helps_in_simple_terms",
  "cta": "encouraging_health_CTA_under_80_chars",
  "format_type": "quick_tip",
  "content_type": "quick_tip"
}

IMPORTANT: Return ONLY the JSON object above. No markdown, no explanations, no additional content.

Create content that makes viewers feel motivated and capable. [${timeMarker}-${tokenMarker}]`;
}