/**
 * Content validation utilities
 * Handles parsing and validation of AI responses
 */

import { ContentData } from '../types';

// Length limits for different content elements
const LENGTH_LIMITS = {
  QUESTION: 180,
  OPTION: 70,
  EXPLANATION: 120,
  CTA: 35
} as const;

/**
 * Truncates text to specified length with ellipsis if needed
 */
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Enforces length limits on content with smart truncation
 */
function enforceLengthLimits(data: any): void {
  // Truncate question/content
  if (data.question) {
    const originalLength = data.question.length;
    data.question = truncateText(data.question, LENGTH_LIMITS.QUESTION);
    if (data.question.length < originalLength) {
      console.warn(`Question truncated from ${originalLength} to ${data.question.length} chars`);
    }
  }
  
  // Truncate options
  if (data.options && typeof data.options === 'object') {
    Object.keys(data.options).forEach(key => {
      if (typeof data.options[key] === 'string') {
        const originalLength = data.options[key].length;
        data.options[key] = truncateText(data.options[key], LENGTH_LIMITS.OPTION);
        if (data.options[key].length < originalLength) {
          console.warn(`Option ${key} truncated from ${originalLength} to ${data.options[key].length} chars`);
        }
      }
    });
  }
  
  // Truncate explanation
  if (data.explanation) {
    const originalLength = data.explanation.length;
    data.explanation = truncateText(data.explanation, LENGTH_LIMITS.EXPLANATION);
    if (data.explanation.length < originalLength) {
      console.warn(`Explanation truncated from ${originalLength} to ${data.explanation.length} chars`);
    }
  }
  
  // Truncate CTA
  if (data.cta) {
    const originalLength = data.cta.length;
    data.cta = truncateText(data.cta, LENGTH_LIMITS.CTA);
    if (data.cta.length < originalLength) {
      console.warn(`CTA truncated from ${originalLength} to ${data.cta.length} chars`);
    }
  }
}

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

    // SSC exam preparation validation
    if (persona === 'ssc_shots') {
      return validateSSCContent(data, layout);
    }

    // Astronomy content validation
    if (persona === 'space_facts_quiz') {
      return validateAstronomyContent(data, layout);
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
  
  // Apply length limits to all content
  enforceLengthLimits(data);
  
  return { success: true, data };
}

/**
 * Validates SSC content structure
 */
function validateSSCContent(data: any, format?: string): ValidationResult {
  // Format-specific validation for SSC content
  if (format === 'challenge') {
    return validateSSCChallengeFormat(data);
  } else if (format === 'common_mistake') {
    return validateSSCCommonMistakeFormat(data);
  } else if (format === 'usage_demo') {
    return validateSSCUsageDemoFormat(data);
  } else if (format === 'quick_tip') {
    return validateSSCQuickTipFormat(data);
  }

  // Default MCQ validation for SSC content
  // Check required fields - for MCQ format, we expect either 'question' or 'content' field
  const hasQuestion = data.question && typeof data.question === 'string';
  const hasContent = data.content && typeof data.content === 'string';
  
  if ((!hasQuestion && !hasContent) ||
      !data.options || typeof data.options !== 'object' ||
      !data.answer || typeof data.answer !== 'string' ||
      !data.explanation || typeof data.explanation !== 'string' ||
      !data.cta || typeof data.cta !== 'string') {
    return {
      success: false,
      error: 'SSC exam question response missing required fields'
    };
  }
  
  // Validate options structure based on question type
  if (data.question_type === 'true_false') {
    if (!data.options.A || !data.options.B || data.options.A !== 'True' || data.options.B !== 'False') {
      return {
        success: false,
        error: 'True/false SSC question must have options A: "True", B: "False"'
      };
    }
    if (!['A', 'B'].includes(data.answer)) {
      return {
        success: false,
        error: 'True/false SSC question answer must be A or B'
      };
    }
  } else {
    // Multiple choice validation
    if (!data.options.A || !data.options.B || !data.options.C || !data.options.D) {
      return {
        success: false,
        error: 'Multiple choice SSC question must have options A, B, C, and D'
      };
    }
    if (!['A', 'B', 'C', 'D'].includes(data.answer)) {
      return {
        success: false,
        error: 'Multiple choice SSC question answer must be A, B, C, or D'
      };
    }
  }
  
  // Apply length limits to all content
  enforceLengthLimits(data);
  
  return { success: true, data };
}

