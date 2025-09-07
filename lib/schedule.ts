/**
 * Multi-Account YouTube Content Generation & Upload Schedule
 *
 * English Shots Strategy: 3 daily uploads with 1 generation batch (3 quizzes/day = perfect match)
 * Health Shots Strategy: 2 daily uploads with 1 generation batch (3 quizzes/day = 1 buffer)
 *
 * Each generation batch creates 3 quizzes. Optimized for quality over quantity.
 */

interface HourlySchedule {
  [hour: number]: string[];
}
  
// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
type DailySchedule = Record<number, HourlySchedule>;

interface AccountSchedules {
  generation: DailySchedule;
  upload: DailySchedule;
}

/**
 * English Shots Account Schedules
 * Focus: Global English learners across time zones
 */
const englishGenerationPattern: HourlySchedule = {
  6: ['english_vocab_builder'],   // Morning generation for daily uploads
};

const englishUploadPattern: HourlySchedule = {
  10: ['english_vocab_builder'], // Mid-morning global peak
  16: ['english_vocab_builder'], // Afternoon global peak  
  21: ['english_vocab_builder'], // Evening global peak
};

/**
 * Health Shots Account Schedules  
 * Focus: Health-conscious audiences during key wellness moments
 * Strategy: 2 daily uploads for optimal engagement without oversaturation
 */
const healthGenerationPattern: HourlySchedule = {
  5: ['brain_health_tips'],      // Early morning generation for daily wellness content
  6: ['eye_health_tips'],      // Early morning generation for daily wellness content
};

const healthUploadPattern: HourlySchedule = {
  8:  ['brain_health_tips'],  // Morning wellness routine
  19: ['eye_health_tips'],    // Evening health awareness
};

// Account-specific schedules
const ACCOUNT_SCHEDULES: Record<string, AccountSchedules> = {
  english_shots: {
    generation: {
      0: englishGenerationPattern, // Sunday
      1: englishGenerationPattern, // Monday
      2: englishGenerationPattern, // Tuesday
      3: englishGenerationPattern, // Wednesday
      4: englishGenerationPattern, // Thursday
      5: englishGenerationPattern, // Friday
      6: englishGenerationPattern, // Saturday
    },
    upload: {
      0: englishUploadPattern, // Sunday
      1: englishUploadPattern, // Monday
      2: englishUploadPattern, // Tuesday
      3: englishUploadPattern, // Wednesday
      4: englishUploadPattern, // Thursday
      5: englishUploadPattern, // Friday
      6: englishUploadPattern, // Saturday
    }
  },

  health_shots: {
    generation: {
      0: healthGenerationPattern, // Sunday
      1: healthGenerationPattern, // Monday
      2: healthGenerationPattern, // Tuesday
      3: healthGenerationPattern, // Wednesday
      4: healthGenerationPattern, // Thursday
      5: healthGenerationPattern, // Friday
      6: healthGenerationPattern, // Saturday
    },
    upload: {
      0: healthUploadPattern, // Sunday
      1: healthUploadPattern, // Monday
      2: healthUploadPattern, // Tuesday
      3: healthUploadPattern, // Wednesday
      4: healthUploadPattern, // Thursday
      5: healthUploadPattern, // Friday
      6: healthUploadPattern, // Saturday
    }
  }
};

/**
 * Get generation schedule for a specific account
 */
export function getGenerationSchedule(accountId: string): DailySchedule {
  const schedules = ACCOUNT_SCHEDULES[accountId];
  if (!schedules) {
    throw new Error(`No generation schedule found for account: ${accountId}`);
  }
  return schedules.generation;
}

/**
 * Get upload schedule for a specific account
 */
export function getUploadSchedule(accountId: string): DailySchedule {
  const schedules = ACCOUNT_SCHEDULES[accountId];
  if (!schedules) {
    throw new Error(`No upload schedule found for account: ${accountId}`);
  }
  return schedules.upload;
}

/**
 * Get personas scheduled for generation at a specific time for an account
 */
export function getScheduledPersonasForGeneration(
  accountId: string,
  dayOfWeek: number,
  hour: number
): string[] {
  const schedule = getGenerationSchedule(accountId);
  const daySchedule = schedule[dayOfWeek];
  return daySchedule?.[hour] || [];
}

/**
 * Get personas scheduled for upload at a specific time for an account
 */
export function getScheduledPersonasForUpload(
  accountId: string,
  dayOfWeek: number,
  hour: number
): string[] {
  const schedule = getUploadSchedule(accountId);
  const daySchedule = schedule[dayOfWeek];
  return daySchedule?.[hour] || [];
}

/**
 * Check if generation is scheduled for an account at current time
 */
export function isGenerationScheduled(accountId: string, date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  const personas = getScheduledPersonasForGeneration(accountId, dayOfWeek, hour);
  return personas.length > 0;
}

/**
 * Check if upload is scheduled for an account at current time
 */
export function isUploadScheduled(accountId: string, date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  const personas = getScheduledPersonasForUpload(accountId, dayOfWeek, hour);
  return personas.length > 0;
}

/**
 * Get all available account IDs with schedules
 */
export function getScheduledAccountIds(): string[] {
  return Object.keys(ACCOUNT_SCHEDULES);
}

// Legacy exports for backward compatibility (will be deprecated)
export const GenerationSchedule: DailySchedule = getGenerationSchedule('english_shots');
export const UploadSchedule: DailySchedule = getUploadSchedule('english_shots');