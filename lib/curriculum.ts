import { Curriculum } from './types'; // 💡 FIX: Imports the shared Curriculum type.

/**
 * The Master Curriculum: The single source of truth for all content personas.
 * This object defines the structure and hierarchy for each "teacher's" content.
 */
export const MasterCurriculum: Curriculum = {
  english_learning: {
    displayName: 'English Learning',
    structure: [
      {
        key: 'vocabulary',
        displayName: 'Vocabulary',
        subCategories: [
          { key: 'word_meaning', displayName: 'Word Meaning' },
          { key: 'synonyms_antonyms', displayName: 'Synonyms & Antonyms' },
          { key: 'idioms_phrases', displayName: 'Idioms & Phrases' },
        ],
      },
      {
        key: 'grammar',
        displayName: 'Grammar',
        subCategories: [
          { key: 'tenses', displayName: 'Verb Tenses' },
          { key: 'parts_of_speech', displayName: 'Parts of Speech' },
          { key: 'sentence_structure', displayName: 'Sentence Structure' },
          { key: 'punctuation', displayName: 'Punctuation' },
        ],
      },
    ],
  },
  
};