/**
 * Defines the daily content UPLOAD schedule, thinking like a teacher.
 * This file acts as the master content calendar for your YouTube channel.
 * The schedule is designed to publish exactly 4 videos per persona, each day,
 * for a total of 28 daily uploads across 7 personas.
 *
 * The key is the hour of the day (0-23) in a 24-hour format (IST).
 * The value is an array of persona keys to be published during that hour.
 */
interface HourlySchedule {
  [hour: number]: string[];
}

// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
type DailySchedule = Record<number, HourlySchedule>;

// Upload schedule: Daytime focus (6 AM - 11 PM) when audiences are most active
const dailyPattern: HourlySchedule = {
    6: ['english_learning'],                        // Morning commute
    7: ['cricket_trivia'],                          // Morning cricket check
    8: ['science_facts'],                           // Morning curiosity
    9: ['geography_travel'],                        // Morning planning
    10: ['psychology_facts'],                       // Mid-morning break
    11: ['technology_facts'],                       // Pre-lunch tech
    12: ['cricket_trivia', 'english_learning'],     // Lunch break (double slot)
    13: ['historical_facts'],                       // Post-lunch learning
    14: ['english_learning'],                       // Afternoon study
    15: ['science_facts'],                          // Afternoon discovery
    16: ['geography_travel'],                       // Afternoon dreaming
    17: ['psychology_facts', 'historical_facts'],   // End of workday (double slot)
    18: ['technology_facts'],                       // Evening tech
    19: ['cricket_trivia'],                         // Evening cricket
    20: ['historical_facts', 'science_facts'],      // Prime time (double slot)
    21: ['english_learning', 'psychology_facts'],   // Evening study (double slot)
    22: ['geography_travel'],                       // Late evening travel
    23: ['technology_facts'],                       // Late evening tech
}

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
