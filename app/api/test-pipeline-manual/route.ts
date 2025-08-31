import { NextRequest, NextResponse } from 'next/server';

// Manual testing endpoint without CRON_SECRET requirement
export async function POST(request: NextRequest) {
  try {
    const { step } = await request.json();
    if (!step || typeof step !== 'number' || step < 1 || step > 4) {
      return NextResponse.json({ success: false, error: 'Invalid step provided.' }, { status: 400 });
    }

    const endpoints: { [key: number]: string } = {
      1: '/api/jobs/generate-quiz',
      2: '/api/jobs/create-frames', 
      3: '/api/jobs/assemble-video',
      4: '/api/jobs/upload-quiz-videos'
    };

    // Use CRON_SECRET for internal API calls
    const url = new URL(endpoints[step], request.url);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json({ success: false, ...data }, { status: response.status });
    }

    return NextResponse.json({ success: true, ...data });

  } catch (error) {
    console.error(`Manual pipeline test failed:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;