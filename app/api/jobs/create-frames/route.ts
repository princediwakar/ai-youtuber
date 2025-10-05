//app/api/jobs/create-frames/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createFramesForJob } from '@/lib/frameService';
import { getOldestPendingJob, updateJob, autoRetryFailedJobs } from '@/lib/database';
import { getAccountConfig } from '@/lib/accounts';
import { initializeErrorHandlers } from '@/lib/errorHandlers';

// Initialize global error handlers
initializeErrorHandlers();

/**
 * --- REFACTORED FOR SERVERLESS RELIABILITY ---
 * This endpoint now fetches and processes only ONE job at a time synchronously.
 * This prevents resource exhaustion and premature termination by the Vercel runtime.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let accountId: string | undefined;
    try {
      const body = await request.json();
      accountId = body.accountId;
    } catch {
      // No body, process for any account
    }

    console.log(`🚀 Starting single frame creation job for account: ${accountId || 'all'}`);

    // 1. Auto-retry previously failed jobs (quick check)
    await autoRetryFailedJobs();
      
    // 2. Fetch the single oldest job pending frame creation (Step 2)
    const job = await getOldestPendingJob(2, accountId);
    
    if (!job) {
      const message = `No jobs pending frame creation for account: ${accountId || 'all'}.`;
      console.log(message);
      return NextResponse.json({ success: true, message });
    }

    console.log(`[Frame Creation] Found job ${job.id}. Starting process...`);

    // 3. Process the single job within a robust try/catch block
    try {
      const frameUrls = await createFramesForJob(job);

      await updateJob(job.id, {
        step: 3,
        status: 'assembly_pending',
        data: { ...job.data, frameUrls },
      });

      console.log(`[Frame Creation] Successfully created ${frameUrls.length} frames for job ${job.id}.`);
      return NextResponse.json({ success: true, processedJobId: job.id, frameCount: frameUrls.length });

    } catch (error) {
       // CRITICAL: If anything fails, mark the job as 'failed' to prevent it from getting stuck.
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Frame Creation] CRITICAL ERROR processing job ${job.id}:`, error);
      await updateJob(job.id, {
        status: 'failed',
        error_message: `Frame creation failed: ${errorMessage.substring(0, 500)}`
      });
      return NextResponse.json({ success: false, error: errorMessage, failedJobId: job.id }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Frame creation endpoint failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: 'Frame creation endpoint failed', details: errorMessage }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;

