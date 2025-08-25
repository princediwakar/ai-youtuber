import { Pool } from 'pg';

// Database connection pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;

}

// Quiz job types
export interface QuizJob {
  id: string;
  test_type: 'SAT' | 'GMAT' | 'GRE';
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: string;
  step: number;
  data: any;
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
  test_type: 'SAT' | 'GMAT' | 'GRE';
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status?: string;
  step?: number;
  data?: any;
}): Promise<string> {
  const pool = getPool();
  const query = `
    INSERT INTO quiz_jobs (test_type, subject, difficulty, status, step, data)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `;
  
  const values = [
    jobData.test_type,
    jobData.subject,
    jobData.difficulty,
    jobData.status || 'pending',
    jobData.step || 1,
    JSON.stringify(jobData.data || {})
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0].id;
}

export async function getPendingJobs(step: number, limit: number = 10): Promise<QuizJob[]> {
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
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
  }));
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
  const pool = getPool();
  
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
  await pool.query(query, values);
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