// lib/config.ts
/**
 * HIGH-VOLUME Vocab MCQ CHANNEL CONFIGURATION
 * Optimized for 16 daily uploads targeting #1 Vocab channel position.
 * All settings tuned for maximum throughput while maintaining quality.
 */
export const config = {
  // Job Processing Configuration - Optimized for 16 daily uploads
  GENERATE_BATCH_SIZE: 2,              // Further reduced for production serverless stability
  CREATE_FRAMES_CONCURRENCY: 2,       // Increased for parallel frame creation
  ASSEMBLY_CONCURRENCY: 1,             // Increased for video assembly speed
  UPLOAD_CONCURRENCY: 1,               // Single upload to avoid rate limits
  MAX_DAILY_UPLOADS: 20,               // Buffer above 16 target for safety

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
