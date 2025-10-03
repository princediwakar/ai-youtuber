import { NextResponse } from 'next/server';
import { analyticsInsightsService as analyticsService } from '@/lib/analytics/insightsService';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    
    console.log(`[Analytics] Getting summary${accountId ? ` for account: ${accountId}` : ' for all accounts'}`);
    
    const summary = await analyticsService.getAnalyticsSummary(accountId || undefined);
    
    return NextResponse.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Analytics] Failed to get summary:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get analytics summary',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}