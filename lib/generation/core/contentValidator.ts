
// lib/generation/core/contentValidator.ts
/**
 * Content validation utilities
 * Handles parsing and validation of AI responses
 */

import { ContentData } from '@/lib/types';



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
// --- FIX: Extract JSON block from potential conversational text ---
const firstBrace = content.indexOf('{');
const lastBrace = content.lastIndexOf('}');

if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
  throw new Error('No valid JSON object found in the response.');
}

// Extract the JSON string
const jsonString = content.substring(firstBrace, lastBrace + 1);
// --- END FIX ---

const data = JSON.parse(jsonString);
    // Health content validation (supports both true_false and multiple_choice)
    if (persona === 'mental_health_tips' || persona === 'general_health_tips') {
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
  // enforceLengthLimits(data);
  
  return { success: true, data };
}

/**
 * Validates SSC content structure
 */
function validateSSCContent(data: any, format?: string): ValidationResult {
  // Format-specific validation for SSC content
   if (format === 'quick_tip') {
    // Use the specific validator
    const result = validateSSCQuickTipFormat(data);
    if (!result.success) return result;
    
    // FIX: Map SSC-specific fields to generic QuickTip fields for compatibility with the generic renderer
    data.action = data.traditional_approach;
    data.result = data.smart_shortcut;
    
    // Ensure CTA is explicitly present for the generic quick_tip layout, as it's now a required frame.
    if (!data.cta) {
        // This should not happen if validateSSCQuickTipFormat passed, but serves as a final check
        return { success: false, error: 'SSC Quick Tip format mapping failed: missing CTA' };
    }
    
    return { success: true, data };
    
  }


  
  // Validate options structure based on question type
  // Check both question_type and content_type for compatibility
  const isTrue_false = data.question_type === 'true_false' || data.content_type === 'true_false';
  
  if (isTrue_false) {
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
    // Multiple choice validation - require all A, B, C, D options
    if (!data.options || typeof data.options !== 'object') {
      return {
        success: false,
        error: 'SSC question must have options object'
      };
    }
    
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
  // enforceLengthLimits(data);
  
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
  

  
  // Ensure content_type defaults to multiple_choice for astronomy
  if (!data.content_type) {
    data.content_type = 'multiple_choice';
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
  // enforceLengthLimits(data);
  
  return { success: true, data };
}

/**
 * Validates English content structure
 */
function validateEnglishContent(data: any, format?: string): ValidationResult {
  // Format-specific validation for English content
  if (format === 'simplified_word' || data.format_type === 'simplified_word') {
    return validateSimplifiedWordFormat(data);
  }


  
  // Apply length limits to all content
  // enforceLengthLimits(data);

  return { success: true, data };
}

// Format-specific validation functions

/**
 * Validates Simplified Word format structure for single-frame videos
 */
function validateSimplifiedWordFormat(data: any): ValidationResult {
  // Resilience: default format_type when absent
  if (!data.format_type) {
    data.format_type = 'simplified_word';
  }
  
  // Attempt to synthesize missing fields from common alternatives
  if (!data.word && (data.question || data.content)) {
    const source = String(data.question || data.content);
    // Try quoted word first
    const quoted = source.match(/"([^"]{2,40})"|'([^']{2,40})'/);
    const candidate = quoted ? (quoted[1] || quoted[2]) : source.split(/[^A-Za-z]+/).find(w => w && w.length > 2);
    if (candidate) data.word = candidate;
  }
  if (!data.definition && (data.explanation || data.answer)) {
    const defSrc = String(data.explanation || data.answer).trim();
    data.definition = defSrc.slice(0, 100);
  }
  if (!data.usage && (data.content || data.question)) {
    const useSrc = String(data.content || data.question).trim();
    data.usage = useSrc.slice(0, 120);
  }
  
  const requiredFields = ['word', 'definition', 'usage', 'format_type'];
  const missingFields = requiredFields.filter(field => !data[field] || typeof data[field] !== 'string');
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Simplified Word format missing required fields: ${missingFields.join(', ')}`
    };
  }

  // Validate format_type
  if (data.format_type !== 'simplified_word') {
    return {
      success: false,
      error: 'Simplified Word format must have format_type: "simplified_word"'
    };
  }

  // Optional fields validation (part_of_speech, pronunciation)
  if (data.part_of_speech && typeof data.part_of_speech !== 'string') {
    return {
      success: false,
      error: 'part_of_speech must be a string if provided'
    };
  }

  if (data.pronunciation && typeof data.pronunciation !== 'string') {
    return {
      success: false,
      error: 'pronunciation must be a string if provided'
    };
  }

  // Validate content for mathematical accuracy and nonsensical patterns
  const allContent = [data.word, data.definition, data.usage].join(' ');
  
  // Check for nonsensical mathematical patterns
  const mathErrors = validateMathematicalAccuracy(allContent);
  if (mathErrors.length > 0) {
    return {
      success: false,
      error: `Content contains mathematical errors: ${mathErrors.join(', ')}`
    };
  }

  return { success: true, data };
}

/**
 * Validates Simplified SSC format structure for single-frame videos
 */

/**
 * Validates Quick Fix format structure
 */
function validateQuickFixFormat(data: any): ValidationResult {
  const requiredFields = ['basic_word', 'advanced_word', 'cta'];
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
 * Validates Quick Tip format structure (for health)
 */
function validateQuickTipFormat(data: any): ValidationResult {
  const requiredFields = [ 'action', 'result', 'cta'];
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
 * Validates SSC Quick Tip format structure
 */
function validateSSCQuickTipFormat(data: any): ValidationResult {
  // FIX: Check for SSC-specific fields
  const requiredFields = ['traditional_approach', 'smart_shortcut', 'application_example', 'explanation', 'cta'];
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
 * Validates mathematical expressions for accuracy and detects nonsensical patterns
 */
function validateMathematicalAccuracy(content: string): string[] {
  const errors: string[] = [];
  
  // Pattern 1: Basic arithmetic equations like "X/Y=Z" or "X*Y=Z"
  const basicMathPattern = /(\d+)\s*([+\-*/])\s*(\d+)\s*=\s*(\d+)/g;
  let match;
  
  while ((match = basicMathPattern.exec(content)) !== null) {
    const [fullMatch, num1Str, operator, num2Str, resultStr] = match;
    const num1 = parseInt(num1Str);
    const num2 = parseInt(num2Str);
    const expectedResult = parseInt(resultStr);
    
    let actualResult: number;
    switch (operator) {
      case '+':
        actualResult = num1 + num2;
        break;
      case '-':
        actualResult = num1 - num2;
        break;
      case '*':
        actualResult = num1 * num2;
        break;
      case '/':
        actualResult = num1 / num2;
        break;
      default:
        continue;
    }
    
    if (Math.abs(actualResult - expectedResult) > 0.01) {
      errors.push(`${fullMatch} is incorrect (should be ${actualResult})`);
    }
  }
  
  // Pattern 2: Year derivations like "X=>YYYY" where X doesn't logically lead to YYYY
  const yearDerivationPattern = /(\d+)\s*=>\s*(\d{4})/g;
  while ((match = yearDerivationPattern.exec(content)) !== null) {
    const [fullMatch, sourceStr, yearStr] = match;
    const source = parseInt(sourceStr);
    const year = parseInt(yearStr);
    
    // Flag obvious nonsensical year derivations
    if (source < 100 && (year < 1800 || year > 2100)) {
      errors.push(`${fullMatch} appears to be a nonsensical year derivation`);
    }
  }
  
  // Pattern 3: Mathematical expressions that don't make logical sense
  const nonsensicalPattern = /(\d+\/\d+\s*=\s*\d+\s*=>\s*\d{4})/g;
  while ((match = nonsensicalPattern.exec(content)) !== null) {
    errors.push(`${match[0]} contains multiple nonsensical relationships`);
  }
  
  return errors;
}

/**
 * Generates a content hash for duplicate detection and tracking
 */
export function generateContentHash(content: ContentData): string {
  const contentString = JSON.stringify({
    // Primary content identifiers - prioritize the main word/concept
    main: content.question || content.traditional_approach || content.content,
    answer: content.answer || content.advanced_word || content.smart_shortcut || content.result,
    content_type: content.question_type || content.content_type || 'format_based',
    // For simplified word format, include definition to ensure uniqueness
    definition: content.definition,
    // Include usage to catch similar words with different examples
    usage: content.usage_example
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