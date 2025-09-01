# Gemini Project: Automated YouTube Shorts English Vocabulary Quiz Generator

This document provides context for the Gemini AI assistant to understand and work with this project.

## 1\. Project Context

This project is an automated system that generates and uploads **English vocabulary quiz videos as YouTube Shorts**. The entire pipeline is designed to create engaging, short-form content for a **global audience of English language learners**.

The system is deployed as a single Next.js application on Vercel.

## 2\. Local Development Setup

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

## 3\. Environment Variables

The following environment variables are required in `.env.local`:

  * `NEXTAUTH_URL`: The canonical URL of the application (e.g., `http://localhost:3000`).
  * `NEXTAUTH_SECRET`: A secret string used for token hashing and signing.
  * `GOOGLE_CLIENT_ID`: The client ID for Google OAuth.
  * `GOOGLE_CLIENT_SECRET`: The client secret for Google OAuth.
  * `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for frame storage.
  * `CLOUDINARY_API_KEY`: Cloudinary API key.
  * `CLOUDINARY_API_SECRET`: Cloudinary API secret.
  * `DEEPSEEK_API_KEY`: API key for the DeepSeek AI model.
  * `CRON_SECRET`: A secret key to authorize cron job requests.

## 4\. Authentication Flow

Authentication is handled by **NextAuth.js** using Google as the OAuth provider.

  * The configuration is located in `lib/auth.ts`.
  * It requests access to the user's YouTube account (`youtube` and `youtube.upload` scopes).
  * It uses a JSON Web Token (JWT) strategy with refresh token rotation to maintain the session.

## 5\. API Endpoint Overview

The application's core logic is exposed under `/api/`.

  * **/api/auth/**: Handles NextAuth.js authentication routes.
  * **/api/jobs/**: Manages the English vocabulary quiz video generation pipeline.
      * `generate-quiz`: Creates new vocabulary quiz questions.
      * `create-frames`: Generates video frames from questions.
      * `assemble-video`: Compiles frames into a video file.
      * `upload-quiz-videos`: Uploads the final video to YouTube.
  * **/api/quiz-dashboard/**: Provides data for the generation monitoring dashboard.

## 6\. Directory Structure

The project follows a standard Next.js project structure:

```
/
├── app/                  # Main application code
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth.js authentication
│   │   └── jobs/         # Quiz generation pipeline jobs
│   ├── page.tsx          # Monitoring Dashboard UI
│   └── ...
├── database/             # Database schema
│   └── schema.sql
├── lib/                  # Shared libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── database.ts       # Database utilities
│   ├── generationService.ts # Vocabulary quiz generation service
│   ├── personas.ts       # Defines the 'english_vocab_builder' persona
│   ├── schedule.ts       # Generation and upload schedules
│   └── playlistManager.ts # Manages topic-based YouTube playlists
├── public/               # Static assets
├── .env.example          # Environment variables example
└── ...
```

## 7\. Database Schema

The database schema is defined in `database/schema.sql`. It consists of two main tables:

  * `quiz_jobs`: Stores the state of each step in the English vocabulary quiz generation pipeline.
  * `uploaded_videos`: Stores metadata about the videos successfully uploaded to YouTube.

## 8\. Quiz Generation and Upload Pipeline

The system uses a 4-step, fully automated pipeline:

**Content Coverage:**

  * The system is built around a single, comprehensive persona: **`english_vocab_builder`**.
  * This persona covers a wide variety of topics, including Synonyms, Antonyms, Phrasal Verbs, Idioms, Thematic Vocabulary, and more.

**Pipeline Process:**

1.  **Question Generation**: Cron jobs call `/api/jobs/generate-quiz` to create English vocabulary questions using the DeepSeek API.
2.  **Frame Creation**: Cron jobs call `/api/jobs/create-frames` to generate video frames for the quiz using the Canvas API.
3.  **Video Assembly**: Cron jobs call `/api/jobs/assemble-video` to compile the frames into a short video using FFmpeg.
4.  **YouTube Upload**: Cron jobs call `/api/jobs/upload-quiz-videos` to upload the final video to YouTube with optimized metadata.

**Scheduling:**

  * **Generation**: **3 batches daily** (2 AM, 10 AM, 6 PM) to create a steady buffer of content (9 quizzes/day).
  * **Upload**: **8 uploads daily**, spread throughout the day to maximize reach across global time zones.

The entire pipeline is monitored via the dashboard at the root URL (`/`).

## 9\. Testing with Playwright MCP

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

## 10\. Development Workflow

Please follow this workflow:

1.  Make your changes to the codebase.
2.  Before committing, run the build command to check for errors:
    ```bash
    npm run build
    ```
3.  Once the build succeeds, commit your changes.

## 11\. Content Structure

The content is organized around a single, comprehensive persona system:

  * **Single Persona**: `english_vocab_builder` is the sole focus.
  * **Sub-categories**: The persona is divided into multiple sub-categories (e.g., Synonyms, Idioms) to provide a rich variety of quiz content.
  * **Targeted Prompts**: AI prompts are tailored to generate high-quality, intermediate-level vocabulary questions.

## 12\. Deployment

The production URL for this project is: [https://aiyoutuber.vercel.app/](https://aiyoutuber.vercel.app/)