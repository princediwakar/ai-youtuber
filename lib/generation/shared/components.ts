/**
 * Shared content components for prompt generation
 * Centralizes common demographics, hook patterns, and CTAs to eliminate redundancy
 */

export interface PersonaDemographics {
  primary: string[];
  secondary: string[];
  contexts: string[];
}

export interface HookPattern {
  type: 'urgency' | 'curiosity' | 'challenge' | 'knowledge' | 'improvement' | 'vocabulary' | 'health' | 'instant' | 'competitive' | 'cosmic_personal';
  templates: string[];
}

export interface CTAPattern {
  type: 'follow' | 'engagement' | 'action' | 'sharing' | 'quiz';
  examples: string[];
}

/**
 * Centralized demographics for each persona type
 * Extracted from scattered definitions across prompt files and promptUtils
 */
export const PERSONA_DEMOGRAPHICS: Record<string, PersonaDemographics> = {
  // English Learning Demographics
  english_vocab_builder: {
    primary: ['English learners', 'language enthusiasts', 'intermediate learners', 'advanced learners'],
    secondary: ['students', 'professionals', 'communication improvers', 'job seekers'],
    contexts: ['language learning session', 'vocabulary building', 'daily English practice', 'speaking improvement', 'word mastery']
  },

  // Health Demographics (Brain & Eye)
  brain_health_tips: {
    primary: ['health-conscious adults (25-55)', 'wellness seekers', 'brain health enthusiasts'],
    secondary: ['busy professionals', 'screen users', 'memory improvement seekers', 'focus seekers'],
    contexts: ['daily wellness routine', 'health break', 'morning health habit', 'evening care routine', 'wellness moment']
  },

  eye_health_tips: {
    primary: ['working professionals and screen users (20-50)', 'vision protection seekers'],
    secondary: ['health-conscious individuals', 'digital workers', 'eye strain sufferers', 'wellness enthusiasts'],
    contexts: ['computer work', 'screen time', 'digital eye strain', 'daily eye care', 'vision protection']
  },

  // SSC Exam Demographics
  ssc_shots: {
    primary: ['SSC exam aspirants', 'government job seekers', 'competitive exam students'],
    secondary: ['exam preparation students', 'government exam candidates', 'serious aspirants', 'toppers'],
    contexts: ['exam preparation', 'study session', 'revision time', 'mock test practice', 'competitive exam prep']
  },

  // Astronomy Demographics
  space_facts_quiz: {
    primary: ['space enthusiasts', 'curious minds', 'astronomy lovers'],
    secondary: ['cosmic explorers', 'universe lovers', 'stargazers', 'science enthusiasts', 'fact seekers'],
    contexts: ['stargazing session', 'cosmic discovery', 'space exploration', 'universe contemplation', 'stellar observation']
  },

  // Default fallback demographics
  default: {
    primary: ['curious learners', 'knowledge seekers', 'students'],
    secondary: ['busy professionals', 'students', 'adults', 'lifelong learners'],
    contexts: ['learning session', 'knowledge break', 'educational moment', 'skill building', 'personal growth']
  }
};

/**
 * Common hook patterns organized by type
 * Reduces duplication in hook generation across personas
 */
