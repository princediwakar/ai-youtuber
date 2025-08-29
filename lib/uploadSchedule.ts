/**
 * STRATEGIC NEET UPLOAD SCHEDULE FOR #1 CHANNEL DOMINANCE
 * 
 * 6 daily uploads optimized for NEET aspirant study patterns and peak engagement.
 * Timing based on typical NEET student routine: Early morning motivation → 
 * Coaching breaks → Evening intensive study → Night revision.
 * 
 * Target: 16 uploads/day (6 slots × 2.67 avg) for maximum market capture.
 */
interface HourlySchedule {
  [hour: number]: string[];
}

// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
type DailySchedule = Record<number, HourlySchedule>;

const dailyPattern: HourlySchedule = {
    // 6 strategic upload slots for maximum NEET student reach
    
    6: ['neet_preparation', 'neet_preparation', 'neet_preparation'],    
    // 6:30 AM: Morning Motivation Batch - Start day with confidence boosters
    
    12: ['neet_preparation', 'neet_preparation'],                       
    // 12:30 PM: Lunch Break Revision - Quick MCQs during coaching break
    
    16: ['neet_preparation', 'neet_preparation'],                       
    // 4:00 PM: Post-Coaching Session - Reinforce concepts learned
    
    18: ['neet_preparation', 'neet_preparation', 'neet_preparation'],   
    // 6:00 PM: Evening Study Launch - Prime study time begins
    
    20: ['neet_preparation', 'neet_preparation', 'neet_preparation'],   
    // 8:00 PM: Intensive Study Hours - Biology focus (highest weightage)
    
    22: ['neet_preparation', 'neet_preparation', 'neet_preparation'],   
    // 10:00 PM: Night Revision - End day with challenging concepts
}

export const UploadSchedule: DailySchedule = {
  // A consistent daily schedule that NEET aspirants can build their study routine around.
  0: dailyPattern, // Sunday
  1: dailyPattern, // Monday
  2: dailyPattern, // Tuesday
  3: dailyPattern, // Wednesday
  4: dailyPattern, // Thursday
  5: dailyPattern, // Friday
  6: dailyPattern, // Saturday
};