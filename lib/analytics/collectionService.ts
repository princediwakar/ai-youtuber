import { google } from 'googleapis';
import { getOAuth2Client } from '../googleAuth';
// Assuming the 'query' function handles database interaction.
import { query } from '../database'; 
import { VideoAnalytics, VideoToCollect } from './types';
import { ChannelStats, PersonaStats } from '../types';

// --- Interface Definitions for Database Query Results ---
interface VideoForAnalyticsRow {
  video_id: string;
  job_id: string;
  account_id: string;
  uploaded_at: string;
}

interface JobAndVideoData {
  persona: string;
  question_format: string;
  topic_display_name: string;
  data: any;
  uploaded_at: string;
  title: string;
}

interface AnalyticsSummaryRow {
  total_videos: string;
  total_views: string;
  avg_engagement_rate: string;
}

interface TopVideoRow {
  video_id: string;
  title: string;
  views: string;
  engagement_rate: string;
  collected_at: string;
}

interface ChannelStatsRow {
  account_id: string;
  channel_name: string;
  total_videos: string;
  total_views: string;
  avg_engagement_rate: string;
  last_upload: string | null;
  status: string;
}

interface PersonaStatsRow {
  persona_name: string;
  account_id: string;
  total_videos: string;
  avg_engagement_rate: string;
  last_video: string | null;
}

// --- CONCURRENCY HELPER FUNCTION ---

/**
 * Processes videos for a single account by fetching statistics from the YouTube API.
 * Uses concurrent chunking to speed up I/O time.
 */
async function processAccountVideos(accountId: string, videos: VideoToCollect[]): Promise<VideoAnalytics[]> {
    const oauth2Client = await getOAuth2Client(accountId);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    // YouTube API allows up to 50 IDs per request. Split into chunks to maximize concurrency.
    const YOUTUBE_MAX_CHUNK_SIZE = 50; 
    const videoChunks: VideoToCollect[][] = [];
    for (let i = 0; i < videos.length; i += YOUTUBE_MAX_CHUNK_SIZE) {
        videoChunks.push(videos.slice(i, i + YOUTUBE_MAX_CHUNK_SIZE));
    }

    // OPTIMIZATION: Use Promise.all to run all chunk fetches concurrently
    const chunkPromises = videoChunks.map(async (chunk, index) => {
        const videoIds = chunk.map(v => v.videoId).join(',');
        
        try {
            console.log(`[CollectionService] Fetching chunk ${index + 1}/${videoChunks.length} for account: ${accountId}`);
            
            const response = await youtube.videos.list({
                part: ['statistics'],
                id: [videoIds],
            });

            if (!response.data.items) return [];

            const analytics: VideoAnalytics[] = [];
            for (const item of response.data.items) {
                const video = chunk.find(v => v.videoId === item.id);
                if (!video || !item.statistics) continue;

                const stats = item.statistics;
                const views = parseInt(stats.viewCount || '0', 10);
                const likes = parseInt(stats.likeCount || '0', 10);
                const comments = parseInt(stats.commentCount || '0', 10);
                const dislikes = parseInt(stats.dislikeCount || '0', 10);

                const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
                const likeRatio = views > 0 ? (likes / views) * 100 : 0;

                analytics.push({
                    videoId: video.videoId,
                    jobId: video.jobId,
                    accountId: video.accountId,
                    views, likes, comments, dislikes,
                    engagementRate: Math.round(engagementRate * 100) / 100,
                    likeRatio: Math.round(likeRatio * 100) / 100,
                    videoUploadedAt: video.uploadedAt
                });
            }
            return analytics;
        } catch (error) {
            console.error(`[CollectionService] Error fetching chunk ${index + 1} for account ${accountId}:`, error);
            return []; // Return empty array on failure
        }
    });

    // Wait for all concurrent chunk promises to resolve
    const results = await Promise.all(chunkPromises);
    return results.flat();
}


class AnalyticsCollectionService {
  
