import { Curriculum } from './types'; // 💡 FIX: Imports the shared Curriculum type.

/**
 * The Master Curriculum: The single source of truth for all content personas.
 * This object defines the structure and hierarchy for each "teacher's" content.
 */
export const MasterCurriculum: Curriculum = {
  english_learning: {
    displayName: 'English Learning',
    structure: [
      { key: 'vocabulary', displayName: 'Vocabulary', subCategories: [
        { key: 'word_meaning', displayName: 'Word Meaning' },
        { key: 'etymology', displayName: 'Etymology & Word Origins' },
      ]},
      { key: 'grammar', displayName: 'Grammar', subCategories: [
        { key: 'tenses', displayName: 'Verb Tenses' },
        { key: 'parts_of_speech', displayName: 'Parts of Speech' },
      ]},
    ],
  },
  upsc_prep: {
    displayName: 'UPSC Preparation',
    structure: [
      { key: 'gs_paper_1', displayName: 'GS Paper 1', subCategories: [
        { key: 'history', displayName: 'History' },
        { key: 'geography', displayName: 'Geography' },
      ]},
      { key: 'gs_paper_2', displayName: 'GS Paper 2', subCategories: [
        { key: 'polity', displayName: 'Polity' },
        { key: 'governance', displayName: 'Governance' },
      ]},
    ],
  },
  current_affairs: {
    displayName: 'Current Affairs',
    structure: [
      { key: 'national', displayName: 'National News' },
      { key: 'international', displayName: 'International Relations' },
      { key: 'sci_tech', displayName: 'Science & Technology' },
    ],
  },
};