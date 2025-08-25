import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createQuizJob } from '@/lib/database';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

export async function POST(request: NextRequest) {
  try {
    // Auth check using CRON_SECRET (following Gibbi-Tweeter pattern)
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting quiz generation batch...');

    // Create 8 different quiz jobs with varied combinations
    const jobsToCreate = [
      { test_type: 'SAT' as const, subject: 'Math', difficulty: 'medium' as const },
      { test_type: 'SAT' as const, subject: 'Reading', difficulty: 'hard' as const },
      { test_type: 'SAT' as const, subject: 'Writing', difficulty: 'easy' as const },
      { test_type: 'GMAT' as const, subject: 'Verbal', difficulty: 'medium' as const },
      { test_type: 'GMAT' as const, subject: 'Quantitative', difficulty: 'hard' as const },
      { test_type: 'GRE' as const, subject: 'Verbal', difficulty: 'easy' as const },
      { test_type: 'GRE' as const, subject: 'Quantitative', difficulty: 'medium' as const },
      { test_type: 'SAT' as const, subject: 'Math', difficulty: 'easy' as const },
    ];

    const createdJobs = [];

    for (const jobConfig of jobsToCreate) {
      try {
        // Generate quiz question using OpenAI
        const question = await generateQuizQuestion(jobConfig);
        
        if (question) {
          // Store in database with next step ready
          const jobId = await createQuizJob({
            ...jobConfig,
            step: 2,
            status: 'frames_pending',
            data: { question }
          });
          
          createdJobs.push({ id: jobId, ...jobConfig });
          console.log(`Created quiz job ${jobId} for ${jobConfig.test_type} ${jobConfig.subject}`);
        }
      } catch (error) {
        console.error(`Failed to create quiz for ${jobConfig.test_type} ${jobConfig.subject}:`, error);
      }
    }

    console.log(`Quiz generation batch completed. Created ${createdJobs.length} jobs.`);

    return NextResponse.json({ 
      success: true,
      created: createdJobs.length,
      jobs: createdJobs
    });

  } catch (error) {
    console.error('Quiz generation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Quiz generation failed' },
      { status: 500 }
    );
  }
}

async function generateQuizQuestion(config: {
  test_type: 'SAT' | 'GMAT' | 'GRE';
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
}) {
  const prompts = {
    'SAT-Math': `Generate a ${config.difficulty}-difficulty SAT Math question covering algebra, geometry, or data analysis. Include clear calculations and logical reasoning.`,
    'SAT-Reading': `Create a ${config.difficulty}-difficulty SAT Reading question with a short passage (2-3 sentences) testing comprehension, vocabulary, or inference.`,
    'SAT-Writing': `Generate a ${config.difficulty}-difficulty SAT Writing question testing grammar, sentence structure, or rhetorical skills.`,
    'GMAT-Verbal': `Create a ${config.difficulty}-difficulty GMAT Verbal question - either Critical Reasoning (argument analysis) or Sentence Correction (grammar/style).`,
    'GMAT-Quantitative': `Generate a ${config.difficulty}-difficulty GMAT Quantitative question - either Problem Solving (word problem with calculations) or Data Sufficiency (determine if given info is sufficient).`,
    'GRE-Verbal': `Create a ${config.difficulty}-difficulty GRE Verbal question - Text Completion, Sentence Equivalence, or Reading Comprehension with vocabulary focus.`,
    'GRE-Quantitative': `Generate a ${config.difficulty}-difficulty GRE Quantitative question covering arithmetic, algebra, geometry, or data analysis.`
  };

  const promptKey = `${config.test_type}-${config.subject}`;
  const basePrompt = prompts[promptKey] || prompts['SAT-Math'];
  
  const fullPrompt = `${basePrompt}

Format your response EXACTLY like this:
Question: [Clear, specific question text]
A) [First option]
B) [Second option] 
C) [Third option]
D) [Fourth option]
Answer: [Single letter: A, B, C, or D]
Explanation: [Brief 1-2 sentence explanation of why the answer is correct]

Make sure the question is appropriate for a 15-20 second video format and tests genuine understanding.`;

  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content generated');
    }

    return parseQuizResponse(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
}

function parseQuizResponse(content: string) {
  try {
    const lines = content.trim().split('\n').map(line => line.trim()).filter(line => line);
    
    let question = '';
    const options: { [key: string]: string } = {};
    let answer = '';
    let explanation = '';
    
    for (const line of lines) {
      if (line.startsWith('Question:')) {
        question = line.replace('Question:', '').trim();
      } else if (line.match(/^[A-D]\)/)) {
        const option = line.charAt(0);
        const text = line.substring(2).trim();
        options[option] = text;
      } else if (line.startsWith('Answer:')) {
        answer = line.replace('Answer:', '').trim().charAt(0);
      } else if (line.startsWith('Explanation:')) {
        explanation = line.replace('Explanation:', '').trim();
      }
    }
    
    // Validate that we have all required parts
    if (!question || Object.keys(options).length !== 4 || !answer || !explanation) {
      throw new Error('Incomplete quiz data parsed');
    }
    
    // Validate answer is one of the options
    if (!['A', 'B', 'C', 'D'].includes(answer)) {
      throw new Error('Invalid answer format');
    }
    
    return {
      question,
      options,
      answer,
      explanation,
      topic: extractTopic(question)
    };
  } catch (error) {
    console.error('Failed to parse quiz response:', error);
    return null;
  }
}

function extractTopic(question: string): string {
  // Simple topic extraction based on keywords
  const topicKeywords = {
    'algebra': ['equation', 'solve', 'variable', 'expression'],
    'geometry': ['triangle', 'circle', 'area', 'perimeter', 'angle'],
    'statistics': ['average', 'mean', 'median', 'data', 'probability'],
    'reading': ['passage', 'author', 'main idea', 'inference'],
    'grammar': ['sentence', 'punctuation', 'verb', 'subject'],
    'critical_thinking': ['argument', 'assumption', 'conclusion', 'evidence']
  };
  
  const lowerQuestion = question.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      return topic;
    }
  }
  
  return 'general';
}