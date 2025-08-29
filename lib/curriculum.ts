import { Curriculum } from './types'; // 💡 FIX: Imports the shared Curriculum type.

/**
 * The Master Curriculum: The single source of truth for all content personas.
 * This object defines the structure and hierarchy for each "teacher's" content.
 */
export const MasterCurriculum: Curriculum = {
  english_learning: {
    displayName: 'English Power-Up',
    structure: [
      {
        key: 'vocabulary',
        displayName: 'Vocabulary Hacks',
        subCategories: [
          { key: 'word_meaning', displayName: 'Word Meanings That Matter' },
          { key: 'synonyms_antonyms', displayName: 'Word Twins & Opposites' },
          { key: 'idioms_phrases', displayName: 'Cool English Expressions' },
        ],
      },
      {
        key: 'grammar',
        displayName: 'Grammar Secrets',
        subCategories: [
          { key: 'tenses', displayName: 'Time Travel with Tenses' },
          { key: 'parts_of_speech', displayName: 'Word Types Decoded' },
          { key: 'sentence_structure', displayName: 'Perfect Sentence Tricks' },
          { key: 'punctuation', displayName: 'Punctuation Power' },
        ],
      },
    ],
  },
  
  cricket_trivia: {
    displayName: 'Cricket Fever',
    structure: [
      {
        key: 'records',
        displayName: 'Unbreakable Records',
        subCategories: [
          { key: 'batting_records', displayName: 'Batting Legends' },
          { key: 'bowling_records', displayName: 'Bowling Wizards' },
          { key: 'team_records', displayName: 'Team Domination' },
        ],
      },
      {
        key: 'tournaments',
        displayName: 'Epic Tournaments',
        subCategories: [
          { key: 'world_cup', displayName: 'World Cup Moments' },
          { key: 'ipl', displayName: 'IPL Madness' },
          { key: 'test_cricket', displayName: 'Test Cricket Drama' },
        ],
      },
    ],
  },

  psychology_facts: {
    displayName: 'Mind Tricks Revealed',
    structure: [
      {
        key: 'body_language',
        displayName: 'Secret Body Signals',
        subCategories: [
          { key: 'facial_expressions', displayName: 'Face Reading Secrets' },
          { key: 'gestures', displayName: 'Hidden Hand Meanings' },
          { key: 'posture_meaning', displayName: 'Posture Psychology' },
        ],
      },
      {
        key: 'human_behavior',
        displayName: 'Why Humans Act Weird',
        subCategories: [
          { key: 'decision_making', displayName: 'Decision Hacks' },
          { key: 'social_psychology', displayName: 'Social Mind Games' },
          { key: 'cognitive_biases', displayName: 'Brain Glitches' },
        ],
      },
    ],
  },

  historical_facts: {
    displayName: 'Historical Facts',
    structure: [
      {
        key: 'inventions',
        displayName: 'Inventions',
        subCategories: [
          { key: 'who_invented', displayName: 'Who Invented' },
          { key: 'invention_year', displayName: 'Invention Year' },
          { key: 'accidental_inventions', displayName: 'Accidental Inventions' },
        ],
      },
      {
        key: 'historical_events',
        displayName: 'Historical Events',
        subCategories: [
          { key: 'event_dates', displayName: 'Event Dates' },
          { key: 'lesser_known_facts', displayName: 'Lesser Known Facts' },
          { key: 'historical_figures', displayName: 'Historical Figures' },
        ],
      },
    ],
  },

  geography_travel: {
    displayName: 'World Explorer',
    structure: [
      {
        key: 'countries',
        displayName: 'Amazing Countries',
        subCategories: [
          { key: 'capitals', displayName: 'Capital Cities Quiz' },
          { key: 'famous_landmarks', displayName: 'Iconic Landmarks' },
        ],
      },
      {
        key: 'travel_facts',
        displayName: 'Travel Secrets',
        subCategories: [
          { key: 'weird_laws', displayName: 'Bizarre Laws' },
          { key: 'cultural_customs', displayName: 'Cultural Customs' },
          { key: 'amazing_facts', displayName: 'Amazing Facts' },
        ],
      },
    ],
  },

  science_facts: {
    displayName: 'Science Mysteries',
    structure: [
      {
        key: 'space',
        displayName: 'Cosmic Secrets',
        subCategories: [
          { key: 'planets', displayName: 'Planet Mysteries' },
          { key: 'space_exploration', displayName: 'Space Adventures' },
          { key: 'universe_facts', displayName: 'Universe Wonders' },
        ],
      },
      {
        key: 'nature',
        displayName: 'Nature\'s Secrets',
        subCategories: [
          { key: 'animals', displayName: 'Wild Animal Facts' },
          { key: 'plants', displayName: 'Plant Superpowers' },
          { key: 'weather', displayName: 'Weather Wonders' },
        ],
      },
    ],
  },

  technology_facts: {
    displayName: 'Technology Facts',
    structure: [
      {
        key: 'internet',
        displayName: 'Internet & Digital',
        subCategories: [
          { key: 'social_media', displayName: 'Social Media Secrets' },
          { key: 'internet_history', displayName: 'Internet Origins' },
          { key: 'digital_trends', displayName: 'Viral Tech Trends' },
        ],
      },
      {
        key: 'innovations',
        displayName: 'Future Tech',
        subCategories: [
          { key: 'ai_technology', displayName: 'AI Mind-Blowing Facts' },
          { key: 'future_tech', displayName: 'Sci-Fi Becoming Real' },
          { key: 'tech_breakthroughs', displayName: 'Game-Changing Tech' },
        ],
      },
    ],
  },
};