/**
 * Validates Astronomy content structure
 */
function validateAstronomyContent(data: any, format?: string): ValidationResult {
  // Currently only MCQ format is supported for astronomy content
  // Check required fields - for MCQ format, we expect either 'question' or 'content' field
  const hasQuestion = data.question && typeof data.question === 'string';
  const hasContent = data.content && typeof data.content === 'string';
  
  if ((!hasQuestion && !hasContent) ||
      !data.options || typeof data.options !== 'object' ||
      !data.answer || typeof data.answer !== 'string' ||
      !data.explanation || typeof data.explanation !== 'string' ||
      !data.cta || typeof data.cta !== 'string') {
    return {
      success: false,
      error: 'Astronomy question response missing required fields'
    };
  }
  
  // Multiple choice validation - astronomy uses A, B, C, D format
  if (!data.options.A || !data.options.B || !data.options.C || !data.options.D) {
    return {
      success: false,
      error: 'Multiple choice astronomy question must have options A, B, C, and D'
    };
  }
  if (!['A', 'B', 'C', 'D'].includes(data.answer)) {
    return {
      success: false,
      error: 'Multiple choice astronomy question answer must be A, B, C, or D'
    };
  }
  
  // Apply length limits to all content
  enforceLengthLimits(data);
  
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
  
  // Apply length limits to all content
  enforceLengthLimits(data);

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

// SSC-specific format validation functions

/**
 * Validates SSC Challenge format structure
 */
function validateSSCChallengeFormat(data: any): ValidationResult {
  const requiredFields = ['hook', 'challenge_question', 'time_limit', 'correct_answer', 'confidence_message', 'learning_tip', 'cta'];
  const missingFields = requiredFields.filter(field => !data[field] || typeof data[field] !== 'string');
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `SSC Challenge format missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { success: true, data };
}

/**
 * Validates SSC Common Mistake format structure
 */
function validateSSCCommonMistakeFormat(data: any): ValidationResult {
  const requiredFields = ['hook', 'mistake', 'correct', 'practice', 'explanation', 'cta'];
  const missingFields = requiredFields.filter(field => !data[field] || typeof data[field] !== 'string');
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `SSC Common Mistake format missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { success: true, data };
}

/**
 * Validates SSC Usage Demo format structure
 */
function validateSSCUsageDemoFormat(data: any): ValidationResult {
  const requiredFields = ['hook', 'target_concept', 'wrong_scenario', 'wrong_context', 'right_scenario', 'right_context', 'practice', 'practice_scenario', 'cta'];
  const missingFields = requiredFields.filter(field => !data[field] || typeof data[field] !== 'string');
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `SSC Usage Demo format missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { success: true, data };
}

/**
 * Validates SSC Quick Tip format structure
 */
function validateSSCQuickTipFormat(data: any): ValidationResult {
  const requiredFields = ['hook', 'traditional_approach', 'smart_shortcut', 'application_example', 'explanation', 'cta'];
  const missingFields = requiredFields.filter(field => !data[field] || typeof data[field] !== 'string');
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `SSC Quick Tip format missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { success: true, data };
}

/**
 * Generates a content hash for duplicate detection and tracking
 */
export function generateContentHash(content: ContentData): string {
  const contentString = JSON.stringify({
    main: content.question || content.hook || content.target_word || content.target_concept || 
          content.challenge_question || content.traditional_approach || content.content,
    answer: content.answer || content.correct || content.advanced_word || content.smart_shortcut || 
            content.correct_answer || content.result,
    content_type: content.question_type || content.content_type || content.challenge_type || 'format_based'
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