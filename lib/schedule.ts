/**
 * Multi-Account YouTube Content Generation & Upload Schedule
 *
 * English Shots Strategy: 8 daily uploads with 3 generation batches (daily vocab building)
 * Health Shots Strategy: 6 daily uploads with 2 generation batches (wellness content)
 * SSC Shots Strategy: 6 daily uploads with 3 generation batches (exam preparation)
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
  14: ['english_vocab_builder'],   // Morning generation for daily uploads
  18: ['english_vocab_builder'],   // Evening generation for daily uploads
};

const englishUploadPattern: HourlySchedule = {
7: ['english_vocab_builder'],  // Keep (good morning slot)                                                                                           │ │
9: ['english_vocab_builder'],  // Keep (good morning slot)                                                                                           │ │
16: ['english_vocab_builder'], // NEW - Analytics show 0.91% engagement                                                                              │ │
17: ['english_vocab_builder'], // Keep (after work)                                                                                                  │ │
19: ['english_vocab_builder'], // Keep - Analytics show 1.9% engagement                                                                              │ │
20: ['english_vocab_builder', 'english_vocab_builder'], // NEW - Analytics show 6.23% engagement (BEST)                                                                       │ │
21: ['english_vocab_builder'], // Keep (prime time)
};

/**
 * Health Shots Account Schedules  
 * Focus: Health-conscious audiences during key wellness moments
 * Strategy: 3 daily uploads for optimal engagement without oversaturation
 */
const healthGenerationPattern: HourlySchedule = {
  5: ['brain_health_tips'],      // Early morning generation for daily wellness content
  6: ['eye_health_tips'],        // Early morning generation for daily wellness content
};

const healthUploadPattern: HourlySchedule = {
  7:  ['brain_health_tips'],  // Morning wellness routine
  9: ['eye_health_tips'],    // Afternoon health break
  16: ['eye_health_tips'],    // Afternoon health break
  19: ['brain_health_tips'],  // Evening health awareness
  20: ['eye_health_tips', 'brain_health_tips'],  // Evening health awareness
  21: ['brain_health_tips'],  // Evening health awareness
};

/**
 * SSC Shots Account Schedules
 * Focus: SSC exam aspirants during optimal study times
 * Strategy: 6 daily uploads targeting serious exam preparation audience
 */
const sscGenerationPattern: HourlySchedule = {
  5: ['ssc_shots'],   // Early morning generation
  14: ['ssc_shots'],  // Post-lunch generation  
  20: ['ssc_shots'],  // Evening generation
};

const sscUploadPattern: HourlySchedule = {
  6: ['ssc_shots'],   // Early morning study time
  9: ['ssc_shots'],   // Morning study session
  16: ['ssc_shots'],  // Evening study start
  18: ['ssc_shots'],  // Night study session
  19: ['ssc_shots'],  // Night study session
  20: ['ssc_shots'],  // Evening study start
  21: ['ssc_shots'],  // Evening study start
};

/**
 * Astronomy Shots Account Schedules
 * Focus: Space enthusiasts and curious learners during peak engagement times
 * Strategy: 6 daily uploads targeting wonder and curiosity-driven audience
 */
const astronomyGenerationPattern: HourlySchedule = {
  6: ['space_facts_quiz'],   // Morning generation for daily space content
  14: ['space_facts_quiz'],  // Afternoon generation  
  20: ['space_facts_quiz'],  // Evening generation
};

const astronomyUploadPattern: HourlySchedule = {
  7: ['space_facts_quiz'],   // Morning curiosity peak
  9: ['space_facts_quiz'],  // Late morning discovery time
  16: ['space_facts_quiz'],  // Afternoon wonder break
  18: ['space_facts_quiz'],  // Evening learning time
  20: ['space_facts_quiz'],  // Prime time space facts
  21: ['space_facts_quiz'],  // Night sky contemplation
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
  },

  ssc_shots: {
    generation: {
      0: sscGenerationPattern, // Sunday
      1: sscGenerationPattern, // Monday
      2: sscGenerationPattern, // Tuesday
      3: sscGenerationPattern, // Wednesday
      4: sscGenerationPattern, // Thursday
      5: sscGenerationPattern, // Friday
      6: sscGenerationPattern, // Saturday
    },
    upload: {
      0: sscUploadPattern, // Sunday
      1: sscUploadPattern, // Monday
      2: sscUploadPattern, // Tuesday
      3: sscUploadPattern, // Wednesday
      4: sscUploadPattern, // Thursday
      5: sscUploadPattern, // Friday
      6: sscUploadPattern, // Saturday
    }
  },

  astronomy_shots: {
    generation: {
      0: astronomyGenerationPattern, // Sunday
      1: astronomyGenerationPattern, // Monday
      2: astronomyGenerationPattern, // Tuesday
      3: astronomyGenerationPattern, // Wednesday
      4: astronomyGenerationPattern, // Thursday
      5: astronomyGenerationPattern, // Friday
      6: astronomyGenerationPattern, // Saturday
    },
    upload: {
      0: astronomyUploadPattern, // Sunday
      1: astronomyUploadPattern, // Monday
      2: astronomyUploadPattern, // Tuesday
      3: astronomyUploadPattern, // Wednesday
      4: astronomyUploadPattern, // Thursday
      5: astronomyUploadPattern, // Friday
      6: astronomyUploadPattern, // Saturday
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