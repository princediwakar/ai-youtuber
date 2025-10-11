// lib/analytics/insightsService.ts
import { QueryResult } from 'pg';
import { query } from '../database';
import { AIAnalyticsInsights, AnalyticsDataForAI } from './types';

// Define interfaces for the expected shapes of database query results
interface OverallStatsRow {
  total_videos: string;
  avg_engagement_rate: string;
  avg_views: string;
}

interface TopicPerformanceRow {
  topic: string;
  engagement_rate: string;
  views: string;
  video_count: string;
}

interface TrendDataRow {
  recent_engagement: number | null;
  recent_views: number | null;
  prev_engagement: number | null;
  prev_views: number | null;
}

interface TimingDataRow {
    hour?: string;
    day_of_week?: string;
    avg_engagement_rate: string;
    avg_views: string;
    video_count: string;
}

interface FormatDataRow {
    format: string;
    avg_engagement_rate: string;
    avg_views: string;
    video_count: string;
    engagement_stddev: string;
}

interface ThemeDataRow {
    theme_name: string;
    avg_engagement_rate: string;
    avg_views: string;
    video_count: string;
    total_views: string;
    avg_likes: string;
}

interface ParameterAnalyticsRow {
    theme?: string;
    audio?: string;
    durationRange?: string;
    questionType?: string;
    hookType?: string;
    avgEngagementRate: string;
    videoCount: string;
}


class AnalyticsInsightsService {
  private readonly apiKey: string = process.env.DEEPSEEK_API_KEY!;
  private readonly apiUrl = 'https://api.deepseek.com/v1/chat/completions';

  /**
   * Return empty analytics data when parameters are invalid or data is unavailable
   */
  private getEmptyAnalyticsData(accountId: string, persona: string): AnalyticsDataForAI {
    return {
      accountId,
      persona,
      totalVideos: 0,
      avgEngagementRate: 0,
      avgViews: 0,
      topPerformingTopics: [],
      underperformingTopics: [],
      recentTrends: {
        engagementTrend: 'stable',
        viewsTrend: 'stable',
        topicPerformanceShifts: []
      },
      timingInsights: {
        bestHours: [],
        bestDays: [],
        worstHours: [],
        worstDays: [],
        hourlyData: [],
        weeklyData: []
      },
      formatInsights: {
        // FIX: Replaced hardcoded 'mcq' defaults with 'N/A' or 'unknown' for neutrality
        bestFormat: 'N/A', 
        worstFormat: 'N/A',
        mostConsistent: 'N/A', 
        formatData: []
      }
    };
  }

  /**
   * Complete AI-powered analytics workflow
   */
  public async analyzePerformanceWithAI(accountId: string, persona: string): Promise<{
    analyticsData: AnalyticsDataForAI;
    aiInsights: AIAnalyticsInsights;
  }> {
    console.log(`[InsightsService] Starting AI-powered analysis for ${persona}`);

    const analyticsData = await this.collectAnalyticsDataForAI(accountId, persona);
    const aiInsights = await this.generateAIInsights(analyticsData);

    console.log(`[InsightsService] AI analysis completed for ${persona}`);

    return {
      analyticsData,
      aiInsights
    };
  }

