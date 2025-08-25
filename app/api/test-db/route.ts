import { NextResponse } from 'next/server';
import { getPool, getJobStats } from '@/lib/database';

export async function GET() {
  try {
    const pool = getPool();
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    
    // Test quiz_jobs table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('quiz_jobs', 'uploaded_videos')
    `);
    
    // Get job statistics
    let stats = null;
    try {
      stats = await getJobStats();
    } catch (error) {
      console.log('Stats not available yet (tables may not exist)');
    }
    
    return NextResponse.json({
      success: true,
      connection: 'OK',
      timestamp: result.rows[0].current_time,
      database_version: result.rows[0].db_version,
      tables_found: tableCheck.rows.map(row => row.table_name),
      job_stats: stats,
      message: tableCheck.rows.length === 2 
        ? 'Database is ready for quiz generation!' 
        : 'Run the schema.sql to create missing tables'
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Check your DATABASE_URL environment variable'
    }, { status: 500 });
  }
}