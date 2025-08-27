import { Pool, Client } from 'pg';

// Database connection pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 1, // Limit connections for serverless
      idleTimeoutMillis: 0, // No idle timeout
      connectionTimeoutMillis: 10000, // 10 second timeout
    });
  }
  return pool;
}

// Alternative: Direct client connection for serverless environments
export function createClient(): Client {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });
}

// Quiz job types
export interface QuizJob {
  id: string;
  persona: 'vocabulary' | 'current_affairs' | 'test_prep' | 'general_knowledge' | 'language_learning';
  category: string;
  question_format: string;
  difficulty: 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';
  language: string;
  target_audience: string;
  status: string;
  step: number;
  data: any;
  tags: string[];
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UploadedVideo {
  id: string;
  job_id: string;
  youtube_video_id: string;
  title: string;
  description?: string;
  tags: string[];
  view_count: number;
  uploaded_at: Date;
}

// Database operations
export async function createQuizJob(jobData: {
  persona: 'vocabulary' | 'current_affairs' | 'test_prep' | 'general_knowledge' | 'language_learning';
  category: string;
  question_format: string;
  difficulty: 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';
  language?: string;
  target_audience?: string;
  tags?: string[];
  status?: string;
  step?: number;
  data?: any;
}): Promise<string> {
  const pool = getPool();
  const query = `
    INSERT INTO quiz_jobs (persona, category, question_format, difficulty, language, target_audience, tags, status, step, data)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `;
  
  const values = [
    jobData.persona,
    jobData.category,
    jobData.question_format,
    jobData.difficulty,
    jobData.language || 'en',
    jobData.target_audience || 'general',
    JSON.stringify(jobData.tags || []),
    jobData.status || 'pending',
    jobData.step || 1,
    JSON.stringify(jobData.data || {})
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0].id;
}

export async function getPendingJobs(step: number, limit: number = 10): Promise<QuizJob[]> {
  // Use direct client connection for serverless environments
  if (process.env.NODE_ENV === 'production') {
    const client = createClient();
    try {
      await client.connect();
      const query = `
        SELECT * FROM quiz_jobs 
        WHERE step = $1 AND status LIKE '%pending%'
        ORDER BY created_at ASC 
        LIMIT $2
      `;
      
      const result = await client.query(query, [step, limit]);
      return result.rows.map(row => ({
        ...row,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags
      }));
    } finally {
      await client.end();
    }
  } else {
    // Use pool for development
    const pool = getPool();
    const query = `
      SELECT * FROM quiz_jobs 
      WHERE step = $1 AND status LIKE '%pending%'
      ORDER BY created_at ASC 
      LIMIT $2
    `;
    
    const result = await pool.query(query, [step, limit]);
    return result.rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags
    }));
  }
}

export async function updateJob(
  jobId: string, 
  updates: {
    status?: string;
    step?: number;
    data?: any;
    error_message?: string;
  }
): Promise<void> {
  const setParts = [];
  const values = [];
  let paramIndex = 1;
  
  if (updates.status !== undefined) {
    setParts.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  
  if (updates.step !== undefined) {
    setParts.push(`step = $${paramIndex++}`);
    values.push(updates.step);
  }
  
  if (updates.data !== undefined) {
    setParts.push(`data = $${paramIndex++}`);
    values.push(JSON.stringify(updates.data));
  }
  
  if (updates.error_message !== undefined) {
    setParts.push(`error_message = $${paramIndex++}`);
    values.push(updates.error_message);
  }
  
  if (setParts.length === 0) return;
  
  const query = `
    UPDATE quiz_jobs 
    SET ${setParts.join(', ')}
    WHERE id = $${paramIndex}
  `;
  
  values.push(jobId);
  
  // Use direct client connection for serverless environments to ensure consistency
  if (process.env.NODE_ENV === 'production') {
    const client = createClient();
    try {
      await client.connect();
      await client.query(query, values);
    } finally {
      await client.end();
    }
  } else {
    // Use pool for development
    const pool = getPool();
    await pool.query(query, values);
  }
}

export async function markJobCompleted(jobId: string, youtubeVideoId: string, metadata: {
  title: string;
  description?: string;
  tags?: string[];
}): Promise<void> {
  const pool = getPool();
  
  // Start transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update job status
    await client.query(
      'UPDATE quiz_jobs SET status = $1, step = 4 WHERE id = $2',
      ['completed', jobId]
    );
    
    // Insert uploaded video record
    await client.query(`
      INSERT INTO uploaded_videos (job_id, youtube_video_id, title, description, tags)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      jobId,
      youtubeVideoId,
      metadata.title,
      metadata.description || '',
      JSON.stringify(metadata.tags || [])
    ]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteAllJobs(): Promise<number> {
  const pool = getPool();
  
  // Delete all uploaded videos first (due to foreign key constraint)
  await pool.query('DELETE FROM uploaded_videos');
  
  // Delete all quiz jobs
  const result = await pool.query('DELETE FROM quiz_jobs');
  
  return result.rowCount || 0;
}

export async function getJobStats(): Promise<{
  total: number;
  pending: number;
  completed: number;
  failed: number;
}> {
  const pool = getPool();
  const query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status LIKE '%pending%' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM quiz_jobs
  `;
  
  const result = await pool.query(query);
  return {
    total: parseInt(result.rows[0].total),
    pending: parseInt(result.rows[0].pending),
    completed: parseInt(result.rows[0].completed),
    failed: parseInt(result.rows[0].failed)
  };
}