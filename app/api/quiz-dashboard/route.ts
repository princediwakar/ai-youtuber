import { NextResponse } from 'next/server';
import { getPool, getJobStats } from '@/lib/database';

export async function GET() {
  try {
    const pool = getPool();
    
    // Get job statistics
    const stats = await getJobStats();
    
    // Get recent jobs (last 20)
    const recentJobsQuery = `
      SELECT 
        id,
        persona,
        category,
        difficulty,
        status,
        step,
        created_at,
        error_message
      FROM quiz_jobs 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    
    const recentJobsResult = await pool.query(recentJobsQuery);
    
    return NextResponse.json({
      success: true,
      stats,
      recentJobs: recentJobsResult.rows
    });
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stats: { total: 0, pending: 0, completed: 0, failed: 0 },
      recentJobs: []
    }, { status: 500 });
  }
}