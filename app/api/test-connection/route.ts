import { NextRequest, NextResponse } from 'next/server';
import { createClient, getPendingJobs } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const dbUrl = process.env.DATABASE_URL;
    const nodeEnv = process.env.NODE_ENV;
    
    // Test direct client connection
    const client = createClient();
    await client.connect();
    
    const timeResult = await client.query('SELECT NOW() as current_time, current_database() as db_name');
    
    const jobsQuery = `
      SELECT id, step, status, created_at 
      FROM quiz_jobs 
      WHERE step = 2 AND status LIKE '%pending%'
      ORDER BY created_at ASC 
      LIMIT 3
    `;
    const jobsResult = await client.query(jobsQuery);
    
    await client.end();
    
    // Test getPendingJobs function
    const pendingJobsFunction = await getPendingJobs(2, 1);
    
    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: nodeEnv,
        DATABASE_URL_prefix: dbUrl?.substring(0, 30) + '...',
      },
      connection: timeResult.rows[0],
      directQuery: {
        count: jobsResult.rows.length,
        jobs: jobsResult.rows
      },
      getPendingJobsFunction: {
        count: pendingJobsFunction.length,
        jobs: pendingJobsFunction
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_exists: !!process.env.DATABASE_URL,
      }
    }, { status: 500 });
  }
}