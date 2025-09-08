Overview

  Refactor the prompt system to be more maintainable, then add SSC exam preparation content as a third channel with minimal
  changes to existing infrastructure.

  Phase 1: Refactor Prompt System

  Current Problem

  - promptTemplates.ts is 600+ lines and growing
  - Mixed persona logic in single file
  - Repeated code across health personas
  - Hard to maintain and extend

  Solution: Split by Persona

  Create shared utilities:
  lib/generation/shared/
  └── promptUtils.ts          # Common functions, interfaces, JSON formatting

  Split into persona-specific files:
  lib/generation/personas/
  ├── englishPrompts.ts       # All English vocabulary templates
  ├── healthPrompts.ts        # Brain & eye health templates
  └── sscPrompts.ts          # SSC exam templates (new)

  Update main router:
  lib/generation/promptTemplates.ts  # Route to appropriate persona, maintain compatibility

  Phase 2: Add SSC Persona

  Update personas.ts

  ssc_shots: {
    displayName: '@SSCShotsDaily',
    subCategories: [
      // General Studies
      { key: 'ssc_history', displayName: 'Indian History Facts' },
      { key: 'ssc_geography', displayName: 'Geography Quick Facts' },
      { key: 'ssc_polity', displayName: 'Constitution & Governance' },
      { key: 'ssc_economics', displayName: 'Economy Basics' },

      // Quantitative Aptitude  
      { key: 'ssc_math_basics', displayName: 'Math Shortcuts & Tricks' },
      { key: 'ssc_percentages', displayName: 'Percentage Problems' },
      { key: 'ssc_ratio_proportion', displayName: 'Ratio & Proportion' },

      // Reasoning
      { key: 'ssc_logical_reasoning', displayName: 'Logical Reasoning' },
      { key: 'ssc_verbal_reasoning', displayName: 'Verbal Reasoning' },
      { key: 'ssc_coding_decoding', displayName: 'Coding-Decoding' },

      // English
      { key: 'ssc_grammar', displayName: 'Grammar Rules' },
      { key: 'ssc_vocabulary', displayName: 'SSC Vocabulary' },

      // Current Affairs
      { key: 'ssc_current_affairs', displayName: 'Current Affairs Flash' },
    ],
  }

  Create SSC Prompt Templates (sscPrompts.ts)

  Supported formats (using existing layouts):
  - MCQ Format - History, geography, polity, math shortcuts, reasoning
  - Quick Facts Format - Current affairs, constitutional facts, economic terms
  - True/False Format - Common misconceptions, fact verification

  Content approach:
  - Government exam focused
  - Competitive exam language and tone
  - Factual, authoritative content
  - Exam-specific terminology

  Phase 3: Update Schedule System

  Add SSC Schedule to schedule.ts

  // SSC exam preparation - optimized for serious aspirants
  const sscGenerationPattern: HourlySchedule = {
    5: ['ssc_shots'],   // Early morning generation
    14: ['ssc_shots'],  // Post-lunch generation  
    20: ['ssc_shots'],  // Evening generation
  };

  const sscUploadPattern: HourlySchedule = {
    6: ['ssc_shots'],   // Early morning study time
    9: ['ssc_shots'],   // Morning study session
    12: ['ssc_shots'],  // Lunch break revision
    15: ['ssc_shots'],  // Afternoon study break
    18: ['ssc_shots'],  // Evening study start
    21: ['ssc_shots'],  // Night study session
  };

  // Add to ACCOUNT_SCHEDULES
  ssc_shots: {
    generation: { /* apply pattern to all days */ },
    upload: { /* apply pattern to all days */ }
  }

  Phase 4: Update Playlist Manager

  Add SSC Support to playlistManager.ts

  Add SSC persona to format mapping:
  'ssc_shots': ['mcq', 'quick_tip'],

  Add SSC hashtags:
  ssc_shots: {
    ssc_shots: ['#SSC', '#GovernmentJobs', '#CompetitiveExams', '#SSCPrep', '#StudyTips']
  }

  Add SSC playlist titles:
  ssc_shots: {
    ssc_shots: {
      'mcq': `SSC Exam Prep: ${topicDisplayName} | Practice Questions`,
      'quick_tip': `SSC Exam Prep: ${topicDisplayName} | Quick Tips`,
    }
  }

  Add SSC playlist descriptions:
  - Government exam focused language
  - Competitive exam benefits
  - Study plan guidance
  - SSC-specific keywords

  Phase 5: Use Existing Visual System

  Theme Assignment in themeMap.ts

  ssc_shots: [
    'VintageScroll',     # Professional scholarly feel
    'MintyFresh',        # Clean and focused
    'SakuraGrove',       # Calm and trustworthy
    'CanyonSunset',      # Warm institutional colors
  ]

  No new themes needed - existing themes provide professional look.

  Phase 6: Account System Integration

  Update accounts system

  - Add third YouTube channel (ssc_shots)
  - Add SSC-specific branding configuration
  - Add Cloudinary account for SSC content storage

  Implementation Steps

  1. Extract shared utilities from promptTemplates.ts
  2. Split existing prompts into persona-specific files
  3. Create SSC prompt templates with government exam focus
  4. Update prompt router to handle all three personas
  5. Add SSC persona to personas configuration
  6. Add SSC schedules optimized for study times
  7. Update playlist manager with SSC branding
  8. Assign existing themes to SSC persona
  9. Test integration across all three channels

  Files to Create/Modify

  New Files

  - lib/generation/shared/promptUtils.ts
  - lib/generation/personas/englishPrompts.ts
  - lib/generation/personas/healthPrompts.ts
  - lib/generation/personas/sscPrompts.ts

  Modified Files

  - lib/generation/promptTemplates.ts (router only)
  - lib/personas.ts (add SSC persona)
  - lib/schedule.ts (add SSC schedules)
  - lib/playlistManager.ts (add SSC support)
  - lib/visuals/themeMap.ts (SSC theme assignment)

  Benefits

  Immediate Benefits

  - Cleaner codebase - Separated concerns by persona
  - Easy maintenance - Each content type in its own file
  - SSC channel ready - Professional government exam content
  - Minimal changes - Reuse existing infrastructure

  Future Benefits

  - Easy expansion - Add UPSC, Banking, Railway exams
  - Independent updates - Modify one persona without affecting others
  - Clear structure - New team members can understand quickly
  - Scalable architecture - Ready for more exam types

  Backward Compatibility

  - Zero impact on existing English/Health channels
  - Same API - No changes to calling code
  - Same functionality - All existing features preserved

  Success Metrics

  - All three channels generate content independently
  - SSC content matches government exam style and topics
  - No disruption to existing English/Health operations
  - Clean, maintainable codebase structure
  - Easy to add more exam types later