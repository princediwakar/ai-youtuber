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

// Optimized generation: 7 generations daily (35 quizzes) to cover all personas evenly
const dailyPattern: HourlySchedule = {
    2: ['english_learning'],           // Generate 5 English quizzes
    3: ['cricket_trivia'],             // Generate 5 Cricket quizzes  
    4: ['psychology_facts'],           // Generate 5 Psychology quizzes
    5: ['historical_facts'],          // Generate 5 History quizzes
    6: ['geography_travel'],          // Generate 5 Geography quizzes
    7: ['science_facts'],             // Generate 5 Science quizzes
    8: ['technology_facts'],          // Generate 5 Technology quizzes
    12: ['english_learning'],           // Generate 5 English quizzes
    13: ['cricket_trivia'],             // Generate 5 Cricket quizzes  
    14: ['psychology_facts'],           // Generate 5 Psychology quizzes
    15: ['historical_facts'],          // Generate 5 History quizzes
    16: ['geography_travel'],          // Generate 5 Geography quizzes
    17: ['science_facts'],             // Generate 5 Science quizzes
    18: ['technology_facts'],          // Generate 5 Technology quizzes
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
