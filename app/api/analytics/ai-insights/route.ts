// app/api/analytics/ai-insights/route.ts
import { NextResponse } from 'next/server';
import { analyticsInsightsService as analyticsService } from '@/lib/analytics/insightsService';
import { getAllAccounts } from '@/lib/accounts'; // Assuming this function is correctly defined elsewhere

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { secret, persona, accountId } = await request.json();
    
    // Verify the cron secret
    if (secret !== process.env.CRON_SECRET) {
      console.log('[AI Analytics] Unauthorized request attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[AI Analytics] Starting AI-powered analytics analysis...');
    
    const startTime = Date.now();
    let analysisPromises: Promise<any>[] = [];

    if (persona && accountId) {
      // Analyze specific persona
      console.log(`[AI Analytics] Analyzing specific persona: ${persona} (${accountId})`);
      // Use an IIFE to match the promise structure below
      analysisPromises.push((async () => {
        try {
            const result = await analyticsService.analyzePerformanceWithAI(accountId, persona);
            return { persona, accountId, ...result };
        } catch (error) {
            console.error(`[AI Analytics] Error analyzing ${persona} (${accountId}):`, error);
            return {
                persona,
                accountId,
                error: error instanceof Error ? error.message : 'Analysis failed'
            };
        }
      })());
      
    } else {
      // Analyze all personas across all accounts
      console.log('[AI Analytics] Analyzing all personas concurrently...');
      const accounts = await getAllAccounts();
      
      for (const account of accounts) {
        for (const personaName of account.personas) {
          // Push a promise for each analysis task
          analysisPromises.push((async () => {
            try {
              const result = await analyticsService.analyzePerformanceWithAI(account.id, personaName);
              return {
                persona: personaName,
                accountId: account.id,
                ...result
              };
            } catch (error) {
              console.error(`[AI Analytics] Error analyzing ${personaName} (${account.id}):`, error);
              return {
                persona: personaName,
                accountId: account.id,
                error: error instanceof Error ? error.message : 'Analysis failed'
              };
            }
          })()); // IIFE to execute the async function and get the promise
        }
      }
    }

    // Wait for all analysis tasks to complete concurrently
    const results = await Promise.all(analysisPromises);

    const duration = Date.now() - startTime;
    const successfulAnalyses = results.filter(r => !r.error).length;
    const errors = results.filter(r => r.error).length;
    
    const response = {
      success: true,
      message: 'AI-powered analytics analysis completed',
      stats: {
        personasAnalyzed: successfulAnalyses,
        errors: errors,
        totalResults: results.length,
        durationMs: duration
      },
      results: results.map(result => ({
        persona: result.persona,
        accountId: result.accountId,
        error: result.error,
        insights: result.error ? null : {
          performanceAnalysis: result.aiInsights.performanceAnalysis,
          topRecommendations: result.aiInsights.contentRecommendations.slice(0, 3),
          engagementStrategies: result.aiInsights.engagementStrategies.slice(0, 3),
          predictiveInsights: result.aiInsights.predictiveInsights
        },
        analyticsData: result.error ? null : {
          totalVideos: result.analyticsData.totalVideos,
          avgEngagementRate: result.analyticsData.avgEngagementRate,
          avgViews: result.analyticsData.avgViews,
          trends: result.analyticsData.recentTrends
        }
      })),
      timestamp: new Date().toISOString()
    };

    console.log('[AI Analytics] Analysis completed:', response.stats);
    
    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Analytics] Analysis failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'AI analytics analysis failed',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint for getting AI insights for a specific persona
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const persona = searchParams.get('persona');
    const accountId = searchParams.get('accountId');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!persona || !accountId) {
      return NextResponse.json({ error: 'persona and accountId parameters required' }, { status: 400 });
    }

    console.log(`[AI Analytics] Getting AI insights for ${persona} (${accountId})`);
    
    // This part remains sequential as it's a single request
    const result = await analyticsService.analyzePerformanceWithAI(accountId, persona);
    
    return NextResponse.json({
      success: true,
      data: {
        persona,
        accountId,
        aiInsights: result.aiInsights,
        analyticsData: result.analyticsData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Analytics] Failed to get AI insights:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get AI insights',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}