  /**
   * Get videos that need analytics collection, respecting a strict limit.
   * Fetches (limit + 1) to determine if more work remains.
   */
  async getVideosForAnalytics(limit: number): Promise<{ videos: VideoToCollect[], totalCount: number }> {
    const result = await query<VideoForAnalyticsRow>(`
      SELECT 
        uv.youtube_video_id as video_id,
        uv.job_id,
        qj.account_id,
        uv.uploaded_at
      FROM uploaded_videos uv
      JOIN quiz_jobs qj ON uv.job_id = qj.id
      LEFT JOIN video_analytics va ON uv.youtube_video_id = va.video_id
      WHERE 
        uv.uploaded_at < NOW() - INTERVAL '24 hours'
        AND va.id IS NULL
      ORDER BY uv.uploaded_at ASC
      LIMIT $1 
    `, [limit + 1]); // Fetch limit + 1

    const totalCount = result.rows.length;
    
    // Only return the requested limit for processing in this execution
    const videos = result.rows.slice(0, limit).map((row) => ({
      videoId: row.video_id,
      jobId: row.job_id,
      accountId: row.account_id,
      uploadedAt: new Date(row.uploaded_at)
    }));
    
    return { videos, totalCount };
  }

  /**
   * Fetch analytics for a batch of videos from YouTube API - **CONCURRENTLY**
   */
  async fetchVideoStatistics(videos: VideoToCollect[]): Promise<VideoAnalytics[]> {
    if (videos.length === 0) return [];

    const videosByAccount = new Map<string, VideoToCollect[]>();
    videos.forEach(video => {
      const accountVideos = videosByAccount.get(video.accountId) || [];
      accountVideos.push(video);
      videosByAccount.set(video.accountId, accountVideos);
    });

    // OPTIMIZATION: Run all account processing concurrently using Promise.all
    const accountPromises = Array.from(videosByAccount.entries()).map(([accountId, accountVideos]) => 
        processAccountVideos(accountId, accountVideos)
    );

    const results = await Promise.all(accountPromises);
    return results.flat();
  }

  /**
   * Store analytics data in the database - **CONCURRENTLY**
   */
  async storeAnalytics(analytics: VideoAnalytics[]): Promise<void> {
    if (analytics.length === 0) return;

    console.log(`[CollectionService] Storing analytics for ${analytics.length} videos`);

    // OPTIMIZATION: Use Promise.all to run all video inserts concurrently
    const storePromises = analytics.map(async (data) => {
      try {
        // Fetch job data (still sequential DB call per video, but independent of others)
        const jobData = await query<JobAndVideoData>(`
          SELECT 
            qj.persona, qj.question_format, qj.topic_display_name, qj.data,
            uv.uploaded_at, uv.title
          FROM quiz_jobs qj
          JOIN uploaded_videos uv ON qj.id = uv.job_id
          WHERE qj.id = $1
        `, [data.jobId]);

        if (jobData.rows.length === 0) {
          console.warn(`[CollectionService] No job data found for ${data.jobId}`);
          return;
        }

        const job = jobData.rows[0];
        
        // Data Enrichment Logic
        const uploadedAt = new Date(job.uploaded_at);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(uploadedAt.getTime() + istOffset);
        const uploadHour = istDate.getHours();
        const uploadDayOfWeek = istDate.getDay(); // 0=Sunday, 6=Saturday

        const jobDataParsed = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
        
        const themeName = jobDataParsed?.themeName || null;
        const audioFile = jobDataParsed?.audioFile || null;
        const frameDurations = jobDataParsed?.frameDurations || null;
        const totalDuration = frameDurations && Array.isArray(frameDurations) ? 
          frameDurations.reduce((sum: number, duration: number) => sum + duration, 0) : null;
        
        const questionType = this.extractQuestionType(job.persona, job.topic_display_name);
        const topicCategory = this.extractTopicCategory(job.persona, job.topic_display_name);
        
        const content = jobDataParsed?.content || {};
        const hookType = this.extractHookType(content.hook);
        const ctaType = this.extractCtaType(content.cta);
        
        // Perform the insertion concurrently
        await query(`
          INSERT INTO video_analytics (
            video_id, job_id, account_id, views, likes, comments, dislikes,
            engagement_rate, like_ratio, video_uploaded_at, collected_at,
            upload_hour, upload_day_of_week, question_format, topic_display_name,
            persona, theme_name, audio_file, total_duration, frame_durations,
            question_type, topic_category, hook_type, cta_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        `, [
          data.videoId, data.jobId, data.accountId, data.views, data.likes,
          data.comments, data.dislikes, data.engagementRate, data.likeRatio,
          data.videoUploadedAt, uploadHour, uploadDayOfWeek, job.question_format,
          job.topic_display_name, job.persona, themeName, audioFile, totalDuration,
          frameDurations ? JSON.stringify(frameDurations) : null,
          questionType, topicCategory, hookType, ctaType
        ]);
      } catch (error) {
        console.error(`[CollectionService] Error storing analytics for video ${data.videoId}:`, error);
      }
    });

    // Wait for all concurrent database inserts to complete
    await Promise.all(storePromises);

    console.log(`[CollectionService] Successfully stored enhanced analytics for ${analytics.length} videos`);
  }

