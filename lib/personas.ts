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
  // English Learning Content - Optimized for 15-20s Videos
  english_vocab_builder: {
    displayName: '@EnglishShotsDaily',
    subCategories: [
      // --- High-Engagement Quick Wins ---
      { key: 'eng_common_mistakes', displayName: 'Stop Making This Mistake ❌' },
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

  // Health Content - Brain Health - Optimized for Quick Consumption
  brain_health_tips: {
    displayName: '@HealthShotsDaily',
    subCategories: [
      { key: 'memory_hacks', displayName: '5-Second Memory Boost 🧠' },
      { key: 'focus_tricks', displayName: 'Instant Focus Fix ⚡' },
      { key: 'brain_foods', displayName: 'This Food Boosts Your IQ 🥗' },
      { key: 'brain_exercises', displayName: '10-Second Brain Workout 🧩' },
      { key: 'stress_killers', displayName: 'Kill Stress in 15 Seconds 😌' },
      { key: 'sleep_hacks', displayName: 'Sleep Better Tonight 😴' },
      { key: 'brain_myths', displayName: 'Brain Myth BUSTED 🔍' },
      { key: 'productivity_hacks', displayName: 'Double Your Focus Now 🎯' }
    ],
  },

  // Health Content - Eye Health - Optimized for Instant Action
  eye_health_tips: {
    displayName: '@HealthShotsDaily',
    subCategories: [
      { key: 'screen_damage', displayName: 'Your Phone Is Killing Your Eyes 📱' },
      { key: 'eye_exercises', displayName: '10-Second Eye Relief 👁️' },
      { key: 'vision_foods', displayName: 'This Food Improves Eyesight 🥕' },
      { key: 'eye_protection', displayName: 'Save Your Eyes Daily 🌟' },
      { key: 'computer_strain', displayName: 'Fix Screen Strain Instantly 💻' },
      { key: 'vision_myths', displayName: 'Eye Health Myth BUSTED 🔍' },
      { key: 'quick_eye_care', displayName: 'Instant Eye Care Hack ⚡' }
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