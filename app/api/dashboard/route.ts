// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { analyticsCollectionService as analyticsService } from '@/lib/analytics/collectionService';

// This export ensures that Next.js treats this route as a dynamic API endpoint,
// preventing it from caching responses and always fetching the latest data.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get overall analytics summary
    const allChannelsSummary = await analyticsService.getAnalyticsSummary();

    const stats = {
      videosPublished: allChannelsSummary.totalVideos,
      totalViews: allChannelsSummary.totalViews,
      avgEngagement: allChannelsSummary.avgEngagementRate,
      bestChannel: 'English Shots' // Default since we don't have channel breakdown
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Dashboard API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        stats: { videosPublished: 0, totalViews: 0, avgEngagement: 0, bestChannel: 'No Data' }
      },
      { status: 500 }
    );
  }
}
