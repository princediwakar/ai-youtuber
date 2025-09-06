-- =================================================================
--      Migration 001: Add Format Tracking for Multi-Format System
-- =================================================================

-- Add format tracking columns to existing quiz_jobs table
ALTER TABLE quiz_jobs ADD COLUMN IF NOT EXISTS format_type VARCHAR(50) DEFAULT 'mcq';
ALTER TABLE quiz_jobs ADD COLUMN IF NOT EXISTS frame_sequence JSONB;
ALTER TABLE quiz_jobs ADD COLUMN IF NOT EXISTS format_metadata JSONB;

-- Add comments for new columns
COMMENT ON COLUMN quiz_jobs.format_type IS 'The content format type (mcq, common_mistake, quick_fix, etc.)';
COMMENT ON COLUMN quiz_jobs.frame_sequence IS 'Array describing the sequence and type of frames for this format';
COMMENT ON COLUMN quiz_jobs.format_metadata IS 'Format-specific metadata including frame count, timing, etc.';

-- =================================================================
--  Format Analytics Table
-- =================================================================

-- New table for format performance tracking
CREATE TABLE IF NOT EXISTS format_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES quiz_jobs(id) ON DELETE CASCADE,
  account_id VARCHAR(50) NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  persona VARCHAR(50) NOT NULL,
  format_type VARCHAR(50) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  
  -- Performance Metrics
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  click_through_rate DECIMAL(5,2) DEFAULT 0.00,
  watch_time_seconds INTEGER DEFAULT 0,
  
  -- YouTube Metrics (populated from video_analytics)
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  
  -- Format-Specific Metrics
  format_performance_score DECIMAL(5,2) DEFAULT 0.00, -- Calculated composite score
  
  -- Collection Metadata
  video_uploaded_at TIMESTAMPTZ NOT NULL,
  analytics_collected_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE format_analytics IS 'Tracks performance metrics for different content formats to optimize format selection';
COMMENT ON COLUMN format_analytics.format_performance_score IS 'Composite score calculated from engagement, completion, and other metrics';

-- =================================================================
--  Format Analytics Indexes
-- =================================================================

-- For format performance queries
CREATE INDEX IF NOT EXISTS idx_format_analytics_lookup ON format_analytics(account_id, persona, format_type);
CREATE INDEX IF NOT EXISTS idx_format_analytics_performance ON format_analytics(account_id, format_type, format_performance_score DESC);
CREATE INDEX IF NOT EXISTS idx_format_analytics_date ON format_analytics(account_id, created_at DESC);

-- For cross-format comparisons
CREATE INDEX IF NOT EXISTS idx_format_analytics_topic ON format_analytics(account_id, topic, format_type);

-- Job lookup
CREATE INDEX IF NOT EXISTS idx_format_analytics_job ON format_analytics(job_id);

-- =================================================================
--  Format Analytics Trigger
-- =================================================================

-- Add automatic timestamp update trigger
CREATE TRIGGER set_format_analytics_updated_at
BEFORE UPDATE ON format_analytics
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- =================================================================
--  Update existing jobs with default format
-- =================================================================

-- Set format_type for all existing jobs that don't have it
UPDATE quiz_jobs 
SET format_type = 'mcq' 
WHERE format_type IS NULL;

-- Add format_metadata for existing MCQ jobs
UPDATE quiz_jobs 
SET format_metadata = jsonb_build_object(
  'frameCount', 5,
  'totalDuration', 15,
  'formatVersion', '1.0'
)
WHERE format_type = 'mcq' AND format_metadata IS NULL;

-- =================================================================
--  Format Rules Configuration Table (Optional)
-- =================================================================

-- Table to store dynamic format rules and weights
CREATE TABLE IF NOT EXISTS format_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id VARCHAR(50) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  persona VARCHAR(50) NOT NULL,
  format_type VARCHAR(50) NOT NULL,
  
  -- Rules Configuration
  weight DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (weight >= 0.00 AND weight <= 1.00),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Topic Restrictions
  allowed_topics JSONB, -- Array of topic keys, null means all topics allowed
  blocked_topics JSONB, -- Array of topic keys to block
  
  -- Performance Thresholds
  min_performance_score DECIMAL(5,2) DEFAULT 0.00,
  
  -- Metadata
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique combination
  UNIQUE(account_id, persona, format_type)
);

COMMENT ON TABLE format_rules IS 'Stores dynamic format selection rules and weights for each account/persona combination';
COMMENT ON COLUMN format_rules.weight IS 'Selection weight for this format (0.00 to 1.00)';
COMMENT ON COLUMN format_rules.allowed_topics IS 'Array of topic keys where this format is allowed (null = all topics)';

-- Index for format rule lookups
CREATE INDEX IF NOT EXISTS idx_format_rules_lookup ON format_rules(account_id, persona);
CREATE INDEX IF NOT EXISTS idx_format_rules_enabled ON format_rules(account_id, persona, is_enabled);

-- Add trigger for format_rules
CREATE TRIGGER set_format_rules_updated_at
BEFORE UPDATE ON format_rules
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- =================================================================
--  Insert Default Format Rules
-- =================================================================

-- Insert default format rules for existing accounts
INSERT INTO format_rules (account_id, persona, format_type, weight, is_enabled)
SELECT 
  'english_shots' as account_id,
  'english_vocab_builder' as persona,
  format_type,
  weight,
  true as is_enabled
FROM (VALUES 
  ('mcq', 0.50),
  ('common_mistake', 0.30),
  ('quick_fix', 0.20)
) AS rules(format_type, weight)
ON CONFLICT (account_id, persona, format_type) DO NOTHING;

INSERT INTO format_rules (account_id, persona, format_type, weight, is_enabled)
SELECT 
  'health_shots' as account_id,
  persona,
  format_type,
  weight,
  true as is_enabled
FROM (VALUES 
  ('brain_health_tips', 'mcq', 0.40),
  ('brain_health_tips', 'quick_tip', 0.40),
  ('brain_health_tips', 'before_after', 0.20),
  ('eye_health_tips', 'mcq', 0.50),
  ('eye_health_tips', 'quick_tip', 0.30),
  ('eye_health_tips', 'before_after', 0.20)
) AS rules(persona, format_type, weight)
ON CONFLICT (account_id, persona, format_type) DO NOTHING;

-- =================================================================
--  Migration complete
-- =================================================================