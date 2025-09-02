import { PersonaConfig } from './types';

/**
 * The Master Persona: A comprehensive, text-only vocabulary builder for automated short-form video quizzes.
 * This persona is designed to be the sole focus, offering a wide variety of quiz formats
 * that require no images, ensuring maximum compatibility and speed.
 *
 * Updated on: 2025-08-31
 * Rationale: Based on the "no images" constraint, the picture-based quiz has been removed.
 * A new category, 'Word Forms', has been added to provide another layer of deep vocabulary
 * testing in a purely text-based format.
 */
export const MasterPersonas: PersonaConfig = {
  english_vocab_builder: {
    displayName: 'Vocabulary Shots',
    subCategories: [
      // --- Core Vocabulary Skills ---
      { key: 'eng_vocab_word_meaning', displayName: 'What Does This Word Mean? 📖' },
      { key: 'eng_vocab_fill_blanks', displayName: 'Fill in the Blank! ✍️' },
      { key: 'eng_spelling_bee', displayName: 'Can You Spell It? 🐝' },
      { key: 'eng_vocab_word_forms', displayName: 'Which Word Form Fits? 🔄' }, // New & Text-Only

      // --- Word Relationships ---
      { key: 'eng_vocab_synonyms', displayName: 'Word Twins (Synonyms) 👯' },
      { key: 'eng_vocab_antonyms', displayName: 'Opposites Attract (Antonyms) ↔️' },
      { key: 'eng_vocab_shades_of_meaning', displayName: 'Shades of Meaning (e.g., walk vs. stroll) 🤔' },

      // --- Practical & Contextual Vocabulary ---
      { key: 'eng_vocab_confusing_words', displayName: 'Commonly Confused Words 😵' },
      { key: 'eng_vocab_collocations', displayName: 'Perfect Pairs (Collocations) 🤝' },
      { key: 'eng_vocab_thematic_words', displayName: 'Thematic Vocab (e.g., Business, Travel) ✈️' },
      { key: 'eng_vocab_register', displayName: 'Formal vs. Casual Words 👔/👕' },

      // --- Advanced Vocabulary & Fluency ---
      { key: 'eng_vocab_phrasal_verbs', displayName: 'Phrasal Verbs (get up, put off) 🧩' },
      { key: 'eng_vocab_idioms', displayName: 'Guess the Idiom! 🤯' },
      { key: 'eng_vocab_prefixes_suffixes', displayName: 'Word Origins (Prefixes/Suffixes) ⚛️' },
    ],
  },
};