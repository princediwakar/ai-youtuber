/**
 * Format Definitions for Multi-Format Video Generation System
 * Defines all available content formats for each account and persona
 */

import { ContentFormat, FormatType } from './types';

// English Shots Account Formats
export const englishFormats: { [key in FormatType]?: ContentFormat } = {
  mcq: {
    type: 'mcq',
    name: 'Multiple Choice Quiz',
    description: 'Traditional quiz format with hook, question+options, answer, and explanation',
    accountId: 'english_shots',
    persona: 'english_vocab_builder',
    frameCount: 4,
    frames: [
      {
        type: 'hook',
        title: 'Hook Frame',
        description: 'Attention-grabbing opener',
        duration: 2.5,
        visualElements: {
          textSize: 'large',
          textWeight: 'extra-bold',
          textColor: '#FFFFFF',
          backgroundColor: '#1E40AF',
          layout: 'centered'
        }
      },
      {
        type: 'question',
        title: 'Question Frame',
        description: 'Present the vocabulary question with options',
        duration: 4,
        visualElements: {
          textSize: 'medium',
          textWeight: 'bold',
          textColor: '#1F2937',
          backgroundColor: '#F3F4F6',
          layout: 'top-bottom'
        }
      },
      {
        type: 'answer',
        title: 'Answer Frame',
        description: 'Reveal correct answer',
        duration: 2,
        visualElements: {
          textSize: 'large',
          textWeight: 'bold',
          textColor: '#FFFFFF',
          backgroundColor: '#059669',
          layout: 'centered'
        }
      },
      {
        type: 'explanation',
        title: 'Explanation Frame',
        description: 'Explain the answer and provide context',
        duration: 3.5,
        visualElements: {
          textSize: 'medium',
          textWeight: 'normal',
          textColor: '#1F2937',
          backgroundColor: '#F9FAFB',
          layout: 'top-bottom'
        }
      }
    ],
    visualStyle: {
      theme: 'english_learning',
      colorScheme: 'bright',
      fontFamily: 'Inter',
      primaryColor: '#1E40AF',
      secondaryColor: '#059669',
      accentColor: '#F59E0B',
      backgroundStyle: 'gradient'
    },
    timing: {
      totalDuration: 15,
      frameTransitions: 0.3,
      pauseBeforeCTA: 0.5
    },
    suitableTopics: ['all'],
    engagementTarget: 'educational'
  },

  common_mistake: {
    type: 'common_mistake',
    name: 'Common Mistake Format',
    description: 'Address common English errors with correction',
    accountId: 'english_shots',
    persona: 'english_vocab_builder',
    frameCount: 4,
    frames: [
      {
        type: 'hook',
        title: 'Hook Frame',
        description: 'Stop saying this word wrong!',
        duration: 2,
        visualElements: {
          textSize: 'large',
          textWeight: 'extra-bold',
          textColor: '#FFFFFF',
          backgroundColor: '#DC2626',
          layout: 'centered'
        }
      },
      {
        type: 'mistake',
        title: 'Mistake Frame',
        description: '99% say: [incorrect pronunciation/usage]',
        duration: 3,
        visualElements: {
          textSize: 'medium',
          textWeight: 'bold',
          textColor: '#DC2626',
          backgroundColor: '#FEF2F2',
          layout: 'centered'
        }
      },
      {
        type: 'correct',
        title: 'Correct Frame',
        description: 'Natives say: [correct version]',
        duration: 3,
        visualElements: {
          textSize: 'medium',
          textWeight: 'bold',
          textColor: '#059669',
          backgroundColor: '#ECFDF5',
          layout: 'centered'
        }
      },
      {
        type: 'practice',
        title: 'Practice Frame',
        description: 'Try it now! Repeat after me...',
        duration: 4,
        visualElements: {
          textSize: 'medium',
          textWeight: 'bold',
          textColor: '#1F2937',
          backgroundColor: '#F3F4F6',
          layout: 'top-bottom'
        }
      }
    ],
    visualStyle: {
      theme: 'english_correction',
      colorScheme: 'bright',
      fontFamily: 'Inter',
      primaryColor: '#DC2626',
      secondaryColor: '#059669',
      accentColor: '#F59E0B',
      backgroundStyle: 'solid'
    },
    timing: {
      totalDuration: 12,
      frameTransitions: 0.2,
      pauseBeforeCTA: 0.5
    },
    suitableTopics: ['eng_vocab_confusing_words', 'eng_vocab_register'],
    engagementTarget: 'practical'
  },

  quick_fix: {
    type: 'quick_fix',
    name: 'Quick Fix Format',
    description: 'Instant vocabulary upgrades',
    accountId: 'english_shots',
    persona: 'english_vocab_builder',
    frameCount: 3,
    frames: [
      {
        type: 'hook',
        title: 'Hook Frame',
        description: 'Upgrade your English in 15 seconds',
        duration: 2,
        visualElements: {
          textSize: 'large',
          textWeight: 'extra-bold',
          textColor: '#FFFFFF',
          backgroundColor: '#7C3AED',
          layout: 'centered'
        }
      },
      {
        type: 'before',
        title: 'Before Frame',
        description: 'Instead of saying [basic word]...',
        duration: 3,
        visualElements: {
          textSize: 'medium',
          textWeight: 'normal',
          textColor: '#6B7280',
          backgroundColor: '#F9FAFB',
          layout: 'centered'
        }
      },
      {
        type: 'after',
        title: 'After Frame',
        description: 'Sound smarter with [advanced word]',
        duration: 4,
        visualElements: {
          textSize: 'large',
          textWeight: 'bold',
          textColor: '#FFFFFF',
          backgroundColor: '#7C3AED',
          layout: 'centered'
        }
      }
    ],
    visualStyle: {
      theme: 'english_upgrade',
      colorScheme: 'gradient',
      fontFamily: 'Inter',
      primaryColor: '#7C3AED',
      secondaryColor: '#059669',
      accentColor: '#F59E0B',
      backgroundStyle: 'gradient'
    },
    timing: {
      totalDuration: 9,
      frameTransitions: 0.2,
      pauseBeforeCTA: 0.3
    },
    suitableTopics: ['eng_vocab_synonyms', 'eng_vocab_register', 'eng_vocab_shades_of_meaning'],
    engagementTarget: 'practical'
  }
};