export const HOOK_PATTERNS: HookPattern[] = [
  {
    type: 'urgency',
    templates: [
      'Stop {action} wrong!',
      'This {timeframe} habit will {benefit}',
      'Don\'t make this {mistake}',
      'Fix this {problem} in {timeframe}',
      'This {discovery} changes everything'
    ]
  },
  {
    type: 'curiosity',
    templates: [
      'What happens when {scenario}?',
      'Can you {challenge}?',
      'This {fact} will shock you',
      'Most people don\'t know {secret}',
      'The truth about {topic}'
    ]
  },
  {
    type: 'challenge',
    templates: [
      'Only {expert_level} can {task}',
      'Test your {knowledge_area}',
      '{percentage} get this wrong',
      'Can you crack this in {timeframe}?',
      'Are you one of the {percentage}?'
    ]
  },
  {
    type: 'knowledge',
    templates: [
      'This {fact} appears in {percentage} of {context}',
      'Never forget this {important_item}',
      'Master this {concept} to {benefit}',
      'This {rule} solves {percentage} of {problems}',
      '{expert_group} know this {secret}'
    ]
  },
  {
    type: 'improvement',
    templates: [
      'Upgrade your {skill} in {timeframe}',
      'Level up your {ability}',
      'Transform your {area} with this {solution}',
      'Double your {capability} with {method}',
      'Boost your {aspect} instantly'
    ]
  },
  {
    type: 'vocabulary',
    templates: [
      'Master this word and sound brilliant!',
      'Vocabulary power-up incoming! 💪',
      'Level up your English game! 🚀',
      'Think you know this word? Let\'s see! 🧠',
      'Word wizard test! Can you ace it? ⚡',
      'Unlock your vocabulary potential! ✨',
      'Ready to sound more sophisticated? 🎯',
      'Boost your word power instantly! 💎',
      'English mastery starts here! 🌟',
      'Elevate your vocabulary today! 🏆'
    ]
  },
  {
    type: 'health',
    templates: [
      'Transform your health with this tip! 💚',
      'Your body will thank you for this! 🌟',
      'Feel amazing with this simple hack! ⚡',
      'Boost your wellness instantly! 💪',
      'Unlock your health potential! 🔓',
      'Quick health win coming up! 🎯',
      'Supercharge your vitality! 🚀',
      'Your best self starts here! ✨',
      'Health upgrade in 30 seconds! ⏰',
      'Feel the difference immediately! 💎'
    ]
  },
  {
    type: 'competitive',
    templates: [
      'Ace your exam with this knowledge! 🎯',
      'Topper-level wisdom incoming! 🏆',
      'Unlock your competitive edge! 🔥',
      'Score high with this strategy! 📈',
      'Master this for exam success! 💪',
      'Your path to victory starts here! 🚀',
      'Excel beyond your competition! ⚡',
      'Smart preparation pays off! 🧠',
      'Boost your exam confidence! 💎',
      'Turn knowledge into success! ✨'
    ]
  },
  {
    type: 'cosmic_personal',
    templates: [
      'Mind-blowing space fact incoming! 🌌',
      'Prepare to be amazed by the universe! 🚀',
      'Cosmic knowledge unlocked! ⭐',
      'Your universe just got bigger! 🌟',
      'Space secrets revealed! 🛸',
      'Stellar wisdom awaits! ✨',
      'Galaxy-level learning time! 🌠',
      'Discover the cosmos within! 🔭',
      'Universal truths unveiled! 💫',
      'Expand your cosmic perspective! 🌍'
    ]
  },
  {
    type: 'instant',
    templates: [
      'Quick knowledge boost! Ready? ⚡',
      'Instant brain upgrade coming! 🧠',
      'Level up in 10 seconds! 🚀',
      'Power-up your skills now! 💪',
      'Quick win incoming! 🎯',
      'Supercharge your knowledge! ✨',
      'Rapid learning mode ON! 🔥',
      'Instant mastery unlocked! 🔓',
      'Fast track to brilliance! 💎',
      'Quick wisdom download! 📲'
    ]
  }
];

/**
 * Persona-specific CTA patterns
 * Organized by engagement type to avoid repetitive CTAs
 */
