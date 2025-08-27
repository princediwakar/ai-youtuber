import { NextRequest, NextResponse } from 'next/server';
import { getPool, getPendingJobs } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    
    // Test basic connection
    const connectionTest = await pool.query('SELECT NOW() as current_time');
    
    // Test getPendingJobs function directly
    const pendingStep2Jobs = await getPendingJobs(2, 5);
    
    // Test raw query that should match
    const rawQuery = await pool.query(`
      SELECT id, step, status, persona, category, created_at 
      FROM quiz_jobs 
      WHERE step = 2 AND status LIKE '%pending%'
      ORDER BY created_at ASC 
      LIMIT 5
    `);
    
    return NextResponse.json({
      success: true,
      connection: connectionTest.rows[0],
      pendingJobsFunction: pendingStep2Jobs,
      rawQuery: rawQuery.rows,
      environment: process.env.NODE_ENV
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}