// Health Shots Account Formats  
export const healthFormats: { [key in FormatType]?: ContentFormat } = {
  // Brain Health MCQ Format
  mcq: {
    type: 'mcq',
    name: 'Brain Health Knowledge Quiz',
    description: 'Educational brain health quiz with hook, question+options, answer, and explanation',
    accountId: 'health_shots',
    persona: 'brain_health_tips',
    frameCount: 4,
    frames: [
      {
        type: 'hook',
        title: 'Hook Frame',
        description: 'Brain health knowledge teaser',
        duration: 2.5,
        visualElements: {
          textSize: 'large',
          textWeight: 'extra-bold',
          textColor: '#FFFFFF',
          backgroundColor: '#059669',
          layout: 'centered'
        }
      },
      {
        type: 'question',
        title: 'Question Frame',
        description: 'Present the brain health question with options',
        duration: 4,
        visualElements: {
          textSize: 'medium',
          textWeight: 'bold',
          textColor: '#1F2937',
          backgroundColor: '#ECFDF5',
          layout: 'top-bottom'
        }
      },
      {
        type: 'answer',
        title: 'Answer Frame',
        description: 'Reveal correct brain health answer',
        duration: 2,
        visualElements: {
          textSize: 'large',
          textWeight: 'bold',
          textColor: '#FFFFFF',
          backgroundColor: '#059669',
          layout: 'centered'
        }
      },
      {
        type: 'explanation',
        title: 'Explanation Frame',
        description: 'Explain the brain health science',
        duration: 3.5,
        visualElements: {
          textSize: 'medium',
          textWeight: 'normal',
          textColor: '#1F2937',
          backgroundColor: '#F0FDF4',
          layout: 'top-bottom'
        }
      }
    ],
    visualStyle: {
      theme: 'health_education',
      colorScheme: 'bright',
      fontFamily: 'Inter',
      primaryColor: '#059669',
      secondaryColor: '#0891B2',
      accentColor: '#F59E0B',
      backgroundStyle: 'gradient'
    },
    timing: {
      totalDuration: 15,
      frameTransitions: 0.3,
      pauseBeforeCTA: 0.5
    },
    suitableTopics: ['all'],
    engagementTarget: 'educational'
  },

  quick_tip: {
    type: 'quick_tip',
    name: 'Quick Brain Health Tip',
    description: 'Actionable brain health advice in 3 frames',
    accountId: 'health_shots',
    persona: 'brain_health_tips',
    frameCount: 3,
    frames: [
      {
        type: 'hook',
        title: 'Hook Frame',
        description: 'This 30-second habit will boost your brain',
        duration: 2.5,
        visualElements: {
          textSize: 'large',
          textWeight: 'extra-bold',
          textColor: '#FFFFFF',
          backgroundColor: '#0891B2',
          layout: 'centered'
        }
      },
      {
        type: 'action',
        title: 'Action Frame',
        description: 'Here\'s exactly what to do: [step by step]',
        duration: 4,
        visualElements: {
          textSize: 'medium',
          textWeight: 'bold',
          textColor: '#1F2937',
          backgroundColor: '#CFFAFE',
          layout: 'stacked'
        }
      },
      {
        type: 'result',
        title: 'Result Frame',
        description: 'Why it works + science behind it',
        duration: 3.5,
        visualElements: {
          textSize: 'medium',
          textWeight: 'normal',
          textColor: '#1F2937',
          backgroundColor: '#F0F9FF',
          layout: 'top-bottom'
        }
      }
    ],
    visualStyle: {
      theme: 'health_action',
      colorScheme: 'bright',
      fontFamily: 'Inter',
      primaryColor: '#0891B2',
      secondaryColor: '#059669',
      accentColor: '#F59E0B',
      backgroundStyle: 'gradient'
    },
    timing: {
      totalDuration: 10,
      frameTransitions: 0.2,
      pauseBeforeCTA: 0.3
    },
    suitableTopics: ['memory_techniques', 'focus_tips', 'brain_lifestyle', 'eye_exercises'],
    engagementTarget: 'practical'
  },

  before_after: {
    type: 'before_after',
    name: 'Before/After Brain Health Impact',
    description: 'Show transformation or consequences of brain health choices',
    accountId: 'health_shots',
    persona: 'brain_health_tips',
    frameCount: 4,
    frames: [
      {
        type: 'hook',
        title: 'Hook Frame',
        description: 'What happens to your brain when you...',
        duration: 2.5,
        visualElements: {
          textSize: 'large',
          textWeight: 'extra-bold',
          textColor: '#FFFFFF',
          backgroundColor: '#7C2D12',
          layout: 'centered'
        }
      },
      {
        type: 'before',
        title: 'Before Frame',
        description: 'Most people damage their health by...',
        duration: 3,
        visualElements: {
          textSize: 'medium',
          textWeight: 'bold',
          textColor: '#DC2626',
          backgroundColor: '#FEF2F2',
          layout: 'centered'
        }
      },
      {
        type: 'after',
        title: 'After Frame',
        description: 'But if you do THIS instead...',
        duration: 3,
        visualElements: {
          textSize: 'medium',
          textWeight: 'bold',
          textColor: '#059669',
          backgroundColor: '#ECFDF5',
          layout: 'centered'
        }
      },
      {
        type: 'result',
        title: 'Proof Frame',
        description: 'Here\'s the science + immediate action',
        duration: 3.5,
        visualElements: {
          textSize: 'medium',
          textWeight: 'normal',
          textColor: '#1F2937',
          backgroundColor: '#F9FAFB',
          layout: 'top-bottom'
        }
      }
    ],
    visualStyle: {
      theme: 'health_transformation',
      colorScheme: 'neutral',
      fontFamily: 'Inter',
      primaryColor: '#7C2D12',
      secondaryColor: '#059669',
      accentColor: '#F59E0B',
      backgroundStyle: 'solid'
    },
    timing: {
      totalDuration: 12,
      frameTransitions: 0.3,
      pauseBeforeCTA: 0.5
    },
    suitableTopics: ['brain_lifestyle', 'screen_protection', 'eye_care_habits', 'workplace_vision'],
    engagementTarget: 'educational'
  }
};

