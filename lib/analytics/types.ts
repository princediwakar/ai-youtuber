// lib/analytics/types.ts

/**
 * Basic analytics data collected for a single video.
 */
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
  
  /**
   * Represents a video that has been identified for analytics collection.
   */
  export interface VideoToCollect {
    videoId: string;
    jobId: string;
    accountId: string;
    uploadedAt: Date;
  }
  
  /**
   * The structured output expected from the AI analysis.
   */
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
  
  /**
   * A comprehensive data structure summarizing channel performance for AI analysis.
   */
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