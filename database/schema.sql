-- =================================================================
--      Automated Video Generation - Production Database Schema
-- =================================================================

-- Drop existing objects in reverse order of dependency to ensure a clean setup.
DROP TRIGGER IF EXISTS set_accounts_updated_at ON accounts;
DROP TRIGGER IF EXISTS set_quiz_jobs_updated_at ON quiz_jobs;
DROP TRIGGER IF EXISTS set_uploaded_videos_updated_at ON uploaded_videos;
DROP FUNCTION IF EXISTS trigger_set_timestamp();
DROP TABLE IF EXISTS uploaded_videos;
DROP TABLE IF EXISTS quiz_jobs;
DROP TABLE IF EXISTS accounts;

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
--  Accounts Table
-- =================================================================

-- This table stores account configurations and encrypted credentials.
CREATE TABLE accounts (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'english_shots', 'health_shots'
    name VARCHAR(100) NOT NULL, -- Display name
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- OAuth Credentials (encrypted)
    google_client_id_encrypted TEXT NOT NULL,
    google_client_secret_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    
    -- Cloudinary Credentials (encrypted)
    cloudinary_cloud_name_encrypted TEXT NOT NULL,
    cloudinary_api_key_encrypted TEXT NOT NULL,
    cloudinary_api_secret_encrypted TEXT NOT NULL,
    
    -- Account Configuration
    personas JSONB NOT NULL, -- Array of persona names
    branding JSONB NOT NULL, -- Theme, audience, tone settings
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE accounts IS 'Stores account configurations and encrypted credentials for multi-channel operation.';
COMMENT ON COLUMN accounts.personas IS 'Array of persona names associated with this account.';
COMMENT ON COLUMN accounts.branding IS 'Account branding configuration (theme, audience, tone).';

-- =================================================================
--  Primary Table: quiz_jobs
-- =================================================================

-- This table tracks each piece of content through the entire generation pipeline.
CREATE TABLE quiz_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Account Reference
    account_id VARCHAR(50) NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,

    -- Core Persona & Content Information
    persona VARCHAR(50) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    topic_display_name VARCHAR(255),

    -- Job Status & Pipeline Control
    status VARCHAR(20) NOT NULL DEFAULT 'frames_pending' CHECK (status IN ('frames_pending', 'assembly_pending', 'upload_pending', 'completed', 'failed')),
    step SMALLINT NOT NULL DEFAULT 2,
    error_message TEXT,

    -- Analytics & Routing Fields (kept for potential future use)
    question_format VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',

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
COMMENT ON COLUMN quiz_jobs.account_id IS 'Foreign key reference to the accounts table.';
COMMENT ON COLUMN quiz_jobs.persona IS 'The content persona, e.g., ''eng_vocabulary_builder''.';
COMMENT ON COLUMN quiz_jobs.topic IS 'The machine-readable topic key from the persona config, e.g., ''physics_units_measurements''.';
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

-- For analytics and filtering by account and content type.
CREATE INDEX idx_jobs_account_persona ON quiz_jobs(account_id, persona);
CREATE INDEX idx_jobs_persona_topic ON quiz_jobs(persona, topic);
CREATE INDEX idx_jobs_account_status ON quiz_jobs(account_id, status);

-- Allows for efficient querying of the JSONB data column.
CREATE INDEX idx_jobs_data ON quiz_jobs USING gin(data);

-- Ensures fast lookups of videos by their parent job.
CREATE INDEX idx_videos_job_id ON uploaded_videos(job_id);


-- =================================================================
--  Triggers for Automatic Timestamp Updates
-- =================================================================

-- Trigger for the accounts table
CREATE TRIGGER set_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

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
--  Video Analytics Table
-- =================================================================

-- This table stores YouTube video performance analytics collected 24+ hours after upload
CREATE TABLE video_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    video_id VARCHAR(50) NOT NULL, -- YouTube video ID
    job_id UUID NOT NULL REFERENCES quiz_jobs(id) ON DELETE CASCADE,
    account_id VARCHAR(50) NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    
    -- Analytics Data
    views BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    dislikes BIGINT DEFAULT 0, -- May be 0 due to YouTube API changes
    
    -- Engagement Metrics (calculated)
    engagement_rate DECIMAL(5,2) DEFAULT 0.00, -- (likes + comments) / views * 100
    like_ratio DECIMAL(5,2) DEFAULT 0.00, -- likes / views * 100
    
    -- Collection Metadata
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    video_uploaded_at TIMESTAMPTZ NOT NULL, -- When the video was originally uploaded
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE video_analytics IS 'Stores YouTube video performance metrics collected 24+ hours after upload for content optimization.';
COMMENT ON COLUMN video_analytics.video_id IS 'YouTube video ID for API reference.';
COMMENT ON COLUMN video_analytics.engagement_rate IS 'Calculated engagement rate as (likes + comments) / views * 100.';
COMMENT ON COLUMN video_analytics.collected_at IS 'When these analytics were collected from YouTube API.';

-- =================================================================
--  Analytics Indexes for Performance
-- =================================================================

-- For efficient analytics queries by account and time
CREATE INDEX idx_analytics_account_collected ON video_analytics(account_id, collected_at DESC);
CREATE INDEX idx_analytics_video_id ON video_analytics(video_id);
CREATE INDEX idx_analytics_job_id ON video_analytics(job_id);

-- For performance analysis queries
CREATE INDEX idx_analytics_engagement ON video_analytics(account_id, engagement_rate DESC);
CREATE INDEX idx_analytics_views ON video_analytics(account_id, views DESC);

-- Unique constraint to prevent duplicate analytics for same video/collection time
CREATE UNIQUE INDEX idx_analytics_unique_collection ON video_analytics(video_id, DATE(collected_at));

-- =================================================================
--  Analytics Trigger for Automatic Timestamp Updates
-- =================================================================

-- Trigger for the video_analytics table
CREATE TRIGGER set_video_analytics_updated_at
BEFORE UPDATE ON video_analytics
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- =================================================================
--  Schema setup complete.
-- =================================================================
