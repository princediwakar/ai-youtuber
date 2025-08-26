require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function migrateDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
  try {
    console.log('Starting database migration...');
    
    // Delete all existing jobs first
    await pool.query('DELETE FROM uploaded_videos');
    await pool.query('DELETE FROM quiz_jobs');
    console.log('✅ Cleared existing data');
    
    // Drop the old table
    await pool.query('DROP TABLE IF EXISTS quiz_jobs CASCADE');
    console.log('✅ Dropped old quiz_jobs table');
    
    // Create new table with persona-based schema
    await pool.query(`
      CREATE TABLE quiz_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        persona VARCHAR(30) NOT NULL CHECK (persona IN ('vocabulary', 'current_affairs', 'test_prep', 'general_knowledge', 'language_learning')),
        category VARCHAR(50) NOT NULL,
        question_format VARCHAR(30) NOT NULL,
        difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('beginner', 'easy', 'medium', 'hard', 'expert')),
        language VARCHAR(10) DEFAULT 'en' NOT NULL,
        target_audience VARCHAR(20) DEFAULT 'general',
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'frames_pending', 'assembly_pending', 'upload_pending', 'completed', 'failed')),
        step INTEGER DEFAULT 1 CHECK (step BETWEEN 1 AND 4),
        data JSONB DEFAULT '{}',
        tags JSONB DEFAULT '[]',
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Created new quiz_jobs table');
    
    // Recreate indexes
    await pool.query('CREATE INDEX idx_quiz_jobs_status_step ON quiz_jobs(status, step)');
    await pool.query('CREATE INDEX idx_quiz_jobs_created_at ON quiz_jobs(created_at)');
    await pool.query('CREATE INDEX idx_quiz_jobs_persona_category ON quiz_jobs(persona, category)');
    await pool.query('CREATE INDEX idx_quiz_jobs_difficulty_audience ON quiz_jobs(difficulty, target_audience)');
    await pool.query('CREATE INDEX idx_quiz_jobs_language ON quiz_jobs(language)');
    await pool.query('CREATE INDEX idx_quiz_jobs_tags ON quiz_jobs USING GIN(tags)');
    console.log('✅ Created indexes');
    
    // Recreate the foreign key constraint for uploaded_videos
    await pool.query('ALTER TABLE uploaded_videos DROP CONSTRAINT IF EXISTS uploaded_videos_job_id_fkey');
    await pool.query('ALTER TABLE uploaded_videos ADD CONSTRAINT uploaded_videos_job_id_fkey FOREIGN KEY (job_id) REFERENCES quiz_jobs(id) ON DELETE CASCADE');
    console.log('✅ Recreated foreign key constraints');
    
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateDatabase().catch(console.error);