import { NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analyticsService';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const accountId = searchParams.get('accountId');
    const persona = searchParams.get('persona');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!accountId) {
      return NextResponse.json({ error: 'accountId parameter required' }, { status: 400 });
    }

    console.log(`[Timing Analytics] Getting timing analytics for ${accountId}${persona ? ` (${persona})` : ''}`);
    
    const timingAnalytics = await analyticsService.getTimingAnalytics(accountId, persona || undefined);
    
    return NextResponse.json({
      success: true,
      data: {
        accountId,
        persona: persona || 'all',
        ...timingAnalytics
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Timing Analytics] Failed to get timing analytics:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get timing analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}