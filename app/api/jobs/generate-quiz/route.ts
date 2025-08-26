// app/api/jobs/generate-quiz/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
// Assuming your database helper functions are in this path
// You will need to implement `createQuizJob` and `getRecentQuizTopics`
import { createQuizJob } from '@/lib/database';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

// --- DYNAMIC CONTENT LIBRARIES ---
// These libraries are the core of generating unique and varied questions.
// You can easily add more topics and styles here to expand the variety.

/**
 * A library of specific sub-topics for each test and subject.
 * This ensures the AI doesn't repeatedly generate questions about the same general area.
 */
const SUB_TOPICS = {
  'SAT-Math': ['Linear Equations', 'Quadratic Functions', 'Systems of Equations', 'Circle Geometry', 'Triangle Properties', 'Data Interpretation', 'Probability', 'Ratios & Proportions', 'Exponents and Radicals'],
  'SAT-Reading': ['Vocabulary-in-Context', 'Main Idea of a Paragraph', 'Author\'s Tone or Purpose', 'Logical Inference'],
  'SAT-Writing': ['Subject-Verb Agreement', 'Pronoun-Antecedent Agreement', 'Punctuation (Commas, Semicolons)', 'Sentence Fragments', 'Parallel Structure', 'Modifier Placement', 'Idiomatic Expressions'],
  'GMAT-Quantitative': ['Data Sufficiency (Number Properties)', 'Problem Solving (Rates & Work)', 'Integer Properties', 'Percents & Ratios', 'Combinatorics', 'Geometry (Area & Volume)'],
  'GMAT-Verbal': ['Sentence Correction (Idioms)', 'Sentence Correction (Comparisons)', 'Critical Reasoning (Strengthen/Weaken)', 'Critical Reasoning (Find the Assumption)'],
  'GRE-Quantitative': ['Quantitative Comparison (Algebra)', 'Quantitative Comparison (Geometry)', 'Data Interpretation (Charts)', 'Number Properties', 'Exponents & Roots', 'Probability'],
  'GRE-Verbal': ['Text Completion (Vocabulary)', 'Sentence Equivalence (Synonyms)', 'Short-form Logical Puzzles']
};

/**
 * A library of different "angles" or styles to frame the question.
 * This changes *how* the question is asked, making the content feel more dynamic.
 */
const QUESTION_STYLES = [
  "a straightforward problem-solving question",
  "a 'common mistake' trap question that tricks most students",
  "a question that requires thinking backward from the options",
  "a 'spot the error' type question for a grammar rule",
  "a question based on a simple, easily described scenario (e.g., a simple chart or geometric shape)",
  "a question testing a core concept in a creative way",
  "a 'word in context' question, providing one clear sentence for context"
];

// Helper function to get a random element from an array
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * API endpoint to generate a batch of quiz questions.
 * This function is designed to be triggered by a cron job.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authorization Check
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting single quiz generation...');

    // 2. Dynamic Job Pool
    // This pool defines the types of questions we can generate.
    const jobPool = [
      { test_type: 'SAT' as const, subject: 'Math', difficulty: 'medium' as const },
      { test_type: 'SAT' as const, subject: 'Reading', difficulty: 'hard' as const },
      { test_type: 'SAT' as const, subject: 'Writing', difficulty: 'easy' as const },
      { test_type: 'GMAT' as const, subject: 'Verbal', difficulty: 'medium' as const },
      { test_type: 'GMAT' as const, subject: 'Quantitative', difficulty: 'hard' as const },
      { test_type: 'GRE' as const, subject: 'Verbal', difficulty: 'easy' as const },
      { test_type: 'GRE' as const, subject: 'Quantitative', difficulty: 'medium' as const },
      { test_type: 'SAT' as const, subject: 'Math', difficulty: 'easy' as const },
    ];

    // Create only one job per request
    const jobConfig = getRandomElement(jobPool);
    
    const createdJobs = [];

    // 3. Process Single Job
    try {
      // To prevent immediate repetition, you can fetch the last few topics generated.
      // This requires a database function `getRecentQuizTopics`.
      // const recentTopics = await getRecentQuizTopics(jobConfig.test_type, jobConfig.subject, 5);
      const recentTopics: string[] = []; // Using an empty array as a placeholder

      // Generate the actual question using our dynamic prompt function
      const questionData = await generateDynamicQuizQuestion(jobConfig, recentTopics);
      
      if (questionData) {
        // Store the generated question in the database
        const jobId = await createQuizJob({
          ...jobConfig,
          step: 2,
          status: 'frames_pending',
          data: { question: questionData }
        });
        
        createdJobs.push({ id: jobId, ...jobConfig, topic: questionData.topic });
        console.log(`✅ Created quiz job ${jobId} for ${jobConfig.test_type} ${jobConfig.subject} on topic: ${questionData.topic}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create quiz for ${jobConfig.test_type} ${jobConfig.subject}:`, error);
    }

    console.log(`Job creation completed. Created ${createdJobs.length} job.`);

    return NextResponse.json({ 
      success: true,
      created: createdJobs.length,
      jobs: createdJobs
    });

  } catch (error) {
    console.error('❌ Quiz generation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Quiz generation failed' },
      { status: 500 }
    );
  }
}

