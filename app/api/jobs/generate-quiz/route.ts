// app/api/jobs/generate-quiz/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createQuizJob } from '@/lib/database';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

// --- VOCABULARY PERSONA CONFIGURATION ---

/**
 * Vocabulary improvement categories and sub-topics
 */
const VOCABULARY_CATEGORIES = {
  'word_meaning': [
    'Advanced Academic Vocabulary',
    'Business & Professional Terms',
    'Scientific & Technical Words',
    'Literary & Artistic Terms',
    'Historical & Political Vocabulary',
    'Common SAT/GRE Words',
    'Everyday Advanced Words'
  ],
  'synonyms_antonyms': [
    'Common Word Pairs',
    'Academic Synonyms',
    'Emotional & Descriptive Words',
    'Action & Movement Words',
    'Complex Concept Words'
  ],
  'word_usage': [
    'Commonly Confused Words',
    'Formal vs Informal Usage',
    'Context-Dependent Meanings',
    'Idiomatic Expressions',
    'Collocations'
  ],
  'etymology': [
    'Greek & Latin Roots',
    'Word Origins & History',
    'Prefix & Suffix Patterns',
    'Language Evolution'
  ],
  'contextual_vocabulary': [
    'Reading Comprehension Vocabulary',
    'Subject-Specific Terms',
    'Contextual Clues',
    'Inferring Meaning'
  ]
};

/**
 * Different question formats for vocabulary learning
 */
const QUESTION_FORMATS = [
  'multiple_choice',
  'fill_blank',
  'match_definition',
  'context_clues',
  'synonym_selection',
  'antonym_identification',
  'word_formation',
  'usage_correction'
];

/**
 * Question styles to make learning engaging
 */
const VOCABULARY_STYLES = [
  "a straightforward definition-based question",
  "a context-based question with a sentence or short passage",
  "a synonym/antonym identification challenge",
  "a word usage scenario with multiple options",
  "an etymology-based question about word origins",
  "a fill-in-the-blank with contextual clues",
  "a commonly confused words scenario",
  "a formal vs informal usage distinction"
];

// Helper function to get a random element from an array
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * API endpoint to generate vocabulary improvement quiz questions.
 * This function is designed to be triggered by a cron job.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authorization Check
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting vocabulary quiz generation...');

    // 2. Generate Vocabulary Job Configuration
    const category = getRandomElement(Object.keys(VOCABULARY_CATEGORIES));
    const questionFormat = getRandomElement(QUESTION_FORMATS);
    const difficulty = getRandomElement(['easy', 'medium', 'hard'] as const);
    const targetAudience = getRandomElement(['general', 'students', 'professionals']);
    
    const jobConfig = {
      persona: 'vocabulary' as const,
      category: 'english',
      question_format: questionFormat,
      difficulty,
      target_audience: targetAudience,
      tags: ['vocabulary', 'english', 'education', category]
    };

    const createdJobs = [];

    // 3. Process Single Vocabulary Job
    try {
      // Generate the vocabulary question using our specialized function
      const questionData = await generateVocabularyQuestion(category, questionFormat, difficulty);
      
      if (questionData) {
        // Store the generated question in the database
        const jobId = await createQuizJob({
          ...jobConfig,
          step: 2,
          status: 'frames_pending',
          data: { question: questionData }
        });
        
        createdJobs.push({ 
          id: jobId, 
          ...jobConfig, 
          category_topic: questionData.category_topic,
          question_type: questionData.question_type 
        });
        console.log(`✅ Created vocabulary quiz job ${jobId} for ${category} (${questionFormat}) - ${questionData.category_topic}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create vocabulary quiz for ${category}:`, error);
    }

    console.log(`Vocabulary job creation completed. Created ${createdJobs.length} job.`);

    return NextResponse.json({ 
      success: true,
      created: createdJobs.length,
      jobs: createdJobs
    });

  } catch (error) {
    console.error('❌ Vocabulary quiz generation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Vocabulary quiz generation failed' },
      { status: 500 }
    );
  }
}

/**
 * Generates a vocabulary improvement question using AI.
 * @param category - The vocabulary category (word_meaning, synonyms_antonyms, etc.)
 * @param questionFormat - The format of the question (multiple_choice, fill_blank, etc.)
 * @param difficulty - The difficulty level (easy, medium, hard)
 * @returns The parsed vocabulary question data or null if generation fails.
 */
