-- Quiz Video Generation Database Schema

-- Table for tracking quiz jobs through the 4-step pipeline
CREATE TABLE quiz_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type VARCHAR(10) NOT NULL CHECK (test_type IN ('SAT', 'GMAT', 'GRE')),
  subject VARCHAR(50) NOT NULL CHECK (subject IN ('Math', 'Verbal', 'Reading', 'Writing', 'Quantitative')),
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'frames_pending', 'assembly_pending', 'upload_pending', 'completed', 'failed')),
  step INTEGER DEFAULT 1 CHECK (step BETWEEN 1 AND 4),
  data JSONB DEFAULT '{}',
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
CREATE INDEX idx_quiz_jobs_test_type_subject ON quiz_jobs(test_type, subject);
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
INSERT INTO quiz_jobs (test_type, subject, difficulty, status, step, data) VALUES
('SAT', 'Math', 'medium', 'pending', 1, '{}'),
('GMAT', 'Verbal', 'hard', 'pending', 1, '{}'),
('GRE', 'Quantitative', 'easy', 'pending', 1, '{}');