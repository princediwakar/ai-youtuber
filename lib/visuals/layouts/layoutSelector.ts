// Simple layout selector based on content structure
import { Canvas } from 'canvas';
import { QuizJob } from '@/lib/types';
import { Theme } from '@/lib/visuals/themes';
import * as mcqLayout from './mcqLayout';
import * as beforeAfterLayout from './beforeAfterLayout';  
import * as quickTipLayout from './quickTipLayout';

export type LayoutType = 'mcq' | 'before_after' | 'quick_tip';

export interface LayoutDefinition {
  type: LayoutType;
  frames: string[];
  renderers: {
    [key: string]: (canvas: Canvas, job: QuizJob, theme: Theme) => void;
  };
}

// Simple layout definitions based on the working mcqLayout pattern
export const layouts: Record<LayoutType, LayoutDefinition> = {
  mcq: {
    type: 'mcq',
    frames: ['hook', 'question', 'answer', 'explanation'],
    renderers: {
      hook: mcqLayout.renderHookFrame,
      question: mcqLayout.renderQuestionFrame, 
      answer: mcqLayout.renderAnswerFrame,
      explanation: mcqLayout.renderExplanationFrame,
    },
  },
  before_after: {
    type: 'before_after', 
    frames: ['hook', 'before', 'after', 'proof'],
    renderers: {
      hook: beforeAfterLayout.renderHookFrame,
      before: beforeAfterLayout.renderBeforeFrame,
      after: beforeAfterLayout.renderAfterFrame,
      proof: beforeAfterLayout.renderProofFrame,
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
};

// Detect layout type from content structure
export function detectLayoutType(contentData: any): LayoutType {
  if (!contentData) return 'mcq';
  
  // Quick tip format: has hook, action, result
  if (contentData.hook && contentData.action && contentData.result) {
    return 'quick_tip';
  }
  
  // Before/after format: has hook, before, after, result/proof
  if (contentData.hook && contentData.before && contentData.after && 
      (contentData.result || contentData.proof)) {
    return 'before_after';
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