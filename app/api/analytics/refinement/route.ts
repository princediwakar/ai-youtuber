import { NextResponse } from 'next/server';
import { refinementService } from '@/lib/refinementService';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { secret } = await request.json();
    
    // Verify the cron secret
    if (secret !== process.env.CRON_SECRET) {
      console.log('[Refinement] Unauthorized request attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Refinement] Starting content refinement analysis...');
    
    const startTime = Date.now();
    const result = await refinementService.performContentRefinement();
    const duration = Date.now() - startTime;
    
    const response = {
      success: true,
      message: 'Content refinement completed successfully',
      stats: {
        personasAnalyzed: result.applied.updated,
        recommendationsGenerated: result.applied.recommendations.length,
        durationMs: duration
      },
      insights: {
        reportDate: result.report.reportDate,
        accountCount: result.report.accountInsights.length,
        globalRecommendations: result.report.globalInsights.recommendedImprovements,
        topRecommendations: result.applied.recommendations.slice(0, 10)
      },
      timestamp: new Date().toISOString()
    };

    console.log('[Refinement] Analysis completed:', response.stats);
    
    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Refinement] Analysis failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Content refinement failed',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint for getting refinement summary
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Refinement] Getting refinement summary...');
    
    const summary = await refinementService.getRefinementSummary();
    
    return NextResponse.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Refinement] Failed to get summary:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get refinement summary',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}