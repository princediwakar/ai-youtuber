import { NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analyticsService';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { secret } = await request.json();
    
    // Verify the cron secret to ensure only authorized requests
    if (secret !== process.env.CRON_SECRET) {
      console.log('[Analytics] Unauthorized request attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Analytics] Starting scheduled analytics collection...');
    
    const startTime = Date.now();
    const result = await analyticsService.collectAnalytics();
    const duration = Date.now() - startTime;
    
    const response = {
      success: true,
      message: 'Analytics collection completed successfully',
      stats: {
        videosCollected: result.collected,
        errors: result.errors,
        durationMs: duration
      },
      timestamp: new Date().toISOString()
    };

    console.log('[Analytics] Collection completed:', response.stats);
    
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

// Also support GET for manual testing (with secret query param)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Analytics] Manual analytics collection triggered...');
    
    const result = await analyticsService.collectAnalytics();
    
    return NextResponse.json({
      success: true,
      message: 'Manual analytics collection completed',
      stats: {
        videosCollected: result.collected,
        errors: result.errors
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