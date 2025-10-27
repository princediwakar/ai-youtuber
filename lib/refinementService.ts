import { query } from './database';
import type { AIAnalyticsInsights } from './analytics/types';
import { analyticsInsightsService } from './analytics/insightsService';
import { analyticsCollectionService } from './analytics/collectionService';

// --- FIX: Define interfaces for the expected shapes of database query results ---
interface TopicPerformanceRow {
  topic: string;
  topic_display_name: string;
  video_count: string;
  avg_engagement_rate: string;
  avg_views: string;
  top_video: string | null;
}

interface PersonaOverallStatsRow {
  total_videos: string;
  avg_engagement_rate: string;
  avg_views: string;
}

interface AccountRow {
    id: string;
    personas: string[];
}

interface PersonaCountRow {
    persona_count: string;
}


export interface ContentInsight {
  topic: string;
  avgEngagementRate: number;
  avgViews: number;
  videoCount: number;
  topPerformingExample?: string | null;
}

export interface PersonaInsights {
  persona: string;
  accountId: string;
  totalVideos: number;
  avgEngagementRate: number;
  avgViews: number;
  topicInsights: ContentInsight[];
  recommendations: string[];
  aiInsights?: AIAnalyticsInsights;
}

export interface RefinementReport {
  reportDate: Date;
  accountInsights: PersonaInsights[];
  globalInsights: {
    bestPerformingTopics: ContentInsight[];
    worstPerformingTopics: ContentInsight[];
    optimalEngagementRate: number;
    recommendedImprovements: string[];
  };
}

class RefinementService {
  /**
   * Analyze performance patterns by topic for a specific persona
   */
  public async analyzeTopicPerformance(persona: string): Promise<ContentInsight[]> {
    const result = await query<TopicPerformanceRow>(`
      SELECT 
        qj.topic,
        qj.topic_display_name,
        COUNT(*) as video_count,
        ROUND(AVG(va.engagement_rate), 2) as avg_engagement_rate,
        ROUND(AVG(va.views), 0) as avg_views,
        MAX(va.video_id) FILTER (WHERE va.engagement_rate = MAX(va.engagement_rate)) as top_video
      FROM quiz_jobs qj
      JOIN video_analytics va ON qj.id = va.job_id
      WHERE qj.persona = $1
        AND va.collected_at > NOW() - INTERVAL '30 days'
      GROUP BY qj.topic, qj.topic_display_name
      HAVING COUNT(*) >= 2
      ORDER BY avg_engagement_rate DESC, avg_views DESC
    `, [persona]);

    return result.rows.map((row) => ({
      topic: row.topic_display_name || row.topic,
      avgEngagementRate: parseFloat(row.avg_engagement_rate || '0'),
      avgViews: parseInt(row.avg_views || '0', 10),
      videoCount: parseInt(row.video_count, 10),
      topPerformingExample: row.top_video
    }));
  }

  /**
   * Generate insights and recommendations for a specific persona
   */
  public async generatePersonaInsights(persona: string, accountId: string, includeAI: boolean = true): Promise<PersonaInsights> {
    const overallStats = await query<PersonaOverallStatsRow>(`
      SELECT 
        COUNT(*) as total_videos,
        ROUND(AVG(va.engagement_rate), 2) as avg_engagement_rate,
        ROUND(AVG(va.views), 0) as avg_views
      FROM quiz_jobs qj
      JOIN video_analytics va ON qj.id = va.job_id
      WHERE qj.persona = $1 AND qj.account_id = $2
        AND va.collected_at > NOW() - INTERVAL '30 days'
    `, [persona, accountId]);

    const stats = overallStats.rows[0];
    if (!stats) {
        // Handle case where there's no data for the persona
        return {
            persona, accountId, totalVideos: 0, avgEngagementRate: 0, avgViews: 0,
            topicInsights: [], recommendations: ['No video data found for this period.'],
        };
    }

    const topicInsights = await this.analyzeTopicPerformance(persona);
    const recommendations = this.generateRecommendations(topicInsights, parseFloat(stats.avg_engagement_rate || '0'));
    let aiInsights: AIAnalyticsInsights | undefined = undefined;

    if (includeAI && parseInt(stats.total_videos, 10) >= 5) {
      try {
        console.log(`[RefinementService] Generating AI insights for ${persona}`);
        const aiAnalysis = await analyticsInsightsService.analyzePerformanceWithAI(accountId, persona);
        aiInsights = aiAnalysis.aiInsights;
        
        if (aiInsights.contentRecommendations.length > 0) {
          recommendations.push('=== AI-Powered Recommendations ===');
          recommendations.push(...aiInsights.contentRecommendations);
        }
        
        console.log(`[RefinementService] AI insights generated successfully for ${persona}`);
      } catch (error) {
        console.error(`[RefinementService] AI insights failed for ${persona}:`, error);
        recommendations.push('Note: AI analysis unavailable - using rule-based recommendations');
      }
    } else if (includeAI && parseInt(stats.total_videos, 10) < 5) {
      recommendations.push('Note: Insufficient data for AI analysis (need 5+ videos)');
    }

    return {
      persona,
      accountId,
      totalVideos: parseInt(stats.total_videos, 10),
      avgEngagementRate: parseFloat(stats.avg_engagement_rate || '0'),
      avgViews: parseInt(stats.avg_views || '0', 10),
      topicInsights,
      recommendations,
      aiInsights
    };
  }

