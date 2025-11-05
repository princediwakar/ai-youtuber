//lib/schedule.ts

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
  9: ['english_vocab_builder'],
  16: ['english_vocab_builder'],
  18: ['english_vocab_builder'],

};
const healthGenerationPattern: HourlySchedule =
{
  2: ['mental_health_tips'],
  6: ['general_health_tips'],
  12: ['mental_health_tips'],
  15: ['general_health_tips'],
  18: ['general_health_tips'],

};
const sscGenerationPattern: HourlySchedule =
{
  3: ['ssc_shots'],
  11: ['ssc_shots'],
  13: ['ssc_shots'],
  14: ['ssc_shots'],
  18: ['ssc_shots'],

};
const astronomyGenerationPattern: HourlySchedule =
{
  8: ['space_facts_quiz'],
  12: ['space_facts_quiz'],
  17: ['space_facts_quiz'],
  18: ['space_facts_quiz'],
};

// ===================================================================
// 1. English Shots (Global Learners, Algorithm-Optimized Timing)
// STRATEGY: Upload 2-3 hours before peak times. 5 uploads/day.
// ===================================================================
const englishWeekdayUpload: HourlySchedule = {
  7: ['english_vocab_builder'],   // Upload for 9-11 AM casual scrolling
  10: ['english_vocab_builder'],  // Upload for 12-3 PM lunch peak
  16: ['english_vocab_builder'],  // Upload for 7-10 PM evening peak (GOLDEN WINDOW)
  19: ['english_vocab_builder'], // Upload for 9-11 PM late night scrolling (DOUBLE)
};
const englishWeekendUpload: HourlySchedule = {
  8: ['english_vocab_builder'],   // Upload for 10 AM-12 PM weekend leisure
  12: ['english_vocab_builder'],  // Upload for 2-4 PM weekend browsing
  16: ['english_vocab_builder',], // **SATURDAY GOLDEN HOUR: 4 PM is #1 for views (DOUBLE)**
  19: ['english_vocab_builder'],  // Upload for evening peak
};

// ===================================================================
// 2. Health Shots (Algorithm-Optimized + Thematic Wellness Timing)
// STRATEGY: 4 uploads/day. Quick Tip format priority (80 avg views vs 54 MCQ).
// ===================================================================
const healthWeekdayUpload: HourlySchedule = {
  7: ['mental_health_tips'],     // Upload for 9 AM morning wellness (casual scrolling)
  10: ['general_health_tips'],      // Upload for 12-1 PM lunch break (PEAK)
  16: ['mental_health_tips'],    // Upload for 7 PM evening peak (GOLDEN WINDOW)
  19: ['general_health_tips'],      // Upload for 9-10 PM late night (casual scrolling)
};
const healthWeekendUpload: HourlySchedule = {
  8: ['mental_health_tips'],     // Upload for 10 AM weekend leisure
  12: ['general_health_tips'],      // Upload for 2-3 PM weekend browsing
  16: ['mental_health_tips'], // **SATURDAY 4 PM GOLDEN HOUR (DOUBLE)**
  19: ['general_health_tips'],      // Evening upload
};

// ===================================================================
// 3. SSC Shots (Algorithm-Optimized Student Study Times)
// STRATEGY: 4 uploads/day. ONLY video with engagement (118 views + 1 like).
// ===================================================================
const sscWeekdayUpload: HourlySchedule = {
  7: ['ssc_shots'],             // Upload for 9-10 AM morning study (casual scrolling)
  10: ['ssc_shots'],            // Upload for 12-1 PM lunch break study
  16: ['ssc_shots'],            // Upload for 7-8 PM prime study session (GOLDEN)
  19: ['ssc_shots'],            // Upload for 9-10 PM late night revision
};
const sscWeekendUpload: HourlySchedule = {
  9: ['ssc_shots'],             // Upload for 11 AM weekend study
  12: ['ssc_shots'],            // Upload for 2-3 PM deep dive
  16: ['ssc_shots'], // **SATURDAY 4 PM GOLDEN HOUR (DOUBLE)**
  19: ['ssc_shots'],            // Upload for evening block
};

// ===================================================================
// 4. Astronomy Shots (Algorithm-Optimized Discovery Content)
// STRATEGY: 4 uploads/day. Strong performer: 172 views #2 video, 65.5 avg.
// ===================================================================
const astronomyWeekdayUpload: HourlySchedule = {
  7: ['space_facts_quiz'],      // Upload for 9-10 AM morning curiosity
  10: ['space_facts_quiz'],     // Upload for 12-2 PM lunch discovery (PEAK)
  16: ['space_facts_quiz'],     // Upload for 7-9 PM evening wonder (GOLDEN)
  21: ['space_facts_quiz'],     // Upload for 11 PM-12 AM late night "stargazing"
};
const astronomyWeekendUpload: HourlySchedule = {
  9: ['space_facts_quiz'],      // Upload for 11 AM weekend curiosity
  14: ['space_facts_quiz'],     // Upload for 4 PM "explore universe" (PRE-GOLDEN)
  16: ['space_facts_quiz'], // **SATURDAY 4 PM GOLDEN HOUR (DOUBLE)**
  20: ['space_facts_quiz'],     // Upload for late evening
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