  /**
   * Complete analytics collection workflow
   */
  async collectAnalytics(limit: number): Promise<{ collected: number; errors: number; moreVideosToCollect: boolean }> {
    const startTime = Date.now();
    console.log(`[CollectionService] Starting analytics collection with limit: ${limit}`);

    try {
      // 1. Get a small batch of videos and check if more work remains
      const { videos: videosToCollect, totalCount } = await this.getVideosForAnalytics(limit);
      const moreVideosToCollect = totalCount > limit;
      console.log(`[CollectionService] Found ${totalCount} videos total, processing ${videosToCollect.length} in this batch.`);

      if (videosToCollect.length === 0) {
        return { collected: 0, errors: 0, moreVideosToCollect: false };
      }

      // 2. Concurrently fetch analytics from YouTube API
      const analytics = await this.fetchVideoStatistics(videosToCollect);

      // 3. Concurrently store all collected analytics
      await this.storeAnalytics(analytics);

      const duration = Date.now() - startTime;
      const errors = videosToCollect.length - analytics.length;

      console.log(`[CollectionService] Batch completed in ${duration}ms. Collected: ${analytics.length}, Errors: ${errors}`);
      return { collected: analytics.length, errors, moreVideosToCollect };

    } catch (error) {
      console.error('[CollectionService] Fatal error during analytics collection:', error);
      throw error;
    }
  }

  /**
   * Get analytics summary for dashboard display
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
    const accountFilter = accountId ? 'AND va.account_id = $1' : '';
    const params = accountId ? [accountId] : [];

    const summaryResult = await query<AnalyticsSummaryRow>(`
      SELECT 
        COUNT(*) as total_videos,
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(ROUND(AVG(engagement_rate), 2), 0) as avg_engagement_rate
      FROM video_analytics va
      WHERE 1=1 ${accountFilter}
    `, params);

    const topVideosResult = await query<TopVideoRow>(`
      SELECT 
        va.video_id, uv.title, va.views, va.engagement_rate, va.collected_at
      FROM video_analytics va
      JOIN uploaded_videos uv ON va.video_id = uv.youtube_video_id
      WHERE 1=1 ${accountFilter}
      ORDER BY va.engagement_rate DESC, va.views DESC
      LIMIT 10
    `, params);

    const summary = summaryResult.rows[0];
    
    return {
      totalVideos: parseInt(summary.total_videos, 10),
      totalViews: parseInt(summary.total_views, 10),
      avgEngagementRate: parseFloat(summary.avg_engagement_rate),
      topPerformingVideos: topVideosResult.rows.map((row) => ({
        videoId: row.video_id,
        title: row.title,
        views: parseInt(row.views, 10),
        engagementRate: parseFloat(row.engagement_rate),
        collectedAt: new Date(row.collected_at)
      }))
    };
  }

  /**
   * Get channel stats for all accounts
   */
  async getChannelStats(): Promise<ChannelStats[]> {
    const result = await query<ChannelStatsRow>(`
      SELECT 
        a.id as account_id,
        a.name as channel_name,
        COALESCE(COUNT(DISTINCT va.id), 0) as total_videos,
        COALESCE(SUM(va.views), 0) as total_views,
        COALESCE(ROUND(AVG(va.engagement_rate), 2), 0) as avg_engagement_rate,
        MAX(uv.uploaded_at) as last_upload,
        CASE 
          WHEN MAX(uv.uploaded_at) >= NOW() - INTERVAL '30 days' OR COUNT(DISTINCT va.id) > 0 
          THEN 'active' 
          ELSE 'inactive' 
        END as status
      FROM accounts a
      LEFT JOIN quiz_jobs qj ON a.id = qj.account_id
      LEFT JOIN uploaded_videos uv ON qj.id = uv.job_id
      LEFT JOIN video_analytics va ON uv.youtube_video_id = va.video_id
      GROUP BY a.id, a.name
      ORDER BY total_views DESC
    `);

    return result.rows.map((row) => ({
      accountId: row.account_id,
      channelName: row.channel_name,
      totalVideos: parseInt(row.total_videos, 10),
      totalViews: parseInt(row.total_views, 10),
      avgEngagementRate: parseFloat(row.avg_engagement_rate),
      lastUpload: row.last_upload,
      status: row.status as 'active' | 'inactive'
    }));
  }

