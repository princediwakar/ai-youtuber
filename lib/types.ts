/**
 * Defines all shared TypeScript interfaces and types for the application.
 * This ensures data consistency from generation to database storage.
 */

// --- MODIFICATION START ---
// Updated the Question interface to include all possible fields from the AI generation.
export interface Question {
  question?: string; // Optional, as assertion/reason questions don't use this
  assertion?: string; // For assertion/reason questions
  reason?: string; // For assertion/reason questions
  options: { [key: string]: string; };
  answer: string;
  explanation: string;
  topic: string;
  question_type?: 'multiple_choice' | 'true_false' | 'assertion_reason'; // More specific type
  cta: string; // For the call-to-action frame
}
// --- MODIFICATION END ---


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
  data: {
    question: Question; // Using the strong Question type here
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