export const CTA_PATTERNS: Record<string, CTAPattern[]> = {
  english_vocab_builder: [
    { type: 'follow', examples: ['Follow for fluency!', 'Follow for native tips!', 'Follow for vocabulary!'] },
    { type: 'engagement', examples: ['Like if you got it!', 'Like if helpful!', 'Share if you learned!'] },
    { type: 'action', examples: ['Level up your English!', 'Master word usage!', 'Speak like a native!'] },
    { type: 'sharing', examples: ['Share this tip!', 'Tag an English learner!', 'Spread the knowledge!'] },
    { type: 'quiz', examples: ['Test yourself daily! 🧠', 'Quiz your way to fluency! 💪', 'Challenge accepted? 🚀', 'Ready for round 2? 🔥', 'More quizzes = Better English! ⚡'] }
  ],

  brain_health_tips: [
    { type: 'follow', examples: ['Follow for brain tips!', 'Follow for memory hacks!', 'Follow for focus tips!'] },
    { type: 'engagement', examples: ['Like if it worked!', 'Try this now!', 'Save for later!'] },
    { type: 'action', examples: ['Boost your brain!', 'Train your memory!', 'Enhance your focus!'] },
    { type: 'sharing', examples: ['Share with friends!', 'Tag someone who needs this!', 'Spread brain health!'] },
    { type: 'quiz', examples: ['Test your brain power! 🧠', 'How smart are you? 🤔', 'Challenge your mind! 💪', 'Brain quiz master? 🏆', 'Next level thinking! ⬆️'] }
  ],

  eye_health_tips: [
    { type: 'follow', examples: ['Follow for eye health!', 'Follow for vision tips!', 'Follow for eye care!'] },
    { type: 'engagement', examples: ['Save your vision!', 'Try this hack!', 'Protect your eyes!'] },
    { type: 'action', examples: ['Save your vision!', 'Protect your sight!', 'Fix eye strain!'] },
    { type: 'sharing', examples: ['Share to help others!', 'Tag screen users!', 'Spread eye awareness!'] },
    { type: 'quiz', examples: ['Test your eye knowledge! 👁️', 'Vision quiz champion? 🏅', 'How much do you know? 🤓', 'Eye health expert? 👨‍⚕️', 'Perfect vision = Perfect score? 💯'] }
  ],

  ssc_shots: [
    { type: 'follow', examples: ['Follow for exam tips!', 'Follow for SSC hacks!', 'Follow for exam prep!'] },
    { type: 'engagement', examples: ['Like if helpful!', 'Save for revision!', 'Crack SSC!'] },
    { type: 'action', examples: ['Study smarter!', 'Master SSC strategy!', 'Ace your exam!'] },
    { type: 'sharing', examples: ['Share with aspirants!', 'Tag exam buddies!', 'Help fellow students!'] },
    { type: 'quiz', examples: ['SSC warrior mode ON! ⚔️', 'Government job ready? 🎯', 'Exam beast activated! 🦁', 'Topper vibes incoming! 📈', 'Selection guaranteed! ✅'] }
  ],

  space_facts_quiz: [
    { type: 'follow', examples: ['Follow for space facts!', 'Follow for cosmic truth!', 'Follow for universe secrets!'] },
    { type: 'engagement', examples: ['Like if amazed!', 'Mind = blown! 🤯', 'Share if shocked!'] },
    { type: 'action', examples: ['Explore the cosmos!', 'Question everything!', 'Think bigger!'] },
    { type: 'sharing', examples: ['Blow minds! Share!', 'Tag space lovers!', 'Spread cosmic wonder!'] },
    { type: 'quiz', examples: ['Space genius level? 🚀', 'Universe master quiz! 🌌', 'Cosmic brain activated! 🧠', 'Stellar knowledge test! ⭐', 'Galaxy-level thinking! 🌟'] }
  ]
};

/**
 * Utility functions for accessing demographics and patterns
 */
export class ContentComponents {
  /**
   * Get demographics for a specific persona with fallback
   */
  static getDemographics(persona: string): PersonaDemographics {
    return PERSONA_DEMOGRAPHICS[persona] || PERSONA_DEMOGRAPHICS.default;
  }

  /**
   * Get a random demographic context for a persona
   */
  static getRandomDemographic(persona: string): string {
    const demographics = this.getDemographics(persona);
    const allDemographics = [...demographics.primary, ...demographics.secondary];
    return allDemographics[Math.floor(Math.random() * allDemographics.length)];
  }

  /**
   * Get a random context for a persona
   */
  static getRandomContext(persona: string): string {
    const demographics = this.getDemographics(persona);
    const contexts = demographics.contexts;
    return contexts[Math.floor(Math.random() * contexts.length)];
  }

  /**
   * Get hook patterns by type
   */
  static getHookPatterns(type: HookPattern['type']): string[] {
    const pattern = HOOK_PATTERNS.find(p => p.type === type);
    return pattern ? pattern.templates : [];
  }

  /**
   * Get all hook patterns
   */
  static getAllHookPatterns(): HookPattern[] {
    return HOOK_PATTERNS;
  }

