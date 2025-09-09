import { google } from 'googleapis';
import { getOAuth2Client } from './googleAuth';
import { query } from './database';

export interface VideoAnalytics {
  videoId: string;
  jobId: string;
  accountId: string;
  views: number;
  likes: number;
  comments: number;
  dislikes: number;
  engagementRate: number;
  likeRatio: number;
  videoUploadedAt: Date;
}

export interface VideoToCollect {
  videoId: string;
  jobId: string;
  accountId: string;
  uploadedAt: Date;
}

export interface AIAnalyticsInsights {
  performanceAnalysis: string;
  contentRecommendations: string[];
  topicOptimization: string[];
  timingOptimization: string[];
  formatOptimization: string[];
  engagementStrategies: string[];
  personaSpecificAdvice: string[];
  predictiveInsights: string[];
}

export interface AnalyticsDataForAI {
  accountId: string;
  persona: string;
  totalVideos: number;
  avgEngagementRate: number;
  avgViews: number;
  topPerformingTopics: Array<{
    topic: string;
    engagementRate: number;
    views: number;
    videoCount: number;
  }>;
  underperformingTopics: Array<{
    topic: string;
    engagementRate: number;
    views: number;
    videoCount: number;
  }>;
  recentTrends: {
    engagementTrend: 'increasing' | 'decreasing' | 'stable';
    viewsTrend: 'increasing' | 'decreasing' | 'stable';
    topicPerformanceShifts: string[];
  };
  timingInsights?: {
    bestHours: number[];
    bestDays: number[];
    worstHours: number[];
    worstDays: number[];
    hourlyData: Array<{ hour: number; avgEngagementRate: number; videoCount: number; }>;
    weeklyData: Array<{ dayOfWeek: number; dayName: string; avgEngagementRate: number; videoCount: number; }>;
  };
  formatInsights?: {
    bestFormat: string;
    worstFormat: string;
    mostConsistent: string;
    formatData: Array<{ format: string; avgEngagementRate: number; videoCount: number; consistency: string; }>;
  };
}

class AnalyticsService {
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

    return result.rows.map(row => ({
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

    // Group videos by account for separate API calls
    const videosByAccount = new Map<string, VideoToCollect[]>();
    videos.forEach(video => {
      const accountVideos = videosByAccount.get(video.accountId) || [];
      accountVideos.push(video);
      videosByAccount.set(video.accountId, accountVideos);
    });

    const allAnalytics: VideoAnalytics[] = [];

    // Fetch analytics for each account separately
    for (const [accountId, accountVideos] of videosByAccount) {
      try {
        const oauth2Client = await getOAuth2Client(accountId);
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        // Batch fetch video statistics (up to 50 videos per request)
        const videoIds = accountVideos.map(v => v.videoId).join(',');
        
        console.log(`[AnalyticsService] Fetching analytics for ${accountVideos.length} videos from account: ${accountId}`);
        
        const response = await youtube.videos.list({
          part: ['statistics'],
          id: [videoIds],
        });

        if (!response.data.items) {
          console.warn(`[AnalyticsService] No data returned for account ${accountId}`);
          continue;
        }

        // Process the statistics for each video
        for (const item of response.data.items) {
          const video = accountVideos.find(v => v.videoId === item.id);
          if (!video || !item.statistics) continue;

          const stats = item.statistics;
          const views = parseInt(stats.viewCount || '0');
          const likes = parseInt(stats.likeCount || '0');
          const comments = parseInt(stats.commentCount || '0');
          const dislikes = parseInt(stats.dislikeCount || '0'); // Usually 0 now

          // Calculate engagement metrics
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
            engagementRate: Math.round(engagementRate * 100) / 100, // Round to 2 decimals
            likeRatio: Math.round(likeRatio * 100) / 100,
            videoUploadedAt: video.uploadedAt
          });
        }

        console.log(`[AnalyticsService] Collected analytics for ${response.data.items.length} videos from ${accountId}`);

      } catch (error) {
        console.error(`[AnalyticsService] Error fetching analytics for account ${accountId}:`, error);
        // Continue with other accounts even if one fails
      }
    }

    return allAnalytics;
  }

