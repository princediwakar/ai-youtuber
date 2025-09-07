/**
 * Format Definition Types for Multi-Format Video Generation System
 * Defines the structure and interfaces for different content formats
 */

export type FormatType = 
  | 'mcq' 
  | 'common_mistake' 
  | 'quick_fix' 
  | 'usage_demo' 
  | 'quick_tip' 
  | 'before_after' 
  | 'challenge';

export type FrameType = 
  | 'hook' 
  | 'question' 
  | 'options' 
  | 'answer' 
  | 'explanation' 
  | 'cta'
  | 'mistake' 
  | 'correct' 
  | 'action' 
  | 'result' 
  | 'challenge' 
  | 'reveal' 
  | 'practice'
  | 'before'
  | 'after'
  | 'setup';

export interface FrameVisualElements {
  textSize: 'small' | 'medium' | 'large';
  textWeight: 'normal' | 'bold' | 'extra-bold';
  textColor: string;
  backgroundColor: string;
  accentColor?: string;
  layout: 'centered' | 'top-bottom' | 'left-right' | 'stacked';
  icons?: string[];
  animations?: string[];
}

export interface FormatFrame {
  type: FrameType;
  title: string;
  description: string;
  visualElements: FrameVisualElements;
  duration: number; // in seconds
  transitions?: {
    in: string;
    out: string;
  };
}

export interface FormatVisualConfig {
  theme: string;
  colorScheme: 'bright' | 'dark' | 'neutral' | 'gradient';
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundStyle: 'solid' | 'gradient' | 'pattern';
}

export interface FrameTimingConfig {
  totalDuration: number;
  frameTransitions: number;
  pauseBeforeCTA: number;
}

export interface ContentFormat {
  type: FormatType;
  name: string;
  description: string;
  accountId: string;
  persona: string | string[];
  frameCount: number;
  frames: FormatFrame[];
  visualStyle: FormatVisualConfig;
  timing: FrameTimingConfig;
  suitableTopics: string[];
  engagementTarget: 'educational' | 'entertaining' | 'interactive' | 'practical';
}

export interface AccountFormatRules {
  [accountId: string]: {
    [persona: string]: {
      formats: FormatType[];
      weights: { [format: string]: number };
      fallback: FormatType;
      brandingOverrides?: Partial<FormatVisualConfig>;
      timingOverrides?: Partial<FrameTimingConfig>;
    };
  };
}

export interface FormatSelectionContext {
  accountId: string;
  persona: string;
  topic: string;
  topicCategory?: string;
  previousFormats?: FormatType[];
  targetEngagement?: 'educational' | 'entertaining' | 'interactive' | 'practical';
}

export interface GenerationContext {
  format: ContentFormat;
  accountId: string;
  persona: string;
  topic: string;
  metadata?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    contentSource?: string;
    targetAudience?: string;
  };
}