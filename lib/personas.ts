import { PersonaConfig } from './types';

/**
 * Master Personas for Multi-Account YouTube Content Generation
 * 
 * English Persona: Comprehensive vocabulary builder for automated short-form video quizzes
 * Health Personas: Brain and eye health tips for wellness-focused content
 *
 * Updated on: 2025-09-03
 * Rationale: Extended to support multi-account architecture with health content personas
 */
export const MasterPersonas: PersonaConfig = {
  // English Learning Content
  english_vocab_builder: {
    displayName: 'Vocabulary Shots',
    subCategories: [
      // --- Core Vocabulary Skills ---
      { key: 'eng_vocab_word_meaning', displayName: 'What Does This Word Mean? 📖' },
      { key: 'eng_vocab_fill_blanks', displayName: 'Fill in the Blank! ✍️' },
      { key: 'eng_spelling_bee', displayName: 'Can You Spell It? 🐝' },
      { key: 'eng_vocab_word_forms', displayName: 'Which Word Form Fits? 🔄' },

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

  // Health Content - Brain Health
  brain_health_tips: {
    displayName: 'Brain Health Tips',
    subCategories: [
      { key: 'memory_techniques', displayName: 'Memory Enhancement Techniques 🧠' },
      { key: 'focus_tips', displayName: 'Focus & Concentration Tips 🎯' },
      { key: 'brain_food', displayName: 'Brain-Healthy Foods & Nutrition 🥗' },
      { key: 'mental_exercises', displayName: 'Cognitive Exercises & Training 🧩' },
      { key: 'brain_lifestyle', displayName: 'Brain-Healthy Lifestyle Habits 💪' },
      { key: 'stress_management', displayName: 'Stress Management for Brain Health 😌' },
      { key: 'sleep_brain', displayName: 'Sleep & Brain Health Connection 😴' },
      { key: 'brain_myths', displayName: 'Brain Health Myths Busted 🔍' }
    ],
  },

  // Health Content - Eye Health  
  eye_health_tips: {
    displayName: 'Eye Health Tips',
    subCategories: [
      { key: 'screen_protection', displayName: 'Screen Time Safety & Blue Light Protection 📱' },
      { key: 'eye_exercises', displayName: 'Eye Exercises & Vision Training 👁️' },
      { key: 'vision_nutrition', displayName: 'Vision-Supporting Foods & Nutrients 🥕' },
      { key: 'eye_care_habits', displayName: 'Daily Eye Care Routines 🌟' },
      { key: 'workplace_vision', displayName: 'Workplace Vision Health 💻' },
      { key: 'eye_safety', displayName: 'Eye Safety & Protection Tips 🥽' },
      { key: 'vision_myths', displayName: 'Eye Health Myths & Facts 🔍' },
      { key: 'eye_fatigue', displayName: 'Preventing Eye Strain & Fatigue 😴' }
    ],
  },
};