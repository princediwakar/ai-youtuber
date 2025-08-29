# Gemini Project: Universal YouTube Uploader & Educational Quiz Video Generator

This document provides context for the Gemini AI assistant to understand and work with this project.

## 1. Project Context

This project consists of two main components:

*   **Universal YouTube Uploader**: A web application that allows users to upload multiple videos to their YouTube channels with intelligent playlists, smart descriptions, and automatic content detection.
*   **Educational Quiz Video Generation System**: An automated system that generates educational quiz videos for Indian students covering Class 10-12 subjects and competitive exams (NEET, JEE, SSC, Banking, UPSC) and uploads them to YouTube as Shorts.

The two systems share the same codebase and are deployed as a single Next.js application on Vercel.

## 2. Local Development Setup

To get the project running locally, follow these steps:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables**:
    Copy the `.env.example` file to a new file named `.env.local` and fill in the required values.
    ```bash
    cp .env.example .env.local
    ```
3.  **Setup Database**:
    Run the database setup script to initialize the database schema.
    ```bash
    node setup-database.js
    ```
4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
The application should now be running at `http://localhost:3000`.

## 3. Project Configuration

*   **Neon Project ID**: `crimson-haze-61309062`

## 4. Environment Variables

The following environment variables are required for the application to run. These should be defined in the `.env.local` file.

*   `NEXTAUTH_URL`: The canonical URL of the application. For local development, this is `http://localhost:3000`.
*   `NEXTAUTH_SECRET`: A secret string used to hash tokens, sign cookies, and generate cryptographic keys.
*   `GOOGLE_CLIENT_ID`: The client ID for Google OAuth, obtained from the Google Cloud Console.
*   `GOOGLE_CLIENT_SECRET`: The client secret for Google OAuth.

## 5. Authentication Flow

Authentication is handled by NextAuth.js, configured to use Google as the OAuth provider.

*   The configuration is located in `lib/auth.ts`.
*   It uses the Google Provider to authenticate users and requests access to their YouTube account (`youtube` and `youtube.upload` scopes).
*   It implements a JSON Web Token (JWT) strategy with refresh token rotation to maintain the user's session and access to the YouTube API.
*   Custom sign-in and error pages are defined in `pages/auth/`.

## 6. API Endpoint Overview

The application exposes several API endpoints under `/api/`.

*   **/api/auth/**: Handles NextAuth.js authentication routes.
*   **/api/jobs/**: Manages the educational quiz video generation pipeline.
    *   `generate-quiz`: Creates new educational quiz questions for Class 10-12 and competitive exams.
    *   `create-frames`: Generates video frames from questions.
    *   `assemble-video`: Compiles frames into a video file.
    *   `upload-quiz-videos`: Uploads the final video to YouTube.
*   **/api/youtube/**: Interacts with the YouTube API for the uploader functionality.
    *   `analyze-playlist`: Analyzes the content of a YouTube playlist.
    *   `analyze-video`: Analyzes a single video's metadata.
    *   `playlist`: Creates and fetches user's playlists.
    *   `playlist-videos`: Fetches videos within a specific playlist.
    *   `suggest-category`: Suggests a YouTube category for a video.
    *   `upload`: Handles direct video uploads.
    *   `upload-optimized`: Handles uploads with additional optimizations.
*   **/api/quiz-dashboard/**: Provides data for the quiz generation monitoring dashboard.

## 7. Directory Structure

The project follows a standard Next.js project structure:

```
/
├── app/                  # Main application code
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth.js authentication
│   │   ├── jobs/         # Quiz generation pipeline jobs
│   │   └── youtube/      # YouTube API integration
│   ├── quiz-dashboard/   # Quiz generation dashboard
│   └── ...
├── database/             # Database schema
│   └── schema.sql
├── lib/                  # Shared libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── database.ts       # Database utilities
│   ├── deepseek.ts       # DeepSeek API integration
│   ├── personas.ts       # Educational content structure (10 academic personas)
│   ├── generationService.ts # Academic content generation with exam-specific prompts
│   ├── schedule.ts       # Generation schedule (50 daily questions)
│   ├── uploadSchedule.ts # Student-optimized upload timing
│   └── playlistManager.ts # Academic playlist organization
├── public/               # Static assets
├── .env.example          # Environment variables example
├── next.config.js        # Next.js configuration
├── package.json          # Dependencies
└── ...
```

## 8. Database Schema

The database schema is defined in `database/schema.sql`. It consists of two tables:

*   `quiz_jobs`: Stores the state of the educational quiz generation jobs with academic persona information.
*   `uploaded_videos`: Stores information about the educational videos uploaded to YouTube.

```sql
-- quiz_jobs table
CREATE TABLE quiz_jobs (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payload JSONB,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- uploaded_videos table
CREATE TABLE uploaded_videos (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES quiz_jobs(id),
    video_title VARCHAR(255) NOT NULL,
    video_description TEXT,
    youtube_video_id VARCHAR(255) NOT NULL,
    upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 9. Educational Quiz Generation and Upload Pipeline

The system uses a 4-step pipeline to automatically generate and upload educational quiz videos covering 10 academic personas:

**Academic Content Coverage:**
*   **Class 10-12 Subjects**: Mathematics, Physics, Chemistry, Biology
*   **Competitive Exams**: NEET (Medical), JEE (Engineering), SSC/Banking, UPSC (Civil Services)
*   **Foundation**: English Grammar, General Knowledge

**Pipeline Process:**
1.  **Question Generation**: Cron jobs call the `/api/jobs/generate-quiz` endpoint to generate 50 educational quiz questions daily (5 per persona) using the DeepSeek API with exam-specific prompts.
2.  **Frame Creation**: Cron jobs call the `/api/jobs/create-frames` endpoint to generate video frames using the Canvas API.
3.  **Video Assembly**: Cron jobs call the `/api/jobs/assemble-video` endpoint to combine the frames into a video using FFmpeg.
4.  **YouTube Upload**: Cron jobs call the `/api/jobs/upload-quiz-videos` endpoint to upload the generated videos to YouTube.

**Scheduling:**
*   **Generation**: 2-11 AM daily (10 hours, 1 persona per hour)
*   **Upload**: 6 AM-11 PM (student-optimized timing aligned with Indian study patterns)

These jobs are orchestrated by external cron jobs (e.g., from cron-job.org) and the entire process can be monitored from the `/quiz-dashboard`.

## 10. Testing with Playwright MCP

This project is configured with Playwright MCP for direct browser testing:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

## 11. Development Workflow

To ensure the project is always in a good state, please follow this workflow:

1.  Make your changes to the codebase.
2.  After any major change, and always before committing to GitHub, run the build command to ensure there are no build errors:

    ```bash
    npm run build
    ```
3.  Once the build is successful, you can commit your changes.

## 12. Educational Content Structure

The educational content is organized through a comprehensive persona system:

*   **10 Academic Personas**: Each persona represents a subject area or exam type
*   **Hierarchical Structure**: Persona → Category → Subcategory for organized content
*   **Exam-Specific Prompts**: AI prompts tailored for each educational context
*   **Progressive Difficulty**: Content ranges from Class 10 basics to advanced competitive exam level
*   **Indian Education Focus**: Aligned with CBSE, ICSE, and major competitive exam patterns

## 13. Deployment

The production URL for this project is: https://youtube-playlist-uploader.vercel.app/