  /**
   * Collect comprehensive analytics data for AI analysis
   */
  public async collectAnalyticsDataForAI(accountId: string, persona: string): Promise<AnalyticsDataForAI> {
    console.log(`[InsightsService] Collecting AI data for ${persona} (${accountId})`);

    if (!accountId || !persona) {
      console.log(`[InsightsService] Invalid parameters: accountId="${accountId}", persona="${persona}"`);
      return this.getEmptyAnalyticsData(accountId || "unknown", persona || "unknown");
    }

    const queryWithTimeout = async <T>(queryFn: () => Promise<QueryResult<T>>, timeoutMs: number = 10000): Promise<QueryResult<T> | null> => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
        );
        return await Promise.race([queryFn(), timeoutPromise]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Query failed';
        console.log(`[InsightsService] Query skipped: ${errorMessage}`);
        return null;
      }
    };

    const overallStats = await queryWithTimeout(() => query<OverallStatsRow>(`
      SELECT 
        COUNT(*) as total_videos,
        ROUND(AVG(va.engagement_rate), 2) as avg_engagement_rate,
        ROUND(AVG(va.views), 0) as avg_views
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      WHERE qj.persona = $1 AND va.account_id = $2
        AND va.collected_at > NOW() - INTERVAL '30 days'
    `, [persona, accountId]));

    if (!overallStats || overallStats.rows.length === 0) {
      return this.getEmptyAnalyticsData(accountId, persona);
    }

    const topTopics = await queryWithTimeout(() => query<TopicPerformanceRow>(`
      SELECT 
        qj.topic_display_name as topic,
        ROUND(AVG(va.engagement_rate), 2) as engagement_rate,
        ROUND(AVG(va.views), 0) as views,
        COUNT(*) as video_count
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      WHERE qj.persona = $1 AND va.account_id = $2 AND va.collected_at > NOW() - INTERVAL '30 days'
      GROUP BY qj.topic_display_name HAVING COUNT(*) >= 2
      ORDER BY engagement_rate DESC, views DESC LIMIT 5
    `, [persona, accountId]));

    const underTopics = await queryWithTimeout(() => query<TopicPerformanceRow>(`
      SELECT 
        qj.topic_display_name as topic,
        ROUND(AVG(va.engagement_rate), 2) as engagement_rate,
        ROUND(AVG(va.views), 0) as views,
        COUNT(*) as video_count
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      WHERE qj.persona = $1 AND va.account_id = $2 AND va.collected_at > NOW() - INTERVAL '30 days'
      GROUP BY qj.topic_display_name HAVING COUNT(*) >= 2
      ORDER BY engagement_rate ASC, views ASC LIMIT 3
    `, [persona, accountId]));

    const trendData = await queryWithTimeout(() => query<TrendDataRow>(`
      WITH recent AS (
        SELECT AVG(va.engagement_rate) as recent_engagement, AVG(va.views) as recent_views
        FROM video_analytics va JOIN quiz_jobs qj ON va.job_id = qj.id
        WHERE qj.persona = $1 AND va.account_id = $2 AND va.collected_at > NOW() - INTERVAL '15 days'
      ),
      previous AS (
        SELECT AVG(va.engagement_rate) as prev_engagement, AVG(va.views) as prev_views
        FROM video_analytics va JOIN quiz_jobs qj ON va.job_id = qj.id
        WHERE qj.persona = $1 AND va.account_id = $2 AND va.collected_at BETWEEN NOW() - INTERVAL '30 days' AND NOW() - INTERVAL '15 days'
      )
      SELECT r.recent_engagement, r.recent_views, p.prev_engagement, p.prev_views
      FROM recent r, previous p
    `, [persona, accountId]));

    const stats = overallStats.rows[0];
    const trend = trendData?.rows[0];

    const engagementTrend = !trend || !trend.prev_engagement || !trend.recent_engagement ? 'stable' : 
      trend.recent_engagement > trend.prev_engagement * 1.1 ? 'increasing' :
      trend.recent_engagement < trend.prev_engagement * 0.9 ? 'decreasing' : 'stable';

    const viewsTrend = !trend || !trend.prev_views || !trend.recent_views ? 'stable' :
      trend.recent_views > trend.prev_views * 1.1 ? 'increasing' :
      trend.recent_views < trend.prev_views * 0.9 ? 'decreasing' : 'stable';

    const timingAnalytics = await this.getTimingAnalytics(accountId, persona);
    const formatAnalytics = await this.getFormatAnalytics(accountId, persona);

    return {
      accountId,
      persona,
      totalVideos: parseInt(stats?.total_videos || '0', 10),
      avgEngagementRate: parseFloat(stats?.avg_engagement_rate || '0'),
      avgViews: parseInt(stats?.avg_views || '0', 10),
      topPerformingTopics: topTopics?.rows?.map((row) => ({ topic: row.topic || 'Unknown', engagementRate: parseFloat(row.engagement_rate), views: parseInt(row.views, 10), videoCount: parseInt(row.video_count, 10) })) || [],
      underperformingTopics: underTopics?.rows?.map((row) => ({ topic: row.topic || 'Unknown', engagementRate: parseFloat(row.engagement_rate), views: parseInt(row.views, 10), videoCount: parseInt(row.video_count, 10) })) || [],
      recentTrends: { engagementTrend, viewsTrend, topicPerformanceShifts: [] },
      timingInsights: {
        bestHours: timingAnalytics?.bestTimingRecommendations?.bestHours || [],
        bestDays: timingAnalytics?.bestTimingRecommendations?.bestDays || [],
        worstHours: timingAnalytics?.bestTimingRecommendations?.worstHours || [],
        worstDays: timingAnalytics?.bestTimingRecommendations?.worstDays || [],
        hourlyData: timingAnalytics?.hourlyPerformance?.map(h => ({ hour: h.hour, avgEngagementRate: h.avgEngagementRate, videoCount: h.videoCount })) || [],
        weeklyData: timingAnalytics?.weeklyPerformance?.map(d => ({ dayOfWeek: d.dayOfWeek, dayName: d.dayName, avgEngagementRate: d.avgEngagementRate, videoCount: d.videoCount })) || []
      },
      formatInsights: {
        // FIX: Use actual format results or neutral defaults
        bestFormat: formatAnalytics?.formatRecommendations?.bestFormat || 'N/A',
        worstFormat: formatAnalytics?.formatRecommendations?.worstFormat || 'N/A',
        mostConsistent: formatAnalytics?.formatRecommendations?.mostConsistent || 'N/A',
        formatData: formatAnalytics?.formatPerformance?.map(f => ({ format: f.format, avgEngagementRate: f.avgEngagementRate, videoCount: f.videoCount, consistency: f.consistency })) || []
      }
    };
  }

  /**
   * Generate AI-powered insights using DeepSeek API
   */
  public async generateAIInsights(analyticsData: AnalyticsDataForAI): Promise<AIAnalyticsInsights> {
    if (!this.apiKey) {
        console.warn("DEEPSEEK_API_KEY is not set. Returning fallback insights.");
        return this.generateFallbackInsights(analyticsData);
    }

    const prompt = this.buildAnalyticsPrompt(analyticsData);

    try {
      console.log(`[InsightsService] Generating AI insights for ${analyticsData.persona}`);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an expert YouTube analytics consultant specializing in educational content optimization. Provide actionable, data-driven insights for improving video performance.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) throw new Error('No response from DeepSeek API');
      return this.parseAIResponse(aiResponse);

    } catch (error) {
      console.error('[InsightsService] Error generating AI insights:', error);
      return this.generateFallbackInsights(analyticsData);
    }
  }

  /**
   * Get timing performance analytics
   */
  public async getTimingAnalytics(accountId: string, persona?: string) {
    const personaFilter = persona ? 'AND qj.persona = $2' : '';
    const params = persona ? [accountId, persona] : [accountId];

    const hourlyData = await query<TimingDataRow>(`
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

    const weeklyData = await query<TimingDataRow>(`
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
    const hourlyPerformance = hourlyData.rows.map(row => ({ hour: parseInt(row.hour!, 10), avgEngagementRate: parseFloat(row.avg_engagement_rate), avgViews: parseInt(row.avg_views, 10), videoCount: parseInt(row.video_count, 10) }));
    const weeklyPerformance = weeklyData.rows.map(row => ({ dayOfWeek: parseInt(row.day_of_week!, 10), dayName: dayNames[parseInt(row.day_of_week!, 10)], avgEngagementRate: parseFloat(row.avg_engagement_rate), avgViews: parseInt(row.avg_views, 10), videoCount: parseInt(row.video_count, 10) }));

    const sortedHours = [...hourlyPerformance].sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
    const sortedDays = [...weeklyPerformance].sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);

    return {
      hourlyPerformance,
      weeklyPerformance,
      bestTimingRecommendations: {
        bestHours: sortedHours.slice(0, 3).map(h => h.hour),
        worstHours: sortedHours.slice(-2).map(h => h.hour),
        bestDays: sortedDays.slice(0, 3).map(d => d.dayOfWeek),
        worstDays: sortedDays.slice(-2).map(d => d.dayOfWeek)
      }
    };
  }

  /**
   * Get format performance analytics
   */
  public async getFormatAnalytics(accountId?: string, persona?: string) {
    const params: any[] = [];
    const conditions: string[] = [];

    if (accountId) {
      params.push(accountId);
      conditions.push(`va.account_id = $${params.length}`);
    }
    if (persona) {
      params.push(persona);
      conditions.push(`qj.persona = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const formatData = await query<FormatDataRow>(`
      SELECT
        va.question_format as format,
        ROUND(AVG(va.engagement_rate), 2) as avg_engagement_rate,
        ROUND(AVG(va.views), 0) as avg_views,
        COUNT(*) as video_count,
        ROUND(STDDEV(va.engagement_rate), 2) as engagement_stddev
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      WHERE va.question_format IS NOT NULL
        AND va.collected_at > NOW() - INTERVAL '60 days'
        ${whereClause}
      GROUP BY va.question_format
      HAVING COUNT(*) >= 3
      ORDER BY avg_engagement_rate DESC
    `, params);

    const formatPerformance = formatData.rows.map((row) => {
      const stddev = parseFloat(row.engagement_stddev || '0');
      let consistency: 'high' | 'medium' | 'low' = 'medium';
      if (stddev < 1.0) consistency = 'high';
      else if (stddev > 2.0) consistency = 'low';
      return { format: row.format, avgEngagementRate: parseFloat(row.avg_engagement_rate), avgViews: parseInt(row.avg_views, 10), videoCount: parseInt(row.video_count, 10), engagementStddev: stddev, consistency };
    });

    const sortedByConsistency = [...formatPerformance].sort((a, b) => a.engagementStddev - b.engagementStddev);

    return {
      formatPerformance,
      formatRecommendations: {
        bestFormat: formatPerformance[0]?.format || 'N/A',
        worstFormat: formatPerformance[formatPerformance.length - 1]?.format || 'N/A',
        mostConsistent: sortedByConsistency[0]?.format || 'N/A',
        leastConsistent: sortedByConsistency[sortedByConsistency.length - 1]?.format || 'N/A'
      }
    };
  }
  
  /**
   * Get theme performance analytics
   */
  public async getThemeAnalytics(accountId?: string, persona?: string) {
    const params: any[] = [];
    const conditions: string[] = [];

    if (accountId) {
      params.push(accountId);
      conditions.push(`va.account_id = $${params.length}`);
    }
    if (persona) {
      params.push(persona);
      conditions.push(`qj.persona = $${params.length}`);
    }
    
    const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const themeData = await query<ThemeDataRow>(`
      SELECT 
        va.theme_name,
        ROUND(AVG(va.engagement_rate), 2) as avg_engagement_rate,
        ROUND(AVG(va.views), 0) as avg_views,
        COUNT(*) as video_count,
        SUM(va.views) as total_views,
        ROUND(AVG(va.likes), 0) as avg_likes
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      WHERE va.theme_name IS NOT NULL
        AND va.collected_at > NOW() - INTERVAL '60 days'
        ${whereClause}
      GROUP BY va.theme_name
      HAVING COUNT(*) >= 2
      ORDER BY avg_engagement_rate DESC
    `, params);

    const themePerformance = themeData.rows.map((row) => ({
      themeName: row.theme_name,
      avgEngagementRate: parseFloat(row.avg_engagement_rate),
      avgViews: parseInt(row.avg_views, 10),
      videoCount: parseInt(row.video_count, 10),
      totalViews: parseInt(row.total_views, 10),
      avgLikes: parseInt(row.avg_likes, 10)
    }));

    const bestTheme = themePerformance[0]?.themeName || 'N/A';
    const worstTheme = themePerformance[themePerformance.length - 1]?.themeName || 'N/A';

    return {
      themePerformance,
      bestTheme,
      worstTheme,
      themeRecommendations: [
        `${bestTheme} shows the highest engagement.`,
        `Consider testing new variations against ${bestTheme}.`
      ]
    };
  }

  /**
   * Get comprehensive parameter performance analytics
   */
  public async getParameterAnalytics(accountId?: string, persona?: string) {
    const params: any[] = [];
    const conditions: string[] = [];

    if (accountId) {
      params.push(accountId);
      conditions.push(`va.account_id = $${params.length}`);
    }
    if (persona) {
      params.push(persona);
      conditions.push(`qj.persona = $${params.length}`);
    }
  
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')} AND va.collected_at > NOW() - INTERVAL '60 days'` : `WHERE va.collected_at > NOW() - INTERVAL '60 days'`;

    const themeAudioData = await query<ParameterAnalyticsRow>(`
      SELECT 
        va.theme_name as theme,
        va.audio_file as audio,
        ROUND(AVG(va.engagement_rate), 2) as "avgEngagementRate",
        COUNT(*) as "videoCount"
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      ${whereClause.replace('WHERE', 'WHERE va.theme_name IS NOT NULL AND')}
      GROUP BY va.theme_name, va.audio_file
      HAVING COUNT(*) >= 1
      ORDER BY "avgEngagementRate" DESC
      LIMIT 10
    `, params);

    const durationData = await query<ParameterAnalyticsRow>(`
      SELECT 
        CASE 
          WHEN va.total_duration IS NULL THEN 'Unknown'
          WHEN va.total_duration < 15 THEN 'Short (< 15s)'
          WHEN va.total_duration < 30 THEN 'Medium (15-30s)'
          ELSE 'Long (30s+)'
        END as "durationRange",
        ROUND(AVG(va.engagement_rate), 2) as "avgEngagementRate",
        COUNT(*) as "videoCount"
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      ${whereClause}
      GROUP BY "durationRange"
      ORDER BY "avgEngagementRate" DESC
    `, params);

    const questionTypeData = await query<ParameterAnalyticsRow>(`
      SELECT 
        COALESCE(va.question_type, 'Unknown') as "questionType",
        ROUND(AVG(va.engagement_rate), 2) as "avgEngagementRate",
        COUNT(*) as "videoCount"
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      ${whereClause}
      GROUP BY va.question_type
      HAVING COUNT(*) >= 2
      ORDER BY "avgEngagementRate" DESC
    `, params);

    const hookTypeData = await query<ParameterAnalyticsRow>(`
      SELECT 
        COALESCE(va.hook_type, 'Unknown') as "hookType",
        ROUND(AVG(va.engagement_rate), 2) as "avgEngagementRate",
        COUNT(*) as "videoCount"
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      ${whereClause.replace('WHERE', 'WHERE va.hook_type IS NOT NULL AND')}
      GROUP BY va.hook_type
      HAVING COUNT(*) >= 2
      ORDER BY "avgEngagementRate" DESC
    `, params);

    return {
      themeAudioCombinations: themeAudioData.rows,
      durationAnalytics: durationData.rows,
      questionTypePerformance: questionTypeData.rows,
      hookTypePerformance: hookTypeData.rows
    };
  }

  /**
   * Get A/B testing insights and recommendations
   */
  public async getABTestingInsights(accountId?: string, persona?: string) {
    const [themeAnalytics] = await Promise.all([
      this.getThemeAnalytics(accountId, persona),
      // Removed call to getAudioAnalytics from Promise.all to fix TypeScript error, 
      // but still need the data for the logic below.
    ]);
    
    // Call getAudioAnalytics separately
    const audioAnalytics = await this.getAudioAnalytics(accountId, persona);


    const winningCombinations = [];

    if (themeAnalytics.themePerformance.length > 1) {
      const best = themeAnalytics.themePerformance[0];
      const avg = themeAnalytics.themePerformance.reduce((sum, t) => sum + t.avgEngagementRate, 0) / themeAnalytics.themePerformance.length;
      const lift = avg > 0 ? ((best.avgEngagementRate - avg) / avg) * 100 : 0;
      winningCombinations.push({ 
          parameter: 'Theme', 
          winner: best.themeName, 
          engagementLift: Math.round(lift), 
          confidence: best.videoCount > 10 ? 'High' : (best.videoCount > 5 ? 'Medium' : 'Low')
      });
    }
    
    // This method is defined but not included in the provided file. I will create a shell for it.
    const audioAnalyticsData = audioAnalytics; // Using the result from the call above
    if (audioAnalyticsData && audioAnalyticsData.audioPerformance.length > 1) {
      const best = audioAnalytics.audioPerformance[0];
      const avg = audioAnalytics.audioPerformance.reduce((sum, a) => sum + a.avgEngagementRate, 0) / audioAnalytics.audioPerformance.length;
      const lift = avg > 0 ? ((best.avgEngagementRate - avg) / avg) * 100 : 0;
      winningCombinations.push({ 
          parameter: 'Audio', 
          winner: best.audioFile || 'No Audio', 
          engagementLift: Math.round(lift), 
          confidence: best.videoCount > 10 ? 'High' : (best.videoCount > 5 ? 'Medium' : 'Low')
      });
    }

    const summary = `Based on recent videos, we've identified ${winningCombinations.length} parameter winners with measurable performance differences.`;

    return {
      summary,
      winningCombinations,
      testRecommendations: [
        'Continue using winning combinations for consistent performance.',
        'Test new variations against current winners to find further improvements.'
      ],
      nextTestSuggestions: [
        'Test new theme variations against the current winner.',
        'Experiment with different audio genres and styles.',
        'Test hook effectiveness across different content types.'
      ]
    };
  }
  
  // This method was missing from the original file but called by getABTestingInsights
  public async getAudioAnalytics(accountId?: string, persona?: string) {
    const params: any[] = [];
    const conditions: string[] = [];

    if (accountId) {
      params.push(accountId);
      conditions.push(`va.account_id = $${params.length}`);
    }
    if (persona) {
      params.push(persona);
      conditions.push(`qj.persona = $${params.length}`);
    }
    
    const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const audioData = await query<any>(`
      SELECT 
        va.audio_file,
        ROUND(AVG(va.engagement_rate), 2) as avg_engagement_rate,
        ROUND(AVG(va.views), 0) as avg_views,
        COUNT(*) as video_count,
        ROUND(AVG(va.likes), 0) as avg_likes
      FROM video_analytics va
      JOIN quiz_jobs qj ON va.job_id = qj.id
      WHERE va.collected_at > NOW() - INTERVAL '60 days'
        ${whereClause}
      GROUP BY va.audio_file
      HAVING COUNT(*) >= 2
      ORDER BY avg_engagement_rate DESC
    `, params);

    const audioPerformance = audioData.rows.map((row: any) => ({
      audioFile: row.audio_file || 'No Audio',
      avgEngagementRate: parseFloat(row.avg_engagement_rate),
      avgViews: parseInt(row.avg_views, 10),
      videoCount: parseInt(row.video_count, 10),
      avgLikes: parseInt(row.avg_likes, 10)
    }));

    const bestAudio = audioPerformance[0]?.audioFile || null;
    const worstAudio = audioPerformance[audioPerformance.length - 1]?.audioFile || null;

    return {
      audioPerformance,
      bestAudio,
      worstAudio,
      audioRecommendations: [
        bestAudio ? `${bestAudio} performs best.` : 'No clear audio winner identified.',
        'Test different audio styles to see what resonates with your audience.'
      ]
    };
  }


  
  // ========================================
  // Private Helper Methods
  // ========================================

  private buildAnalyticsPrompt(data: AnalyticsDataForAI): string {
    const topTopics = data.topPerformingTopics.map(t => `- ${t.topic}: ${t.engagementRate}% engagement, ${t.views} avg views`).join('\n');
    const underTopics = data.underperformingTopics.map(t => `- ${t.topic}: ${t.engagementRate}% engagement, ${t.views} avg views`).join('\n');
    const timingSection = data.timingInsights ? `\nUPLOAD TIMING ANALYSIS:\n- Best Hours (IST): ${data.timingInsights.bestHours.join(', ')}\n- Best Days: ${data.timingInsights.bestDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}` : '';
    const formatSection = data.formatInsights ? `\nCONTENT FORMAT ANALYSIS:\n- Best Format: ${data.formatInsights.bestFormat}\n- Most Consistent: ${data.formatInsights.mostConsistent}` : '';

    return `Analyze this YouTube channel's performance data and provide actionable insights in the specified format:

CHANNEL CONTEXT:
- Content Type: ${data.persona}
- Target Audience: ${this.getAudienceDescription(data.persona)}

PERFORMANCE METRICS (Last 30 Days):
- Total Videos: ${data.totalVideos}
- Average Engagement Rate: ${data.avgEngagementRate}%
- Average Views: ${data.avgViews}
- Engagement Trend: ${data.recentTrends.engagementTrend}
- Views Trend: ${data.recentTrends.viewsTrend}

TOP PERFORMING TOPICS:
${topTopics || 'N/A'}

UNDERPERFORMING TOPICS:
${underTopics || 'N/A'}${timingSection}${formatSection}

Please provide analysis in this exact format, with each item on a new line started with a hyphen:

PERFORMANCE_ANALYSIS:
[2-3 sentences analyzing overall performance and key patterns.]

CONTENT_RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]

TOPIC_OPTIMIZATION:
- [Suggestion 1]
- [Suggestion 2]

TIMING_OPTIMIZATION:
- [Recommendation 1]
- [Recommendation 2]

FORMAT_OPTIMIZATION:
- [Suggestion 1]
- [Suggestion 2]

ENGAGEMENT_STRATEGIES:
- [Strategy 1]
- [Strategy 2]
- [Strategy 3]

PERSONA_SPECIFIC_ADVICE:
- [Advice 1]
- [Advice 2]

PREDICTIVE_INSIGHTS:
- [Prediction 1]
- [Prediction 2]
`;
  }

  private getAudienceDescription(persona: string): string {
    const descriptions: Record<string, string> = {
      'english_vocab_builder': 'Global English language learners seeking vocabulary improvement',
      'brain_health_tips': 'Health-conscious individuals interested in cognitive wellness',
      'eye_health_tips': 'People concerned about vision health and screen time effects',
    };
    return descriptions[persona] || 'Educational content consumers';
  }

  private parseAIResponse(response: string): AIAnalyticsInsights {
    return {
      performanceAnalysis: this.extractSection(response, 'PERFORMANCE_ANALYSIS:'),
      contentRecommendations: this.extractListSection(response, 'CONTENT_RECOMMENDATIONS:'),
      topicOptimization: this.extractListSection(response, 'TOPIC_OPTIMIZATION:'),
      timingOptimization: this.extractListSection(response, 'TIMING_OPTIMIZATION:'),
      formatOptimization: this.extractListSection(response, 'FORMAT_OPTIMIZATION:'),
      engagementStrategies: this.extractListSection(response, 'ENGAGEMENT_STRATEGIES:'),
      personaSpecificAdvice: this.extractListSection(response, 'PERSONA_SPECIFIC_ADVICE:'),
      predictiveInsights: this.extractListSection(response, 'PREDICTIVE_INSIGHTS:')
    };
  }

  private extractSection(response: string, header: string): string {
    const lines = response.split('\n');
    const startIndex = lines.findIndex(line => line.startsWith(header));
    if (startIndex === -1) return 'No analysis provided.';
    let content = '';
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.endsWith(':') && line.toUpperCase() === line) break; // Next section
      if (line) content += line.replace(/^[-•]\s*/, '') + ' ';
    }
    return content.trim() || 'No analysis provided.';
  }

  private extractListSection(response: string, header: string): string[] {
    const lines = response.split('\n');
    const startIndex = lines.findIndex(line => line.startsWith(header));
    if (startIndex === -1) return ['No recommendations provided.'];
    const items: string[] = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.endsWith(':') && line.toUpperCase() === line) break; // Next section
      if (line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line)) {
        items.push(line.replace(/^[-•\d.]+\s*/, ''));
      }
    }
    return items.length > 0 ? items : ['No recommendations provided.'];
  }

  private generateFallbackInsights(data: AnalyticsDataForAI): AIAnalyticsInsights {
    // FIX: Fallback insights should also use the determined bestFormat, even if N/A
    const bestFormat = data.formatInsights?.bestFormat || 'your strongest format';

    return {
      performanceAnalysis: `Channel performance shows a total of ${data.totalVideos} videos with an average engagement of ${data.avgEngagementRate}%. The recent trend is ${data.recentTrends.engagementTrend}.`,
      contentRecommendations: [`Focus on top-performing topics like "${data.topPerformingTopics[0]?.topic || 'your best content'}".`],
      topicOptimization: ['Double down on what works and create variations of successful topics.'],
      timingOptimization: data.timingInsights?.bestHours.length ? [`Post around these times for better reach: ${data.timingInsights.bestHours.join(':00, ')}:00 IST.`] : ['Test different posting times.'],
      formatOptimization: [`Utilize the "${bestFormat}" format more often as it performs best.` || 'Experiment with different video formats.'],
      engagementStrategies: ['Ask engaging questions in your videos and respond to comments.'],
      personaSpecificAdvice: [`Tailor content specifically for your "${data.persona}" audience.`],
      predictiveInsights: ['Continuing to analyze performance data will reveal more growth opportunities.']
    };
  }
}

export const analyticsInsightsService = new AnalyticsInsightsService();
export default analyticsInsightsService;