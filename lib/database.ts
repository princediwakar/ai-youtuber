import { Pool, Client } from 'pg';
import { QuizJob } from './types';

// Database connection pool
let pool: Pool | null = null;

// (getPool and createClient functions remain the same)
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 1,
      idleTimeoutMillis: 0,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}
export function createClient(): Client {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });
}


/**
 * UPDATED & FIXED: Can now filter pending jobs by an array of personas.
 * The SQL parameter indexing has been corrected for robust filtering.
 */
export async function getPendingJobs(step: number, limit: number = 10, personas?: string[]): Promise<QuizJob[]> {
  const client = createClient();
  try {
    await client.connect();
    
    let query = `
      SELECT * FROM quiz_jobs 
      WHERE step = $1 AND status LIKE '%pending%'
    `;
    const values: any[] = [step];
    let paramIndex = 2; // The next available parameter index is $2.

    // If personas are provided, add the filter to the query.
    if (personas && personas.length > 0) {
      query += ` AND persona = ANY($${paramIndex++}::text[])`;
      values.push(personas);
    }
    
    // Always add ordering and limit at the end, using the next available parameter index.
    query += ` ORDER BY created_at ASC LIMIT $${paramIndex++}`;
    values.push(limit);

    const result = await client.query<QuizJob>(query, values);
    return result.rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
    }));
  } finally {
    await client.end();
  }
}

// (All other database functions: createQuizJob, getRecentJobs, etc., remain the same)
export async function createQuizJob(jobData: Partial<QuizJob>): Promise<string> {
  const query = `
    INSERT INTO quiz_jobs (
      persona, topic, topic_display_name, 
      question_format, generation_date, status, step, data
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `;
  
  // UPDATED VALUES ARRAY - removed category references
  const values = [
    jobData.persona,
    jobData.topic,
    jobData.topic_display_name,
    jobData.question_format || 'multiple_choice',
    jobData.generation_date,
    jobData.status,
    jobData.step,
    JSON.stringify(jobData.data || {})
  ];
  
  const client = createClient();
  try {
    await client.connect();
    const result = await client.query(query, values);
    if (result.rows.length === 0) throw new Error("Failed to create job, no ID returned.");
    return result.rows[0].id;
  } finally {
    await client.end();
  }
}

export async function getRecentJobs(limit: number = 20): Promise<QuizJob[]> {
  const client = createClient();
  try {
    await client.connect();
    const query = `
      SELECT id, persona, category, topic, category_display_name, topic_display_name, status, step, created_at, error_message, data
      FROM quiz_jobs
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const result = await client.query<QuizJob>(query, [limit]);
     return result.rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
    }));
  } finally {
    await client.end();
  }
}

export async function updateJob(
  jobId: string, 
  updates: Partial<Pick<QuizJob, 'status' | 'step' | 'data' | 'error_message'>>
): Promise<void> {
  const setParts: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const dbKey = key === 'error_message' ? 'error_message' : key;
      setParts.push(`${dbKey} = $${paramIndex++}`);
      values.push(key === 'data' ? JSON.stringify(value) : value);
    }
  }
  
  if (setParts.length === 0) return;
  
  const query = `UPDATE quiz_jobs SET ${setParts.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`;
  values.push(jobId);
  
  const client = createClient();
  try {
    await client.connect();
    await client.query(query, values);
  } finally {
    await client.end();
  }
}

export async function markJobCompleted(jobId: string, youtubeVideoId: string, metadata: {
  title: string;
  description?: string;
  tags?: string[];
}): Promise<void> {
  const client = createClient();
  try {
    await client.connect();
    await client.query('BEGIN');
    
    await client.query(
      "UPDATE quiz_jobs SET status = 'completed', step = 5, data = jsonb_set(data, '{youtube_video_id}', $1) WHERE id = $2",
      [JSON.stringify(youtubeVideoId), jobId]
    );
    
    await client.query(`
      INSERT INTO uploaded_videos (job_id, youtube_video_id, title, description, tags)
      VALUES ($1, $2, $3, $4, $5)
    `, [jobId, youtubeVideoId, metadata.title, metadata.description || '', JSON.stringify(metadata.tags || [])]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Transaction failed for job ${jobId}:`, error);
    throw error;
  } finally {
    await client.end();
  }
}

export async function getJobStats(): Promise<{
  total: number;
  pending: number;
  completed: number;
  failed: number;
}> {
  const query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status LIKE '%pending%' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM quiz_jobs
  `;
  
  const client = createClient();
  try {
    await client.connect();
    const result = await client.query(query);
    const stats = result.rows[0];
    return {
      total: parseInt(stats.total || '0', 10),
      pending: parseInt(stats.pending || '0', 10),
      completed: parseInt(stats.completed || '0', 10),
      failed: parseInt(stats.failed || '0', 10)
    };
  } finally {
    await client.end();
  }
}
