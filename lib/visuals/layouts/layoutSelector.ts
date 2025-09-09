// Simple layout selector based on content structure
import { Canvas } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
import * as mcqLayout from './mcqLayout';
import * as quickTipLayout from './quickTipLayout';
import * as commonMistakeLayout from './commonMistakeLayout';
import * as quickFixLayout from './quickFixLayout';
import * as usageDemoLayout from './usageDemoLayout';
import * as challengeLayout from './challengeLayout';

export type LayoutType = 'mcq' | 'quick_tip' | 'common_mistake' | 'quick_fix' | 'usage_demo' | 'challenge';

export interface LayoutDefinition {
  type: LayoutType;
  frames: string[];
  renderers: {
    [key: string]: (canvas: Canvas, job: QuizJob, theme: Theme) => void;
  };
}

// Layout definitions for all 6 supported formats (hookframes disabled)
export const layouts: Record<LayoutType, LayoutDefinition> = {
  mcq: {
    type: 'mcq',
    frames: ['question', 'answer', 'explanation'],
    renderers: {
      hook: mcqLayout.renderHookFrame,
      question: mcqLayout.renderQuestionFrame, 
      answer: mcqLayout.renderAnswerFrame,
      explanation: mcqLayout.renderExplanationFrame,
    },
  },
  quick_tip: {
    type: 'quick_tip',
    frames: ['action', 'result'], 
    renderers: {
      hook: quickTipLayout.renderHookFrame,
      action: quickTipLayout.renderActionFrame,
      result: quickTipLayout.renderResultFrame,
    },
  },
  common_mistake: {
    type: 'common_mistake',
    frames: ['mistake', 'correct', 'practice'],
    renderers: {
      hook: commonMistakeLayout.renderHookFrame,
      mistake: commonMistakeLayout.renderMistakeFrame,
      correct: commonMistakeLayout.renderCorrectFrame,
      practice: commonMistakeLayout.renderPracticeFrame,
    },
  },
  quick_fix: {
    type: 'quick_fix',
    frames: ['basic_word', 'advanced_word'],
    renderers: {
      hook: quickFixLayout.renderHookFrame,
      basic_word: quickFixLayout.renderBasicWordFrame,
      advanced_word: quickFixLayout.renderAdvancedWordFrame,
    },
  },
  usage_demo: {
    type: 'usage_demo',
    frames: ['wrong_example', 'right_example', 'practice'],
    renderers: {
      hook: usageDemoLayout.renderHookFrame,
      wrong_example: usageDemoLayout.renderWrongExampleFrame,
      right_example: usageDemoLayout.renderRightExampleFrame,
      practice: usageDemoLayout.renderPracticeFrame,
    },
  },
  challenge: {
    type: 'challenge',
    frames: ['setup', 'challenge', 'reveal', 'cta'],
    renderers: {
      hook: challengeLayout.renderHookFrame,
      setup: challengeLayout.renderSetupFrame,
      challenge: challengeLayout.renderChallengeFrame,
      reveal: challengeLayout.renderRevealFrame,
      cta: challengeLayout.renderCtaFrame,
    },
  },
};

// Detect layout type from content structure
export function detectLayoutType(contentData: any): LayoutType {
  if (!contentData) return 'mcq';
  
  // Common mistake format: has hook, mistake, correct, practice
  if (contentData.hook && contentData.mistake && contentData.correct && contentData.practice) {
    return 'common_mistake';
  }
  
  // Quick fix format: has hook, basic_word, advanced_word
  if (contentData.hook && contentData.basic_word && contentData.advanced_word) {
    return 'quick_fix';
  }
  
  // Usage demo format: has hook, target_word, wrong_example, right_example, practice
  if (contentData.hook && contentData.target_word && contentData.wrong_example && 
      contentData.right_example && contentData.practice) {
    return 'usage_demo';
  }
  
  // Challenge format: has hook, setup, challenge_type, reveal, answer
  if (contentData.hook && contentData.setup && contentData.challenge_type && 
      contentData.reveal && contentData.answer) {
    return 'challenge';
  }
  
  // Quick tip format: has hook, action, result
  if (contentData.hook && contentData.action && contentData.result) {
    return 'quick_tip';
  }
  
  
  // MCQ format: has question/content, options, answer, explanation
  if ((contentData.question || contentData.content) && 
      contentData.options && contentData.answer && contentData.explanation) {
    return 'mcq';
  }
  
  // Default to MCQ
  console.warn('Could not detect layout type, using MCQ. Content keys:', Object.keys(contentData));
  return 'mcq';
}

// Get layout definition
export function getLayout(layoutType: LayoutType): LayoutDefinition {
  return layouts[layoutType];
}

// Create render functions for a layout
export function createRenderFunctions(
  layoutType: LayoutType, 
  job: QuizJob, 
  theme: Theme
): Array<(canvas: Canvas) => void> {
  const layout = getLayout(layoutType);
  if (!layout) {
    console.warn(`Unknown layout type: ${layoutType}, falling back to MCQ`);
    return createRenderFunctions('mcq', job, theme);
  }
  
  return layout.frames.map(frameType => {
    const renderer = layout.renderers[frameType];
    if (!renderer) {
      console.warn(`No renderer found for frame type: ${frameType}`);
      // Fallback to hook frame
      return (canvas: Canvas) => layout.renderers.hook(canvas, job, theme);
    }
    return (canvas: Canvas) => renderer(canvas, job, theme);
  });
}