  /**
   * Store analytics data in the database with enhanced timing data
   */
  async storeAnalytics(analytics: VideoAnalytics[]): Promise<void> {
    if (analytics.length === 0) return;

    console.log(`[AnalyticsService] Storing analytics for ${analytics.length} videos`);

    for (const data of analytics) {
      try {
        // Get additional job data for timing and format analysis
        const jobData = await query(`
          SELECT qj.question_format, qj.topic_display_name, uv.uploaded_at
          FROM quiz_jobs qj
          JOIN uploaded_videos uv ON qj.id = uv.job_id
          WHERE qj.id = $1
        `, [data.jobId]);

        if (jobData.rows.length === 0) {
          console.warn(`[AnalyticsService] No job data found for ${data.jobId}`);
          continue;
        }

        const job = jobData.rows[0];
        const uploadedAt = new Date(job.uploaded_at);
        
        // Convert to IST (UTC + 5:30) for timing analysis
        const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
        const istDate = new Date(uploadedAt.getTime() + istOffset);
        
        const uploadHour = istDate.getHours();
        const uploadDayOfWeek = istDate.getDay(); // 0=Sunday, 6=Saturday

        await query(`
          INSERT INTO video_analytics (
            video_id, job_id, account_id, views, likes, comments, dislikes,
            engagement_rate, like_ratio, video_uploaded_at, collected_at,
            upload_hour, upload_day_of_week, question_format, topic_display_name
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12, $13, $14)
        `, [
          data.videoId,
          data.jobId,
          data.accountId,
          data.views,
          data.likes,
          data.comments,
          data.dislikes,
          data.engagementRate,
          data.likeRatio,
          data.videoUploadedAt,
          uploadHour,
          uploadDayOfWeek,
          job.question_format,
          job.topic_display_name
        ]);
      } catch (error) {
        console.error(`[AnalyticsService] Error storing analytics for video ${data.videoId}:`, error);
        // Continue with other videos even if one fails
      }
    }

    console.log(`[AnalyticsService] Successfully stored enhanced analytics for ${analytics.length} videos`);
  }

  /**
   * Complete analytics collection workflow
   */
  async collectAnalytics(): Promise<{ collected: number; errors: number }> {
    const startTime = Date.now();
    console.log('[AnalyticsService] Starting analytics collection...');

    try {
      // Step 1: Get videos that need analytics
      const videosToCollect = await this.getVideosForAnalytics();
      console.log(`[AnalyticsService] Found ${videosToCollect.length} videos needing analytics`);

      if (videosToCollect.length === 0) {
        console.log('[AnalyticsService] No videos need analytics collection at this time');
        return { collected: 0, errors: 0 };
      }

      // Step 2: Fetch analytics from YouTube API
      const analytics = await this.fetchVideoStatistics(videosToCollect);
      console.log(`[AnalyticsService] Successfully fetched analytics for ${analytics.length} videos`);

      // Step 3: Store analytics in database
      await this.storeAnalytics(analytics);

      const duration = Date.now() - startTime;
      const errors = videosToCollect.length - analytics.length;

      console.log(`[AnalyticsService] Analytics collection completed in ${duration}ms`);
      console.log(`[AnalyticsService] Collected: ${analytics.length}, Errors: ${errors}`);

      return { collected: analytics.length, errors };

    } catch (error) {
      console.error('[AnalyticsService] Fatal error during analytics collection:', error);
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
        va.video_id,
        uv.title,
        va.views,
        va.engagement_rate,
        va.collected_at
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
      topPerformingVideos: topVideosResult.rows.map(row => ({
        videoId: row.video_id,
        title: row.title,
        views: parseInt(row.views),
        engagementRate: parseFloat(row.engagement_rate),
        collectedAt: new Date(row.collected_at)
      }))
    };
  }

  // ========================================
  // AI-Powered Analytics Methods
  // ========================================

  private readonly apiKey: string = process.env.DEEPSEEK_API_KEY!;
  private readonly apiUrl = 'https://api.deepseek.com/v1/chat/completions';