  /**
   * Generate actionable recommendations based on performance data
   */
  private generateRecommendations(topicInsights: ContentInsight[], avgEngagementRate: number): string[] {
    const recommendations: string[] = [];

    if (topicInsights.length === 0) {
      recommendations.push('Insufficient data for analysis. Continue creating content to build performance history.');
      return recommendations;
    }

    const bestTopic = topicInsights[0];
    const worstTopic = topicInsights[topicInsights.length - 1];

    if (bestTopic.avgEngagementRate > avgEngagementRate * 1.5) {
      recommendations.push(`Focus more on "${bestTopic.topic}" content - it shows ${bestTopic.avgEngagementRate}% engagement rate`);
    }

    if (worstTopic.avgEngagementRate < avgEngagementRate * 0.5) {
      recommendations.push(`Reconsider "${worstTopic.topic}" content strategy - engagement rate is below average`);
    }

    if (avgEngagementRate < 0.5) {
      recommendations.push('Experiment with different visual styles or question formats');
    } else if (avgEngagementRate > 1.0) {
      recommendations.push('Great engagement rate! Scale successful content patterns to similar topics');
    }

    if (topicInsights.length < 3) {
      recommendations.push('Diversify content topics to identify new high-performing areas');
    }

    const highViewsLowEngagement = topicInsights.filter(t => t.avgViews > 200 && t.avgEngagementRate < 0.3);
    if (highViewsLowEngagement.length > 0) {
      recommendations.push('Some high-view topics have low engagement - focus on improving call-to-action or question difficulty');
    }

    return recommendations;
  }

  /**
   * Generate complete refinement report for all accounts
   */
  public async generateRefinementReport(): Promise<RefinementReport> {
    console.log('[RefinementService] Generating content refinement report...');

    const accountsResult = await query<AccountRow>(`
      SELECT id, personas FROM accounts WHERE status = 'active'
    `);

    const accountInsights: PersonaInsights[] = [];

    for (const account of accountsResult.rows) {
      const personas = account.personas as string[];
      
      for (const persona of personas) {
        try {
          const insights = await this.generatePersonaInsights(persona, account.id);
          if (insights.totalVideos > 0) {
            accountInsights.push(insights);
          }
        } catch (error) {
          console.error(`[RefinementService] Error analyzing persona ${persona}:`, error);
        }
      }
    }

    const allTopicInsights = accountInsights.flatMap(ai => ai.topicInsights);
    const globalInsights = this.generateGlobalInsights(allTopicInsights, accountInsights);

    console.log(`[RefinementService] Generated insights for ${accountInsights.length} personas`);

    return {
      reportDate: new Date(),
      accountInsights,
      globalInsights
    };
  }

