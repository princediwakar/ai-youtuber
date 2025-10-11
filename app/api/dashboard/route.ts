// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { analyticsCollectionService as analyticsService } from '@/lib/analytics/collectionService';
import { analyticsInsightsService } from '@/lib/analytics/insightsService';

// This export ensures that Next.js treats this route as a dynamic API endpoint,
// preventing it from caching responses and always fetching the latest data.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get overall analytics summary
    const allChannelsSummary = await analyticsService.getAnalyticsSummary();

    // Get channel and persona breakdowns
    const channels = await analyticsService.getChannelStats();
    const personas = await analyticsService.getPersonaStats();

    // Get theme and format analytics (no filters for overall dashboard)
    const themeAnalytics = await analyticsInsightsService.getThemeAnalytics();
    const formatAnalytics = await analyticsInsightsService.getFormatAnalytics();

    const stats = {
      videosPublished: allChannelsSummary.totalVideos,
      totalViews: allChannelsSummary.totalViews,
      avgEngagement: allChannelsSummary.avgEngagementRate,
      bestChannel: channels[0]?.channelName || 'No Data',
      channels,
      personas,
      themes: themeAnalytics?.themePerformance || [],
      formats: formatAnalytics?.formatPerformance || []
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Dashboard API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stats: {
          videosPublished: 0,
          totalViews: 0,
          avgEngagement: 0,
          bestChannel: 'No Data',
          channels: [],
          personas: [],
          themes: [],
          formats: []
        }
      },
      { status: 500 }
    );
  }
}