  /**
   * Collect comprehensive analytics data for AI analysis
   */
  async collectAnalyticsDataForAI(accountId: string, persona: string): Promise<AnalyticsDataForAI> {
    console.log(`[Analytics] Collecting AI data for ${persona} (${accountId})`);

    // Get overall performance stats
    const overallStats = await query(`
      SELECT 
        COUNT(*) as total_videos,
        ROUND(AVG(va.engagement_rate), 2) as avg_engagement_rate,
        ROUND(AVG(va.views), 0) as avg_views
      FROM quiz_jobs qj
      JOIN video_analytics va ON qj.id = va.job_id
      WHERE qj.persona = $1 AND qj.account_id = $2
        AND va.collected_at > NOW() - INTERVAL '30 days'
    `, [persona, accountId]);

    // Get top performing topics
    const topTopics = await query(`
      SELECT 
        qj.topic_display_name as topic,
        ROUND(AVG(va.engagement_rate), 2) as engagement_rate,
        ROUND(AVG(va.views), 0) as views,
        COUNT(*) as video_count
      FROM quiz_jobs qj
      JOIN video_analytics va ON qj.id = va.job_id
      WHERE qj.persona = $1 AND qj.account_id = $2
        AND va.collected_at > NOW() - INTERVAL '30 days'
      GROUP BY qj.topic_display_name
      HAVING COUNT(*) >= 2
      ORDER BY engagement_rate DESC, views DESC
      LIMIT 5
    `, [persona, accountId]);

    // Get underperforming topics
    const underTopics = await query(`
      SELECT 
        qj.topic_display_name as topic,
        ROUND(AVG(va.engagement_rate), 2) as engagement_rate,
        ROUND(AVG(va.views), 0) as views,
        COUNT(*) as video_count
      FROM quiz_jobs qj
      JOIN video_analytics va ON qj.id = va.job_id
      WHERE qj.persona = $1 AND qj.account_id = $2
        AND va.collected_at > NOW() - INTERVAL '30 days'
      GROUP BY qj.topic_display_name
      HAVING COUNT(*) >= 2
      ORDER BY engagement_rate ASC, views ASC
      LIMIT 3
    `, [persona, accountId]);

    // Analyze trends (compare last 15 days vs previous 15 days)
    const trendData = await query(`
      WITH recent AS (
        SELECT AVG(va.engagement_rate) as recent_engagement, AVG(va.views) as recent_views
        FROM quiz_jobs qj
        JOIN video_analytics va ON qj.id = va.job_id
        WHERE qj.persona = $1 AND qj.account_id = $2
          AND va.collected_at > NOW() - INTERVAL '15 days'
      ),
      previous AS (
        SELECT AVG(va.engagement_rate) as prev_engagement, AVG(va.views) as prev_views
        FROM quiz_jobs qj
        JOIN video_analytics va ON qj.id = va.job_id
        WHERE qj.persona = $1 AND qj.account_id = $2
          AND va.collected_at BETWEEN NOW() - INTERVAL '30 days' AND NOW() - INTERVAL '15 days'
      )
      SELECT 
        r.recent_engagement, r.recent_views,
        p.prev_engagement, p.prev_views
      FROM recent r, previous p
    `, [persona, accountId]);

    const stats = overallStats.rows[0];
    const trend = trendData.rows[0];

    // Determine trends
    const engagementTrend = !trend ? 'stable' : 
      trend.recent_engagement > trend.prev_engagement * 1.1 ? 'increasing' :
      trend.recent_engagement < trend.prev_engagement * 0.9 ? 'decreasing' : 'stable';

    const viewsTrend = !trend ? 'stable' :
      trend.recent_views > trend.prev_views * 1.1 ? 'increasing' :
      trend.recent_views < trend.prev_views * 0.9 ? 'decreasing' : 'stable';

    // Get timing and format insights
    const timingAnalytics = await this.getTimingAnalytics(accountId, persona);
    const formatAnalytics = await this.getFormatAnalytics(accountId, persona);

    return {
      accountId,
      persona,
      totalVideos: parseInt(stats?.total_videos || '0'),
      avgEngagementRate: parseFloat(stats?.avg_engagement_rate || '0'),
      avgViews: parseInt(stats?.avg_views || '0'),
      topPerformingTopics: topTopics.rows.map((row: any) => ({
        topic: row.topic || 'Unknown',
        engagementRate: parseFloat(row.engagement_rate),
        views: parseInt(row.views),
        videoCount: parseInt(row.video_count)
      })),
      underperformingTopics: underTopics.rows.map((row: any) => ({
        topic: row.topic || 'Unknown',
        engagementRate: parseFloat(row.engagement_rate),
        views: parseInt(row.views),
        videoCount: parseInt(row.video_count)
      })),
      recentTrends: {
        engagementTrend,
        viewsTrend,
        topicPerformanceShifts: []
      },
      timingInsights: {
        bestHours: timingAnalytics.bestTimingRecommendations.bestHours,
        bestDays: timingAnalytics.bestTimingRecommendations.bestDays,
        worstHours: timingAnalytics.bestTimingRecommendations.worstHours,
        worstDays: timingAnalytics.bestTimingRecommendations.worstDays,
        hourlyData: timingAnalytics.hourlyPerformance.map(h => ({
          hour: h.hour,
          avgEngagementRate: h.avgEngagementRate,
          videoCount: h.videoCount
        })),
        weeklyData: timingAnalytics.weeklyPerformance.map(d => ({
          dayOfWeek: d.dayOfWeek,
          dayName: d.dayName,
          avgEngagementRate: d.avgEngagementRate,
          videoCount: d.videoCount
        }))
      },
      formatInsights: {
        bestFormat: formatAnalytics.formatRecommendations.bestFormat,
        worstFormat: formatAnalytics.formatRecommendations.worstFormat,
        mostConsistent: formatAnalytics.formatRecommendations.mostConsistent,
        formatData: formatAnalytics.formatPerformance.map(f => ({
          format: f.format,
          avgEngagementRate: f.avgEngagementRate,
          videoCount: f.videoCount,
          consistency: f.consistency
        }))
      }
    };
  }

