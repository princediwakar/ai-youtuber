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

// Layout definitions for all 6 supported formats (hook frames now enabled)
export const layouts: Record<LayoutType, LayoutDefinition> = {
  mcq: {
    type: 'mcq',
    frames: ['hook', 'question', 'answer', 'explanation', 'cta'],
    renderers: {
      hook: mcqLayout.renderHookFrame,
      question: mcqLayout.renderQuestionFrame, 
      answer: mcqLayout.renderAnswerFrame,
      explanation: mcqLayout.renderExplanationFrame,
      cta: mcqLayout.renderCtaFrame,
    },
  },
  quick_tip: {
    type: 'quick_tip',
    frames: ['hook', 'action', 'result'], 
    renderers: {
      hook: quickTipLayout.renderHookFrame,
      action: quickTipLayout.renderActionFrame,
      result: quickTipLayout.renderResultFrame,
    },
  },
  common_mistake: {
    type: 'common_mistake',
    frames: ['hook', 'mistake', 'correct', 'practice'],
    renderers: {
      hook: commonMistakeLayout.renderHookFrame,
      mistake: commonMistakeLayout.renderMistakeFrame,
      correct: commonMistakeLayout.renderCorrectFrame,
      practice: commonMistakeLayout.renderPracticeFrame,
    },
  },
  quick_fix: {
    type: 'quick_fix',
    frames: ['hook', 'basic_word', 'advanced_word'],
    renderers: {
      hook: quickFixLayout.renderHookFrame,
      basic_word: quickFixLayout.renderBasicWordFrame,
      advanced_word: quickFixLayout.renderAdvancedWordFrame,
    },
  },
  usage_demo: {
    type: 'usage_demo',
    frames: ['hook', 'wrong_example', 'right_example', 'practice'],
    renderers: {
      hook: usageDemoLayout.renderHookFrame,
      wrong_example: usageDemoLayout.renderWrongExampleFrame,
      right_example: usageDemoLayout.renderRightExampleFrame,
      practice: usageDemoLayout.renderPracticeFrame,
    },
  },
  challenge: {
    type: 'challenge',
    frames: ['hook', 'challenge', 'reveal', 'cta'],
    renderers: {
      hook: challengeLayout.renderHookFrame,
      setup: challengeLayout.renderSetupFrame,
      challenge: challengeLayout.renderChallengeFrame,
      reveal: challengeLayout.renderRevealFrame,
      cta: challengeLayout.renderCtaFrame,
    },
  },
};

// ANALYTICS-DRIVEN: Force MCQ layout only
// Complex layouts showed 0% engagement, MCQ shows 1.26% engagement
export function detectLayoutType(contentData: any): LayoutType {
  // ALWAYS return MCQ - analytics prove it's the only working format
  if (contentData) {
    const detectedKeys = Object.keys(contentData);
    console.log(`🎯 Analytics override: forcing MCQ layout (content has keys: ${detectedKeys.join(', ')})`);
  }
  
  return 'mcq'; // HARD-CODED: Only format that drives engagement
}

// Get layout definition
export function getLayout(layoutType: LayoutType): LayoutDefinition {
  return layouts[layoutType];
}

// Create render functions for a layout - ANALYTICS-DRIVEN MCQ ONLY
export function createRenderFunctions(
  layoutType: LayoutType, 
  job: QuizJob, 
  theme: Theme
): Array<(canvas: Canvas) => void> {
  // FORCE MCQ - analytics show it's the only engaging format
  const forcedLayoutType = 'mcq';
  
  if (layoutType !== 'mcq') {
    console.log(`🎯 Analytics override: forcing MCQ render functions (requested: ${layoutType})`);
  }
  
  const layout = getLayout(forcedLayoutType);
  if (!layout) {
    throw new Error('MCQ layout must be available - this is our only working format');
  }
  
  return layout.frames.map(frameType => {
    const renderer = layout.renderers[frameType];
    if (!renderer) {
      console.warn(`No renderer found for frame type: ${frameType}, using hook frame`);
      // Fallback to hook frame
      return (canvas: Canvas) => layout.renderers.hook(canvas, job, theme);
    }
    return (canvas: Canvas) => renderer(canvas, job, theme);
  });
}