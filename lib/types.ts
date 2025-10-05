/**
 * Defines all shared TypeScript interfaces and types for the application.
 * This ensures data consistency from generation to database storage.
 */

// English quiz content structure
export interface Question {
  question?: string; // Optional, as assertion/reason questions don't use this
  content?: string; // Alternative field for content (used in some validation)
  assertion?: string; // For assertion/reason questions
  reason?: string; // For assertion/reason questions
  options: { [key: string]: string; };
  answer: string;
  explanation: string;
  topic: string;
  question_type?: 'multiple_choice' | 'true_false' | 'assertion_reason';
  content_type?: 'multiple_choice' | 'true_false' | 'assertion_reason'; // AI responses use this field
  cta: string; // For the call-to-action frame
  
  // Format-specific properties for new layouts
  // Common Mistake Format
  hook?: string;
  mistake?: string;
  incorrect_usage?: string;
  mistake_percentage?: string;
  correct?: string;
  correct_usage?: string;
  practice?: string;
  
  // Quick Fix Format
  basic_word?: string;
  advanced_word?: string;
  usage_example?: string;
  before?: string;
  after?: string;
  context?: string;
  definition?: string;
  
  // Usage Demo Format
  target_word?: string;
  wrong_example?: string;
  wrong_context?: string;
  right_example?: string;
  right_context?: string;
  practice_scenario?: string;
  
  // SSC Usage Demo Format
  target_concept?: string;
  wrong_scenario?: string;
  right_scenario?: string;
  
  // SSC Challenge Format
  challenge_question?: string;
  time_limit?: string;
  correct_answer?: string;
  confidence_message?: string;
  learning_tip?: string;
  
  // SSC Quick Tip Format
  traditional_approach?: string;
  smart_shortcut?: string;
  application_example?: string;
  
  // Health Format Fields
  action?: string;
  result?: string;
  science?: string;
  habit?: string;
  duration?: string;
  
  // Quick Tip Format (Health)
  steps?: string[];
  step_details?: string[];
  instructions?: string[];
  detailed_action?: string;
  why_it_works?: string;
  
  // Before/After Format (Health)
  bad_habit?: string;
  good_habit?: string;
  negative_effects?: string;
  positive_effects?: string;
  damage?: string;
  benefits?: string;
  proof?: string;
  evidence?: string;
  research?: string;
  immediate_action?: string;
  next_step?: string;
  
  // Challenge Format (Health)
  setup?: string;
  challenge_type?: string;
  challenge_items?: string[];
  items_to_remember?: string[];
  challenge_content?: string;
  visual_test?: string;
  reveal?: string;
  trick?: string;
  method?: string;
  solution?: string;
  encouragement?: string;
  next_challenge?: string;
}

// Union type for all content types (now just Question since health content uses the same format)
export type ContentData = Question;


// Represents a node in the persona hierarchy.
interface PersonaNode {
  key: string;
  displayName: string;
  subCategories?: PersonaNode[];
}

// Defines the structure for the MasterPersonas object.
export interface PersonaConfig {
  [personaKey: string]: {
    displayName: string;
    subCategories: PersonaNode[];
  };
}

// Represents the structure of a job as stored in the quiz_jobs table.
export interface QuizJob {
  id: string;
  persona: string;
  topic: string;
  topic_display_name?: string;
  question_format: string;
  generation_date: string;
  status: string;
  step: number;
  account_id: string; // Account identifier for multi-account support
  
  // Format tracking fields (new)
  format_type?: string; // Format type (mcq, common_mistake, quick_fix, etc.)
  frame_sequence?: any[]; // Sequence and type of frames for this format
  format_metadata?: {
    frameCount?: number;
    totalDuration?: number;
    formatVersion?: string;
    [key: string]: any;
  };
  
  data: {
    content: ContentData; // Unified content structure
    [key: string]: any; // Allows for other properties like frameUrls, themeName etc.
  };
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Represents a successfully uploaded video record.
export interface UploadedVideo {
  id: string;
  job_id: string;
  youtube_video_id: string;
  title: string;
  description?: string;
  tags: string[];
  view_count: number;
  uploaded_at: Date;
}



export interface ChannelStats {
  accountId: string;
  channelName: string;
  totalVideos: number;
  totalViews: number;
  avgEngagementRate: number;
  lastUpload: string | null;
  status: 'active' | 'inactive';
}

export interface PersonaStats {
  personaName: string;
  accountId: string;
  totalVideos: number;
  avgEngagementRate: number;
  lastVideo: string | null;
}

export interface AnalyticsStats {
  videosPublished: number;
  totalViews: number;
  avgEngagement: number;
  bestChannel: string;
  channels: ChannelStats[];
  personas: PersonaStats[];
}
