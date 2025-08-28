/**
 * Centralized configuration for the entire video generation system.
 * Use environment variables for sensitive data or values that differ by environment.
 */
export const config = {
  // Job Processing Configuration
  GENERATE_BATCH_SIZE: 5,
  CREATE_FRAMES_CONCURRENCY: 2,
  ASSEMBLY_CONCURRENCY: 1,
  UPLOAD_CONCURRENCY: 2,
  // 💡 FIX: Increased the daily upload limit to accommodate the generation schedule.
  MAX_DAILY_UPLOADS: 20,

  // Video & Frame Dimensions
  VIDEO_WIDTH: 1080,
  VIDEO_HEIGHT: 1920,

  // Cloudinary Configuration
  CLOUDINARY_FRAMES_FOLDER: 'quiz-frames',
  CLOUDINARY_VIDEOS_FOLDER: 'quiz-videos',

  // YouTube Configuration
  YOUTUBE_CATEGORY_ID: '27', // 27 = Education

  // System & Debugging
  DEBUG_MODE: process.env.DEBUG_MODE === 'true',
};
