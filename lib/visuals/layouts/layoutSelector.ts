// Simple layout selector based on content structure
// lib/visuals/layouts/layoutSelector.ts
import { Canvas } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
import * as mcqLayout from './mcqLayout';
import * as quickTipLayout from './quickTipLayout';
import * as commonMistakeLayout from './commonMistakeLayout';
import * as quickFixLayout from './quickFixLayout';
import * as usageDemoLayout from './usageDemoLayout';
import * as challengeLayout from './challengeLayout';
import * as simplifiedWordLayout from './simplifiedWordLayout';

export type LayoutType = 'mcq' | 'quick_tip' | 'common_mistake' | 'quick_fix' | 'usage_demo' | 'challenge' | 'simplified_word';

export interface LayoutDefinition {
  type: LayoutType;
  frames: string[];
  renderers: {
    [key: string]: (canvas: Canvas, job: QuizJob, theme: Theme) => void;
  };
}

// Layout definitions for all supported formats (including new simplified format)
export const layouts: Record<LayoutType, LayoutDefinition> = {
  simplified_word: {
    type: 'simplified_word',
    frames: ['word'],
    renderers: {
      word: simplifiedWordLayout.renderWordFrame,
    },
  },
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
    frames: ['hook', 'setup', 'challenge', 'reveal', 'cta'],
    renderers: {
      hook: challengeLayout.renderHookFrame,
      setup: challengeLayout.renderSetupFrame,
      challenge: challengeLayout.renderChallengeFrame,
      reveal: challengeLayout.renderRevealFrame,
      cta: challengeLayout.renderCtaFrame,
    },
  },
};

// ANALYTICS-DRIVEN: Simplified Word format for maximum engagement
// Addressing 73% zero engagement by using ultra-simple single-frame format
export function detectLayoutType(contentData: any): LayoutType {
  if (!contentData) {
    return 'mcq'; // Proven default with 1.26% engagement
  }

  const detectedKeys = Object.keys(contentData);
  console.log(`🔍 Layout detection: content has keys: ${detectedKeys.join(', ')}`);

  // PRIORITY 1: Force MCQ for SSC content (analytics-driven decision)
  const hasSSCStructure = detectedKeys.includes('fact_title') ||
                          detectedKeys.includes('key_info');

  if (hasSSCStructure) {
    console.log(`🔄 Detected SSC content - using MCQ layout (best performing format)`);
    return 'mcq'; // Force MCQ for better engagement
  }

  // PRIORITY 2: Detect simplified word format structure
  const hasSimplifiedWordStructure = detectedKeys.includes('word') &&
                                     detectedKeys.includes('definition') &&
                                     detectedKeys.includes('format_type') &&
                                     contentData.format_type === 'simplified_word';

  if (hasSimplifiedWordStructure) {
    console.log(`✅ Detected simplified_word layout - using ultra-simple single frame format`);
    return 'simplified_word';
  }

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

  // PROVEN FORMAT: MCQ for traditional content (1.26% engagement success)
  const hasMCQStructure = detectedKeys.includes('question') &&
                         detectedKeys.includes('options') ||
                         detectedKeys.includes('hook') &&
                         detectedKeys.includes('explanation');

  if (hasMCQStructure) {
    console.log(`✅ Detected MCQ layout structure - using proven format (1.26% engagement)`);
    return 'mcq';
  }

  // Default to proven MCQ format
  console.log(`🎯 Using MCQ layout (proven default format)`);
  return 'mcq';
}

// Get layout definition
export function getLayout(layoutType: LayoutType): LayoutDefinition {
  return layouts[layoutType];
}

// Create render functions for a layout - ANALYTICS-DRIVEN with Simplified Word priority
export function createRenderFunctions(
  layoutType: LayoutType,
  job: QuizJob,
  theme: Theme
): Array<(canvas: Canvas) => void> {
  // ANALYTICS LOGIC: Prioritize simplified_word for maximum engagement
  let finalLayoutType = layoutType;

  if (layoutType === 'simplified_word') {
    console.log(`✅ Using simplified_word render functions (ultra-simple single frame)`);
    // Keep simplified_word - maximum simplicity for engagement
  } else if (layoutType === 'quick_tip') {
    console.log(`✅ Using quick_tip render functions (1.2K views breakthrough format)`);
    // Keep quick_tip - it works for health content!
  } else {
    console.log(`✅ Using requested layout: ${layoutType}`);
    // Keep all layouts available - no forced overrides
  }

  const layout = getLayout(finalLayoutType);
  if (!layout) {
    // Fallback to proven MCQ if layout not found
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
      console.warn(`No renderer found for frame type: ${frameType}, using word frame`);
      // Fallback to word frame for simplified layout
      return (canvas: Canvas) => finalLayout.renderers.word || finalLayout.renderers.hook(canvas, job, theme);
    }
    return (canvas: Canvas) => renderer(canvas, job, theme);
  });
}