import { Pool, QueryResult } from 'pg';

// Define the structure of your QuizJob object for type safety.
// It's a good practice to have this in a central types file (e.g., lib/types.ts).
export interface QuizJob {
  id: string;
  account_id: string;
  persona: string;
  topic: string;
  topic_display_name?: string;
  question_format: string;
  generation_date: string;
  status: string;
  step: number;
  data: any; // Or a more specific type for your job data
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * --- FIX ---
 * Added a specific type for the stats query result.
 * This ensures that properties like 'total', 'pending', etc., are correctly typed
 * and avoids the 'property does not exist on type unknown' error.
 */
interface JobStats {
  total: string;
  pending: string;
  completed: string;
  failed: string;
}


/**
 * --- CRITICAL FIX ---
 * A single, persistent connection pool.
 * This pool is created once when the application starts and is reused for all
 * database queries. This is the correct pattern for Node.js and serverless
 * applications, preventing connection exhaustion and timeouts.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Sensible defaults for a serverless environment:
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 20000, // Fail if a connection cannot be established within 20 seconds
});

/**
 * --- CRITICAL FIX ---
 * A single, centralized query function that uses the connection pool.
 * Every other function in this file will use this helper. It automatically
 * handles acquiring a client from the pool, executing the query, and
 * releasing the client back to the pool.
 */
export async function query<T>(text: string, params?: any[]): Promise<QueryResult<T>> {
  try {
    return await pool.query<T>(text, params);
  } catch (error) {
    console.error('Database query failed:', { text, params, error });
    // Re-throw the error to be handled by the calling function
    throw error;
  }
}

/**
 * Filters pending jobs by step, personas, and/or accountId.
 */
export async function getPendingJobs(step: number, limit: number = 10, personas?: string[], accountId?: string): Promise<QuizJob[]> {
  let queryString = `
    SELECT * FROM quiz_jobs 
    WHERE step = $1 AND (
      status LIKE '%pending%' OR 
      (status = 'failed' AND step > 1)
    )
  `;
  const values: any[] = [step];
  let paramIndex = 2;

  if (personas && personas.length > 0) {
    queryString += ` AND persona = ANY($${paramIndex++}::text[])`;
    values.push(personas);
  }
  if (accountId) {
    queryString += ` AND account_id = $${paramIndex++}`;
    values.push(accountId);
  }
  
  queryString += ` ORDER BY created_at ASC LIMIT $${paramIndex++}`;
  values.push(limit);

  const result = await query<QuizJob>(queryString, values);
  return result.rows.map(row => ({
    ...row,
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
  }));
}

export async function createQuizJob(jobData: Partial<QuizJob>): Promise<string> {
  const queryString = `
    INSERT INTO quiz_jobs (
      account_id, persona, topic, topic_display_name, 
      question_format, generation_date, status, step, data
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `;
  
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
  
  /**
   * --- FIX ---
   * Provided a specific type `{ id: string }` for the query result.
   * This tells TypeScript that we expect each row to have an 'id' property,
   * fixing the "Property 'id' does not exist on type 'unknown'" error.
   */
  const result = await query<{ id: string }>(queryString, values);
  if (result.rows.length === 0) {
    throw new Error("Failed to create job, no ID returned.");
  }
  return result.rows[0].id;
}

export async function getRecentJobs(limit: number = 20): Promise<QuizJob[]> {
  const queryString = `
    SELECT id, persona, topic, topic_display_name, status, step, created_at, error_message, data
    FROM quiz_jobs
    ORDER BY created_at DESC
    LIMIT $1
  `;
  const result = await query<QuizJob>(queryString, [limit]);
   return result.rows.map(row => ({
    ...row,
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
  }));
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
      const dbKey = key === 'errorMessage' ? 'error_message' : key;
      setParts.push(`${dbKey} = $${paramIndex++}`);
      values.push(key === 'data' ? JSON.stringify(value) : value);
    }
  }
  
  if (setParts.length === 0) return;
  
  const queryString = `UPDATE quiz_jobs SET ${setParts.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`;
  values.push(jobId);
  
  await query(queryString, values);
}

export async function resetFailedJobToRetry(jobId: string): Promise<void> {
  const jobResult = await query<QuizJob>('SELECT * FROM quiz_jobs WHERE id = $1', [jobId]);
  if (jobResult.rows.length === 0) return;
  
  const currentJob = jobResult.rows[0];
  const data = typeof currentJob.data === 'string' ? JSON.parse(currentJob.data) : currentJob.data;
  
  let newStatus = 'frames_pending';
  let newStep = 2;
  
  if (data.question) { newStep = 2; newStatus = 'frames_pending'; }
  if (data.frameUrls?.length > 0) { newStep = 3; newStatus = 'assembly_pending'; }
  if (data.videoUrl) { newStep = 4; newStatus = 'upload_pending'; }
  
  await query(
    'UPDATE quiz_jobs SET status = $1, step = $2, error_message = NULL, updated_at = NOW() WHERE id = $3',
    [newStatus, newStep, jobId]
  );
  
  console.log(`Reset failed job ${jobId} to ${newStatus} (step ${newStep})`);
}

export async function autoRetryFailedJobs(): Promise<number> {
  const failedJobsResult = await query<QuizJob>(`
    SELECT id, step, data FROM quiz_jobs 
    WHERE status = 'failed' AND step > 1
    ORDER BY created_at ASC
  `);
  
  let resetCount = 0;
  for (const job of failedJobsResult.rows) {
    const data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
      
    if ((job.step >= 2 && data.question) ||
        (job.step >= 3 && data.frameUrls?.length > 0) ||
        (job.step >= 4 && data.videoUrl)) {
      await resetFailedJobToRetry(job.id);
      resetCount++;
    }
  }
    
  if (resetCount > 0) {
    console.log(`🔄 Auto-retried ${resetCount} failed jobs with valid data`);
  }
    
  return resetCount;
}

export async function markJobCompleted(jobId: string, youtubeVideoId: string, metadata: {
  title: string;
  description?: string;
  tags?: string[];
}): Promise<void> {
  // For transactions, we must check out a single client from the pool to ensure
  // all commands are executed on the same connection.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      "UPDATE quiz_jobs SET status = 'completed', step = 5, data = jsonb_set(data, '{youtubeVideoId}', to_jsonb($1::text), true) WHERE id = $2",
      [youtubeVideoId, jobId]
    );
    
    await client.query(`
      INSERT INTO uploaded_videos (job_id, youtube_video_id, title, description, tags)
      VALUES ($1, $2, $3, $4, $5)
    `, [jobId, youtubeVideoId, metadata.title, metadata.description || '', JSON.stringify(metadata.tags || [])]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Transaction failed for job ${jobId}, rolled back.`, error);
    throw error;
  } finally {
    // CRITICAL: Always release the client back to the pool.
    client.release();
  }
}

export async function getJobStats(): Promise<{
  total: number;
  pending: number;
  completed: number;
  failed: number;
}> {
  const queryString = `
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status LIKE '%pending%') AS pending,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed
    FROM quiz_jobs
  `;
  
  /**
   * --- FIX ---
   * Used the `JobStats` interface to strongly type the query result.
   * This fixes the errors for the 'total', 'pending', and 'failed' properties.
   */
  const result = await query<JobStats>(queryString);
  
  const stats = result.rows[0];
  return {
    total: parseInt(stats.total || '0', 10),
    pending: parseInt(stats.pending || '0', 10),
    completed: parseInt(stats.completed || '0', 10),
    failed: parseInt(stats.failed || '0', 10)
  };
}

