import { NextRequest, NextResponse } from 'next/server';
import { deleteAllJobs } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Auth check using CRON_SECRET
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting database cleanup...');
    
    // Delete all jobs to free up storage space
    const deletedCount = await deleteAllJobs();
    
    console.log(`Database cleanup completed. Deleted ${deletedCount} jobs.`);

    return NextResponse.json({ 
      success: true, 
      deletedJobs: deletedCount,
      message: 'Database cleanup completed successfully' 
    });

  } catch (error) {
    console.error('Database cleanup failed:', error);
    return NextResponse.json(
      { success: false, error: 'Database cleanup failed' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;