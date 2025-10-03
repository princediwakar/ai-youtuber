import { NextResponse } from 'next/server';
import { analyticsInsightsService as analyticsService } from '@/lib/analytics/insightsService';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const persona = searchParams.get('persona');
    
    console.log(`[Analytics] Getting A/B testing insights${accountId ? ` for account: ${accountId}` : ''}${persona ? ` and persona: ${persona}` : ''}`);
    
    const abTestingInsights = await analyticsService.getABTestingInsights(accountId || undefined, persona || undefined);
    
    return NextResponse.json({
      success: true,
      data: abTestingInsights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Analytics] Failed to get A/B testing insights:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get A/B testing insights',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}