  /**
   * Get persona stats across accounts
   */
  async getPersonaStats(): Promise<PersonaStats[]> {
    const result = await query<PersonaStatsRow>(`
      SELECT 
        qj.persona as persona_name,
        qj.account_id,
        COALESCE(COUNT(DISTINCT va.id), 0) as total_videos,
        COALESCE(ROUND(AVG(va.engagement_rate), 2), 0) as avg_engagement_rate,
        MAX(uv.uploaded_at) as last_video
      FROM quiz_jobs qj
      LEFT JOIN uploaded_videos uv ON qj.id = uv.job_id
      LEFT JOIN video_analytics va ON uv.youtube_video_id = va.video_id
      WHERE qj.persona IS NOT NULL
      GROUP BY qj.persona, qj.account_id
      ORDER BY total_videos DESC
    `);

    return result.rows.map((row) => ({
      personaName: row.persona_name,
      accountId: row.account_id,
      totalVideos: parseInt(row.total_videos, 10),
      avgEngagementRate: parseFloat(row.avg_engagement_rate),
      lastVideo: row.last_video
    }));
  }
  
  // Helper methods for extracting contextual data
  private extractQuestionType(persona: string, topicDisplayName: string): string | null {
     if (!persona || !topicDisplayName) return null;
     const topicLower = topicDisplayName.toLowerCase();
     if (persona.includes('english')) {
       if (topicLower.includes('synonym')) return 'synonym';
       if (topicLower.includes('antonym')) return 'antonym';
       if (topicLower.includes('definition')) return 'definition';
       if (topicLower.includes('usage')) return 'usage';
       return 'vocabulary';
     }
     if (persona.includes('health')) {
       if (topicLower.includes('exercise')) return 'exercise_tip';
       if (topicLower.includes('nutrition')) return 'nutrition_tip';
       if (topicLower.includes('mental')) return 'mental_health';
       if (topicLower.includes('brain')) return 'brain_health';
       if (topicLower.includes('eye')) return 'eye_health';
       return 'health_tip';
     }
     if (persona.includes('ssc')) {
       if (topicLower.includes('history')) return 'history_question';
       if (topicLower.includes('geography')) return 'geography_question';
       if (topicLower.includes('polity')) return 'polity_question';
       return 'general_knowledge';
     }
     return 'general';
  }

  private extractTopicCategory(persona: string, topicDisplayName: string): string | null {
    if (!persona) return null;
    if (persona.includes('english')) return 'Language Learning';
    if (persona.includes('health')) return 'Health & Wellness';
    if (persona.includes('ssc')) return 'Competitive Exams';
    if (persona.includes('astronomy') || persona.includes('space')) return 'Science & Space';
    return 'Educational';
  }

  private extractHookType(hook: string): string | null {
    if (!hook || typeof hook !== 'string') return null;
    const hookLower = hook.toLowerCase();
    if (hookLower.includes('did you know')) return 'did_you_know';
    if (hookLower.includes('test yourself') || hookLower.includes('quiz')) return 'challenge';
    if (hookLower.includes('can you')) return 'question';
    if (hookLower.includes('discover') || hookLower.includes('learn')) return 'educational';
    if (hookLower.includes('mistake') || hookLower.includes('error')) return 'mistake_warning';
    if (hookLower.includes('secret') || hookLower.includes('tip')) return 'secret_tip';
    return 'general';
}

  private extractCtaType(cta: string): string | null {
    if (!cta || typeof cta !== 'string') return null;
    const ctaLower = cta.toLowerCase();
    if (ctaLower.includes('subscribe')) return 'subscribe';
    if (ctaLower.includes('like')) return 'like';
    if (ctaLower.includes('comment')) return 'comment';
    if (ctaLower.includes('follow')) return 'follow';
    if (ctaLower.includes('share')) return 'share';
    if (ctaLower.includes('learn more')) return 'learn_more';
    if (ctaLower.includes('practice')) return 'practice';
    return 'general';
  }
}

export const analyticsCollectionService = new AnalyticsCollectionService();
export default analyticsCollectionService;
