import { NextResponse } from 'next/server';
import { simpleAnalyticsService } from '@/lib/simpleAnalyticsService';

// This export ensures that Next.js treats this route as a dynamic API endpoint,
// preventing it from caching responses and always fetching the latest data.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get overall analytics summary and detailed breakdowns
    const [allChannelsSummary, channelBreakdown, personaBreakdown] = await Promise.all([
      simpleAnalyticsService.getAnalyticsSummary(),
      simpleAnalyticsService.getChannelBreakdown(),
      simpleAnalyticsService.getPersonaBreakdown()
    ]);

    // Determine best performing channel based on video count (since no engagement data yet)
    let bestChannel = 'No Data';
    if (channelBreakdown.channels.length > 0) {
      const topChannel = channelBreakdown.channels.reduce((best, current) => 
        current.totalVideos > best.totalVideos ? current : best
      );
      bestChannel = topChannel.totalVideos > 0 ? topChannel.channelName : 'No Data';
    }

    const stats = {
      videosPublished: allChannelsSummary.totalVideos,
      totalViews: allChannelsSummary.totalViews,
      avgEngagement: allChannelsSummary.avgEngagementRate,
      bestChannel,
      channels: channelBreakdown.channels,
      personas: personaBreakdown.personas
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
