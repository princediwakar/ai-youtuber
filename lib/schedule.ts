/**
 * English Vocabulary Quiz Generation & Upload Schedule
 *
 * Strategy: Establish a consistent "always-on" presence with 8 daily uploads.
 * This high-frequency schedule caters to a global audience in different time zones,
 * targeting learners during commutes, breaks, and study periods.
 *
 * Generation is scheduled 3 times a day to create a steady buffer of content,
 * ensuring there are always high-quality quizzes ready for the next upload slot.
 * (3 generations × 3 batch size = 9 quizzes generated daily for 8 upload slots).
 */

interface HourlySchedule {
  [hour: number]: string[];
}
  
// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
type DailySchedule = Record<number, HourlySchedule>;

/**
 * Generation Schedule: 3 batches spread out to create a content buffer.
 */
const generationDailyPattern: HourlySchedule = {
    // Early morning generation for the day's first uploads
    2: ['english_vocab_builder'],
    
    // Mid-day generation for the afternoon and evening uploads
    10: ['english_vocab_builder'],
    
    // Evening generation for the late-night and next day's morning uploads
    18: ['english_vocab_builder'],
};

/**
 * Upload Schedule: 8 daily uploads for consistent global engagement.
 */
const uploadDailyPattern: HourlySchedule = {
  8:  ['english_vocab_builder'], // Morning (e.g., US evening, Asia morning)
  11: ['english_vocab_builder'], // Mid-morning Break
  13: ['english_vocab_builder'], // Lunch Break
  15: ['english_vocab_builder'], // Afternoon Break
  17: ['english_vocab_builder'], // Evening Commute
  19: ['english_vocab_builder'], // Post-Dinner Study
  21: ['english_vocab_builder'], // Prime Evening Time
  23: ['english_vocab_builder'], // Late Night / Other Timezones Prime Time
};

export const GenerationSchedule: DailySchedule = {
  // A consistent schedule applies to every day of the week.
  0: generationDailyPattern, // Sunday
  1: generationDailyPattern, // Monday
  2: generationDailyPattern, // Tuesday
  3: generationDailyPattern, // Wednesday
  4: generationDailyPattern, // Thursday
  5: generationDailyPattern, // Friday
  6: generationDailyPattern, // Saturday
};

export const UploadSchedule: DailySchedule = {
  // A consistent schedule applies to every day of the week.
  0: uploadDailyPattern, // Sunday
  1: uploadDailyPattern, // Monday
  2: uploadDailyPattern, // Tuesday
  3: uploadDailyPattern, // Wednesday
  4: uploadDailyPattern, // Thursday
  5: uploadDailyPattern, // Friday
  6: uploadDailyPattern, // Saturday
};