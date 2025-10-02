// lib/analytics/collectionService.ts
import { google } from 'googleapis';
import { getOAuth2Client } from '../googleAuth';
import { query } from '../database';
import { VideoAnalytics, VideoToCollect } from './types';

class AnalyticsCollectionService {
  /**
   * Get videos that need analytics collection (uploaded 24+ hours ago, not yet analyzed)
   */
  async getVideosForAnalytics(): Promise<VideoToCollect[]> {
    const result = await query(`
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
      LIMIT 50
    `);

    return result.rows.map((row: any) => ({
      videoId: row.video_id,
      jobId: row.job_id,
      accountId: row.account_id,
      uploadedAt: new Date(row.uploaded_at)
    }));
  }

  /**
   * Fetch analytics for a batch of videos from YouTube API
   */
  async fetchVideoStatistics(videos: VideoToCollect[]): Promise<VideoAnalytics[]> {
    if (videos.length === 0) return [];

    const videosByAccount = new Map<string, VideoToCollect[]>();
    videos.forEach(video => {
      const accountVideos = videosByAccount.get(video.accountId) || [];
      accountVideos.push(video);
      videosByAccount.set(video.accountId, accountVideos);
    });

    const allAnalytics: VideoAnalytics[] = [];

    for (const [accountId, accountVideos] of videosByAccount) {
      try {
        const oauth2Client = await getOAuth2Client(accountId);
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const videoIds = accountVideos.map(v => v.videoId).join(',');
        
        console.log(`[CollectionService] Fetching analytics for ${accountVideos.length} videos from account: ${accountId}`);
        
        const response = await youtube.videos.list({
          part: ['statistics'],
          id: [videoIds],
        });

        if (!response.data.items) {
          console.warn(`[CollectionService] No data returned for account ${accountId}`);
          continue;
        }

        for (const item of response.data.items) {
          const video = accountVideos.find(v => v.videoId === item.id);
          if (!video || !item.statistics) continue;

          const stats = item.statistics;
          const views = parseInt(stats.viewCount || '0');
          const likes = parseInt(stats.likeCount || '0');
          const comments = parseInt(stats.commentCount || '0');
          const dislikes = parseInt(stats.dislikeCount || '0');

          const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
          const likeRatio = views > 0 ? (likes / views) * 100 : 0;

          allAnalytics.push({
            videoId: video.videoId,
            jobId: video.jobId,
            accountId: video.accountId,
            views,
            likes,
            comments,
            dislikes,
            engagementRate: Math.round(engagementRate * 100) / 100,
            likeRatio: Math.round(likeRatio * 100) / 100,
            videoUploadedAt: video.uploadedAt
          });
        }
        console.log(`[CollectionService] Collected analytics for ${response.data.items.length} videos from ${accountId}`);
      } catch (error) {
        console.error(`[CollectionService] Error fetching analytics for account ${accountId}:`, error);
      }
    }
    return allAnalytics;
  }

  /**
   * Store analytics data in the database with enhanced timing and contextual data
   */
  async storeAnalytics(analytics: VideoAnalytics[]): Promise<void> {
    if (analytics.length === 0) return;

    console.log(`[CollectionService] Storing analytics for ${analytics.length} videos`);

    for (const data of analytics) {
      try {
        const jobData = await query(`
          SELECT 
            qj.persona, qj.question_format, qj.topic_display_name, qj.data,
            uv.uploaded_at, uv.title
          FROM quiz_jobs qj
          JOIN uploaded_videos uv ON qj.id = uv.job_id
          WHERE qj.id = $1
        `, [data.jobId]);

        if (jobData.rows.length === 0) {
          console.warn(`[CollectionService] No job data found for ${data.jobId}`);
          continue;
        }

        const job = jobData.rows[0];
        const uploadedAt = new Date(job.uploaded_at);
        
        // Convert to IST (UTC + 5:30) for timing analysis
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
    }

    console.log(`[CollectionService] Successfully stored enhanced analytics for ${analytics.length} videos`);
  }

  /**
   * Complete analytics collection workflow
   */
  async collectAnalytics(): Promise<{ collected: number; errors: number }> {
    const startTime = Date.now();
    console.log('[CollectionService] Starting analytics collection...');

    try {
      const videosToCollect = await this.getVideosForAnalytics();
      console.log(`[CollectionService] Found ${videosToCollect.length} videos needing analytics`);

      if (videosToCollect.length === 0) {
        console.log('[CollectionService] No videos need analytics collection at this time');
        return { collected: 0, errors: 0 };
      }

      const analytics = await this.fetchVideoStatistics(videosToCollect);
      console.log(`[CollectionService] Successfully fetched analytics for ${analytics.length} videos`);

      await this.storeAnalytics(analytics);

      const duration = Date.now() - startTime;
      const errors = videosToCollect.length - analytics.length;

      console.log(`[CollectionService] Analytics collection completed in ${duration}ms. Collected: ${analytics.length}, Errors: ${errors}`);
      return { collected: analytics.length, errors };

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

    const summaryResult = await query(`
      SELECT 
        COUNT(*) as total_videos,
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(ROUND(AVG(engagement_rate), 2), 0) as avg_engagement_rate
      FROM video_analytics va
      WHERE 1=1 ${accountFilter}
    `, params);

    const topVideosResult = await query(`
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
      totalVideos: parseInt(summary.total_videos),
      totalViews: parseInt(summary.total_views),
      avgEngagementRate: parseFloat(summary.avg_engagement_rate),
      topPerformingVideos: topVideosResult.rows.map((row: any) => ({
        videoId: row.video_id,
        title: row.title,
        views: parseInt(row.views),
        engagementRate: parseFloat(row.engagement_rate),
        collectedAt: new Date(row.collected_at)
      }))
    };
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