  /**
   * Get timing performance analytics
   */
  async getTimingAnalytics(accountId: string, persona?: string): Promise<{
    hourlyPerformance: Array<{
      hour: number;
      avgEngagementRate: number;
      avgViews: number;
      videoCount: number;
    }>;
    weeklyPerformance: Array<{
      dayOfWeek: number;
      dayName: string;
      avgEngagementRate: number;
      avgViews: number;
      videoCount: number;
    }>;
    bestTimingRecommendations: {
      bestHours: number[];
      bestDays: number[];
      worstHours: number[];
      worstDays: number[];
    };
  }> {
    const personaFilter = persona ? 'AND qj.persona = $2' : '';
    const params = persona ? [accountId, persona] : [accountId];

    // Hourly performance
    const hourlyData = await query(`
      SELECT 
        va.upload_hour as hour,
        ROUND(AVG(va.engagement_rate), 2) as avg_engagement_rate,
        ROUND(AVG(va.views), 0) as avg_views,
        COUNT(*) as video_count
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      WHERE va.account_id = $1 ${personaFilter}
        AND va.upload_hour IS NOT NULL
        AND va.collected_at > NOW() - INTERVAL '60 days'
      GROUP BY va.upload_hour
      HAVING COUNT(*) >= 2
      ORDER BY va.upload_hour
    `, params);

    // Weekly performance
    const weeklyData = await query(`
      SELECT 
        va.upload_day_of_week as day_of_week,
        ROUND(AVG(va.engagement_rate), 2) as avg_engagement_rate,
        ROUND(AVG(va.views), 0) as avg_views,
        COUNT(*) as video_count
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      WHERE va.account_id = $1 ${personaFilter}
        AND va.upload_day_of_week IS NOT NULL
        AND va.collected_at > NOW() - INTERVAL '60 days'
      GROUP BY va.upload_day_of_week
      HAVING COUNT(*) >= 2
      ORDER BY va.upload_day_of_week
    `, params);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const hourlyPerformance = hourlyData.rows.map(row => ({
      hour: parseInt(row.hour),
      avgEngagementRate: parseFloat(row.avg_engagement_rate),
      avgViews: parseInt(row.avg_views),
      videoCount: parseInt(row.video_count)
    }));

    const weeklyPerformance = weeklyData.rows.map(row => ({
      dayOfWeek: parseInt(row.day_of_week),
      dayName: dayNames[parseInt(row.day_of_week)],
      avgEngagementRate: parseFloat(row.avg_engagement_rate),
      avgViews: parseInt(row.avg_views),
      videoCount: parseInt(row.video_count)
    }));

    // Calculate recommendations
    const sortedByEngagement = [...hourlyPerformance].sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
    const sortedDaysByEngagement = [...weeklyPerformance].sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);

