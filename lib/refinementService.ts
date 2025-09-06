import { query } from './database';
import { analyticsService, type AIAnalyticsInsights } from './analyticsService';

export interface ContentInsight {
  topic: string;
  avgEngagementRate: number;
  avgViews: number;
  videoCount: number;
  topPerformingExample?: string;
}

export interface PersonaInsights {
  persona: string;
  accountId: string;
  totalVideos: number;
  avgEngagementRate: number;
  avgViews: number;
  topicInsights: ContentInsight[];
  recommendations: string[];
  aiInsights?: AIAnalyticsInsights; // New AI-powered insights
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
  async analyzeTopicPerformance(persona: string): Promise<ContentInsight[]> {
    const result = await query(`
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
      HAVING COUNT(*) >= 2  -- Only analyze topics with 2+ videos
      ORDER BY avg_engagement_rate DESC, avg_views DESC
    `, [persona]);

    return result.rows.map((row: any) => ({
      topic: row.topic_display_name || row.topic,
      avgEngagementRate: parseFloat(row.avg_engagement_rate || '0'),
      avgViews: parseInt(row.avg_views || '0'),
      videoCount: parseInt(row.video_count),
      topPerformingExample: row.top_video
    }));
  }

  /**
   * Generate insights and recommendations for a specific persona
   */
  async generatePersonaInsights(persona: string, accountId: string, includeAI: boolean = true): Promise<PersonaInsights> {
    // Get overall stats for the persona
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

    const stats = overallStats.rows[0];
    const topicInsights = await this.analyzeTopicPerformance(persona);

    // Generate basic recommendations based on performance patterns
    const recommendations = this.generateRecommendations(topicInsights, parseFloat(stats.avg_engagement_rate || '0'));

    let aiInsights: AIAnalyticsInsights | undefined = undefined;

    // Generate AI-powered insights if requested and we have sufficient data
    if (includeAI && parseInt(stats.total_videos) >= 5) {
      try {
        console.log(`[RefinementService] Generating AI insights for ${persona}`);
        const aiAnalysis = await analyticsService.analyzePerformanceWithAI(accountId, persona);
        aiInsights = aiAnalysis.aiInsights;
        
        // Merge AI recommendations with basic recommendations
        if (aiInsights.contentRecommendations.length > 0) {
          recommendations.push('=== AI-Powered Recommendations ===');
          recommendations.push(...aiInsights.contentRecommendations);
        }
        
        console.log(`[RefinementService] AI insights generated successfully for ${persona}`);
      } catch (error) {
        console.error(`[RefinementService] AI insights failed for ${persona}:`, error);
        recommendations.push('Note: AI analysis unavailable - using rule-based recommendations');
      }
    } else if (includeAI && parseInt(stats.total_videos) < 5) {
      recommendations.push('Note: Insufficient data for AI analysis (need 5+ videos)');
    }

    return {
      persona,
      accountId,
      totalVideos: parseInt(stats.total_videos),
      avgEngagementRate: parseFloat(stats.avg_engagement_rate || '0'),
      avgViews: parseInt(stats.avg_views || '0'),
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

    // High-performing topic recommendations
    if (bestTopic.avgEngagementRate > avgEngagementRate * 1.5) {
      recommendations.push(`Focus more on "${bestTopic.topic}" content - it shows ${bestTopic.avgEngagementRate}% engagement rate`);
    }

    // Low-performing topic recommendations
    if (worstTopic.avgEngagementRate < avgEngagementRate * 0.5) {
      recommendations.push(`Reconsider "${worstTopic.topic}" content strategy - engagement rate is below average`);
    }

    // Engagement rate analysis
    if (avgEngagementRate < 0.5) {
      recommendations.push('Consider improving titles with more engaging questions or emotional hooks');
      recommendations.push('Experiment with different visual styles or question formats');
    } else if (avgEngagementRate > 1.0) {
      recommendations.push('Great engagement rate! Scale successful content patterns to similar topics');
    }

    // Topic diversity recommendations
    if (topicInsights.length < 3) {
      recommendations.push('Diversify content topics to identify new high-performing areas');
    }

    // Views vs engagement analysis
    const highViewsLowEngagement = topicInsights.filter(t => t.avgViews > 200 && t.avgEngagementRate < 0.3);
    if (highViewsLowEngagement.length > 0) {
      recommendations.push('Some high-view topics have low engagement - focus on improving call-to-action or question difficulty');
    }

    return recommendations;
  }

  /**
   * Generate complete refinement report for all accounts
   */
  async generateRefinementReport(): Promise<RefinementReport> {
    console.log('[RefinementService] Generating content refinement report...');

    // Get all active personas from accounts
    const accountsResult = await query(`
      SELECT id, personas FROM accounts WHERE status = 'active'
    `);

    const accountInsights: PersonaInsights[] = [];

    // Analyze each persona
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

    // Generate global insights
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
    // Sort topics by performance
    const sortedTopics = [...allTopics].sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
    
    const bestPerformingTopics = sortedTopics.slice(0, 5);
    const worstPerformingTopics = sortedTopics.slice(-5).reverse();
    
    // Calculate optimal engagement rate (top 25% average)
    const topQuartileSize = Math.max(1, Math.floor(sortedTopics.length * 0.25));
    const optimalEngagementRate = topQuartileSize > 0 
      ? sortedTopics.slice(0, topQuartileSize).reduce((sum, t) => sum + t.avgEngagementRate, 0) / topQuartileSize
      : 0;

    // Generate global recommendations
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
  async applyContentRefinements(report: RefinementReport): Promise<{ updated: number; recommendations: string[] }> {
    console.log('[RefinementService] Applying content refinements...');
    
    let updatedCount = 0;
    const allRecommendations: string[] = [];

    for (const insights of report.accountInsights) {
      // For now, we'll log recommendations rather than automatically updating prompts
      // This ensures human oversight for AI prompt modifications
      
      console.log(`[RefinementService] Insights for ${insights.persona} (${insights.accountId}):`);
      console.log(`  - Engagement Rate: ${insights.avgEngagementRate}%`);
      console.log(`  - Top Topic: ${insights.topicInsights[0]?.topic || 'N/A'}`);
      
      insights.recommendations.forEach(rec => {
        console.log(`  - Recommendation: ${rec}`);
        allRecommendations.push(`[${insights.persona}] ${rec}`);
      });

      updatedCount++;
    }

    // Global recommendations
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
  async performContentRefinement(): Promise<{
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
  async getRefinementSummary(): Promise<{
    lastAnalysis: Date | null;
    totalPersonas: number;
    avgEngagementRate: number;
    topRecommendations: string[];
  }> {
    try {
      const result = await analyticsService.getAnalyticsSummary();
      
      // Get personas count
      const personasResult = await query(`
        SELECT COUNT(DISTINCT persona) as persona_count
        FROM quiz_jobs qj
        JOIN video_analytics va ON qj.id = va.job_id
        WHERE va.collected_at > NOW() - INTERVAL '7 days'
      `);

      return {
        lastAnalysis: new Date(), // In production, store this in database
        totalPersonas: parseInt(personasResult.rows[0]?.persona_count || '0'),
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

// Export singleton instance
export const refinementService = new RefinementService();
export default refinementService;