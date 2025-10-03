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
      connectionTimeoutMillis: 30000,
      query_timeout: 60000,
    });
  }
  return pool;
}
export function createClient(): Client {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 30000,
    query_timeout: 60000,
  });
}

// Helper function for running queries with automatic connection management
export async function query(text: string, params?: any[]): Promise<any> {
  const client = createClient();
  try {
    await client.connect();
    return await client.query(text, params);
  } finally {
    await client.end();
  }
}


/**
 * UPDATED & FIXED: Can now filter pending jobs by an array of personas.
 * The SQL parameter indexing has been corrected for robust filtering.
 */
export async function getPendingJobs(step: number, limit: number = 10, personas?: string[], accountId?: string): Promise<QuizJob[]> {
  const client = createClient();
  try {
    await client.connect();
    
    let query = `
      SELECT * FROM quiz_jobs 
      WHERE step = $1 AND (
        status LIKE '%pending%' OR 
        (status = 'failed' AND step > 1)
      )
    `;
    const values: any[] = [step];
    let paramIndex = 2;

    if (personas && personas.length > 0) {
      query += ` AND persona = ANY($${paramIndex++}::text[])`;
      values.push(personas);
    }
    if (accountId) {
      query += ` AND account_id = $${paramIndex++}`;
      values.push(accountId);
    }
    
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
      account_id, persona, topic, topic_display_name, 
      question_format, generation_date, status, step, data
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `;
  
  // UPDATED VALUES ARRAY - includes account_id
  const values = [
    jobData.account_id,
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
      SELECT id, persona, topic, topic_display_name, status, step, created_at, error_message, data
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

export async function resetFailedJobToRetry(jobId: string): Promise<void> {
  const client = createClient();
  try {
    await client.connect();
    
    // Get the job to determine what step it should retry from
    const job = await client.query('SELECT * FROM quiz_jobs WHERE id = $1', [jobId]);
    if (job.rows.length === 0) return;
    
    const currentJob = job.rows[0];
    const data = typeof currentJob.data === 'string' ? JSON.parse(currentJob.data) : currentJob.data;
    
    // Determine the appropriate status and step based on available data
    let newStatus = 'frames_pending';
    let newStep = 2;
    
    if (data.question) {
      // If we have quiz data, try frames next
      newStatus = 'frames_pending';
      newStep = 2;
    }
    if (data.frameUrls && data.frameUrls.length > 0) {
      // If we have frames, try assembly next
      newStatus = 'assembly_pending'; 
      newStep = 3;
    }
    if (data.videoUrl) {
      // If we have video, try upload next
      newStatus = 'upload_pending';
      newStep = 4;
    }
    
    await client.query(
      'UPDATE quiz_jobs SET status = $1, step = $2, error_message = NULL, updated_at = NOW() WHERE id = $3',
      [newStatus, newStep, jobId]
    );
    
    console.log(`Reset failed job ${jobId} to ${newStatus} (step ${newStep})`);
  } finally {
    await client.end();
  }
}

export async function autoRetryFailedJobs(): Promise<number> {
  const client = createClient();
  try {
    await client.connect();
    
    // Get failed jobs that have valid data for retry
    const failedJobs = await client.query(`
      SELECT id, step, data FROM quiz_jobs 
      WHERE status = 'failed' AND step > 1
      ORDER BY created_at ASC
    `);
    
    let resetCount = 0;
    for (const job of failedJobs.rows) {
      const data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
      
      // Only retry if we have valid data from previous steps
      if ((job.step === 2 && data.question) ||
          (job.step === 3 && data.frameUrls && data.frameUrls.length > 0) ||
          (job.step === 4 && data.videoUrl)) {
        await resetFailedJobToRetry(job.id);
        resetCount++;
      }
    }
    
    if (resetCount > 0) {
      console.log(`🔄 Auto-retried ${resetCount} failed jobs with valid data`);
    }
    
    return resetCount;
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
    
    // --- MODIFICATION START ---
    // Use `to_jsonb` to correctly store the video ID as a clean JSON string,
    // and pass the raw string instead of a JSON.stringified() version.
    await client.query(
      "UPDATE quiz_jobs SET status = 'completed', step = 5, data = jsonb_set(data, '{youtube_video_id}', to_jsonb($1::text)) WHERE id = $2",
      [youtubeVideoId, jobId]
    );
    // --- MODIFICATION END ---
    
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
