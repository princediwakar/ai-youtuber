/**
 * SSC (Staff Selection Commission) exam preparation prompt templates
 * Government exam focused content for competitive exam aspirants
 */

import { 
  PromptConfig,
  getTopicGuidelines
} from '../shared/promptUtils';

/**
 * Generates main SSC exam preparation prompt for MCQ format
 */
export function generateSSCExamPrompt(config: PromptConfig): string {
  const { topicData, topic, markers } = config;
  const { timeMarker, tokenMarker } = markers;
  const guidelines = getTopicGuidelines(topic);

  if (topicData) {
    return `You are an expert SSC coaching instructor creating viral exam preparation content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - ${guidelines?.focus || 'Essential SSC exam concepts for government job preparation'}

EXAM STRATEGY:
• HOOK: ${guidelines?.hook || 'Present questions that separate successful candidates from others'}
• SCENARIOS: Focus on ${guidelines?.scenarios?.join(', ') || 'real SSC exam patterns and previous year questions'}
• ENGAGEMENT: ${guidelines?.engagement || 'Create immediate exam advantage for serious aspirants'}

Generate a question that targets SSC exam aspirants preparing for government jobs:

CONTENT APPROACH:
• Present concepts that appear frequently in SSC exams
• Include practical application in government job context
• Create "This could be in my exam" moments that boost preparation focus

QUESTION CRAFTING:
• PRECISION: Direct, exam-style questions matching SSC pattern
• RELEVANCE: Focus on topics with high probability in actual exams
• DIFFICULTY: Challenging enough to teach but achievable for motivated aspirants
• DISTRACTORS: Include common exam mistakes, close alternatives, and typical confusions
• IMPACT: Provide knowledge that immediately improves exam performance

MANDATORY OUTPUT:
• "question": Clear, exam-style question that tests real SSC concepts
• "options": Object with "A", "B", "C", "D" - one correct answer, three smart distractors based on common exam errors
• "answer": Single letter "A", "B", "C", or "D"
• "explanation": Why this answer is correct + exam relevance tip (under 120 characters)
• "cta": Motivational CTA (under 40 chars): "Crack SSC!", "Follow for exam tips!", "Like if helpful!"
• "question_type": Will be set automatically

Create exam content that makes aspirants feel more confident and prepared for success. [${timeMarker}-${tokenMarker}]`;
  } else {
    return `You are an expert SSC exam coach creating viral preparation content for YouTube Shorts.

Generate an SSC exam question on "${topic}" that challenges aspirants while building exam confidence.

REQUIREMENTS:
• HOOK: Present concepts that separate successful candidates from average ones
• PRACTICAL: Focus on topics frequently tested in SSC exams
• DISTRACTORS: Include common exam mistakes and plausible alternatives
• ENGAGEMENT: Create immediate "exam preparation upgrade" value
• EXPLANATION: Provide insight that improves exam performance (under 120 characters)

Make aspirants feel accomplished and ready to tackle their government job exam. [${timeMarker}-${tokenMarker}]`;
  }
}


/**
 * Generates Quick Facts format prompt (SSC) - for Challenge layout
 */
export function generateSSCQuickFactsPrompt(config: PromptConfig): string {
  const { topicData, markers } = config;
  const { timeMarker, tokenMarker } = markers;

  return `You are an SSC exam expert creating viral "Quick Facts Challenge" content for YouTube Shorts.

TOPIC: "${topicData.displayName}" - Essential facts for government exam success

FORMAT: Challenge (5 frames)
Frame 1 (Hook): "SSC aspirants must know this fact"
Frame 2 (Setup): "This question appears in 80% of exams"
Frame 3 (Challenge): "Can you answer this in 10 seconds?"
Frame 4 (Reveal): "The answer is: [correct answer + brief explanation]"
Frame 5 (CTA): "Follow for more exam facts!"

CONTENT REQUIREMENTS:
• HOOK: Create urgency about exam-critical information
• SETUP: Establish the importance and frequency of this knowledge
• CHALLENGE: Present as an interactive quiz question
• REVEAL: Provide authoritative answer with exam context
• Focus on factual accuracy and exam relevance

TARGET: Serious SSC aspirants seeking comprehensive preparation

MANDATORY OUTPUT JSON:
• "hook": Exam-focused opener emphasizing importance (under 60 chars)
• "setup": Why this knowledge is crucial for SSC success
• "challenge_type": "fact_recall" or "quick_question"
• "challenge": The actual question/challenge for viewers
• "reveal": The correct answer with brief explanation
• "answer": The specific correct answer
• "cta": "Master SSC facts!" or similar (under 40 chars)
• "format_type": "challenge"

Create authoritative content that directly contributes to exam success. [${timeMarker}-${tokenMarker}]`;
}

