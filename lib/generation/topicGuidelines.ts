/**
 * Topic-specific guidelines for enhanced content generation
 * Extracted from generationService for better maintainability
 */

export interface TopicGuideline {
  focus: string;
  hook: string;
  scenarios: string[];
  engagement: string;
}

export const TOPIC_GUIDELINES: Record<string, TopicGuideline> = {
  // Brain Health Categories
  memory_techniques: {
    focus: 'Neuroplasticity-based encoding methods, spatial memory systems, and synaptic strengthening protocols',
    hook: 'Master the ancient technique that turns anyone into a memory champion',
    scenarios: ['professional certification studying', 'multilingual vocabulary retention', 'database information recall'],
    engagement: 'Provide immediate memorization challenge with measurable results'
  },
  focus_tips: {
    focus: 'Attention restoration therapy, cognitive load management, and dopamine regulation strategies',
    hook: 'Discover why your brain loses focus every 8 minutes (and how to fix it)',
    scenarios: ['deep work session optimization', 'ADHD-friendly productivity systems', 'meditation-resistant focus training'],
    engagement: 'Challenge viewers to complete focus endurance test'
  },
  brain_food: {
    focus: 'Neurotransmitter precursor nutrition, blood-brain barrier optimization, and cognitive enhancement timing',
    hook: 'Uncover the breakfast timing that increases IQ by 12 points',
    scenarios: ['pre-exam cognitive loading', 'age-related cognitive decline prevention', 'neurodivergent brain nutrition'],
    engagement: 'Create urgency about nutrient timing windows'
  },
  mental_exercises: {
    focus: 'Working memory expansion, processing speed enhancement, and executive function strengthening',
    hook: 'Take the cognitive flexibility test that predicts career success',
    scenarios: ['age-related cognitive maintenance', 'problem-solving skill advancement', 'creative thinking unlocking'],
    engagement: 'Provide progressive difficulty brain challenges'
  },
  brain_lifestyle: {
    focus: 'Circadian rhythm optimization, social cognition enhancement, and environmental neurotoxin avoidance',
    hook: 'Identify the lifestyle factor destroying 20% of your brain cells annually',
    scenarios: ['remote work cognitive health', 'retirement brain preservation', 'parenting cognitive demands'],
    engagement: 'Offer lifestyle audit with cognitive impact scoring'
  },
  stress_management: {
    focus: 'HPA axis regulation, cortisol rhythm restoration, and resilience neurocircuitry building',
    hook: 'Measure your stress damage level with this 60-second brain test',
    scenarios: ['chronic workplace pressure', 'caregiver burnout prevention', 'financial anxiety management'],
    engagement: 'Provide physiological stress measurement techniques'
  },
  sleep_brain: {
    focus: 'Glymphatic system optimization, memory consolidation timing, and REM sleep enhancement',
    hook: 'Calculate how much intelligence you lose with each hour of sleep debt',
    scenarios: ['shift work cognitive protection', 'insomnia-related memory issues', 'power nap cognitive benefits'],
    engagement: 'Challenge viewers to track cognitive performance vs sleep quality'
  },
  brain_myths: {
    focus: 'Evidence-based debunking of neurological misconceptions with peer-reviewed research',
    hook: 'Expose the brain training myth that wastes millions of dollars annually',
    scenarios: ['supplement industry false claims', 'education system cognitive misconceptions', 'aging brain capability myths'],
    engagement: 'Challenge viewers to fact-check popular brain claims'
  },
  
  // Eye Health Categories
  screen_protection: {
    focus: 'Blue light filtering technology, screen distance optimization, and digital break protocols',
    hook: 'Expose the invisible light wavelength slowly destroying your retina every minute',
    scenarios: ['remote work setups', 'smartphone addiction patterns', 'streaming marathons'],
    engagement: 'Challenge viewers to test their blue light exposure immediately'
  },
  eye_exercises: {
    focus: 'Ciliary muscle strengthening, convergence training, and visual field enhancement exercises',
    hook: 'Test your eye muscle strength with this focusing challenge',
    scenarios: ['programmer focus training', 'age-related accommodation decline', 'sports vision enhancement'],
    engagement: 'Provide measurable improvement tracking method'
  },
  vision_nutrition: {
    focus: 'Lutein absorption pathways, zeaxanthin bioavailability, and retinal antioxidant protection',
    hook: 'Discover the nutrient deficiency behind 90% of vision problems',
    scenarios: ['age-related macular degeneration prevention', 'night vision optimization', 'diabetic retinopathy nutrition'],
    engagement: 'Create urgency about nutrient timing and absorption'
  },
  eye_care_habits: {
    focus: 'Tear film stability, eyelid hygiene protocols, and environmental protection routines',
    hook: 'Uncover the morning habit that prevents 80% of eye infections',
    scenarios: ['contact lens safety protocols', 'makeup-related eye damage', 'allergen exposure management'],
    engagement: 'Provide step-by-step implementation checklist'
  },
  workplace_vision: {
    focus: 'Ergonomic viewing angles, ambient lighting ratios, and productivity-vision balance',
    hook: 'Calculate if your desk setup is causing permanent vision damage',
    scenarios: ['home office lighting optimization', 'dual monitor positioning', 'presentation eye strain'],
    engagement: 'Offer measurable workspace assessment tools'
  },
  eye_safety: {
    focus: 'UV radiation protection, impact injury prevention, and chemical exposure protocols',
    hook: 'Reveal the everyday activity that causes 40% of eye injuries',
    scenarios: ['outdoor UV exposure risks', 'DIY project safety gaps', 'sports impact protection'],
    engagement: 'Create immediate protective behavior adoption'
  },
  vision_myths: {
    focus: 'Scientific debunking of popular vision misconceptions with research evidence',
    hook: 'Expose the vision "fact" taught in schools that science proves dangerous',
    scenarios: ['carrot vision improvement myths', 'reading in dark damage claims', 'eye exercise miracle cures'],
    engagement: 'Challenge viewers to verify claims with evidence'
  },
  eye_fatigue: {
    focus: 'Accommodation spasm relief, blink rate optimization, and neural visual processing recovery',
    hook: 'Identify the hidden muscle causing your daily headaches',
    scenarios: ['post-work eye exhaustion', 'digital migraine triggers', 'driving vision fatigue'],
    engagement: 'Provide instant fatigue relief validation techniques'
  },
  
  // English Vocabulary Categories
  eng_vocab_word_meaning: {
    focus: 'Essential word definitions with memorable contexts and usage',
    hook: 'Test knowledge of a word that sounds simple but most people misuse',
    scenarios: ['job interviews', 'academic writing', 'professional communication'],
    engagement: 'Challenge viewers to use the word correctly'
  },
  eng_vocab_fill_blanks: {
    focus: 'Context-based vocabulary application and sentence completion',
    hook: 'Present a sentence that stumps even native speakers',
    scenarios: ['writing emails', 'giving presentations', 'casual conversations'],
    engagement: 'Test their sentence completion skills'
  },
  eng_vocab_word_forms: {
    focus: 'Grammar and word form variations (noun/verb/adjective)',
    hook: 'Test whether they know the correct form that even advanced learners miss',
    scenarios: ['formal writing', 'academic papers', 'business communications'],
    engagement: 'Challenge their grammar precision'
  },
  eng_vocab_synonyms: {
    focus: 'Word relationships and precise synonym usage',
    hook: 'Reveal synonym pairs that seem identical but have crucial differences',
    scenarios: ['avoiding repetition', 'upgrading vocabulary', 'expressing nuance'],
    engagement: 'Help them choose the perfect word'
  },
  eng_vocab_antonyms: {
    focus: 'Opposite word relationships and contrasting meanings',
    hook: 'Test antonym knowledge with words that have surprising opposites',
    scenarios: ['debates and arguments', 'creative writing', 'expressing contrast'],
    engagement: 'Challenge their opposite-word knowledge'
  },
  eng_vocab_confusing_words: {
    focus: 'Commonly mixed-up word pairs and how to use them correctly',
    hook: 'Expose the word mistake that makes you sound less intelligent',
    scenarios: ['affect vs effect', 'complement vs compliment', 'principal vs principle'],
    engagement: 'Help them avoid embarrassing mistakes'
  },
  eng_vocab_idioms: {
    focus: 'Common idiomatic expressions and their cultural contexts',
    hook: 'Decode expressions that confuse non-native speakers',
    scenarios: ['movies and TV shows', 'casual conversations', 'cultural understanding'],
    engagement: 'Help them understand hidden meanings'
  },
};