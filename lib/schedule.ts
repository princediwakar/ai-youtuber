/**
 * Multi-Account YouTube Content Generation & Upload Schedule
 *
 * OPTIMIZED FOR ENGAGEMENT & AUDIENCE ROUTINES (October 5, 2025)
 *
 * Strategy:
 * 1. Aligns upload times with high-traffic user moments: morning commute, lunch break, after work, and evening prime time.
 * 2. Strengthens the proven 8 PM (20:00 IST) prime-time slot for key channels.
 * 3. Introduces more distinct thematic timing to match content with user mindset (e.g., wellness routines, study blocks).
 * 4. Adjusts generation times to run earlier, ensuring content is always ready well ahead of the first upload slot.
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

// --- Optimized Generation Patterns ---
// Strategy: Run generation earlier in the morning (4-5 AM) to ensure a full content queue for the day.
const englishGenerationPattern: HourlySchedule =
{
  1: ['english_vocab_builder'],
  5: ['english_vocab_builder'],
  9: ['english_vocab_builder']
};
const healthGenerationPattern: HourlySchedule =
{
  2: ['brain_health_tips'],
  6: ['eye_health_tips'],
};
const sscGenerationPattern: HourlySchedule =
{
  3: ['ssc_shots'],
  11: ['ssc_shots']
};
const astronomyGenerationPattern: HourlySchedule =
{
  8: ['space_facts_quiz'],
  12: ['space_facts_quiz'],
  13: ['space_facts_quiz'],
};

// ===================================================================
// 1. English Shots (Global Learners, Indian Prime-Time Focus)
// STRATEGY: 5 uploads/day. Capture morning commute, lunch, and post-work slots, while doubling down on the 8 PM peak.
// ===================================================================
const englishWeekdayUpload: HourlySchedule = {
  8: ['english_vocab_builder'],   // Morning commute / First phone check
  13: ['english_vocab_builder'],  // Lunch break
  17: ['english_vocab_builder'],  // After work/school commute
  20: ['english_vocab_builder', 'english_vocab_builder'], // **DATA-DRIVEN PEAK: Double upload**
};
const englishWeekendUpload: HourlySchedule = {
  10: ['english_vocab_builder'],  // Later weekend morning start
  14: ['english_vocab_builder'],  // Weekend afternoon
  18: ['english_vocab_builder'],  // Early evening
  20: ['english_vocab_builder', 'english_vocab_builder'], // **PEAK: Maintain the double upload**
};

// ===================================================================
// 2. Health Shots (Wellness Moments)
// STRATEGY: 4 uploads/day. Thematic timing: "Start your day," "Midday break," "Evening wind-down," and "Before bed."
// ===================================================================
const healthWeekdayUpload: HourlySchedule = {
  7: ['brain_health_tips'],     // Morning wellness routine
  13: ['eye_health_tips'],       // Lunchtime screen break reminder
  18: ['brain_health_tips'],     // Post-work de-stress
  21: ['eye_health_tips'],       // Pre-sleep digital detox tip
};
const healthWeekendUpload: HourlySchedule = {
  9: ['brain_health_tips'],     // Weekend wellness start
  14: ['eye_health_tips'],       // Afternoon self-care
  19: ['brain_health_tips'],     // Evening relaxation
  21: ['eye_health_tips'],       // Weekend prime-time content
};

// ===================================================================
// 3. SSC Shots (Dedicated Study Times)
// STRATEGY: 4 uploads/day. Align with typical student schedules: morning revision, post-class, and evening study blocks.
// ===================================================================
const sscWeekdayUpload: HourlySchedule = {
  8: ['ssc_shots'],             // Morning revision / warm-up
  16: ['ssc_shots'],            // Post-class / start of evening study
  19: ['ssc_shots'],            // Prime study session
  22: ['ssc_shots'],            // Late-night final review
};
const sscWeekendUpload: HourlySchedule = {
  11: ['ssc_shots'],            // Late morning weekend study start
  16: ['ssc_shots'],            // Afternoon deep-dive session
  19: ['ssc_shots'],            // Prime evening study block
  21: ['ssc_shots'],            // Weekend late study session
};

// ===================================================================
// 4. Astronomy Shots (Curiosity & Wonder)
// STRATEGY: 4 uploads/day. Focus on discovery moments: morning coffee, afternoon break, and a stronger evening prime-time block.
// ===================================================================
const astronomyWeekdayUpload: HourlySchedule = {
  9: ['space_facts_quiz'],      // Morning coffee "did you know"
  14: ['space_facts_quiz'],      // Afternoon mental break
  20: ['space_facts_quiz'],      // Prime-time discovery
  23: ['space_facts_quiz'],      // Late-night "look at the sky" thematic post
};
const astronomyWeekendUpload: HourlySchedule = {
  11: ['space_facts_quiz'],     // Weekend morning curiosity
  16: ['space_facts_quiz'],     // Afternoon "explore the universe"
  20: ['space_facts_quiz', 'space_facts_quiz'], // **PEAK: Double down on prime-time for entertainment/discovery content**
  22: ['space_facts_quiz'],
};

// ===================================================================
// Final Assembled Schedules
// ===================================================================
const ACCOUNT_SCHEDULES: Record<string, AccountSchedules> = {
  english_shots: {
    generation: { 0: englishGenerationPattern, 1: englishGenerationPattern, 2: englishGenerationPattern, 3: englishGenerationPattern, 4: englishGenerationPattern, 5: englishGenerationPattern, 6: englishGenerationPattern },
    upload: {
      0: englishWeekendUpload, // Sunday
      1: englishWeekdayUpload, 2: englishWeekdayUpload, 3: englishWeekdayUpload, 4: englishWeekdayUpload, 5: englishWeekdayUpload,
      6: englishWeekendUpload, // Saturday
    }
  },
  health_shots: {
    generation: { 0: healthGenerationPattern, 1: healthGenerationPattern, 2: healthGenerationPattern, 3: healthGenerationPattern, 4: healthGenerationPattern, 5: healthGenerationPattern, 6: healthGenerationPattern },
    upload: {
      0: healthWeekendUpload, // Sunday
      1: healthWeekdayUpload, 2: healthWeekdayUpload, 3: healthWeekdayUpload, 4: healthWeekdayUpload, 5: healthWeekdayUpload,
      6: healthWeekendUpload, // Saturday
    }
  },
  ssc_shots: {
    generation: { 0: sscGenerationPattern, 1: sscGenerationPattern, 2: sscGenerationPattern, 3: sscGenerationPattern, 4: sscGenerationPattern, 5: sscGenerationPattern, 6: sscGenerationPattern },
    upload: {
      0: sscWeekendUpload, // Sunday
      1: sscWeekdayUpload, 2: sscWeekdayUpload, 3: sscWeekdayUpload, 4: sscWeekdayUpload, 5: sscWeekdayUpload,
      6: sscWeekendUpload, // Saturday
    }
  },
  astronomy_shots: {
    generation: { 0: astronomyGenerationPattern, 1: astronomyGenerationPattern, 2: astronomyGenerationPattern, 3: astronomyGenerationPattern, 4: astronomyGenerationPattern, 5: astronomyGenerationPattern, 6: astronomyGenerationPattern },
    upload: {
      0: astronomyWeekendUpload, // Sunday
      1: astronomyWeekdayUpload, 2: astronomyWeekdayUpload, 3: astronomyWeekdayUpload, 4: astronomyWeekdayUpload, 5: astronomyWeekdayUpload,
      6: astronomyWeekendUpload, // Saturday
    }
  }
};


// The helper functions remain the same.

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
