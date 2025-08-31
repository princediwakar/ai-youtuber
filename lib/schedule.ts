/**
 * NEET-FOCUSED Generation Schedule for #1 NEET MCQ Channel Dominance
 * 
 * Strategy: 6 daily generations (18 total questions = 6 generations × 3 batch size) 
 * perfectly aligned with 16 daily upload slots (2 extras for quality selection).
 * 
 * Distribution aligned with NEET exam weightage:
 * - Biology: 60% (4 generations) - Morning, Evening, Prime time, Night
 * - Chemistry: 20% (1 generation) - Mid-morning  
 * - Physics: 20% (1 generation) - Afternoon
 */

interface HourlySchedule {
  [hour: number]: string[]
}
  
// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
type DailySchedule = Record<number, HourlySchedule>;

// OPTIMIZED: Generate exactly what we need (16 uploads = ~6 generation batches)
const dailyPattern: HourlySchedule = {
    // Morning batch (for 6:30 AM - 3 uploads)
    2: ['neet_biology'],      // Biology focus - 3 questions
    6: ['neet_biology'],     // Biology focus - 3 questions
    
    // Mid-morning batch (for 12:30 PM - 2 uploads)  
    3: ['neet_chemistry'],    // Chemistry focus - 3 questions (1 extra for selection)
    
    // Afternoon batch (for 4:00 PM - 2 uploads)
    4: ['neet_physics'],     // Physics focus - 3 questions (1 extra for selection)
    14: ['neet_physics'],     // Physics focus - 3 questions (1 extra for selection)
    
    // Evening batch (for 6:00 PM - 3 uploads)
    5: ['neet_biology'],     // Biology focus - 3 questions
    
    // Prime time batch (for 8:00 PM - 3 uploads)
    16: ['neet_biology'],     // Biology focus - 3 questions
    
    // Night batch (for 10:00 PM - 3 uploads)
    21: ['neet_biology'],     // Biology focus - 3 questions
};

// Upload schedule optimized for NEET student engagement patterns
const uploadDailyPattern: HourlySchedule = {
  6: ['neet_biology', 'neet_biology', 'neet_biology'],    // 6:30 AM - Morning motivation
  8: ['neet_biology', 'neet_biology'],                    // 8:00 AM - Start day strong
  12: ['neet_chemistry', 'neet_chemistry'],               // 12:00 PM - Lunch break revision
  16: ['neet_physics', 'neet_physics'],                   // 4:00 PM - Post-coaching
  18: ['neet_biology', 'neet_biology', 'neet_biology'],   // 6:00 PM - Evening study launch
  20: ['neet_biology', 'neet_biology', 'neet_biology'],   // 8:00 PM - Prime study hours
  22: ['neet_biology', 'neet_chemistry', 'neet_physics'], // 10:00 PM - Night revision
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

export const UploadSchedule: DailySchedule = {
  0: uploadDailyPattern, // Sunday
  1: uploadDailyPattern, // Monday
  2: uploadDailyPattern, // Tuesday
  3: uploadDailyPattern, // Wednesday
  4: uploadDailyPattern, // Thursday
  5: uploadDailyPattern, // Friday
  6: uploadDailyPattern, // Saturday
};
