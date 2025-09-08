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
  // English Learning - Optimized for 15s Videos
  eng_pronunciation_fails: {
    focus: 'One commonly mispronounced word with correct pronunciation and memory trick',
    hook: '90% of people say this word wrong (are you one of them?)',
    scenarios: ['job interviews', 'presentations', 'daily conversations'],
    engagement: 'Say the word out loud right now'
  },
  eng_common_mistakes: {
    focus: 'One grammar/usage mistake that sounds right but is wrong',
    hook: 'Stop embarrassing yourself with this common mistake',
    scenarios: ['emails', 'texts', 'speaking'],
    engagement: 'Check if you make this mistake too'
  },
  eng_grammar_hacks: {
    focus: 'One simple grammar rule that fixes multiple mistakes instantly',
    hook: 'This 5-second rule fixes your English forever',
    scenarios: ['writing', 'speaking', 'exams'],
    engagement: 'Use this rule in your next sentence'
  },
  eng_spelling_tricks: {
    focus: 'One memorable trick to spell difficult words correctly',
    hook: 'Never misspell this tricky word again',
    scenarios: ['writing', 'texting', 'professional communication'],
    engagement: 'Try spelling it without looking'
  },

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
  },
  
  // English Vocabulary - Quick Wins
  eng_vocab_word_meaning: {
    focus: 'One word that 90% of people use incorrectly with simple fix',
    hook: 'You\'ve been using this word wrong your whole life',
    scenarios: ['daily conversations', 'texting', 'work emails'],
    engagement: 'Use the word correctly in your next sentence'
  },
  eng_vocab_fill_blanks: {
    focus: 'One perfect word that completes a tricky sentence',
    hook: 'Can you fill this blank that stumps English experts?',
    scenarios: ['writing', 'speaking', 'exams'],
    engagement: 'Pause and guess before the reveal'
  },
  eng_vocab_synonyms: {
    focus: 'Two words that seem the same but have one crucial difference',
    hook: 'These twin words are NOT the same (here\'s why)',
    scenarios: ['writing', 'speaking', 'exams'],
    engagement: 'Test if you know the difference'
  },
  eng_vocab_antonyms: {
    focus: 'One word pair with a surprising opposite that tricks everyone',
    hook: 'The opposite of this word will shock you',
    scenarios: ['conversations', 'writing', 'vocabulary tests'],
    engagement: 'Guess the opposite before we reveal it'
  },
  eng_vocab_register: {
    focus: 'One word that changes meaning from formal to casual contexts',
    hook: 'Using this word casually makes you sound unprofessional',
    scenarios: ['work emails', 'job interviews', 'presentations'],
    engagement: 'Check if you use this word correctly'
  },

  // SSC Exam Preparation - High-Frequency Facts
  ssc_history: {
    focus: 'One historical fact that appears in every government exam',
    hook: 'This history fact appears in 90% of SSC exams',
    scenarios: ['SSC CGL', 'CHSL', 'state exams'],
    engagement: 'Memorize this fact for your next exam'
  },
  ssc_geography: {
    focus: 'One geography fact or memory trick that saves exam time',
    hook: 'This geography trick helps you remember 20+ facts instantly',
    scenarios: ['state capitals', 'river origins', 'mountain peaks'],
    engagement: 'Use this trick for your geography preparation'
  },
  ssc_grammar: {
    focus: 'One grammar rule that solves 90% of SSC English questions',
    hook: 'Master this rule to crack SSC English section',
    scenarios: ['error spotting', 'sentence improvement', 'fill-in-blanks'],
    engagement: 'Apply this rule to practice questions immediately'
  },
  ssc_vocab: {
    focus: 'One SSC word with synonym, antonym, and usage in 15 seconds',
    hook: 'This word appears in every SSC vocabulary section',
    scenarios: ['synonyms', 'antonyms', 'one-word substitutions'],
    engagement: 'Practice using this word in a sentence'
  },
  ssc_current_affairs: {
    focus: 'One 2025 current affairs fact that will be in your next exam',
    hook: 'This 2025 update will definitely be in your SSC exam',
    scenarios: ['recent appointments', 'new schemes', 'major events'],
    engagement: 'Note this down for your current affairs preparation'
  },

  // Additional SSC Categories
  ssc_important_dates: {
    focus: 'One crucial date with memory trick that appears in all exams',
    hook: 'Never forget this date that appears in every government exam',
    scenarios: ['independence movement', 'constitution dates', 'historical events'],
    engagement: 'Use the memory trick to remember this date'
  },
  ssc_states_capitals: {
    focus: 'One state-capital trick that helps remember multiple pairs',
    hook: 'This trick helps you remember 10+ state capitals instantly',
    scenarios: ['SSC geography section', 'static GK questions', 'quick revision'],
    engagement: 'Use this trick to memorize state capitals now'
  },
  ssc_govt_schemes: {
    focus: 'One government scheme name, purpose, and launch year in 15 seconds',
    hook: 'This government scheme will definitely be in your exam',
    scenarios: ['scheme-based questions', 'current affairs', 'policy knowledge'],
    engagement: 'Remember the scheme name and purpose for exams'
  },
  
  // New High-Engagement Categories
  ssc_gk_tricks: {
    focus: 'One memory trick that helps remember multiple GK facts instantly',
    hook: 'This GK trick will save you 10 minutes in every exam',
    scenarios: ['static GK', 'quick revision', 'exam shortcuts'],
    engagement: 'Use this trick for your GK preparation immediately'
  },
  ssc_numbers: {
    focus: 'One important number (year, count, percentage) with memorable context',
    hook: 'This number appears in 80% of SSC questions',
    scenarios: ['statistical questions', 'numerical facts', 'data queries'],
    engagement: 'Memorize this number for your next exam'
  },
  ssc_shortcuts: {
    focus: 'One exam-solving shortcut that saves crucial seconds',
    hook: 'This shortcut saves 30 seconds per question',
    scenarios: ['time management', 'quick elimination', 'calculation tricks'],
    engagement: 'Practice this shortcut right now'
  },

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
  },
};