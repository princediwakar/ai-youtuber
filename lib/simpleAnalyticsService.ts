// Simple analytics service that works with basic schema
import { query } from './database';

export class SimpleAnalyticsService {
  /**
   * Get analytics summary using basic uploaded_videos data
   */
  async getAnalyticsSummary(accountId?: string): Promise<{
    totalVideos: number;
    totalViews: number;
    avgEngagementRate: number;
    topPerformingVideos: Array<{
      videoId: string;
      title: string;
      views: number;
      engagementRate: number;
      collectedAt: Date;
    }>;
  }> {
    try {
      let accountJoin = '';
      let accountFilter = '';
      let params: string[] = [];
      
      if (accountId) {
        accountJoin = 'JOIN quiz_jobs qj ON uv.job_id = qj.id';
        accountFilter = 'WHERE qj.account_id = $1';
        params = [accountId];
      }

      // Count total videos from uploaded_videos table
      const result = await query(`
        SELECT COUNT(*) as total_videos
        FROM uploaded_videos uv
        ${accountJoin}
        ${accountFilter}
      `, params);

      const totalVideos = parseInt(result.rows[0]?.total_videos || '0');

      return {
        totalVideos,
        totalViews: 0, // No analytics data yet
        avgEngagementRate: 0, // No analytics data yet
        topPerformingVideos: [] // No analytics data yet
      };

    } catch (error) {
      console.error('[SimpleAnalyticsService] Error:', error);
      return {
        totalVideos: 0,
        totalViews: 0,
        avgEngagementRate: 0,
        topPerformingVideos: []
      };
    }
  }

  /**
   * Get channel-wise breakdown statistics
   */
  async getChannelBreakdown(): Promise<{
    channels: Array<{
      accountId: string;
      channelName: string;
      totalVideos: number;
      totalViews: number;
      avgEngagementRate: number;
      lastUpload: Date | null;
      status: 'active' | 'inactive';
    }>;
  }> {
    try {
      // Get all active channels from accounts table
      const channelsResult = await query(`
        SELECT id, name, status, created_at
        FROM accounts 
        WHERE status = 'active'
        ORDER BY name
      `);

      const channels = [];
      
      for (const channel of channelsResult.rows) {
        // Get video count for each channel
        const videoCountResult = await query(`
          SELECT COUNT(*) as total_videos, MAX(uv.uploaded_at) as last_upload
          FROM uploaded_videos uv
          JOIN quiz_jobs qj ON uv.job_id = qj.id
          WHERE qj.account_id = $1
        `, [channel.id]);

        const videoCount = parseInt(videoCountResult.rows[0]?.total_videos || '0');
        const lastUpload = videoCountResult.rows[0]?.last_upload;

        channels.push({
          accountId: channel.id,
          channelName: channel.name || channel.id,
          totalVideos: videoCount,
          totalViews: 0, // No analytics data yet
          avgEngagementRate: 0, // No analytics data yet
          lastUpload: lastUpload ? new Date(lastUpload) : null,
          status: channel.status
        });
      }

      return { channels };

    } catch (error) {
      console.error('[SimpleAnalyticsService] Error in getChannelBreakdown:', error);
      return { channels: [] };
    }
  }

  /**
   * Get persona performance breakdown
   */
  async getPersonaBreakdown(): Promise<{
    personas: Array<{
      personaName: string;
      accountId: string;
      totalVideos: number;
      avgEngagementRate: number;
      lastVideo: Date | null;
    }>;
  }> {
    try {
      const personaResult = await query(`
        SELECT 
          qj.persona,
          qj.account_id,
          COUNT(*) as total_videos,
          MAX(uv.uploaded_at) as last_video
        FROM quiz_jobs qj
        JOIN uploaded_videos uv ON qj.id = uv.job_id
        GROUP BY qj.persona, qj.account_id
        ORDER BY total_videos DESC
      `);

      const personas = personaResult.rows.map((row: any) => ({
        personaName: row.persona,
        accountId: row.account_id,
        totalVideos: parseInt(row.total_videos),
        avgEngagementRate: 0, // No analytics data yet
        lastVideo: row.last_video ? new Date(row.last_video) : null
      }));

      return { personas };

    } catch (error) {
      console.error('[SimpleAnalyticsService] Error in getPersonaBreakdown:', error);
      return { personas: [] };
    }
  }
}

// Export singleton instance
export const simpleAnalyticsService = new SimpleAnalyticsService();
export default simpleAnalyticsService;