// Eye Health Formats (separate from brain health)
export const eyeHealthFormats: { [key in FormatType]?: ContentFormat } = {
  mcq: {
    type: 'mcq',
    name: 'Eye Health Knowledge Quiz',
    description: 'Educational eye health quiz with hook, question+options, answer, and explanation',
    accountId: 'health_shots',
    persona: 'eye_health_tips',
    frameCount: 4,
    frames: [
      {
        type: 'hook',
        title: 'Hook Frame',
        description: 'Eye health knowledge teaser',
        duration: 2.5,
        visualElements: {
          textSize: 'large',
          textWeight: 'extra-bold',
          textColor: '#FFFFFF',
          backgroundColor: '#0891B2',
          layout: 'centered'
        }
      },
      {
        type: 'question',
        title: 'Question Frame',
        description: 'Present the eye health question with options',
        duration: 4,
        visualElements: {
          textSize: 'medium',
          textWeight: 'bold',
          textColor: '#1F2937',
          backgroundColor: '#CFFAFE',
          layout: 'top-bottom'
        }
      },
      {
        type: 'answer',
        title: 'Answer Frame',
        description: 'Reveal correct eye health answer',
        duration: 2,
        visualElements: {
          textSize: 'large',
          textWeight: 'bold',
          textColor: '#FFFFFF',
          backgroundColor: '#0891B2',
          layout: 'centered'
        }
      },
      {
        type: 'explanation',
        title: 'Explanation Frame',
        description: 'Explain the eye health science',
        duration: 3.5,
        visualElements: {
          textSize: 'medium',
          textWeight: 'normal',
          textColor: '#1F2937',
          backgroundColor: '#F0F9FF',
          layout: 'top-bottom'
        }
      }
    ],
    visualStyle: {
      theme: 'health_education',
      colorScheme: 'bright',
      fontFamily: 'Inter',
      primaryColor: '#0891B2',
      secondaryColor: '#059669',
      accentColor: '#F59E0B',
      backgroundStyle: 'gradient'
    },
    timing: {
      totalDuration: 15,
      frameTransitions: 0.3,
      pauseBeforeCTA: 0.5
    },
    suitableTopics: ['all'],
    engagementTarget: 'educational'
  },

  quick_tip: {
    type: 'quick_tip',
    name: 'Quick Eye Health Tip',
    description: 'Actionable eye health advice in 3 frames',
    accountId: 'health_shots',
    persona: 'eye_health_tips',
    frameCount: 3,
    frames: [
      {
        type: 'hook',
        title: 'Hook Frame',
        description: 'This 30-second habit will protect your eyes',
        duration: 2.5,
        visualElements: {
          textSize: 'large',
          textWeight: 'extra-bold',
          textColor: '#FFFFFF',
          backgroundColor: '#0891B2',
          layout: 'centered'
        }
      },
      {
        type: 'action',
        title: 'Action Frame',
        description: 'Here\'s exactly what to do: [step by step]',
        duration: 4,
        visualElements: {
          textSize: 'medium',
          textWeight: 'bold',
          textColor: '#1F2937',
          backgroundColor: '#CFFAFE',
          layout: 'stacked'
        }
      },
      {
        type: 'result',
        title: 'Result Frame',
        description: 'Why it protects your vision + science behind it',
        duration: 3.5,
        visualElements: {
          textSize: 'medium',
          textWeight: 'normal',
          textColor: '#1F2937',
          backgroundColor: '#F0F9FF',
          layout: 'top-bottom'
        }
      }
    ],
    visualStyle: {
      theme: 'health_action',
      colorScheme: 'bright',
      fontFamily: 'Inter',
      primaryColor: '#0891B2',
      secondaryColor: '#059669',
      accentColor: '#F59E0B',
      backgroundStyle: 'gradient'
    },
    timing: {
      totalDuration: 10,
      frameTransitions: 0.2,
      pauseBeforeCTA: 0.3
    },
    suitableTopics: ['screen_protection', 'eye_exercises', 'eye_care_habits', 'workplace_vision'],
    engagementTarget: 'practical'
  },

  before_after: {
    type: 'before_after',
    name: 'Before/After Eye Health Impact',
    description: 'Show transformation or consequences of eye health choices',
    accountId: 'health_shots',
    persona: 'eye_health_tips',
    frameCount: 4,
    frames: [
      {
        type: 'hook',
        title: 'Hook Frame',
        description: 'What happens to your eyes when you...',
        duration: 2.5,
        visualElements: {
          textSize: 'large',
          textWeight: 'extra-bold',
          textColor: '#FFFFFF',
          backgroundColor: '#7C2D12',
          layout: 'centered'
        }
      },
      {
        type: 'before',
        title: 'Before Frame',
        description: 'Most people damage their vision by...',
        duration: 3,
        visualElements: {
          textSize: 'medium',
          textWeight: 'bold',
          textColor: '#DC2626',
          backgroundColor: '#FEF2F2',
          layout: 'centered'
        }
      },
      {
        type: 'after',
        title: 'After Frame',
        description: 'But if you protect your eyes like THIS...',
        duration: 3,
        visualElements: {
          textSize: 'medium',
          textWeight: 'bold',
          textColor: '#0891B2',
          backgroundColor: '#CFFAFE',
          layout: 'centered'
        }
      },
      {
        type: 'result',
        title: 'Proof Frame',
        description: 'Here\'s the science + immediate action for your eyes',
        duration: 3.5,
        visualElements: {
          textSize: 'medium',
          textWeight: 'normal',
          textColor: '#1F2937',
          backgroundColor: '#F9FAFB',
          layout: 'top-bottom'
        }
      }
    ],
    visualStyle: {
      theme: 'health_transformation',
      colorScheme: 'neutral',
      fontFamily: 'Inter',
      primaryColor: '#0891B2',
      secondaryColor: '#059669',
      accentColor: '#F59E0B',
      backgroundStyle: 'solid'
    },
    timing: {
      totalDuration: 12,
      frameTransitions: 0.3,
      pauseBeforeCTA: 0.5
    },
    suitableTopics: ['screen_protection', 'eye_care_habits', 'workplace_vision', 'digital_eye_strain'],
    engagementTarget: 'educational'
  }
};

