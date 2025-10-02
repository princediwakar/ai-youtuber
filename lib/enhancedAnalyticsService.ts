// Enhanced analytics service with orphaned video recovery
import { analyticsService } from './analyticsService';
import { query } from './database';
import { google } from 'googleapis';
import { getOAuth2Client } from './googleAuth';

export class EnhancedAnalyticsService {
  /**
   * Enhanced analytics collection with orphaned video recovery
   */
  async collectAnalyticsWithRecovery(): Promise<{ collected: number; errors: number; orphansRecovered: number }> {
    const startTime = Date.now();
    console.log('[EnhancedAnalytics] Starting analytics collection with orphan recovery...');

    try {
      // Step 1: Recover orphaned videos from YouTube channels
      const orphansRecovered = await this.recoverOrphanedVideos();
      console.log(`[EnhancedAnalytics] Recovered ${orphansRecovered} orphaned videos`);

      // Step 2: Run standard analytics collection
      const standardResult = await analyticsService.collectAnalytics();

      const duration = Date.now() - startTime;
      console.log(`[EnhancedAnalytics] Enhanced collection completed in ${duration}ms`);
      console.log(`[EnhancedAnalytics] Collected: ${standardResult.collected}, Errors: ${standardResult.errors}, Orphans: ${orphansRecovered}`);

      return { 
        collected: standardResult.collected, 
        errors: standardResult.errors, 
        orphansRecovered 
      };

    } catch (error) {
      console.error('[EnhancedAnalytics] Fatal error during enhanced analytics collection:', error);
      throw error;
    }
  }

  /**
   * Recover orphaned videos from YouTube channels (videos not in uploaded_videos table)
   */
  async recoverOrphanedVideos(): Promise<number> {
    console.log('[EnhancedAnalytics] Starting orphaned video recovery...');
    
    try {
      // Get all accounts
      const accountsResult = await query(`SELECT id FROM accounts WHERE status = 'active'`);
      const accounts = accountsResult.rows.map((row: any) => row.id);
      
      let totalRecovered = 0;
      
      for (const accountId of accounts) {
        try {
          console.log(`[EnhancedAnalytics] Checking ${accountId} for orphaned videos...`);
          
          const oauth2Client = await getOAuth2Client(accountId);
          const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
          
          // Get channel info to find uploads playlist
          const channelResponse = await youtube.channels.list({
            part: ['contentDetails'],
            mine: true
          });
          
          if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
            console.warn(`[EnhancedAnalytics] No channel found for ${accountId}`);
            continue;
          }
          
          const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
          if (!uploadsPlaylistId) {
            console.warn(`[EnhancedAnalytics] No uploads playlist found for ${accountId}`);
            continue;
          }
          
          // Get all videos from uploads playlist
          let nextPageToken = '';
          let allVideos = [];
          
          do {
            const playlistResponse = await youtube.playlistItems.list({
              part: ['snippet'],
              playlistId: uploadsPlaylistId,
              maxResults: 50,
              pageToken: nextPageToken || undefined
            });
            
            if (playlistResponse.data.items) {
              allVideos.push(...playlistResponse.data.items);
            }
            
            nextPageToken = playlistResponse.data.nextPageToken || '';
          } while (nextPageToken);
          
          console.log(`[EnhancedAnalytics] Found ${allVideos.length} total videos in ${accountId} channel`);
          
          // Check which videos are missing from uploaded_videos table
          for (const video of allVideos) {
            const videoId = video.snippet?.resourceId?.videoId;
            const title = video.snippet?.title || 'Unknown Title';
            const publishedAt = video.snippet?.publishedAt;
            
            if (!videoId || !publishedAt) continue;
            
            // Check if video exists in uploaded_videos
            const existsResult = await query(
              `SELECT id FROM uploaded_videos WHERE youtube_video_id = $1`,
              [videoId]
            );
            
            if (existsResult.rows.length === 0) {
              // Video is orphaned - create uploaded_videos record
              await query(`
                INSERT INTO uploaded_videos (job_id, youtube_video_id, title, uploaded_at, created_at)
                VALUES (NULL, $1, $2, $3, NOW())
                ON CONFLICT (youtube_video_id) DO NOTHING
              `, [videoId, title, publishedAt]);
              
              totalRecovered++;
              console.log(`[EnhancedAnalytics] Recovered orphaned video: ${title} (${videoId})`);
            }
          }
          
        } catch (error) {
          console.error(`[EnhancedAnalytics] Error recovering videos for ${accountId}:`, error);
          // Continue with other accounts
        }
      }
      
      console.log(`[EnhancedAnalytics] Orphaned video recovery completed. Total recovered: ${totalRecovered}`);
      return totalRecovered;
      
    } catch (error) {
      console.error('[EnhancedAnalytics] Fatal error during orphaned video recovery:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const enhancedAnalyticsService = new EnhancedAnalyticsService();
export default enhancedAnalyticsService;