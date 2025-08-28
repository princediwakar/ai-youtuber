/**
 * Defines the daily content generation schedule.
 * The cron job will trigger the generation API every hour, and this schedule
 * determines which persona's content gets generated during that specific hour.
 *
 * The key is the hour of the day (0-23) in a 24-hour format.
 * The value is an array of persona keys to be generated during that hour.
 */
interface HourlySchedule {
    [hour: number]: string[];
  }
  
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  type DailySchedule = Record<number, HourlySchedule>;

// This pattern creates 3 generation slots per day, 5 for each run.
const dailyPattern: HourlySchedule = {
    5: ['english_learning'],  // 5 AM
    6: ['upsc_prep'],         // 6 AM
    7: ['current_affairs'],   // 7 AM
};

export const GenerationSchedule: DailySchedule = {
  // The same consistent schedule applies to every day of the week.
  0: dailyPattern, // Sunday
  1: dailyPattern, // Monday
  2: dailyPattern, // Tuesday
  3: dailyPattern, // Wednesday
  4: dailyPattern, // Thursday
  5: dailyPattern, // Friday
  6: dailyPattern, // Saturday
};
