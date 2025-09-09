-- =================================================================
--      Enhanced Timing & Format Analytics Migration
-- =================================================================

-- Add timing and format tracking columns to video_analytics table
ALTER TABLE video_analytics ADD COLUMN IF NOT EXISTS upload_hour SMALLINT;
ALTER TABLE video_analytics ADD COLUMN IF NOT EXISTS upload_day_of_week SMALLINT;
ALTER TABLE video_analytics ADD COLUMN IF NOT EXISTS question_format VARCHAR(50);
ALTER TABLE video_analytics ADD COLUMN IF NOT EXISTS topic_display_name VARCHAR(255);

-- Create indexes for efficient timing analytics queries
CREATE INDEX IF NOT EXISTS idx_video_analytics_timing ON video_analytics(upload_hour, upload_day_of_week);
CREATE INDEX IF NOT EXISTS idx_video_analytics_format ON video_analytics(question_format);
CREATE INDEX IF NOT EXISTS idx_video_analytics_format_timing ON video_analytics(question_format, upload_hour, upload_day_of_week);
CREATE INDEX IF NOT EXISTS idx_video_analytics_topic_timing ON video_analytics(topic_display_name, upload_hour, upload_day_of_week);

-- Add comments for new columns
COMMENT ON COLUMN video_analytics.upload_hour IS 'Hour of day (0-23 IST) when video was uploaded';
COMMENT ON COLUMN video_analytics.upload_day_of_week IS 'Day of week (0=Sunday, 6=Saturday) when video was uploaded';
COMMENT ON COLUMN video_analytics.question_format IS 'Format of the quiz content (multiple_choice, true_false, etc.)';
COMMENT ON COLUMN video_analytics.topic_display_name IS 'Human-readable topic name for performance analysis';

-- =================================================================
--      Performance Analytics Views
-- =================================================================

-- View for timing performance analysis
CREATE OR REPLACE VIEW timing_performance_view AS
SELECT 
    account_id,
    upload_hour,
    upload_day_of_week,
    COUNT(*) as video_count,
    ROUND(AVG(views), 0) as avg_views,
    ROUND(AVG(engagement_rate), 2) as avg_engagement_rate,
    ROUND(AVG(like_ratio), 2) as avg_like_ratio,
    MIN(collected_at) as first_collection,
    MAX(collected_at) as last_collection
FROM video_analytics 
WHERE upload_hour IS NOT NULL AND upload_day_of_week IS NOT NULL
GROUP BY account_id, upload_hour, upload_day_of_week
HAVING COUNT(*) >= 2;

COMMENT ON VIEW timing_performance_view IS 'Aggregated performance metrics by upload timing for analytics optimization';

-- View for format performance analysis  
CREATE OR REPLACE VIEW format_performance_view AS
SELECT 
    account_id,
    question_format,
    COUNT(*) as video_count,
    ROUND(AVG(views), 0) as avg_views,
    ROUND(AVG(engagement_rate), 2) as avg_engagement_rate,
    ROUND(AVG(like_ratio), 2) as avg_like_ratio,
    ROUND(STDDEV(engagement_rate), 2) as engagement_stddev,
    MIN(engagement_rate) as min_engagement,
    MAX(engagement_rate) as max_engagement
FROM video_analytics 
WHERE question_format IS NOT NULL
GROUP BY account_id, question_format
HAVING COUNT(*) >= 3;

COMMENT ON VIEW format_performance_view IS 'Aggregated performance metrics by content format for optimization insights';

-- View for topic-timing correlation
CREATE OR REPLACE VIEW topic_timing_performance_view AS
SELECT 
    account_id,
    topic_display_name,
    upload_hour,
    upload_day_of_week,
    COUNT(*) as video_count,
    ROUND(AVG(views), 0) as avg_views,
    ROUND(AVG(engagement_rate), 2) as avg_engagement_rate,
    CASE 
        WHEN upload_hour BETWEEN 6 AND 11 THEN 'morning'
        WHEN upload_hour BETWEEN 12 AND 17 THEN 'afternoon'
        WHEN upload_hour BETWEEN 18 AND 22 THEN 'evening'
        ELSE 'night'
    END as time_slot
FROM video_analytics 
WHERE topic_display_name IS NOT NULL 
    AND upload_hour IS NOT NULL 
    AND upload_day_of_week IS NOT NULL
GROUP BY account_id, topic_display_name, upload_hour, upload_day_of_week
HAVING COUNT(*) >= 1;

COMMENT ON VIEW topic_timing_performance_view IS 'Topic performance correlation with upload timing for content strategy optimization';