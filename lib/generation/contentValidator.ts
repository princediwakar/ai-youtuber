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
 * Parse and validate AI response based on content type and format
 */
export function parseAndValidateResponse(content: string, persona: string, layout?: string): ValidationResult {
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);

    // Health content validation (supports both true_false and multiple_choice)
    if (persona === 'brain_health_tips' || persona === 'eye_health_tips') {
      return validateHealthContent(data, layout);
    }

    // English quiz validation
    if (persona === 'english_vocab_builder') {
      return validateEnglishContent(data, layout);
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
function validateHealthContent(data: any, format?: string): ValidationResult {
  // Format-specific validation for health content
  if (format === 'quick_tip') {
    return validateQuickTipFormat(data);
  } else if (format === 'before_after') {
    return validateBeforeAfterFormat(data);
  } else if (format === 'challenge') {
    return validateChallengeFormat(data);
  }

  // Default MCQ validation for health content
  // Check required fields - for MCQ format, we expect either 'question' or 'content' field
  const hasQuestion = data.question && typeof data.question === 'string';
  const hasContent = data.content && typeof data.content === 'string';
  
  if ((!hasQuestion && !hasContent) ||
      !data.options || typeof data.options !== 'object' ||
      !data.answer || typeof data.answer !== 'string' ||
      !data.explanation || typeof data.explanation !== 'string' ||
      !data.cta || typeof data.cta !== 'string' ||
      !data.content_type || 
      (data.content_type !== 'true_false' && data.content_type !== 'multiple_choice')) {
    return {
      success: false,
      error: 'Health question response missing required fields'
    };
  }
  
  // Validate options structure based on question type
  if (data.content_type === 'true_false') {
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
  } else if (data.content_type === 'multiple_choice') {
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
function validateEnglishContent(data: any, format?: string): ValidationResult {
  // Format-specific validation for English content
  if (format === 'common_mistake') {
    return validateCommonMistakeFormat(data);
  } else if (format === 'quick_fix') {
    return validateQuickFixFormat(data);
  } else if (format === 'usage_demo') {
    return validateUsageDemoFormat(data);
  } else if (format === 'challenge') {
    return validateChallengeFormat(data);
  }

  // Default MCQ validation for English content
  const hasQuestion = data.content && typeof data.content === 'string';
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
  if (data.explanation && data.explanation.length > 150) {
    console.warn(`English explanation too long (${data.explanation.length} chars), truncating`);
    data.explanation = data.explanation.substring(0, 147) + '...';
  }

  return { success: true, data };
}

// Format-specific validation functions

/**
 * Validates Common Mistake format structure
 */
function validateCommonMistakeFormat(data: any): ValidationResult {
  const requiredFields = ['hook', 'mistake', 'correct', 'practice', 'cta'];
  const missingFields = requiredFields.filter(field => !data[field] || typeof data[field] !== 'string');
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Common Mistake format missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { success: true, data };
}

/**
 * Validates Quick Fix format structure
 */
function validateQuickFixFormat(data: any): ValidationResult {
  const requiredFields = ['hook', 'basic_word', 'advanced_word', 'cta'];
  const missingFields = requiredFields.filter(field => !data[field] || typeof data[field] !== 'string');
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Quick Fix format missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { success: true, data };
}

/**
 * Validates Usage Demo format structure
 */
function validateUsageDemoFormat(data: any): ValidationResult {
  const requiredFields = ['hook', 'target_word', 'wrong_example', 'right_example', 'practice', 'cta'];
  const missingFields = requiredFields.filter(field => !data[field] || typeof data[field] !== 'string');
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Usage Demo format missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { success: true, data };
}

/**
 * Validates Quick Tip format structure (for health)
 */
function validateQuickTipFormat(data: any): ValidationResult {
  const requiredFields = ['hook', 'action', 'result', 'cta'];
  const missingFields = requiredFields.filter(field => !data[field] || typeof data[field] !== 'string');
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Quick Tip format missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { success: true, data };
}

/**
 * Validates Before/After format structure (for health)
 */
function validateBeforeAfterFormat(data: any): ValidationResult {
  const requiredFields = ['hook', 'before', 'after', 'result', 'cta'];
  const missingFields = requiredFields.filter(field => !data[field] || typeof data[field] !== 'string');
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Before/After format missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { success: true, data };
}

/**
 * Validates Challenge format structure (for health)
 */
function validateChallengeFormat(data: any): ValidationResult {
  const requiredFields = ['hook', 'setup', 'instructions', 'challenge_type', 'reveal', 'answer', 'cta'];
  const missingFields = requiredFields.filter(field => !data[field] || typeof data[field] !== 'string');
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Challenge format missing required fields: ${missingFields.join(', ')}`
    };
  }

  // Validate challenge_type is one of expected values
  const validChallengeTypes = ['memory', 'visual', 'logic'];
  if (!validChallengeTypes.includes(data.challenge_type)) {
    return {
      success: false,
      error: `Challenge format challenge_type must be one of: ${validChallengeTypes.join(', ')}`
    };
  }

  // For memory challenges, validate challenge_items array exists
  if (data.challenge_type === 'memory' && (!data.challenge_items || !Array.isArray(data.challenge_items))) {
    return {
      success: false,
      error: 'Memory challenge format requires challenge_items array'
    };
  }

  return { success: true, data };
}

/**
 * Generates a content hash for duplicate detection and tracking
 */
export function generateContentHash(content: ContentData): string {
  const contentString = JSON.stringify({
    main: content.question || content.hook || content.target_word,
    answer: content.answer || content.correct || content.advanced_word,
    content_type: content.question_type || 'format_based'
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