  /**
   * Get CTA options for a persona and type
   */
  static getCTAs(persona: string, type: CTAPattern['type']): string[] {
    const patterns = CTA_PATTERNS[persona] || CTA_PATTERNS.english_vocab_builder; // fallback
    const pattern = patterns.find(p => p.type === type);
    return pattern ? pattern.examples : ['Follow for more!', 'Like if helpful!'];
  }

  /**
   * Get a random CTA for a persona
   */
  static getRandomCTA(persona: string): string {
    const patterns = CTA_PATTERNS[persona] || CTA_PATTERNS.english_vocab_builder;
    const allCTAs = patterns.flatMap(p => p.examples);
    return allCTAs[Math.floor(Math.random() * allCTAs.length)];
  }

  /**
   * Get a quiz-specific CTA for MCQ format (prioritizes quiz type)
   */
  static getQuizCTA(persona: string): string {
    const patterns = CTA_PATTERNS[persona] || CTA_PATTERNS.english_vocab_builder;
    const quizPattern = patterns.find(p => p.type === 'quiz');
    
    if (quizPattern && quizPattern.examples.length > 0) {
      return quizPattern.examples[Math.floor(Math.random() * quizPattern.examples.length)];
    }
    
    // Fallback to regular CTA if no quiz-specific patterns
    return this.getRandomCTA(persona);
  }

  /**
   * Get primary target audience description for a persona
   */
  static getPrimaryAudience(persona: string): string {
    const demographics = this.getDemographics(persona);
    return demographics.primary[0]; // Return the first (most specific) primary demographic
  }

  /**
   * Get urgency levels by persona context
   */
  static getUrgencyLevels(persona: string): string[] {
    if (persona.includes('health') || persona.includes('brain') || persona.includes('eye')) {
      return ['immediate health benefit', 'daily wellness', 'long-term health', 'preventive care', 'wellness optimization'];
    }
    if (persona.includes('space') || persona.includes('astronomy')) {
      return ['mind-blowing revelation', 'cosmic breakthrough', 'universe-changing fact', 'stellar discovery', 'galactic insight'];
    }
    if (persona.includes('english') || persona.includes('vocab')) {
      return ['vocabulary boost', 'speaking confidence', 'language mastery', 'communication skills', 'word power'];
    }
    if (persona.includes('ssc')) {
      return ['exam advantage', 'preparation boost', 'score improvement', 'competitive edge', 'success strategy'];
    }
    // Default urgency levels
    return ['immediate', 'within 24 hours', 'this week', 'starting today', 'right now'];
  }

  /**
   * Get a random urgency level for a persona
   */
  static getRandomUrgency(persona: string): string {
    const levels = this.getUrgencyLevels(persona);
    return levels[Math.floor(Math.random() * levels.length)];
  }

  /**
   * Get punchy, persona-specific hook for MCQ format
   */
  static getPunchyHook(persona: string): string {
    if (persona.includes('english') || persona.includes('vocab')) {
      const vocabHooks = this.getHookPatterns('vocabulary');
      return vocabHooks[Math.floor(Math.random() * vocabHooks.length)];
    }
    
    if (persona.includes('health') || persona.includes('brain') || persona.includes('eye')) {
      const healthHooks = this.getHookPatterns('health');
      return healthHooks[Math.floor(Math.random() * healthHooks.length)];
    }
    
    if (persona.includes('ssc')) {
      const competitiveHooks = this.getHookPatterns('competitive');
      return competitiveHooks[Math.floor(Math.random() * competitiveHooks.length)];
    }
    
    if (persona.includes('space') || persona.includes('astronomy')) {
      const cosmicHooks = this.getHookPatterns('cosmic_personal');
      return cosmicHooks[Math.floor(Math.random() * cosmicHooks.length)];
    }
    
    // Fallback to instant hooks for other personas
    const instantHooks = this.getHookPatterns('instant');
    return instantHooks[Math.floor(Math.random() * instantHooks.length)];
  }

  /**
   * Get specific hook type patterns
   */
  static getSpecificHookType(type: 'vocabulary' | 'health' | 'instant' | 'competitive' | 'cosmic_personal'): string {
    const patterns = this.getHookPatterns(type);
    return patterns[Math.floor(Math.random() * patterns.length)];
  }
}