/**
 * Generates a single, unique quiz question by dynamically building a prompt.
 * @param config - The configuration for the quiz question (test, subject, difficulty).
 * @param recentTopics - An array of recent topics to avoid generating duplicates.
 * @returns The parsed quiz question data or null if generation fails.
 */
async function generateDynamicQuizQuestion(
  config: {
    test_type: 'SAT' | 'GMAT' | 'GRE';
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
  },
  recentTopics: string[] = []
) {
  const promptKey = `${config.test_type}-${config.subject}` as keyof typeof SUB_TOPICS;

  // 1. Dynamically select content for the prompt
  const availableTopics = SUB_TOPICS[promptKey] || SUB_TOPICS['SAT-Math'];
  const selectedTopic = getRandomElement(availableTopics.filter(t => !recentTopics.includes(t)));
  const selectedStyle = getRandomElement(QUESTION_STYLES);

  // 2. Define refined, video-first base prompts
  const basePrompts = {
    'SAT-Math': `Generate a ${config.difficulty} SAT Math question.`,
    'SAT-Reading': `Generate a ${config.difficulty} SAT Reading question. Focus on Vocabulary-in-Context. If you test a word's meaning, you MUST provide a single, concise sentence for context. ABSOLUTELY NO long passages.`,
    'SAT-Writing': `Generate a ${config.difficulty} SAT Writing question testing a specific grammar or style rule.`,
    'GMAT-Verbal': `Generate a ${config.difficulty} GMAT Verbal question. Focus on Sentence Correction or a very short Critical Reasoning puzzle. NO long reading passages.`,
    'GMAT-Quantitative': `Generate a ${config.difficulty} GMAT Quantitative question.`,
    'GRE-Verbal': `Generate a ${config.difficulty} GRE Verbal question. Focus on vocabulary, sentence equivalence, or a quick logic puzzle. ABSOLUTELY NO reading comprehension passages.`,
    'GRE-Quantitative': `Generate a ${config.difficulty} GRE Quantitative question.`
  };
  
  const basePrompt = basePrompts[promptKey];
  
  // 3. Assemble the final, unique prompt
  const fullPrompt = `${basePrompt}

TOPIC FOCUS: Your question MUST be about **${selectedTopic}**.
QUESTION STYLE: Frame it as **${selectedStyle}**.

CRITICAL REQUIREMENTS FOR VIDEO FORMAT:
- The question must be self-contained and perfect for a 15-20 second video.
- It must be easily understandable within 5-7 seconds of reading.
- Question length: 50-250 characters.
- Options length: 10-75 characters each.
- Explanation length: 50-350 characters. It must be clear, step-by-step, and educational.
- Only ONE correct answer. Options must be distinct and plausible.
${recentTopics.length > 0 ? `- ORIGINALITY: Do NOT create a question about these recent topics: ${recentTopics.join(', ')}.` : ''}

Format your response EXACTLY like this (no extra text, markdown, or commentary):
Question: [Your unique question text]
A) [Option A]
B) [Option B]
C) [Option C] 
D) [Option D]
Answer: [Single letter: A, B, C, or D]
Explanation: [Clear, step-by-step reasoning and solution]

Generate the question now.`;

  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0.8, // Increased for more creative and varied outputs
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content generated from AI');
    }

    // Pass the selected topic to the parser so it can be stored with the question
    return parseQuizResponse(content, selectedTopic);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
}

/**
 * Parses the raw text response from the AI into a structured object.
 * @param content - The raw string response from the OpenAI API.
 * @param topic - The topic that was used to generate the question.
 * @returns A structured quiz object or null if parsing fails.
 */
function parseQuizResponse(content: string, topic: string = 'general') {
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

    // Enhanced validation to ensure a complete and valid question was generated
    if (!question || Object.keys(options).length !== 4 || !['A', 'B', 'C', 'D'].includes(answer) || !explanation) {
      throw new Error(`Incomplete or invalid response parsed. Content: "${content}"`);
    }
    
    return {
      question,
      options,
      answer,
      explanation,
      topic // Return the dynamically selected topic for storage
    };
  } catch (error) {
    console.error('Failed to parse quiz response:', error);
    // Return null to indicate failure, allowing the main loop to continue
    return null; 
  }
}
