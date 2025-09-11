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

    console.log(`🚀 Queuing frame creation for account: ${accountId || 'all'}`);

    // Fire and forget: Move heavy operations to background
    setTimeout(() => {
      processFrameCreationWithRetry(accountId).catch(error => {
        console.error('Background frame creation failed:', error);
      });
    }, 0);

    return NextResponse.json({ 
      success: true, 
      accountId: accountId || 'all',
      message: 'Frame creation queued in background'
    });
  } catch (error) {
    console.error('Frame creation batch failed:', error);
    return NextResponse.json({ success: false, error: 'Frame creation batch failed' }, { status: 500 });
  }
}

/**
 * Background processing function that includes retry logic and frame creation.
 * Runs asynchronously without blocking the API response.
 */
async function processFrameCreationWithRetry(accountId: string | undefined) {
  try {
    console.log(`🔄 Background frame creation started for account: ${accountId || 'all'}`);

    // Auto-retry failed jobs with valid data (moved to background)
    await autoRetryFailedJobs();
    
    // Get jobs; prefer SQL-side filtering by account to avoid LIMIT mismatches
    const jobs = await getPendingJobs(2, config.CREATE_FRAMES_CONCURRENCY, undefined, accountId);
      
    if (jobs.length === 0) {
      const message = accountId ? 
        `No jobs pending frame creation for account ${accountId}.` :
        'No jobs pending frame creation.';
      console.log(message);
      return;
    }

    console.log(`Found ${jobs.length} jobs for frame creation. Processing...`);

    // Process frame creation
    await processFrameCreationInBackground(jobs);

  } catch (error) {
    console.error(`❌ Background frame creation failed for ${accountId}:`, error);
  }
}

/**
 * Background processing function for frame creation.
 * Runs asynchronously without blocking the API response.
 */
async function processFrameCreationInBackground(jobs: QuizJob[]) {
  try {
    console.log(`🔄 Background frame creation started for ${jobs.length} jobs`);

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

    const successCount = summary.filter(s => s.status === 'success').length;
    console.log(`✅ Background frame creation completed: ${successCount}/${jobs.length} successful`);

  } catch (error) {
    console.error('❌ Background frame creation failed:', error);
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
