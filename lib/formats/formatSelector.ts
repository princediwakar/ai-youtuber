/**
 * Format Selection Logic for Multi-Format Video Generation
 * Intelligently selects the most appropriate format based on account, persona, topic, and performance data
 */

import { FormatType, FormatSelectionContext } from './types';
import { formatRules, getTopicFormatPreferences, isFormatSuitableForTopic } from './formatRules';

interface FormatScore {
  format: FormatType;
  score: number;
  reasons: string[];
}

/**
 * Main format selection function
 * Selects the best format based on weighted random selection with topic preferences
 */
export function selectFormatForContent(context: FormatSelectionContext): FormatType {
  const { accountId, persona, topic, previousFormats = [] } = context;
  
  // Get account rules
  const rules = formatRules[accountId]?.[persona];
  if (!rules) {
    console.warn(`No format rules found for ${accountId}/${persona}, falling back to MCQ`);
    return 'mcq';
  }

  // Calculate format scores
  const formatScores = calculateFormatScores(context, rules);
  
  // Apply diversity bonus (avoid recently used formats)
  applyDiversityBonus(formatScores, previousFormats);
  
  // Select format using weighted random selection
  const selectedFormat = weightedRandomSelection(formatScores);
  
  console.log(`[FormatSelector] Selected ${selectedFormat} for ${accountId}/${persona}/${topic}`);
  return selectedFormat;
}

/**
 * Calculate scores for each available format
 */
function calculateFormatScores(
  context: FormatSelectionContext, 
  rules: any
): FormatScore[] {
  const { topic } = context;
  const formatScores: FormatScore[] = [];

  // Get topic preferences
  const topicPreferences = getTopicFormatPreferences(topic);

  for (const format of rules.formats) {
    const reasons: string[] = [];
    let score = rules.weights[format] || 0;

    // Topic suitability bonus
    if (isFormatSuitableForTopic(format, topic)) {
      if (topicPreferences.includes(format)) {
        const preferenceIndex = topicPreferences.indexOf(format);
        const bonus = (topicPreferences.length - preferenceIndex) * 0.1;
        score += bonus;
        reasons.push(`Topic preference (+${bonus.toFixed(1)})`);
      }
    } else {
      // Penalize unsuitable formats
      score *= 0.5;
      reasons.push('Topic mismatch (-50%)');
    }

    // Engagement target alignment
    if (context.targetEngagement) {
      const engagementBonus = getEngagementBonus(format, context.targetEngagement);
      score += engagementBonus;
      if (engagementBonus > 0) {
        reasons.push(`Engagement match (+${engagementBonus})`);
      }
    }

    formatScores.push({
      format,
      score: Math.max(0.01, score), // Ensure minimum score
      reasons
    });
  }

  return formatScores;
}

/**
 * Apply diversity bonus to avoid format repetition
 */
function applyDiversityBonus(formatScores: FormatScore[], previousFormats: FormatType[]) {
  if (previousFormats.length === 0) return;

  const recentFormats = previousFormats.slice(-3); // Consider last 3 formats
  
  formatScores.forEach(formatScore => {
    const timesUsedRecently = recentFormats.filter(f => f === formatScore.format).length;
    if (timesUsedRecently > 0) {
      const penalty = timesUsedRecently * 0.2; // 20% penalty per recent use
      formatScore.score *= (1 - penalty);
      formatScore.reasons.push(`Diversity penalty (-${(penalty * 100).toFixed(0)}%)`);
    }
  });
}

/**
 * Get engagement bonus based on format and target engagement type
 */
function getEngagementBonus(format: FormatType, targetEngagement: string): number {
  const engagementMap: { [format: string]: { [engagement: string]: number } } = {
    'mcq': { 'educational': 0.2, 'entertaining': 0.1, 'interactive': 0.1, 'practical': 0.1 },
    'common_mistake': { 'educational': 0.1, 'entertaining': 0.2, 'interactive': 0.1, 'practical': 0.3 },
    'quick_fix': { 'educational': 0.1, 'entertaining': 0.1, 'interactive': 0.1, 'practical': 0.3 },
    'quick_tip': { 'educational': 0.2, 'entertaining': 0.1, 'interactive': 0.1, 'practical': 0.3 },
    'before_after': { 'educational': 0.3, 'entertaining': 0.2, 'interactive': 0.1, 'practical': 0.2 },
    'challenge': { 'educational': 0.1, 'entertaining': 0.3, 'interactive': 0.4, 'practical': 0.1 }
  };

  return engagementMap[format]?.[targetEngagement] || 0;
}

/**
 * Weighted random selection from format scores
 */
function weightedRandomSelection(formatScores: FormatScore[]): FormatType {
  const totalWeight = formatScores.reduce((sum, fs) => sum + fs.score, 0);
  
  if (totalWeight === 0) {
    console.warn('[FormatSelector] All formats have zero weight, falling back to first available');
    return formatScores[0]?.format || 'mcq';
  }

  let random = Math.random() * totalWeight;
  
  for (const formatScore of formatScores) {
    random -= formatScore.score;
    if (random <= 0) {
      return formatScore.format;
    }
  }

  // Fallback to last format (should not happen)
  return formatScores[formatScores.length - 1].format;
}

/**
 * Get fallback format for account/persona combination
 */
export function getFallbackFormat(accountId: string, persona: string): FormatType {
  const rules = formatRules[accountId]?.[persona];
  return rules?.fallback || 'mcq';
}

/**
 * Validate that a format can be used for given context
 */
export function validateFormatForContext(context: FormatSelectionContext, format: FormatType): boolean {
  const { accountId, persona, topic } = context;
  
  // Check account/persona rules
  const rules = formatRules[accountId]?.[persona];
  if (!rules?.formats.includes(format)) {
    return false;
  }

  // Check topic suitability
  if (!isFormatSuitableForTopic(format, topic)) {
    return false;
  }

  return true;
}

/**
 * Get format distribution statistics for monitoring
 */
export function getFormatDistribution(accountId: string, persona: string): { [format: string]: number } {
  const rules = formatRules[accountId]?.[persona];
  if (!rules) return {};

  const total = Object.values(rules.weights).reduce((sum, weight) => sum + weight, 0);
  const distribution: { [format: string]: number } = {};

  for (const [format, weight] of Object.entries(rules.weights)) {
    distribution[format] = (weight / total) * 100; // Convert to percentage
  }

  return distribution;
}