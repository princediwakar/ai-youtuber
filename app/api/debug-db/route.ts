
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const sqlQuery = body.query;

    if (!sqlQuery) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const result = await query(sqlQuery);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Debug DB error:', error);
    return NextResponse.json({ success: false, error: 'Failed to execute query' }, { status: 500 });
  }
}