    const bestHours = sortedByEngagement.slice(0, 3).map(h => h.hour);
    const worstHours = sortedByEngagement.slice(-2).map(h => h.hour);
    const bestDays = sortedDaysByEngagement.slice(0, 3).map(d => d.dayOfWeek);
    const worstDays = sortedDaysByEngagement.slice(-2).map(d => d.dayOfWeek);

    return {
      hourlyPerformance,
      weeklyPerformance,
      bestTimingRecommendations: {
        bestHours,
        bestDays,
        worstHours,
        worstDays
      }
    };
  }

  /**
   * Get format performance analytics
   */
  async getFormatAnalytics(accountId: string, persona?: string): Promise<{
    formatPerformance: Array<{
      format: string;
      avgEngagementRate: number;
      avgViews: number;
      videoCount: number;
      engagementStddev: number;
      consistency: 'high' | 'medium' | 'low';
    }>;
    formatRecommendations: {
      bestFormat: string;
      worstFormat: string;
      mostConsistent: string;
      leastConsistent: string;
    };
  }> {
    const personaFilter = persona ? 'AND qj.persona = $2' : '';
    const params = persona ? [accountId, persona] : [accountId];

    const formatData = await query(`
      SELECT 
        va.question_format as format,
        ROUND(AVG(va.engagement_rate), 2) as avg_engagement_rate,
        ROUND(AVG(va.views), 0) as avg_views,
        COUNT(*) as video_count,
        ROUND(STDDEV(va.engagement_rate), 2) as engagement_stddev,
        MIN(va.engagement_rate) as min_engagement,
        MAX(va.engagement_rate) as max_engagement
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      WHERE va.account_id = $1 ${personaFilter}
        AND va.question_format IS NOT NULL
        AND va.collected_at > NOW() - INTERVAL '60 days'
      GROUP BY va.question_format
      HAVING COUNT(*) >= 3
      ORDER BY avg_engagement_rate DESC
    `, params);

    const formatPerformance = formatData.rows.map(row => {
      const stddev = parseFloat(row.engagement_stddev || '0');
      let consistency: 'high' | 'medium' | 'low' = 'medium';
      
      if (stddev < 1.0) consistency = 'high';
      else if (stddev > 2.0) consistency = 'low';

      return {
        format: row.format,
        avgEngagementRate: parseFloat(row.avg_engagement_rate),
        avgViews: parseInt(row.avg_views),
        videoCount: parseInt(row.video_count),
        engagementStddev: stddev,
        consistency
      };
    });

    const sortedByConsistency = [...formatPerformance].sort((a, b) => a.engagementStddev - b.engagementStddev);

    return {
      formatPerformance,
      formatRecommendations: {
        bestFormat: formatPerformance[0]?.format || 'multiple_choice',
        worstFormat: formatPerformance[formatPerformance.length - 1]?.format || 'multiple_choice',
        mostConsistent: sortedByConsistency[0]?.format || 'multiple_choice',
        leastConsistent: sortedByConsistency[sortedByConsistency.length - 1]?.format || 'multiple_choice'
      }
    };
  }

  /**
   * Generate AI-powered insights using DeepSeek API
   */
  async generateAIInsights(analyticsData: AnalyticsDataForAI): Promise<AIAnalyticsInsights> {
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is required for AI analytics');
    }

    const prompt = this.buildAnalyticsPrompt(analyticsData);

    try {
      console.log(`[Analytics] Generating AI insights for ${analyticsData.persona}`);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an expert YouTube analytics consultant specializing in educational content optimization. Provide actionable, data-driven insights for improving video performance.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from DeepSeek API');
      }

      return this.parseAIResponse(aiResponse);

    } catch (error) {
      console.error('[Analytics] Error generating AI insights:', error);
      return this.generateFallbackInsights(analyticsData);
    }
  }

  /**
   * Build comprehensive analytics prompt for AI analysis
   */
  private buildAnalyticsPrompt(data: AnalyticsDataForAI): string {
    const topTopics = data.topPerformingTopics.map(t => 
      `- ${t.topic}: ${t.engagementRate}% engagement, ${t.views} avg views (${t.videoCount} videos)`
    ).join('\n');

    const underTopics = data.underperformingTopics.map(t => 
      `- ${t.topic}: ${t.engagementRate}% engagement, ${t.views} avg views (${t.videoCount} videos)`
    ).join('\n');

    // Build timing insights section
    const timingSection = data.timingInsights ? `
UPLOAD TIMING ANALYSIS:
- Best Performing Hours (IST): ${data.timingInsights.bestHours.map(h => `${h}:00`).join(', ')}
- Best Performing Days: ${data.timingInsights.bestDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}
- Worst Performing Hours: ${data.timingInsights.worstHours.map(h => `${h}:00`).join(', ')}
- Hourly Engagement Data: ${data.timingInsights.hourlyData.slice(0, 5).map(h => 
    `${h.hour}:00 (${h.avgEngagementRate}% engagement, ${h.videoCount} videos)`).join(', ')}
` : '';

    // Build format insights section  
    const formatSection = data.formatInsights ? `
CONTENT FORMAT ANALYSIS:
- Best Format: ${data.formatInsights.bestFormat} (highest engagement)
- Most Consistent: ${data.formatInsights.mostConsistent} (lowest variability)
- Format Performance: ${data.formatInsights.formatData.map(f => 
    `${f.format} (${f.avgEngagementRate}% avg, ${f.consistency} consistency)`).join(', ')}
` : '';

    return `Analyze this YouTube channel's performance data and provide actionable insights:

CHANNEL CONTEXT:
- Account: ${data.accountId}
- Content Type: ${data.persona}
- Target Audience: ${this.getAudienceDescription(data.persona)}

PERFORMANCE METRICS (Last 30 Days):
- Total Videos: ${data.totalVideos}
- Average Engagement Rate: ${data.avgEngagementRate}%
- Average Views: ${data.avgViews}
- Engagement Trend: ${data.recentTrends.engagementTrend}
- Views Trend: ${data.recentTrends.viewsTrend}

TOP PERFORMING TOPICS:
${topTopics || 'None with sufficient data'}

UNDERPERFORMING TOPICS:
${underTopics || 'None identified'}${timingSection}${formatSection}

Please provide analysis in this exact format:

PERFORMANCE_ANALYSIS:
[2-3 sentences analyzing overall performance, trends, and key patterns including timing and format insights]

CONTENT_RECOMMENDATIONS:
[3-5 specific content topic/format recommendations based on data]

TOPIC_OPTIMIZATION:
[2-4 suggestions for optimizing topic selection and presentation]

TIMING_OPTIMIZATION:
[2-3 specific recommendations for upload timing based on the timing analysis data]

FORMAT_OPTIMIZATION:
[2-3 recommendations for content format optimization based on format performance data]

ENGAGEMENT_STRATEGIES:
[3-5 tactical strategies to improve engagement rates]

PERSONA_SPECIFIC_ADVICE:
[2-3 recommendations specific to ${data.persona} content type]

PREDICTIVE_INSIGHTS:
[2-3 forward-looking predictions or opportunities based on the data]

Keep recommendations specific, actionable, and based on the provided data.`;
  }

  /**
   * Get audience description for different personas
   */
  private getAudienceDescription(persona: string): string {
    const descriptions: Record<string, string> = {
      'english_vocab_builder': 'Global English language learners seeking vocabulary improvement',
      'brain_health_tips': 'Health-conscious individuals interested in cognitive wellness',
      'eye_health_tips': 'People concerned about vision health and screen time effects',
    };
    
    return descriptions[persona] || 'Educational content consumers';
  }

  /**
   * Parse AI response into structured insights
   */
  private parseAIResponse(response: string): AIAnalyticsInsights {
    const sections = {
      performanceAnalysis: this.extractSection(response, 'PERFORMANCE_ANALYSIS:'),
      contentRecommendations: this.extractListSection(response, 'CONTENT_RECOMMENDATIONS:'),
      topicOptimization: this.extractListSection(response, 'TOPIC_OPTIMIZATION:'),
      timingOptimization: this.extractListSection(response, 'TIMING_OPTIMIZATION:'),
      formatOptimization: this.extractListSection(response, 'FORMAT_OPTIMIZATION:'),
      engagementStrategies: this.extractListSection(response, 'ENGAGEMENT_STRATEGIES:'),
      personaSpecificAdvice: this.extractListSection(response, 'PERSONA_SPECIFIC_ADVICE:'),
      predictiveInsights: this.extractListSection(response, 'PREDICTIVE_INSIGHTS:')
    };

    return sections;
  }

  /**
   * Extract a single section from AI response
   */
  private extractSection(response: string, sectionHeader: string): string {
    const lines = response.split('\n');
    const startIndex = lines.findIndex(line => line.includes(sectionHeader));
    
    if (startIndex === -1) return 'No analysis provided';

    let content = '';
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.endsWith(':') && line.toUpperCase() === line) break; // Next section
      if (line) content += line + ' ';
    }

    return content.trim() || 'No analysis provided';
  }

  /**
   * Extract a list section from AI response
   */
  private extractListSection(response: string, sectionHeader: string): string[] {
    const lines = response.split('\n');
    const startIndex = lines.findIndex(line => line.includes(sectionHeader));
    
    if (startIndex === -1) return ['No recommendations provided'];

    const items: string[] = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.endsWith(':') && line.toUpperCase() === line) break; // Next section
      if (line && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
        items.push(line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''));
      }
    }

    return items.length > 0 ? items : ['No recommendations provided'];
  }

  /**
   * Generate fallback insights if AI fails
   */
  private generateFallbackInsights(data: AnalyticsDataForAI): AIAnalyticsInsights {
    return {
      performanceAnalysis: `Channel has ${data.totalVideos} videos with ${data.avgEngagementRate}% average engagement rate. Performance is ${data.recentTrends.engagementTrend} based on recent trends.`,
      contentRecommendations: [
        data.topPerformingTopics.length > 0 
          ? `Focus more on "${data.topPerformingTopics[0].topic}" content which shows strong performance`
          : 'Experiment with diverse content topics to identify high-performing areas',
        'Consider trending topics in your niche for better discoverability',
        'Test different question formats and difficulty levels'
      ],
      topicOptimization: [
        'Analyze successful topic patterns and create variations',
        'Test timing and seasonality effects on topic performance'
      ],
      timingOptimization: [
        data.timingInsights?.bestHours.length 
          ? `Focus uploads during peak hours: ${data.timingInsights.bestHours.map(h => `${h}:00`).join(', ')} IST`
          : 'Experiment with different upload times to identify peak engagement windows',
        data.timingInsights?.bestDays.length
          ? `Schedule more content on high-performing days: ${data.timingInsights.bestDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`
          : 'Test various days of the week to optimize scheduling strategy'
      ],
      formatOptimization: [
        data.formatInsights?.bestFormat
          ? `Prioritize ${data.formatInsights.bestFormat} format which shows highest engagement`
          : 'Test multiple content formats to identify most effective approach',
        data.formatInsights?.mostConsistent
          ? `Consider ${data.formatInsights.mostConsistent} format for consistent performance`
          : 'Focus on maintaining consistent quality across all content formats'
      ],
      engagementStrategies: [
        'Improve titles with more compelling questions or emotional hooks',
        'Experiment with visual presentation and graphics',
        'Include clear calls-to-action for viewer interaction'
      ],
      personaSpecificAdvice: [
        `Optimize content for ${data.persona} target audience preferences`,
        'Consider audience feedback and comments for content direction'
      ],
      predictiveInsights: [
        'Monitor engagement trends for early optimization opportunities',
        'Diversify content to reduce dependency on single topic types'
      ]
    };
  }

  /**
   * Complete AI-powered analytics workflow
   */
  async analyzePerformanceWithAI(accountId: string, persona: string): Promise<{
    analyticsData: AnalyticsDataForAI;
    aiInsights: AIAnalyticsInsights;
  }> {
    console.log(`[Analytics] Starting AI-powered analysis for ${persona}`);

    const analyticsData = await this.collectAnalyticsDataForAI(accountId, persona);
    const aiInsights = await this.generateAIInsights(analyticsData);

    console.log(`[Analytics] AI analysis completed for ${persona}`);

    return {
      analyticsData,
      aiInsights
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;