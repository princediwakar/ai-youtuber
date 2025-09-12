import { NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analyticsService';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const persona = searchParams.get('persona');
    
    console.log(`[Analytics] Getting audio analytics${accountId ? ` for account: ${accountId}` : ''}${persona ? ` and persona: ${persona}` : ''}`);
    
    const audioAnalytics = await analyticsService.getAudioAnalytics(accountId || undefined, persona || undefined);
    
    return NextResponse.json({
      success: true,
      data: audioAnalytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Analytics] Failed to get audio analytics:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get audio analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}