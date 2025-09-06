/**
 * Content validation utilities
 * Handles parsing and validation of AI responses
 */

import { ContentData } from '../types';

export interface ValidationResult {
  success: boolean;
  data?: ContentData;
  error?: string;
}

/**
 * Parse and validate AI response based on content type
 */
export function parseAndValidateResponse(content: string, persona: string): ValidationResult {
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);

    // Health content validation (supports both true_false and multiple_choice)
    if (persona === 'brain_health_tips' || persona === 'eye_health_tips') {
      return validateHealthContent(data);
    }

    // English quiz validation
    if (persona === 'english_vocab_builder') {
      return validateEnglishContent(data);
    }

    return {
      success: false,
      error: `Unsupported persona for validation: ${persona}`
    };
    
  } catch (error) {
    console.error(`Failed to parse AI JSON response for persona ${persona}. Content: "${content}"`, error);
    return {
      success: false,
      error: `JSON parsing failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Validates health content structure
 */
function validateHealthContent(data: any): ValidationResult {
  // Check required fields
  if (!data.question || typeof data.question !== 'string' ||
      !data.options || typeof data.options !== 'object' ||
      !data.answer || typeof data.answer !== 'string' ||
      !data.explanation || typeof data.explanation !== 'string' ||
      !data.cta || typeof data.cta !== 'string' ||
      !data.question_type || 
      (data.question_type !== 'true_false' && data.question_type !== 'multiple_choice')) {
    return {
      success: false,
      error: 'Health question response missing required fields'
    };
  }
  
  // Validate options structure based on question type
  if (data.question_type === 'true_false') {
    if (!data.options.A || !data.options.B || data.options.A !== 'True' || data.options.B !== 'False') {
      return {
        success: false,
        error: 'True/false health question must have options A: "True", B: "False"'
      };
    }
    if (!['A', 'B'].includes(data.answer)) {
      return {
        success: false,
        error: 'True/false health question answer must be A or B'
      };
    }
  } else if (data.question_type === 'multiple_choice') {
    if (!data.options.A || !data.options.B || !data.options.C || !data.options.D) {
      return {
        success: false,
        error: 'Multiple choice health question must have options A, B, C, and D'
      };
    }
    if (!['A', 'B', 'C', 'D'].includes(data.answer)) {
      return {
        success: false,
        error: 'Multiple choice health question answer must be A, B, C, or D'
      };
    }
  }
  
  // Truncate explanation if too long
  if (data.explanation.length > 150) {
    console.warn(`Health explanation too long (${data.explanation.length} chars), truncating`);
    data.explanation = data.explanation.substring(0, 147) + '...';
  }
  
  return { success: true, data };
}

/**
 * Validates English content structure
 */
function validateEnglishContent(data: any): ValidationResult {
  const hasQuestion = data.question && typeof data.question === 'string';
  const hasAssertionReason = data.assertion && typeof data.assertion === 'string' && 
                            data.reason && typeof data.reason === 'string';
  const hasCta = data.cta && typeof data.cta === 'string';

  if ((!hasQuestion && !hasAssertionReason) ||
      !hasCta ||
      !data.options || typeof data.options !== 'object' || Object.keys(data.options).length < 2 ||
      !data.answer || typeof data.answer !== 'string' || !data.options[data.answer] ||
      !data.explanation || typeof data.explanation !== 'string') {
    return {
      success: false,
      error: 'English quiz response missing required JSON fields'
    };
  }
  
  // Truncate explanation if too long
  if (data.explanation.length > 150) {
    console.warn(`English explanation too long (${data.explanation.length} chars), truncating`);
    data.explanation = data.explanation.substring(0, 147) + '...';
  }

  return { success: true, data };
}

/**
 * Generates a content hash for duplicate detection and tracking
 */
export function generateContentHash(content: ContentData): string {
  const contentString = JSON.stringify({
    main: content.question,
    options: content.options,
    answer: content.answer,
    content_type: content.question_type
  });

  // Simple hash function (for production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < contentString.length; i++) {
    const char = contentString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `CH${Math.abs(hash).toString(36).toUpperCase()}`;
}