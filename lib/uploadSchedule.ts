/**
 * Defines the daily content UPLOAD schedule, thinking like a teacher.
 * This file acts as the master content calendar for your YouTube channel.
 * The schedule is designed to publish exactly 5 videos per persona, each day,
 * for a total of 15 daily uploads.
 *
 * The key is the hour of the day (0-23) in a 24-hour format (IST).
 * The value is an array of persona keys to be published during that hour.
 */
interface HourlySchedule {
  [hour: number]: string[];
}

// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
type DailySchedule = Record<number, HourlySchedule>;

// This pattern creates 15 upload slots per day, 5 for each persona.
const dailyPattern: HourlySchedule = {
    8: ['english_learning'],  // 8 AM
    9: ['upsc_prep'],         // 9 AM
    10: ['current_affairs'],   // 10 AM
    11: ['english_learning'],  // 11 AM
    12: ['upsc_prep'],         // 12 PM
    13: ['current_affairs'],   // 1 PM
    14: ['english_learning'],  // 2 PM
    15: ['upsc_prep'],         // 3 PM
    16: ['current_affairs'],   // 4 PM
    17: ['english_learning'],  // 5 PM
    18: ['upsc_prep'],         // 6 PM
    19: ['current_affairs'],   // 7 PM
    20: ['english_learning'],  // 8 PM
    21: ['upsc_prep'],         // 9 PM
    22: ['current_affairs'],   // 10 PM
};

export const UploadSchedule: DailySchedule = {
  // The same consistent schedule applies to every day of the week.
  0: dailyPattern, // Sunday
  1: dailyPattern, // Monday
  2: dailyPattern, // Tuesday
  3: dailyPattern, // Wednesday
  4: dailyPattern, // Thursday
  5: dailyPattern, // Friday
  6: dailyPattern, // Saturday
};
