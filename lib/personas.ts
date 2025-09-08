import { PersonaConfig } from './types';

/**
 * Master Personas for Multi-Account YouTube Content Generation
 * 
 * English Persona: Comprehensive vocabulary builder for automated short-form video quizzes
 * Health Personas: Brain and eye health tips for wellness-focused content
 * SSC Persona: Government exam preparation content for competitive exam aspirants
 *
 * Updated on: 2025-09-08
 * Rationale: Extended to support three-channel architecture with SSC exam preparation content
 */
export const MasterPersonas: PersonaConfig = {
  // English Learning Content
  english_vocab_builder: {
    displayName: '@EnglishShotsDaily',
    subCategories: [
      // --- Core Vocabulary Skills ---
      { key: 'eng_vocab_word_meaning', displayName: 'What Does This Word Mean? 📖' },
      { key: 'eng_vocab_fill_blanks', displayName: 'Fill in the Blank! ✍️' },
      { key: 'eng_vocab_word_forms', displayName: 'Which Word Form Fits? 🔄' },

      // --- Word Relationships ---
      { key: 'eng_vocab_synonyms', displayName: 'Word Twins (Synonyms) 👯' },
      { key: 'eng_vocab_antonyms', displayName: 'Opposites Attract (Antonyms) ↔️' },
      { key: 'eng_vocab_shades_of_meaning', displayName: 'Shades of Meaning 🤔' },

      // --- Practical & Contextual Vocabulary ---
      { key: 'eng_vocab_thematic_words', displayName: 'Thematic Vocab (e.g., Business, Travel) ✈️' },
      { key: 'eng_vocab_register', displayName: 'Formal vs. Casual Words 👔/👕' },

      // --- Advanced Vocabulary & Fluency ---
      { key: 'eng_vocab_idioms', displayName: 'Guess the Idiom! 🤯' },
    ],
  },

  // Health Content - Brain Health
  brain_health_tips: {
    displayName: '@HealthShotsDaily',
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
    displayName: '@HealthShotsDaily',
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

  // SSC Exam Preparation Content
  ssc_shots: {
    displayName: '@SSCShotsDaily',
    subCategories: [
      // General Studies
      { key: 'ssc_history', displayName: 'Indian History Facts 📚' },
      { key: 'ssc_geography', displayName: 'Geography Quick Facts 🌍' },
      { key: 'ssc_polity', displayName: 'Constitution & Governance 🏛️' },
      { key: 'ssc_economics', displayName: 'Economy Basics 💰' },

      // Quantitative Aptitude  
      { key: 'ssc_math_basics', displayName: 'Math Shortcuts & Tricks ➕' },
      { key: 'ssc_percentages', displayName: 'Percentage Problems 📊' },
      { key: 'ssc_ratio_proportion', displayName: 'Ratio & Proportion ⚖️' },

      // Reasoning
      { key: 'ssc_logical_reasoning', displayName: 'Logical Reasoning 🧠' },
      { key: 'ssc_verbal_reasoning', displayName: 'Verbal Reasoning 💭' },
      { key: 'ssc_coding_decoding', displayName: 'Coding-Decoding 🔐' },

      // English
      { key: 'ssc_grammar', displayName: 'Grammar Rules 📝' },
      { key: 'ssc_vocabulary', displayName: 'SSC Vocabulary 📖' },

      // Current Affairs
      { key: 'ssc_current_affairs', displayName: 'Current Affairs Flash' },
    ],
  },
};