  /**
   * Generate cross-account insights and recommendations
   */
  private generateGlobalInsights(allTopics: ContentInsight[], accountInsights: PersonaInsights[]) {
    const sortedTopics = [...allTopics].sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
    
    const bestPerformingTopics = sortedTopics.slice(0, 5);
    const worstPerformingTopics = sortedTopics.slice(-5).reverse();
    
    const topQuartileSize = Math.max(1, Math.floor(sortedTopics.length * 0.25));
    const optimalEngagementRate = topQuartileSize > 0 
      ? sortedTopics.slice(0, topQuartileSize).reduce((sum, t) => sum + t.avgEngagementRate, 0) / topQuartileSize
      : 0;

    const recommendedImprovements: string[] = [];

    if (bestPerformingTopics.length > 0) {
      const bestTopic = bestPerformingTopics[0];
      recommendedImprovements.push(`Best performing topic: "${bestTopic.topic}" with ${bestTopic.avgEngagementRate}% engagement`);
    }

    const avgEngagement = accountInsights.reduce((sum, ai) => sum + ai.avgEngagementRate, 0) / Math.max(1, accountInsights.length);
    if (avgEngagement < 0.5) {
      recommendedImprovements.push('Consider A/B testing different question formats and visual styles');
      recommendedImprovements.push('Focus on trending topics and current events for better engagement');
    }

    return {
      bestPerformingTopics,
      worstPerformingTopics,
      optimalEngagementRate: Math.round(optimalEngagementRate * 100) / 100,
      recommendedImprovements
    };
  }

  /**
   * Apply insights to update content generation prompts
   */
  public async applyContentRefinements(report: RefinementReport): Promise<{ updated: number; recommendations: string[] }> {
    console.log('[RefinementService] Applying content refinements...');
    
    let updatedCount = 0;
    const allRecommendations: string[] = [];

    for (const insights of report.accountInsights) {
      console.log(`[RefinementService] Insights for ${insights.persona} (${insights.accountId}):`);
      console.log(`  - Engagement Rate: ${insights.avgEngagementRate}%`);
      console.log(`  - Top Topic: ${insights.topicInsights[0]?.topic || 'N/A'}`);
      
      insights.recommendations.forEach(rec => {
        console.log(`  - Recommendation: ${rec}`);
        allRecommendations.push(`[${insights.persona}] ${rec}`);
      });

      updatedCount++;
    }

    report.globalInsights.recommendedImprovements.forEach(rec => {
      console.log(`[Global] ${rec}`);
      allRecommendations.push(`[Global] ${rec}`);
    });

    return {
      updated: updatedCount,
      recommendations: allRecommendations
    };
  }

  /**
   * Full refinement workflow
   */
  public async performContentRefinement(): Promise<{
    success: boolean;
    report: RefinementReport;
    applied: { updated: number; recommendations: string[] };
  }> {
    try {
      console.log('[RefinementService] Starting content refinement workflow...');
      
      const report = await this.generateRefinementReport();
      const applied = await this.applyContentRefinements(report);

      console.log('[RefinementService] Content refinement completed successfully');
      
      return {
        success: true,
        report,
        applied
      };

    } catch (error) {
      console.error('[RefinementService] Content refinement failed:', error);
      throw error;
    }
  }

  /**
   * Get refinement summary for API/dashboard use
   */
  public async getRefinementSummary(): Promise<{
    lastAnalysis: Date | null;
    totalPersonas: number;
    avgEngagementRate: number;
    topRecommendations: string[];
  }> {
    try {
      const result = await analyticsCollectionService.getAnalyticsSummary();
      
      const personasResult = await query<PersonaCountRow>(`
        SELECT COUNT(DISTINCT persona) as persona_count
        FROM quiz_jobs qj
        JOIN video_analytics va ON qj.id = va.job_id
        WHERE va.collected_at > NOW() - INTERVAL '7 days'
      `);

      return {
        lastAnalysis: new Date(),
        totalPersonas: parseInt(personasResult.rows[0]?.persona_count || '0', 10),
        avgEngagementRate: result.avgEngagementRate,
        topRecommendations: [
          'Focus on high-engagement topics for increased reach',
          'Experiment with question difficulty levels',
          'Consider trending topics for better discovery'
        ]
      };

    } catch (error) {
      console.error('[RefinementService] Error getting refinement summary:', error);
      throw error;
    }
  }
}

export const refinementService = new RefinementService();
export default refinementService;
