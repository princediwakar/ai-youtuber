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
    focus: 'Practical memory improvement strategies, mnemonics, and scientifically-proven techniques',
    hook: 'Reveal a surprising memory technique that viewers can master in minutes',
    scenarios: ['studying for exams', 'remembering names at events', 'recalling important information'],
    engagement: 'Challenge viewers to test the technique immediately'
  },
  focus_tips: {
    focus: 'Modern attention challenges and actionable concentration techniques',
    hook: 'Address the epidemic of digital distraction with proven focus methods',
    scenarios: ['working from home', 'studying with distractions', 'staying focused during meetings'],
    engagement: 'Promise immediate focus improvement'
  },
  brain_food: {
    focus: 'Specific nutrients, foods, and dietary patterns with measurable brain benefits',
    hook: 'Reveal surprising foods that dramatically boost brain power',
    scenarios: ['exam preparation meals', 'brain-boosting breakfast', 'foods that prevent memory loss'],
    engagement: 'Make viewers want to try the food today'
  },
  mental_exercises: {
    focus: 'Engaging cognitive challenges and neuroplasticity concepts',
    hook: 'Present a fun brain exercise that reveals cognitive abilities',
    scenarios: ['daily brain training', 'preventing cognitive decline', 'sharpening mental agility'],
    engagement: 'Include a mini-exercise viewers can try'
  },
  brain_lifestyle: {
    focus: 'Lifestyle factors that significantly impact cognitive function',
    hook: 'Expose how daily habits secretly damage or boost brain health',
    scenarios: ['morning routines', 'weekend activities', 'social interactions'],
    engagement: 'Motivate immediate lifestyle changes'
  },
  stress_management: {
    focus: 'Stress-brain connection with practical cortisol-reducing techniques',
    hook: 'Reveal how stress literally shrinks the brain and how to reverse it',
    scenarios: ['work stress', 'relationship anxiety', 'financial worries'],
    engagement: 'Offer instant stress relief techniques'
  },
  sleep_brain: {
    focus: 'Sleep-memory consolidation and optimal sleep habits for brain performance',
    hook: 'Expose the shocking truth about what happens to your brain during sleep',
    scenarios: ['pulling all-nighters', 'improving memory overnight', 'sleep quality optimization'],
    engagement: 'Promise better sleep and sharper thinking'
  },
  brain_myths: {
    focus: 'Debunking popular brain myths with surprising scientific truths',
    hook: 'Shatter a belief that 90% of people think is true but science proves wrong',
    scenarios: ['common misconceptions', 'things parents taught wrong', 'viral health claims'],
    engagement: 'Create "I had no idea!" moments'
  },
  
  // Eye Health Categories
  screen_protection: {
    focus: 'Digital eye strain prevention and blue light protection strategies',
    hook: 'Reveal what hours of screen time are actually doing to your eyes',
    scenarios: ['working from home', 'gaming sessions', 'late-night phone use'],
    engagement: 'Offer immediate relief from eye strain'
  },
  eye_exercises: {
    focus: 'Practical eye exercises and vision training techniques',
    hook: 'Teach a simple eye exercise that improves vision in 30 seconds',
    scenarios: ['computer work breaks', 'driving long distances', 'reading for hours'],
    engagement: 'Guide viewers through the exercise'
  },
  vision_nutrition: {
    focus: 'Foods and nutrients that directly support eye health and vision',
    hook: 'Reveal foods that can literally improve your eyesight',
    scenarios: ['preventing macular degeneration', 'foods for night vision', 'protecting aging eyes'],
    engagement: 'Make viewers want to eat these foods today'
  },
  eye_care_habits: {
    focus: 'Daily routines and habits that protect and improve eye health',
    hook: 'Expose daily habits that are secretly damaging your vision',
    scenarios: ['morning eye care', 'makeup and contacts', 'environmental protection'],
    engagement: 'Motivate immediate habit changes'
  },
  workplace_vision: {
    focus: 'Optimizing work environment and habits for eye health',
    hook: 'Reveal how your workspace setup is destroying your vision',
    scenarios: ['office lighting', 'monitor positioning', 'break strategies'],
    engagement: 'Offer instant workspace improvements'
  },
  eye_safety: {
    focus: 'Protection strategies for various activities and environments',
    hook: 'Show shocking eye injury statistics and how to prevent them',
    scenarios: ['sports activities', 'home improvement', 'outdoor adventures'],
    engagement: 'Create urgency about eye protection'
  },
  vision_myths: {
    focus: 'Debunking eye health myths with evidence-based facts',
    hook: 'Shatter common beliefs about vision that are completely wrong',
    scenarios: ['carrots improving vision', 'reading in dark', 'eye exercise limitations'],
    engagement: 'Create surprise and disbelief moments'
  },
  eye_fatigue: {
    focus: 'Preventing and treating digital eye strain and fatigue',
    hook: 'Reveal the hidden cause of your constant eye tiredness',
    scenarios: ['end-of-day eye strain', 'headaches from screens', 'tired eyes driving'],
    engagement: 'Promise immediate relief techniques'
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