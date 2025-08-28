import { NextResponse } from 'next/server';
import { getJobStats, getRecentJobs } from '@/lib/database';

// This export ensures that Next.js treats this route as a dynamic API endpoint,
// preventing it from caching responses and always fetching the latest data.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch the aggregate job statistics and the list of recent jobs in parallel.
    // This is more efficient than fetching them sequentially.
    const [stats, recentJobs] = await Promise.all([
      getJobStats(),
      getRecentJobs(20) // Fetch the last 20 jobs for the dashboard view.
    ]);

    return NextResponse.json({ success: true, stats, recentJobs });
  } catch (error) {
    console.error('Dashboard API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    
    // Return a structured error response that the frontend can handle gracefully.
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        // Provide default empty values to prevent the frontend from crashing.
        stats: { total: 0, pending: 0, completed: 0, failed: 0 },
        recentJobs: []
      },
      { status: 500 }
    );
  }
}
