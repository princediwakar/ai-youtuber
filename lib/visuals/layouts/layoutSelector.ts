// lib/visuals/layouts/layoutSelector.ts
import { Canvas } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
import * as mcqLayout from './mcqLayout';
import * as quickTipLayout from './quickTipLayout';
import * as commonMistakeLayout from './commonMistakeLayout';
import * as quickFixLayout from './quickFixLayout';
import * as usageDemoLayout from './usageDemoLayout';
import * as simplifiedWordLayout from './simplifiedWordLayout';

export type LayoutType = 'mcq' | 'quick_tip' | 'common_mistake' | 'quick_fix' | 'usage_demo' | 'simplified_word';

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
    // FIX: Added 'cta' frame for a complete video sequence
    frames: ['hook', 'action', 'result', 'cta'],
    renderers: {
      hook: quickTipLayout.renderHookFrame,
      action: quickTipLayout.renderActionFrame,
      result: quickTipLayout.renderResultFrame,
      // Using generic CTA renderer
      cta: mcqLayout.renderCtaFrame, 
    },
  },
  common_mistake: {
    type: 'common_mistake',
    // FIX: Added 'practice' frame and re-ordered to match common video flow (Hook -> Mistake -> Correct -> Practice -> Explanation -> CTA)
    frames: ['hook', 'mistake', 'correct', 'practice', 'explanation', 'cta'],
    renderers: {
      hook: commonMistakeLayout.renderHookFrame,
      mistake: commonMistakeLayout.renderMistakeFrame,
      correct: commonMistakeLayout.renderCorrectFrame,
      // ASSUMPTION: A renderPracticeFrame exists in commonMistakeLayout, as the content is generated.
      practice: commonMistakeLayout.renderPracticeFrame, 
      // Use MCQ's generic renderers for the Explanation and CTA frames
      explanation: mcqLayout.renderExplanationFrame, 
      cta: mcqLayout.renderCtaFrame,
    },
  },
  quick_fix: {
    type: 'quick_fix',
    // FIX: Added 'cta' frame for a complete video sequence
    frames: ['hook', 'basic_word', 'advanced_word', 'cta'],
    renderers: {
      hook: quickFixLayout.renderHookFrame,
      basic_word: quickFixLayout.renderBasicWordFrame,
      advanced_word: quickFixLayout.renderAdvancedWordFrame,
      // Using generic CTA renderer
      cta: mcqLayout.renderCtaFrame, 
    },
  },
  usage_demo: {
    type: 'usage_demo',
    // FIX: Added 'cta' frame for a complete video sequence
    frames: ['hook', 'wrong_example', 'right_example', 'practice', 'cta'],
    renderers: {
      hook: usageDemoLayout.renderHookFrame,
      wrong_example: usageDemoLayout.renderWrongExampleFrame,
      right_example: usageDemoLayout.renderRightExampleFrame,
      practice: usageDemoLayout.renderPracticeFrame,
      // Using generic CTA renderer
      cta: mcqLayout.renderCtaFrame, 
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

  // PRIORITY 1: Detect Common Mistake structure
  const hasCommonMistakeStructure = detectedKeys.includes('mistake') &&
                                    detectedKeys.includes('correct') &&
                                    detectedKeys.includes('practice') &&
                                    contentData.format_type === 'common_mistake';

  if (hasCommonMistakeStructure) {
    console.log(`✅ Detected common_mistake layout - using 6-frame mistake-fix format`);
    return 'common_mistake'; // Prioritize the generated format
  }


  // PRIORITY 2: Detect Usage Demo structure
  const hasUsageDemoStructure = detectedKeys.includes('wrong_example') &&
                                detectedKeys.includes('right_example') &&
                                detectedKeys.includes('practice') &&
                                contentData.format_type === 'usage_demo';

  if (hasUsageDemoStructure) {
    console.log(`✅ Detected usage_demo layout - using 5-frame demo format`);
    return 'usage_demo'; 
  }


  // PRIORITY 3: Force MCQ for SSC content (analytics-driven decision)
  const hasSSCStructure = detectedKeys.includes('fact_title') ||
                          detectedKeys.includes('key_info');

  if (hasSSCStructure && contentData.content_type === 'multiple_choice') {
    console.log(`🔄 Detected SSC MCQ content - using MCQ layout (best performing format)`);
    return 'mcq'; // Force MCQ for better engagement
  }
  
  // PRIORITY 4: Detect quick_fix structure for word upgrades
  const hasQuickFixStructure = detectedKeys.includes('basic_word') &&
                               detectedKeys.includes('advanced_word');

  if (hasQuickFixStructure) {
    console.log(`✅ Detected quick_fix layout - using 4-frame upgrade format`);
    return 'quick_fix';
  }


  // PRIORITY 5: Detect simplified word format structure
  const hasSimplifiedWordStructure = detectedKeys.includes('word') &&
                                     detectedKeys.includes('definition') &&
                                     detectedKeys.includes('format_type') &&
                                     contentData.format_type === 'simplified_word';

  if (hasSimplifiedWordStructure) {
    console.log(`✅ Detected simplified_word layout - using ultra-simple single frame format`);
    return 'simplified_word';
  }

  // PRIORITY 6: Detect quick_tip structure for health content
  const hasQuickTipStructure = detectedKeys.includes('hook') &&
                              detectedKeys.includes('action') &&
                              detectedKeys.includes('result') &&
                              !detectedKeys.includes('question') &&
                              !detectedKeys.includes('options');

  if (hasQuickTipStructure) {
    console.log(`✅ Detected quick_tip layout structure - allowing for health breakthrough format`);
    return 'quick_tip';
  }

  // FALLBACK 1: PROVEN FORMAT: MCQ for traditional content
  const hasMCQStructure = detectedKeys.includes('question') &&
                         detectedKeys.includes('options') ||
                         detectedKeys.includes('hook') &&
                         detectedKeys.includes('explanation');

  if (hasMCQStructure) {
    console.log(`✅ Detected MCQ layout structure - using proven format (1.26% engagement)`);
    return 'mcq';
  }

  // FINAL DEFAULT
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
      // Fallback is generally safe here as long as the content has a hook
      console.warn(`No renderer found for frame type: ${frameType} in ${finalLayoutType} layout. Falling back to Hook.`);
      return (canvas: Canvas) => finalLayout.renderers.hook(canvas, job, theme);
    }
    return (canvas: Canvas) => renderer(canvas, job, theme);
  });
}