// All available formats
export const allFormats = {
  ...englishFormats,
  ...healthFormats,
  ...eyeHealthFormats
};

// Get format by type, account, and optional persona
export function getFormat(formatType: FormatType, accountId: string, persona?: string): ContentFormat | null {
  if (accountId === 'english_shots') {
    return englishFormats[formatType] || null;
  } else if (accountId === 'health_shots') {
    // For health account, we need persona-specific formats
    if (persona === 'brain_health_tips') {
      return healthFormats[formatType] || null;
    } else if (persona === 'eye_health_tips') {
      return eyeHealthFormats[formatType] || null;
    } else {
      // Fallback to brain health for backward compatibility
      return healthFormats[formatType] || null;
    }
  }
  return null;
}

// Get all formats for an account and persona
export function getFormatsForAccount(accountId: string, persona?: string): ContentFormat[] {
  if (accountId === 'english_shots') {
    return Object.values(englishFormats).filter((format): format is ContentFormat => format !== undefined);
  } else if (accountId === 'health_shots') {
    if (persona === 'brain_health_tips') {
      return Object.values(healthFormats).filter((format): format is ContentFormat => format !== undefined);
    } else if (persona === 'eye_health_tips') {
      return Object.values(eyeHealthFormats).filter((format): format is ContentFormat => format !== undefined);
    } else {
      // Return all health formats if no persona specified
      return [
        ...Object.values(healthFormats),
        ...Object.values(eyeHealthFormats)
      ].filter((format): format is ContentFormat => format !== undefined);
    }
  }
  return [];
}