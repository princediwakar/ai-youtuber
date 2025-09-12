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

// ANALYTICS-DRIVEN: MCQ primary + Health Quick Tips breakthrough format
// MCQ shows 1.26% engagement, Health Quick Tips show 1.2K views breakthrough
export function detectLayoutType(contentData: any): LayoutType {
  if (!contentData) {
    return 'mcq'; // Default fallback
  }
  
  const detectedKeys = Object.keys(contentData);
  console.log(`🔍 Layout detection: content has keys: ${detectedKeys.join(', ')}`);
  
  // ANALYTICS BREAKTHROUGH: Detect quick_tip structure for health content
  const hasQuickTipStructure = detectedKeys.includes('hook') && 
                              detectedKeys.includes('action') && 
                              detectedKeys.includes('result') &&
                              !detectedKeys.includes('question') &&
                              !detectedKeys.includes('options');
  
  if (hasQuickTipStructure) {
    console.log(`✅ Detected quick_tip layout structure - allowing for health breakthrough format`);
    return 'quick_tip';
  }
  
  // Default to MCQ for standard question/answer content
  console.log(`🎯 Using MCQ layout (proven 1.26% engagement format)`);
  return 'mcq';
}

// Get layout definition
export function getLayout(layoutType: LayoutType): LayoutDefinition {
  return layouts[layoutType];
}

// Create render functions for a layout - ANALYTICS-DRIVEN MCQ + Health Quick Tips
export function createRenderFunctions(
  layoutType: LayoutType, 
  job: QuizJob, 
  theme: Theme
): Array<(canvas: Canvas) => void> {
  // ANALYTICS LOGIC: Allow quick_tip for proven health breakthrough, force MCQ for others
  let finalLayoutType = layoutType;
  
  if (layoutType === 'quick_tip') {
    console.log(`✅ Using quick_tip render functions (1.2K views breakthrough format)`);
    // Keep quick_tip - it works for health content!
  } else if (layoutType !== 'mcq') {
    console.log(`🎯 Analytics override: forcing MCQ render functions (requested: ${layoutType})`);
    finalLayoutType = 'mcq'; // Force MCQ for non-working formats
  }
  
  const layout = getLayout(finalLayoutType);
  if (!layout) {
    // Fallback to MCQ if layout not found
    const mcqLayout = getLayout('mcq');
    if (!mcqLayout) {
      throw new Error('MCQ layout must be available as fallback');
    }
    console.warn(`Layout ${finalLayoutType} not found, falling back to MCQ`);
    finalLayoutType = 'mcq';
  }
  
  const finalLayout = getLayout(finalLayoutType);
  
  return finalLayout.frames.map(frameType => {
    const renderer = finalLayout.renderers[frameType];
    if (!renderer) {
      console.warn(`No renderer found for frame type: ${frameType}, using hook frame`);
      // Fallback to hook frame
      return (canvas: Canvas) => finalLayout.renderers.hook(canvas, job, theme);
    }
    return (canvas: Canvas) => renderer(canvas, job, theme);
  });
}