import { PersonaConfig } from './types';

/**
 * Master Personas for Multi-Account YouTube Content Generation
 * * English Persona: Comprehensive vocabulary builder for automated short-form video quizzes
 * Health Personas: Mental and general health tips for wellness-focused content
 * SSC Persona: Government exam preparation content for competitive exam aspirants
 *
 * Updated on: 2025-10-27
 * Rationale: Added comprehensive topic lists for mental and general health personas.
 */
export const MasterPersonas: PersonaConfig = {
  // English Learning Content - Optimized for 15-20s Videos
  english_vocab_builder: {
    displayName: '@EnglishShotsDaily',
    subCategories: [
      // --- High-Engagement Quick Wins ---
      { key: 'eng_vocab_word_meaning', displayName: 'You Use This Word Wrong 📖' },
      { key: 'eng_vocab_fill_blanks', displayName: 'Fill the Blank Challenge ✍️' },
      
      // --- Word Relationships (Simplified) ---
      { key: 'eng_vocab_synonyms', displayName: 'Twin Words Test 👯' },
      { key: 'eng_vocab_antonyms', displayName: 'Opposite Word Quiz ↔️' },
      { key: 'eng_vocab_register', displayName: 'Formal vs Casual ❓' },
      
      // --- Quick Grammar Fixes ---
      { key: 'eng_grammar_hacks', displayName: '5-Second Grammar Fix ⚡' },
    ],
  },

  // Health Content - Mental Health - Optimized for Quick Consumption
  mental_health_tips: {
    displayName: '@HealthShotsDaily',
    subCategories: [
      { key: 'stress_management', displayName: 'Stress Relief Tips 🧘' },
      { key: 'focus_boost', displayName: 'Improve Your Focus 🧠' },
      { key: 'mood_enhancers', displayName: 'Quick Mood Boosters 😊' },
      { key: 'mindfulness_hacks', displayName: 'Mindfulness Hacks 🌿' },
      { key: 'sleep_quality', displayName: 'Better Sleep Tips 😴' },
      { key: 'cognitive_habits', displayName: 'Brain-Boosting Habits ⚡' },
      { key: 'anxiety_relief', displayName: 'Anxiety Relief 🌬️' },
      { key: 'digital_detox', displayName: 'Digital Detox 📵' },
      { key: 'gratitude_practice', displayName: 'Gratitude Practice 🙏' },
      { key: 'positive_affirmations', displayName: 'Positive Affirmations ✨' },
      { key: 'memory_tricks', displayName: 'Memory Hacks 💡' },
      { key: 'emotional_intelligence', displayName: 'Emotional IQ 💖' },
      { key: 'burnout_prevention', displayName: 'Avoid Burnout 🔥' },
      { key: 'social_connection', displayName: 'Social Connection 🤝' },
      { key: 'self_care_ideas', displayName: 'Self-Care Ideas 🛁' },
      { key: 'morning_routine', displayName: 'Mindful Morning ☀️' },
      { key: 'laughter_therapy', displayName: 'Laughter is Medicine 😂' },
    ],
  },

  // Health Content - General Health - Optimized for Instant Action
  general_health_tips: {
    displayName: '@HealthShotsDaily',
    subCategories: [
      { key: 'heart_health', displayName: 'Heart Health Tips ❤️' },
      { key: 'digestive_wellness', displayName: 'Digestive Health 🍉' },
      { key: 'skin_health', displayName: 'Healthy Skin Hacks ✨' },
      { key: 'joint_support', displayName: 'Joint & Bone Health 💪' },
      { key: 'immune_boosters', displayName: 'Immune System Tips 🛡️' },
      { key: 'hydration_facts', displayName: 'Hydration Facts 💧' },
      { key: 'energy_boosts', displayName: 'Natural Energy Boosts ⚡' },
      { key: 'lung_health', displayName: 'Lung Health 🫁' },
      { key: 'eye_care', displayName: 'Protect Your Eyes 👁️' },
      { key: 'posture_tips', displayName: 'Better Posture Tips 🚶' },
      { key: 'nutrition_hacks', displayName: 'Nutrition Hacks 🥦' },
      { key: 'fitness_motivation', displayName: 'Fitness Motivation 👟' },
      { key: 'metabolism_myths', displayName: 'Metabolism Myths 📈' },
      { key: 'sun_safety', displayName: 'Sun Safety ☀️' },
      { key: 'gut_microbiome', displayName: 'Gut Health 🦠' },
      { key: 'oral_health', displayName: 'Oral Health 🦷' },
      { key: 'healthy_aging', displayName: 'Healthy Aging ⏳' },
    ],
  },

  // SSC Exam Preparation Content - Optimized for Quick Facts
  ssc_shots: {
    displayName: '@SSCShotsDaily',
    subCategories: [
      // High-Frequency One-Liners (Perfect for 15s)
      { key: 'ssc_history', displayName: 'History One-Liner 📚' },
      { key: 'ssc_geography', displayName: 'Geography Fact Flash 🌍' },
      { key: 'ssc_current_affairs', displayName: '2025 Current Affairs ⚡' },
      { key: 'ssc_gk_tricks', displayName: 'GK Memory Trick 🧠' },
      
      // Quick Learning Aids
      { key: 'ssc_vocab', displayName: 'SSC Word of the Day 📖' },
      { key: 'ssc_grammar', displayName: 'Grammar Rule in 15s 📝' },
      { key: 'ssc_numbers', displayName: 'Important Number 🔢' },
      { key: 'ssc_shortcuts', displayName: 'Exam Shortcut Hack ⚡' },
      
      // Essential Facts Only
      { key: 'ssc_states_capitals', displayName: 'State-Capital Trick 🗺️' },
      { key: 'ssc_important_dates', displayName: 'Must-Know Date 📅' },
      { key: 'ssc_govt_schemes', displayName: 'Scheme Name + Purpose 📋' },
    ],
  },

  // Astronomy Content - Space Facts and Mind-Blowing Quiz Content
  space_facts_quiz: {
    displayName: '@SpaceTriviaDaily',
    subCategories: [
      // Mind-Blowing Scale Comparisons (Perfect for 15-20s)
      { key: 'space_scale_comparisons', displayName: 'Mind-Blowing Space Scale 🌌' },
      { key: 'space_speed_facts', displayName: 'Insane Space Speeds ⚡' },
      { key: 'space_temperature_extremes', displayName: 'Extreme Space Temps 🔥❄️' },
      { key: 'space_time_facts', displayName: 'Time Works Weird in Space ⏰' },
      
      // High-Engagement Content
      { key: 'space_myths_busted', displayName: 'Space Myth BUSTED 🔍' },
      { key: 'space_discovery_facts', displayName: 'Latest Space Discovery 🚀' },
      { key: 'space_record_numbers', displayName: 'Record-Breaking Space Numbers 📊' },
      { key: 'space_coincidences', displayName: 'Cosmic Coincidences 🎯' },
      
      // Quick Space Facts
      { key: 'planet_comparisons', displayName: 'Planet vs Planet Battle ⚔️' },
      { key: 'space_would_you_rather', displayName: 'Space Would You Rather? 🤔' },
      { key: 'space_what_if', displayName: 'What If in Space? 💭' },
    ],
  },
};