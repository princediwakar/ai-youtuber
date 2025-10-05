/**
 * Multi-Account YouTube Content Generation & Upload Schedule
 *
 * OPTIMIZED FOR ENGAGEMENT (Oct 3, 2025)
 *
 * Strategy:
 * 1. Reduced upload frequency (4-5 videos/day) to increase per-video impact.
 * 2. Anchored schedule around the proven 8 PM (20:00) prime-time slot.
 * 3. Introduced distinct weekday vs. weekend patterns to match user behavior.
 * 4. Spaced out uploads to create a predictable "pulse" throughout the day.
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

// --- Generation patterns can remain largely the same ---
const englishGenerationPattern: HourlySchedule =
{
  6: ['english_vocab_builder'],
  16: ['english_vocab_builder'],
  18: ['english_vocab_builder']
};
const healthGenerationPattern: HourlySchedule =
{
  5: ['brain_health_tips'],
  6: ['eye_health_tips'],
  13: [ 'eye_health_tips'],
  14: ['brain_health_tips']
};
const sscGenerationPattern: HourlySchedule =
{
  5: ['ssc_shots'],
  16: ['ssc_shots'],
  17: ['ssc_shots']
};
const astronomyGenerationPattern: HourlySchedule =
{
  6: ['space_facts_quiz'],
  13: ['space_facts_quiz'],
  16: ['space_facts_quiz'],
  23: ['space_facts_quiz']
};

// ===================================================================
// 1. English Shots (Global Learners, Indian Prime-Time Focus)
// STRATEGY: 5 uploads/day. Double down on the 8 PM winner. Add a lunch slot for global reach.
// ===================================================================
const englishWeekdayUpload: HourlySchedule = {
  8: ['english_vocab_builder'],   // Stronger, consolidated morning slot
  13: ['english_vocab_builder'],  // Lunch break / European morning slot
  17: ['english_vocab_builder'],  // After work/school slot
  20: ['english_vocab_builder', 'english_vocab_builder'], // **DATA-DRIVEN PEAK: Double upload in the best-performing hour**
};
const englishWeekendUpload: HourlySchedule = {
  9: ['english_vocab_builder'],   // Later weekend morning start
  14: ['english_vocab_builder'],  // Weekend afternoon leisure time
  18: ['english_vocab_builder'],  // Early evening
  20: ['english_vocab_builder', 'english_vocab_builder'], // **PEAK: Maintain the double upload**
};

// ===================================================================
// 2. Health Shots (Wellness Moments)
// STRATEGY: 4 uploads/day. Thematic timing: motivation in AM, relaxation in PM.
// ===================================================================
const healthWeekdayUpload: HourlySchedule = {
  7: ['brain_health_tips'],     // Morning motivation / mind-setter
  16: ['eye_health_tips'],       // Mid-day screen break reminder
  19: ['brain_health_tips'],     // Evening wind-down
  21: ['eye_health_tips'],       // Pre-sleep digital detox tip
};
const healthWeekendUpload: HourlySchedule = {
  8: ['brain_health_tips'],     // Weekend wellness start
  14: ['eye_health_tips'],       // Afternoon self-care
  19: ['brain_health_tips'],     // Sunday/Saturday relaxation
  21: ['eye_health_tips', 'brain_health_tips'], // More content during weekend prime time
};

// ===================================================================
// 3. SSC Shots (Dedicated Study Times)
// STRATEGY: 4 uploads/day. Spread out to act as study session primers, not a distraction.
// ===================================================================
const sscWeekdayUpload: HourlySchedule = {
  8: ['ssc_shots'],             // Morning current affairs / warm-up
  16: ['ssc_shots'],            // Post-class / start of evening study block
  19: ['ssc_shots'],            // Prime study session
  21: ['ssc_shots'],            // Late-night revision topic
};
const sscWeekendUpload: HourlySchedule = {
  10: ['ssc_shots'],            // Weekend mock test / topic deep dive
  15: ['ssc_shots'],            // Afternoon study block
  19: ['ssc_shots'],            // Prime study session
  21: ['ssc_shots'],            // Final revision for the day
};

// ===================================================================
// 4. Astronomy Shots (Curiosity & Wonder)
// STRATEGY: 4 uploads/day. Thematic timing to inspire wonder.
// ===================================================================
const astronomyWeekdayUpload: HourlySchedule = {
  9: ['space_facts_quiz'],      // Late morning "did you know"
  16: ['space_facts_quiz'],      // Afternoon mental break
  20: ['space_facts_quiz'],      // Prime-time discovery
  22: ['space_facts_quiz'],      // Late-night "look at the sky" thematic post
};
const astronomyWeekendUpload: HourlySchedule = {
  10: ['space_facts_quiz'],     // Weekend morning curiosity
  15: ['space_facts_quiz'],     // Afternoon "explore the universe"
  20: ['space_facts_quiz'],     // **PEAK: Anchor on prime time**
  22: ['space_facts_quiz'], // Double upload for late-night weekend browsing
};

// ===================================================================
// Final Assembled Schedules
// ===================================================================
const ACCOUNT_SCHEDULES: Record<string, AccountSchedules> = {
  english_shots: {
    generation: { 0: englishGenerationPattern, 1: englishGenerationPattern, 2: englishGenerationPattern, 3: englishGenerationPattern, 4: englishGenerationPattern, 5: englishGenerationPattern, 6: englishGenerationPattern },
    upload: {
      0: englishWeekendUpload, // Sunday
      1: englishWeekdayUpload,
      2: englishWeekdayUpload,
      3: englishWeekdayUpload,
      4: englishWeekdayUpload,
      5: englishWeekdayUpload,
      6: englishWeekendUpload, // Saturday
    }
  },
  health_shots: {
    generation: { 0: healthGenerationPattern, 1: healthGenerationPattern, 2: healthGenerationPattern, 3: healthGenerationPattern, 4: healthGenerationPattern, 5: healthGenerationPattern, 6: healthGenerationPattern },
    upload: {
      0: healthWeekendUpload, // Sunday
      1: healthWeekdayUpload,
      2: healthWeekdayUpload,
      3: healthWeekdayUpload,
      4: healthWeekdayUpload,
      5: healthWeekdayUpload,
      6: healthWeekendUpload, // Saturday
    }
  },
  ssc_shots: {
    generation: { 0: sscGenerationPattern, 1: sscGenerationPattern, 2: sscGenerationPattern, 3: sscGenerationPattern, 4: sscGenerationPattern, 5: sscGenerationPattern, 6: sscGenerationPattern },
    upload: {
      0: sscWeekendUpload, // Sunday
      1: sscWeekdayUpload,
      2: sscWeekdayUpload,
      3: sscWeekdayUpload,
      4: sscWeekdayUpload,
      5: sscWeekdayUpload,
      6: sscWeekendUpload, // Saturday
    }
  },
  astronomy_shots: {
    generation: { 0: astronomyGenerationPattern, 1: astronomyGenerationPattern, 2: astronomyGenerationPattern, 3: astronomyGenerationPattern, 4: astronomyGenerationPattern, 5: astronomyGenerationPattern, 6: astronomyGenerationPattern },
    upload: {
      0: astronomyWeekendUpload, // Sunday
      1: astronomyWeekdayUpload,
      2: astronomyWeekdayUpload,
      3: astronomyWeekdayUpload,
      4: astronomyWeekdayUpload,
      5: astronomyWeekdayUpload,
      6: astronomyWeekendUpload, // Saturday
    }
  }
};


// The rest of your functions (getGenerationSchedule, getUploadSchedule, etc.) remain unchanged.
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