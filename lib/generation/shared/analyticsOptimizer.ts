/**
 * Analytics-driven content optimization utilities
 * Uses performance data to enhance prompt generation
 */

import type { AIAnalyticsInsights } from '../../analytics/insightsService';

export interface TopicWeight {
  topic: string;
  weight: number; // 0.1 to 2.0, where 1.0 is baseline
  reason: string;
}

export interface TimingContext {
  hour: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  energy: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'relaxed';
  audience: string;
}

/**
 * Generate topic weights based on analytics performance
 */
export function generateTopicWeights(insights?: AIAnalyticsInsights): TopicWeight[] {
  if (!insights) {
    return [];
  }

  const weights: TopicWeight[] = [];

  // Boost high-performing topics (weight > 1.0)
  insights.contentRecommendations
    .filter(rec => rec.includes('focus') || rec.includes('more') || rec.includes('boost'))
    .forEach(rec => {
      const topicMatch = insights.topicOptimization.find(topic => 
        rec.toLowerCase().includes(topic.toLowerCase().split(' ')[0])
      );
      if (topicMatch) {
        weights.push({
          topic: topicMatch,
          weight: 1.5,
          reason: 'High engagement performance'
        });
      }
    });

  // Reduce underperforming topics (weight < 1.0)  
  insights.contentRecommendations
    .filter(rec => rec.includes('avoid') || rec.includes('reduce') || rec.includes('less'))
    .forEach(rec => {
      weights.push({
        topic: rec.split(' ')[0],
        weight: 0.7,
        reason: 'Below average performance'
      });
    });

  return weights;
}

/**
 * Get timing context for upload hour (IST)
 */
export function getTimingContext(uploadHour?: number): TimingContext {
  if (!uploadHour) {
    return {
      hour: 12,
      timeOfDay: 'afternoon',
      energy: 'medium',
      urgency: 'relaxed',
      audience: 'general learners'
    };
  }

  if (uploadHour >= 6 && uploadHour < 12) {
    return {
      hour: uploadHour,
      timeOfDay: 'morning',
      energy: 'high',
      urgency: 'immediate',
      audience: 'motivated early learners'
    };
  } else if (uploadHour >= 12 && uploadHour < 17) {
    return {
      hour: uploadHour,
      timeOfDay: 'afternoon',
      energy: 'medium',
      urgency: 'relaxed',
      audience: 'casual browsers'
    };
  } else if (uploadHour >= 17 && uploadHour < 21) {
    return {
      hour: uploadHour,
      timeOfDay: 'evening',
      energy: 'high',
      urgency: 'immediate',
      audience: 'engaged evening learners'
    };
  } else {
    return {
      hour: uploadHour,
      timeOfDay: 'night',
      energy: 'low',
      urgency: 'relaxed',
      audience: 'dedicated night learners'
    };
  }
}

/**
 * Get optimal format based on analytics insights
 */
export function getOptimalFormat(insights?: AIAnalyticsInsights, defaultFormat: string = 'multiple_choice'): string {
  if (!insights?.formatOptimization || insights.formatOptimization.length === 0) {
    return defaultFormat;
  }

  // Extract format from optimization recommendations
  const formatRec = insights.formatOptimization[0];
  if (formatRec.includes('multiple_choice') || formatRec.includes('MCQ')) {
    return 'multiple_choice';
  } else if (formatRec.includes('true_false') || formatRec.includes('true/false')) {
    return 'true_false';  
  } else if (formatRec.includes('assertion_reason')) {
    return 'assertion_reason';
  }

  return defaultFormat;
}

/**
 * Enhance prompt with timing-appropriate language
 */
export function enhancePromptWithTiming(basePrompt: string, context: TimingContext): string {
  let enhanced = basePrompt;

  // Add timing-specific energy and urgency
  const timingModifiers = {
    morning: {
      energy: 'energetic', 
      urgency: 'Start your day strong!',
      audience: 'motivated morning learners'
    },
    afternoon: {
      energy: 'focused',
      urgency: 'Quick knowledge boost',
      audience: 'busy professionals taking a break'
    },
    evening: {
      energy: 'engaging',
      urgency: 'Perfect evening challenge!',
      audience: 'engaged evening learners'
    },
    night: {
      energy: 'thoughtful',
      urgency: 'Deep learning time',
      audience: 'dedicated night students'
    }
  };

  const modifier = timingModifiers[context.timeOfDay];

  // Replace timing placeholders
  enhanced = enhanced.replace(/\${timing_energy}/g, modifier.energy);
  enhanced = enhanced.replace(/\${timing_urgency}/g, modifier.urgency);
  enhanced = enhanced.replace(/\${timing_audience}/g, modifier.audience);

  return enhanced;
}

/**
 * Select weighted topic from available options
 */
export function selectOptimalTopic(
  availableTopics: string[], 
  weights: TopicWeight[]
): string {
  if (weights.length === 0) {
    // Fallback to random selection
    return availableTopics[Math.floor(Math.random() * availableTopics.length)];
  }

  // Create weighted selection pool
  const weightedPool: string[] = [];
  
  availableTopics.forEach(topic => {
    const weight = weights.find(w => 
      topic.toLowerCase().includes(w.topic.toLowerCase()) ||
      w.topic.toLowerCase().includes(topic.toLowerCase())
    )?.weight || 1.0;
    
    // Add topic multiple times based on weight
    const addCount = Math.round(weight * 10); // 0.5 weight = 5 adds, 1.5 weight = 15 adds
    for (let i = 0; i < addCount; i++) {
      weightedPool.push(topic);
    }
  });

  // Select from weighted pool
  return weightedPool[Math.floor(Math.random() * weightedPool.length)] || availableTopics[0];
}

/**
 * Enhance CTA based on performance insights
 */
export function enhanceCTA(baseCTA: string, insights?: AIAnalyticsInsights): string {
  if (!insights?.engagementStrategies || insights.engagementStrategies.length === 0) {
    return baseCTA;
  }

  const strategy = insights.engagementStrategies[0];
  
  if (strategy.includes('share') || strategy.includes('tag')) {
    return baseCTA.replace('Follow', 'Share').replace('Like', 'Tag a friend');
  } else if (strategy.includes('comment') || strategy.includes('interact')) {
    return baseCTA.replace('Follow', 'Comment').replace('Like', 'Drop your answer');
  } else if (strategy.includes('save')) {
    return baseCTA.replace('Like', 'Save this').replace('Follow', 'Bookmark');
  }
  
  return baseCTA;
}