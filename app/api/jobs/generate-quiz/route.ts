import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createQuizJob } from '@/lib/database';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

export async function POST(request: NextRequest) {
  try {
    // Auth check using CRON_SECRET
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
    'SAT-Math': `Generate a ${config.difficulty}-difficulty SAT Math question covering algebra, geometry, or data analysis. Focus on practical problem-solving with clear numerical calculations. Make the question engaging and test conceptual understanding, not just memorization.`,
    'SAT-Reading': `Create a ${config.difficulty}-difficulty SAT Reading question with a concise passage (2-3 sentences max) testing reading comprehension, vocabulary in context, or logical inference. Focus on skills like main idea, author's tone, or word meaning.`,
    'SAT-Writing': `Generate a ${config.difficulty}-difficulty SAT Writing question testing grammar, sentence structure, punctuation, or rhetorical effectiveness. Present a sentence with an underlined portion and test knowledge of standard written English conventions.`,
    'GMAT-Verbal': `Create a ${config.difficulty}-difficulty GMAT Verbal question - either Critical Reasoning (analyzing arguments, assumptions, conclusions) or Sentence Correction (identifying and fixing grammar/style issues). Focus on business-relevant scenarios.`,
    'GMAT-Quantitative': `Generate a ${config.difficulty}-difficulty GMAT Quantitative question - either Problem Solving (multi-step word problem) or Data Sufficiency (determine if given information is sufficient to answer). Use business contexts when possible.`,
    'GRE-Verbal': `Create a ${config.difficulty}-difficulty GRE Verbal question - Text Completion (fill in missing words), Sentence Equivalence (choose equivalent words), or Reading Comprehension. Emphasize vocabulary and analytical reading skills.`,
    'GRE-Quantitative': `Generate a ${config.difficulty}-difficulty GRE Quantitative question covering arithmetic, algebra, geometry, or data interpretation. Focus on quantitative reasoning and problem-solving rather than complex calculations.`
  };

  const promptKey = `${config.test_type}-${config.subject}`;
  const basePrompt = prompts[promptKey] || prompts['SAT-Math'];
  
  const fullPrompt = `${basePrompt}

CRITICAL REQUIREMENTS:
- Question must be clear and specific (50-300 characters)
- Each option must be distinct and plausible (15-100 characters each)
- Only ONE correct answer
- Explanation must be step-by-step and educational (50-400 characters)
- Content appropriate for 15-20 second video format
- Test genuine understanding, not memorization

Format your response EXACTLY like this (no extra text):
Question: [Clear, specific question text that can be read in 5-10 seconds]
A) [First plausible option]
B) [Second plausible option]
C) [Third plausible option] 
D) [Fourth plausible option]
Answer: [Single letter: A, B, C, or D]
Explanation: [Step-by-step reasoning why the answer is correct, include the solution process]

EXAMPLE FOR SAT MATH:
Question: If 3x + 7 = 22, what is the value of x?
A) 3
B) 5
C) 7
D) 9
Answer: B
Explanation: Subtract 7 from both sides: 3x = 15. Divide by 3: x = 5.

Generate a complete, well-structured question now:`;

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
        answer = line.replace('Answer:', '').trim().charAt(0).toUpperCase();
      } else if (line.startsWith('Explanation:')) {
        explanation = line.replace('Explanation:', '').trim();
      }
    }
    
    // Enhanced validation with helpful error messages
    if (!question || question.length < 10) {
      throw new Error(`Invalid or too short question: "${question}"`);
    }
    
    if (Object.keys(options).length !== 4) {
      console.warn(`Only found ${Object.keys(options).length} options:`, options);
      // Try to create missing options
      const optionLabels = ['A', 'B', 'C', 'D'];
      optionLabels.forEach(label => {
        if (!options[label]) {
          options[label] = `Option ${label}`;
        }
      });
    }
    
    if (!answer || !['A', 'B', 'C', 'D'].includes(answer)) {
      console.warn(`Invalid answer format: "${answer}", defaulting to A`);
      answer = 'A'; // Default fallback
    }
    
    if (!explanation || explanation.length < 10) {
      console.warn(`Invalid or too short explanation: "${explanation}"`);
      explanation = `The correct answer is ${answer}. This tests your understanding of the concept.`;
    }
    
    // Length validation with truncation
    if (question.length > 300) {
      question = question.substring(0, 297) + '...';
    }
    
    Object.keys(options).forEach(key => {
      if (options[key].length > 100) {
        options[key] = options[key].substring(0, 97) + '...';
      }
    });
    
    if (explanation.length > 400) {
      explanation = explanation.substring(0, 397) + '...';
    }
    
    return {
      question,
      options,
      answer,
      explanation,
      topic: extractTopic(question)
    };
  } catch (error) {
    console.error('Failed to parse quiz response:', error, 'Content:', content);
    
    // Return a fallback question if parsing completely fails
    return {
      question: 'Sample quiz question will be provided here.',
      options: {
        A: 'Option A',
        B: 'Option B', 
        C: 'Option C',
        D: 'Option D'
      },
      answer: 'A',
      explanation: 'This is a sample explanation for the quiz question.',
      topic: 'general'
    };
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