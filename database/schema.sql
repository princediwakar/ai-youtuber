-- Quiz Video Generation Database Schema

-- Table for tracking quiz jobs through the 4-step pipeline
CREATE TABLE quiz_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona VARCHAR(30) NOT NULL CHECK (persona IN ('vocabulary', 'current_affairs', 'test_prep', 'general_knowledge', 'language_learning')),
  category VARCHAR(50) NOT NULL, -- e.g., 'english', 'current_affairs', 'sat_math', 'general_knowledge'
  question_format VARCHAR(30) NOT NULL, -- e.g., 'multiple_choice', 'fill_blank', 'true_false', 'match_pairs'
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('beginner', 'easy', 'medium', 'hard', 'expert')),
  language VARCHAR(10) DEFAULT 'en' NOT NULL, -- Support for multiple languages
  target_audience VARCHAR(20) DEFAULT 'general', -- 'students', 'professionals', 'general', 'kids'
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'frames_pending', 'assembly_pending', 'upload_pending', 'completed', 'failed')),
  step INTEGER DEFAULT 1 CHECK (step BETWEEN 1 AND 4),
  data JSONB DEFAULT '{}', -- Flexible JSON for question data, metadata, etc.
  tags JSONB DEFAULT '[]', -- For categorization and search
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking successfully uploaded videos
CREATE TABLE uploaded_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES quiz_jobs(id) ON DELETE CASCADE,
  youtube_video_id VARCHAR(50) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  tags JSONB DEFAULT '[]',
  view_count INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_quiz_jobs_status_step ON quiz_jobs(status, step);
CREATE INDEX idx_quiz_jobs_created_at ON quiz_jobs(created_at);
CREATE INDEX idx_quiz_jobs_persona_category ON quiz_jobs(persona, category);
CREATE INDEX idx_quiz_jobs_difficulty_audience ON quiz_jobs(difficulty, target_audience);
CREATE INDEX idx_quiz_jobs_language ON quiz_jobs(language);
CREATE INDEX idx_quiz_jobs_tags ON quiz_jobs USING GIN(tags);
CREATE INDEX idx_uploaded_videos_job_id ON uploaded_videos(job_id);
CREATE INDEX idx_uploaded_videos_uploaded_at ON uploaded_videos(uploaded_at);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_quiz_jobs_updated_at 
    BEFORE UPDATE ON quiz_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uploaded_videos_updated_at 
    BEFORE UPDATE ON uploaded_videos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO quiz_jobs (persona, category, question_format, difficulty, target_audience, tags, status, step, data) VALUES
('vocabulary', 'english', 'multiple_choice', 'medium', 'general', '["vocabulary", "word_meaning", "education"]', 'pending', 1, '{}'),
('vocabulary', 'english', 'fill_blank', 'hard', 'students', '["vocabulary", "synonyms", "antonyms"]', 'pending', 1, '{}'),
('current_affairs', 'world_news', 'multiple_choice', 'easy', 'general', '["current_affairs", "news", "world"]', 'pending', 1, '{}');