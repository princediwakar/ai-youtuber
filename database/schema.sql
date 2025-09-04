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
--  Schema setup complete.
-- =================================================================
