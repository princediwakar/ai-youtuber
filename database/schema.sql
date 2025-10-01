-- Database schema for commit d616ba0ac1639adac6d98bd8b435dfe041008179
-- Multi-Channel YouTube Shorts Generator (Analytics System Implementation)
-- Date: September 12, 2025
-- This schema supports the comprehensive analytics system added in this commit

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Accounts table for storing OAuth and Cloudinary credentials (encrypted)
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    google_client_id_encrypted TEXT NOT NULL,
    google_client_secret_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    cloudinary_cloud_name_encrypted TEXT NOT NULL,
    cloudinary_api_key_encrypted TEXT NOT NULL,
    cloudinary_api_secret_encrypted TEXT NOT NULL,
    personas JSONB NOT NULL DEFAULT '[]',
    branding JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main jobs table for tracking video generation pipeline
CREATE TABLE quiz_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id TEXT NOT NULL,
    persona TEXT NOT NULL,
    topic TEXT NOT NULL,
    topic_display_name TEXT,
    question_format TEXT NOT NULL DEFAULT 'multiple_choice',
    generation_date TEXT NOT NULL,
    status TEXT NOT NULL,
    step INTEGER NOT NULL DEFAULT 1,
    data JSONB NOT NULL DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking uploaded videos
CREATE TABLE uploaded_videos (
    id SERIAL PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES quiz_jobs(id) ON DELETE CASCADE,
    youtube_video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    tags JSONB DEFAULT '[]',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video analytics table for comprehensive performance tracking
CREATE TABLE video_analytics (
    id SERIAL PRIMARY KEY,
    video_id TEXT NOT NULL UNIQUE,
    job_id UUID NOT NULL REFERENCES quiz_jobs(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    like_ratio DECIMAL(5,2) DEFAULT 0,
    video_uploaded_at TIMESTAMP WITH TIME ZONE,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timing analytics
    upload_hour INTEGER,
    upload_day_of_week INTEGER,
    
    -- Content metadata
    question_format TEXT,
    topic_display_name TEXT,
    persona TEXT,
    theme_name TEXT,
    audio_file TEXT,
    total_duration DECIMAL(5,2),
    frame_durations JSONB,
    
    -- Content analysis
    question_type TEXT,
    topic_category TEXT,
    hook_type TEXT,
    cta_type TEXT
);

-- Indexes for performance
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_personas ON accounts USING GIN(personas);
CREATE INDEX idx_quiz_jobs_status_step ON quiz_jobs(status, step);
CREATE INDEX idx_quiz_jobs_account_id ON quiz_jobs(account_id);
CREATE INDEX idx_quiz_jobs_persona ON quiz_jobs(persona);
CREATE INDEX idx_quiz_jobs_created_at ON quiz_jobs(created_at);
CREATE INDEX idx_uploaded_videos_job_id ON uploaded_videos(job_id);
CREATE INDEX idx_uploaded_videos_youtube_video_id ON uploaded_videos(youtube_video_id);
CREATE INDEX idx_video_analytics_video_id ON video_analytics(video_id);
CREATE INDEX idx_video_analytics_account_id ON video_analytics(account_id);
CREATE INDEX idx_video_analytics_persona ON video_analytics(persona);
CREATE INDEX idx_video_analytics_collected_at ON video_analytics(collected_at);
CREATE INDEX idx_video_analytics_engagement_rate ON video_analytics(engagement_rate);
CREATE INDEX idx_video_analytics_upload_hour ON video_analytics(upload_hour);
CREATE INDEX idx_video_analytics_question_format ON video_analytics(question_format);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at timestamps
CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_jobs_updated_at 
    BEFORE UPDATE ON quiz_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE accounts IS 'OAuth and Cloudinary credentials for each account (encrypted)';
COMMENT ON COLUMN accounts.google_client_id_encrypted IS 'Encrypted Google OAuth client ID';
COMMENT ON COLUMN accounts.google_client_secret_encrypted IS 'Encrypted Google OAuth client secret';  
COMMENT ON COLUMN accounts.refresh_token_encrypted IS 'Encrypted Google OAuth refresh token';
COMMENT ON COLUMN accounts.cloudinary_cloud_name_encrypted IS 'Encrypted Cloudinary cloud name';
COMMENT ON COLUMN accounts.cloudinary_api_key_encrypted IS 'Encrypted Cloudinary API key';
COMMENT ON COLUMN accounts.cloudinary_api_secret_encrypted IS 'Encrypted Cloudinary API secret';
COMMENT ON COLUMN accounts.personas IS 'Array of personas this account can generate (e.g., ["english_vocab_builder"])';
COMMENT ON COLUMN accounts.branding IS 'Account branding preferences (theme, audience, tone)';

COMMENT ON TABLE quiz_jobs IS 'Main pipeline jobs for video generation with analytics tracking';
COMMENT ON COLUMN quiz_jobs.account_id IS 'Account identifier (english_shots, health_shots, etc.)';
COMMENT ON COLUMN quiz_jobs.persona IS 'Content persona (english_vocab_builder, brain_health_tips, etc.)';
COMMENT ON COLUMN quiz_jobs.step IS 'Pipeline step: 1=generate, 2=frames, 3=assembly, 4=upload, 5=completed';
COMMENT ON COLUMN quiz_jobs.data IS 'JSON data containing content, frameUrls, videoUrl, analytics data, etc.';

COMMENT ON TABLE uploaded_videos IS 'Track successfully uploaded YouTube videos for analytics';
COMMENT ON COLUMN uploaded_videos.youtube_video_id IS 'YouTube video ID for analytics tracking';
COMMENT ON COLUMN uploaded_videos.uploaded_at IS 'When video was uploaded to YouTube';

COMMENT ON TABLE video_analytics IS 'Comprehensive analytics data collected from YouTube API';
COMMENT ON COLUMN video_analytics.video_id IS 'YouTube video ID (matches uploaded_videos.youtube_video_id)';
COMMENT ON COLUMN video_analytics.engagement_rate IS 'Calculated engagement rate (likes+comments)/views * 100';
COMMENT ON COLUMN video_analytics.upload_hour IS 'Hour of day when video was uploaded (0-23)';
COMMENT ON COLUMN video_analytics.upload_day_of_week IS 'Day of week when uploaded (0=Sunday, 6=Saturday)';