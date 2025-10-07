// app/api/analytics/collect/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { analyticsCollectionService as analyticsService } from '@/lib/analytics/collectionService';

// Set a safe default batch limit for cron execution
const DEFAULT_BATCH_LIMIT = 20;

// Force dynamic rendering for this API route (essential for Serverless cron jobs)
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let secret: string | undefined;
  
  // 1. IMPROVEMENT: Safely parse JSON body to prevent uncaught error
  try {
    const body = await request.json();
    secret = body?.secret;
  } catch (e) {
    // If body is not valid JSON, secret remains undefined.
    // Error will be caught by the outer try-catch if logic proceeds.
  }

  try {
    // Verify the cron secret to ensure only authorized requests
    if (secret !== process.env.CRON_SECRET) {
      console.log('[Analytics] Unauthorized POST request attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Analytics] Starting scheduled analytics collection for batch size: ${DEFAULT_BATCH_LIMIT}`);
    
    const startTime = Date.now();
    // 2. OPTIMIZATION: Process a small, fixed batch only
    const result = await analyticsService.collectAnalytics(DEFAULT_BATCH_LIMIT); 
    const duration = Date.now() - startTime;
    
    const response = {
      success: true,
      message: `Analytics collection completed successfully for batch of ${result.collected} videos.`,
      stats: {
        videosCollected: result.collected,
        errors: result.errors,
        durationMs: duration,
        // 3. NEW: Flag to inform the scheduler if more runs are needed
        moreVideosToCollect: result.moreVideosToCollect 
      },
      timestamp: new Date().toISOString()
    };

    console.log('[Analytics] Collection completed:', response.stats);
    
    // Serverless function returns quickly
    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Analytics] Collection failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Analytics collection failed',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow manual override of batch limit for testing
    const limitParam = searchParams.get('limit');
    const BATCH_LIMIT = limitParam ? parseInt(limitParam, 10) : DEFAULT_BATCH_LIMIT;

    console.log(`[Analytics] Manual analytics collection triggered with limit: ${BATCH_LIMIT}`);
    
    const result = await analyticsService.collectAnalytics(BATCH_LIMIT);
    
    return NextResponse.json({
      success: true,
      message: 'Manual analytics collection completed',
      stats: {
        videosCollected: result.collected,
        errors: result.errors,
        moreVideosToCollect: result.moreVideosToCollect
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Analytics] Manual collection failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Manual analytics collection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}