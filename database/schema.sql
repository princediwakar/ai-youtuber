-- =================================================================
--      Automated Video Generation - Production Database Schema
-- =================================================================

-- Drop existing objects in reverse order of dependency to ensure a clean setup.
DROP TRIGGER IF EXISTS set_quiz_jobs_updated_at ON quiz_jobs;
DROP TRIGGER IF EXISTS set_uploaded_videos_updated_at ON uploaded_videos;
DROP FUNCTION IF EXISTS trigger_set_timestamp();
DROP TABLE IF EXISTS uploaded_videos;
DROP TABLE IF EXISTS quiz_jobs;

-- =================================================================
--  Helper Function for Timestamps
-- =================================================================

-- A single, reusable function to automatically update the 'updated_at' timestamp on any table.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
--  Primary Table: quiz_jobs
-- =================================================================

-- This table tracks each piece of content through the entire generation pipeline.
CREATE TABLE quiz_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core Persona & Curriculum Information
    persona VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    topic VARCHAR(100),
    category_display_name VARCHAR(255),
    topic_display_name VARCHAR(255),

    -- Job Status & Pipeline Control
    status VARCHAR(20) NOT NULL DEFAULT 'frames_pending' CHECK (status IN ('frames_pending', 'assembly_pending', 'upload_pending', 'completed', 'failed')),
    step SMALLINT NOT NULL DEFAULT 2,
    error_message TEXT,

    -- Analytics & Routing Fields (kept for potential future use)
    question_format VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
    difficulty VARCHAR(50) NOT NULL DEFAULT 'medium',

    -- Time-sensitive Field for Personas like Current Affairs
    generation_date TIMESTAMPTZ,

    -- Dynamic Data Payload
    -- Using JSONB is critical for performance and the ability to index the contents.
    data JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE quiz_jobs IS 'Tracks the state of each content generation job from creation to completion.';
COMMENT ON COLUMN quiz_jobs.persona IS 'The content persona, e.g., ''upsc_prep'', ''english_learning''.';
COMMENT ON COLUMN quiz_jobs.category IS 'The machine-readable category key from the curriculum, e.g., ''gs_paper_1''.';
COMMENT ON COLUMN quiz_jobs.topic IS 'The machine-readable topic key from the curriculum, e.g., ''history''.';
COMMENT ON COLUMN quiz_jobs.data IS 'Stores the AI-generated question, frame URLs, video URL, etc.';


-- =================================================================
--  Secondary Table: uploaded_videos
-- =================================================================

-- This table stores a record of every video successfully uploaded to YouTube.
CREATE TABLE uploaded_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES quiz_jobs(id) ON DELETE CASCADE,
    youtube_video_id VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags JSONB,
    view_count INTEGER DEFAULT 0,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE uploaded_videos IS 'Stores metadata for videos successfully uploaded to YouTube.';
COMMENT ON COLUMN uploaded_videos.job_id IS 'A foreign key linking back to the original job.';


-- =================================================================
--  Indexes for Performance
-- =================================================================

-- Crucial for the 'getPendingJobs' function to quickly find work to do.
CREATE INDEX idx_jobs_pending ON quiz_jobs(status, step);

-- For analytics and filtering by content type.
CREATE INDEX idx_jobs_persona_category_topic ON quiz_jobs(persona, category, topic);

-- Allows for efficient querying of the JSONB data column.
CREATE INDEX idx_jobs_data ON quiz_jobs USING gin(data);

-- Ensures fast lookups of videos by their parent job.
CREATE INDEX idx_videos_job_id ON uploaded_videos(job_id);


-- =================================================================
--  Triggers for Automatic Timestamp Updates
-- =================================================================

-- Trigger for the quiz_jobs table
CREATE TRIGGER set_quiz_jobs_updated_at
BEFORE UPDATE ON quiz_jobs
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Trigger for the uploaded_videos table
CREATE TRIGGER set_uploaded_videos_updated_at
BEFORE UPDATE ON uploaded_videos
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- =================================================================
--  Schema setup complete.
-- =================================================================
