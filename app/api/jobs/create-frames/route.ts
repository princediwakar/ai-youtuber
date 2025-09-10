//app/api/jobs/create-frames/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob, autoRetryFailedJobs } from '@/lib/database';
import { createFramesForJob } from '@/lib/frameService';
import { config } from '@/lib/config';
import { QuizJob } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse request body to get accountId (optional)
    let accountId: string | undefined;
    try {
      const body = await request.json();
      accountId = body.accountId;
    } catch {
      // No body or invalid JSON - process all accounts
    }

    // Auto-retry failed jobs with valid data
    await autoRetryFailedJobs();
    
    // Get jobs; prefer SQL-side filtering by account to avoid LIMIT mismatches
    const jobs = await getPendingJobs(2, config.CREATE_FRAMES_CONCURRENCY, undefined, accountId);
      
    if (jobs.length === 0) {
      const message = accountId ? 
        `No jobs pending frame creation for account ${accountId}.` :
        'No jobs pending frame creation.';
      return NextResponse.json({ success: true, message });
    }

    console.log(`Found ${jobs.length} jobs for frame creation. Processing...`);

    const processPromises = jobs.map((job: QuizJob) => processJob(job));

    const results = await Promise.allSettled(processPromises);
    
    const summary = results.map((result, index) => {
      const jobId = jobs[index].id;
      if (result.status === 'fulfilled' && result.value) {
        return { jobId, status: 'success' };
      } else {
        return { jobId, status: 'failed', reason: result.status === 'rejected' ? String(result.reason) : 'Unknown error' };
      }
    });

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('Frame creation batch failed:', error);
    return NextResponse.json({ success: false, error: 'Frame creation batch failed' }, { status: 500 });
  }
}

// 💡 FIX: The return type is now Promise<string | null> to match the UUID type of job.id.
async function processJob(job: QuizJob): Promise<string | null> {
  try {
    console.log(`[Job ${job.id}] Starting frame creation...`);
    await createFramesForJob(job);
    console.log(`[Job ${job.id}] ✅ Frame creation successful.`);
    return job.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Job ${job.id}] ❌ Frame creation failed:`, errorMessage);
    await updateJob(job.id, {
      status: 'failed',
      error_message: `Frame creation failed: ${errorMessage}`
    });
    return null;
  }
}
