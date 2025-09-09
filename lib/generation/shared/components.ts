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
  type: 'urgency' | 'curiosity' | 'challenge' | 'knowledge' | 'improvement';
  templates: string[];
}

export interface CTAPattern {
  type: 'follow' | 'engagement' | 'action' | 'sharing';
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
    { type: 'sharing', examples: ['Share this tip!', 'Tag an English learner!', 'Spread the knowledge!'] }
  ],

  brain_health_tips: [
    { type: 'follow', examples: ['Follow for brain tips!', 'Follow for memory hacks!', 'Follow for focus tips!'] },
    { type: 'engagement', examples: ['Like if it worked!', 'Try this now!', 'Save for later!'] },
    { type: 'action', examples: ['Boost your brain!', 'Train your memory!', 'Enhance your focus!'] },
    { type: 'sharing', examples: ['Share with friends!', 'Tag someone who needs this!', 'Spread brain health!'] }
  ],

  eye_health_tips: [
    { type: 'follow', examples: ['Follow for eye health!', 'Follow for vision tips!', 'Follow for eye care!'] },
    { type: 'engagement', examples: ['Save your vision!', 'Try this hack!', 'Protect your eyes!'] },
    { type: 'action', examples: ['Save your vision!', 'Protect your sight!', 'Fix eye strain!'] },
    { type: 'sharing', examples: ['Share to help others!', 'Tag screen users!', 'Spread eye awareness!'] }
  ],

  ssc_shots: [
    { type: 'follow', examples: ['Follow for exam tips!', 'Follow for SSC hacks!', 'Follow for exam prep!'] },
    { type: 'engagement', examples: ['Like if helpful!', 'Save for revision!', 'Crack SSC!'] },
    { type: 'action', examples: ['Study smarter!', 'Master SSC strategy!', 'Ace your exam!'] },
    { type: 'sharing', examples: ['Share with aspirants!', 'Tag exam buddies!', 'Help fellow students!'] }
  ],

  space_facts_quiz: [
    { type: 'follow', examples: ['Follow for space facts!', 'Follow for cosmic truth!', 'Follow for universe secrets!'] },
    { type: 'engagement', examples: ['Like if amazed!', 'Mind = blown! 🤯', 'Share if shocked!'] },
    { type: 'action', examples: ['Explore the cosmos!', 'Question everything!', 'Think bigger!'] },
    { type: 'sharing', examples: ['Blow minds! Share!', 'Tag space lovers!', 'Spread cosmic wonder!'] }
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
}