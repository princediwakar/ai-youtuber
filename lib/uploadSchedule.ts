/**
 * Defines the daily content UPLOAD schedule.
 * This file acts as the master content calendar for your YouTube channel.
 * The upload API will run frequently (e.g., every 15-30 minutes), but will only
 * upload videos for personas scheduled during the current hour.
 *
 * The key is the hour of the day (0-23) in a 24-hour format (IST).
 * The value is an array of persona keys to be published during that hour.
 */
interface HourlySchedule {
    [hour: number]: string[];
  }
  
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  type DailySchedule = Record<number, HourlySchedule>;
  
  export const UploadSchedule: DailySchedule = {
    // Weekday Schedule (Monday to Friday)
    1: { // Monday
      8: ['english_learning'], // 8 AM: English video to start the day
      16: ['upsc_prep'],       // 4 PM: UPSC content for afternoon study
      20: ['current_affairs'], // 8 PM: Daily news recap
    },
    2: { // Tuesday
      8: ['english_learning'],
      16: ['upsc_prep'],
      20: ['current_affairs'],
    },
    3: { // Wednesday
      8: ['english_learning'],
      16: ['upsc_prep'],
      20: ['current_affairs'],
    },
    4: { // Thursday
      8: ['english_learning'],
      16: ['upsc_prep'],
      20: ['current_affairs'],
    },
    5: { // Friday
      8: ['english_learning'],
      16: ['upsc_prep'],
      20: ['current_affairs'],
    },
  
    // Weekend Schedule (Saturday & Sunday)
    6: { // Saturday
      10: ['current_affairs'], // 10 AM: Weekend news
      14: ['english_learning'], // 2 PM: Weekend learning
    },
    0: { // Sunday
      10: ['current_affairs'], // 10 AM: Weekend news
      14: ['upsc_prep'],       // 2 PM: Weekend study session
    },
  };
  