async function generateVocabularyQuestion(
  category: string,
  questionFormat: string,
  difficulty: 'easy' | 'medium' | 'hard'
) {
  // 1. Select specific topic and style for this question
  const topicOptions = VOCABULARY_CATEGORIES[category as keyof typeof VOCABULARY_CATEGORIES] || VOCABULARY_CATEGORIES['word_meaning'];
  const selectedTopic = getRandomElement(topicOptions);
  const selectedStyle = getRandomElement(VOCABULARY_STYLES);

  // 2. Define format-specific instructions
  const formatInstructions = {
    'multiple_choice': 'Create a multiple choice question with 4 options (A, B, C, D). Only one correct answer.',
    'fill_blank': 'Create a fill-in-the-blank question with 4 word choices. The sentence should have clear context clues.',
    'match_definition': 'Create a question asking to match a word with its definition. Provide 4 definition choices.',
    'context_clues': 'Create a question where the word meaning must be inferred from context. Provide a sentence and 4 meaning choices.',
    'synonym_selection': 'Create a question asking for the best synonym. Provide 4 synonym choices with subtle differences.',
    'antonym_identification': 'Create a question asking for the antonym. Provide 4 antonym choices.',
    'word_formation': 'Create a question about word formation (prefixes, suffixes, roots). Test understanding of word building.',
    'usage_correction': 'Create a question about correct word usage in context. Show incorrect usage and ask for the correction.'
  };

  // 3. Build the comprehensive prompt
  const fullPrompt = `Generate a ${difficulty} level vocabulary question to help improve English vocabulary skills.

CATEGORY: ${category.replace('_', ' ').toUpperCase()}
TOPIC FOCUS: Your question MUST focus on **${selectedTopic}**.
QUESTION FORMAT: ${formatInstructions[questionFormat as keyof typeof formatInstructions] || formatInstructions['multiple_choice']}
QUESTION STYLE: Frame it as **${selectedStyle}**.

EDUCATIONAL OBJECTIVES:
- Help users learn new vocabulary words
- Improve understanding of word meanings and usage
- Build contextual vocabulary skills
- Make learning engaging and memorable

CRITICAL REQUIREMENTS FOR VIDEO FORMAT:
- Perfect for a 15-20 second educational video
- Clear and concise for quick comprehension
- Question text: 50-300 characters
- Each option: 10-80 characters
- Explanation: 50-400 characters with educational value
- Use words appropriate for ${difficulty} level learners
- Include helpful context or memory aids in explanation

DIFFICULTY GUIDELINES:
- Easy: Common words, basic contexts, obvious clues
- Medium: Intermediate words, moderate complexity, some nuance
- Hard: Advanced words, complex contexts, subtle distinctions

Format your response EXACTLY like this (no extra text, markdown, or commentary):
Question: [Your vocabulary question]
A) [Option A]
B) [Option B]
C) [Option C] 
D) [Option D]
Answer: [Single letter: A, B, C, or D]
Explanation: [Educational explanation with context, etymology, or usage tips]

Generate the vocabulary question now.`;

  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0.9, // Higher temperature for creative vocabulary questions
      max_tokens: 600
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content generated from AI');
    }

    // Parse and return the vocabulary question
    return parseVocabularyResponse(content, selectedTopic, category, questionFormat);
  } catch (error) {
    console.error('Vocabulary generation error:', error);
    return null;
  }
}

/**
 * Parses the vocabulary question response from AI into a structured object.
 * @param content - The raw string response from the OpenAI API.
 * @param categoryTopic - The specific topic that was used to generate the question.
 * @param category - The vocabulary category.
 * @param questionFormat - The format of the question.
 * @returns A structured vocabulary question object or null if parsing fails.
 */
function parseVocabularyResponse(
  content: string, 
  categoryTopic: string, 
  category: string, 
  questionFormat: string
) {
  try {
    const lines = content.trim().split('\n').map(line => line.trim()).filter(line => line);
    
    const question = lines.find(l => l.startsWith('Question:'))?.replace('Question:', '').trim() || '';
    const explanation = lines.find(l => l.startsWith('Explanation:'))?.replace('Explanation:', '').trim() || '';
    const answer = lines.find(l => l.startsWith('Answer:'))?.replace('Answer:', '').trim().charAt(0).toUpperCase() || '';
    
    const options: { [key: string]: string } = {};
    lines.filter(l => l.match(/^[A-D]\)/)).forEach(line => {
      const key = line.charAt(0);
      const text = line.substring(2).trim();
      options[key] = text;
    });

    // Enhanced validation for vocabulary questions
    if (!question || Object.keys(options).length !== 4 || !['A', 'B', 'C', 'D'].includes(answer) || !explanation) {
      throw new Error(`Incomplete or invalid vocabulary response parsed. Content: "${content}"`);
    }
    
    // Validate question length for video format
    if (question.length > 300) {
      console.warn('Question might be too long for video format:', question.length, 'characters');
    }
    
    return {
      question,
      options,
      answer,
      explanation,
      category_topic: categoryTopic,
      category,
      question_type: questionFormat,
      educational_value: explanation // Alias for educational context
    };
  } catch (error) {
    console.error('Failed to parse vocabulary response:', error);
    return null; 
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
