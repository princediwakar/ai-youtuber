import { Curriculum } from './types'; // 💡 FIX: Imports the shared Curriculum type.

/**
 * The Master Curriculum: The single source of truth for all content personas.
 * This object defines the structure and hierarchy for each "teacher's" content.
 */
export const MasterCurriculum: Curriculum = {
  english_learning: {
    displayName: 'Daily English Learning',
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
  
  sports_trivia: {
    displayName: 'Sports Trivia',
    structure: [
      {
        key: 'records',
        displayName: 'Records',
        subCategories: [
          { key: 'world_records', displayName: 'World Records' },
          { key: 'olympic_records', displayName: 'Olympic Records' },
          { key: 'league_records', displayName: 'League Records' },
        ],
      },
      {
        key: 'championships',
        displayName: 'Championships',
        subCategories: [
          { key: 'world_cup', displayName: 'World Cup' },
          { key: 'super_bowl', displayName: 'Super Bowl' },
          { key: 'olympics', displayName: 'Olympics' },
        ],
      },
    ],
  },

  psychology_facts: {
    displayName: 'Psychology Facts',
    structure: [
      {
        key: 'body_language',
        displayName: 'Body Language',
        subCategories: [
          { key: 'facial_expressions', displayName: 'Facial Expressions' },
          { key: 'gestures', displayName: 'Gestures' },
          { key: 'posture_meaning', displayName: 'Posture Meaning' },
        ],
      },
      {
        key: 'human_behavior',
        displayName: 'Human Behavior',
        subCategories: [
          { key: 'decision_making', displayName: 'Decision Making' },
          { key: 'social_psychology', displayName: 'Social Psychology' },
          { key: 'cognitive_biases', displayName: 'Cognitive Biases' },
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
    displayName: 'Geography & Travel',
    structure: [
      {
        key: 'countries',
        displayName: 'Countries',
        subCategories: [
          { key: 'capitals', displayName: 'Capitals' },
          { key: 'flags', displayName: 'Flags' },
          { key: 'famous_landmarks', displayName: 'Famous Landmarks' },
        ],
      },
      {
        key: 'travel_facts',
        displayName: 'Travel Facts',
        subCategories: [
          { key: 'weird_laws', displayName: 'Weird Laws' },
          { key: 'cultural_customs', displayName: 'Cultural Customs' },
          { key: 'amazing_facts', displayName: 'Amazing Facts' },
        ],
      },
    ],
  },

  science_facts: {
    displayName: 'Science Facts',
    structure: [
      {
        key: 'space',
        displayName: 'Space & Universe',
        subCategories: [
          { key: 'planets', displayName: 'Planets' },
          { key: 'space_exploration', displayName: 'Space Exploration' },
          { key: 'universe_facts', displayName: 'Universe Facts' },
        ],
      },
      {
        key: 'nature',
        displayName: 'Nature',
        subCategories: [
          { key: 'animals', displayName: 'Animals' },
          { key: 'plants', displayName: 'Plants' },
          { key: 'weather', displayName: 'Weather' },
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
          { key: 'social_media', displayName: 'Social Media' },
          { key: 'internet_history', displayName: 'Internet History' },
          { key: 'digital_trends', displayName: 'Digital Trends' },
        ],
      },
      {
        key: 'innovations',
        displayName: 'Innovations',
        subCategories: [
          { key: 'ai_technology', displayName: 'AI Technology' },
          { key: 'future_tech', displayName: 'Future Tech' },
          { key: 'tech_breakthroughs', displayName: 'Tech Breakthroughs' },
        ],
      },
    ],
  },
};