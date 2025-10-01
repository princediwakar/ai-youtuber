import { NextRequest, NextResponse } from 'next/server';
import { generateAndStoreContent } from '@/lib/generation/core/generationService';
import { getAccountConfig } from '@/lib/accounts';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('🔄 [DEBUG] Starting full generation test in production...');
    
    // Test account retrieval
    console.log('🔄 [DEBUG] Testing account retrieval...');
    const account = await getAccountConfig('english_shots');
    console.log('🔄 [DEBUG] Account retrieved:', account.name);
    
    // Test single content generation
    console.log('🔄 [DEBUG] Testing content generation...');
    const jobConfig = {
      persona: 'english_vocab_builder',
      generationDate: new Date(),
      topic: 'eng_vocab_word_meaning',
      accountId: 'english_shots'
    };
    
    console.log('🔄 [DEBUG] Calling generateAndStoreContent with config:', jobConfig);
    const result = await generateAndStoreContent(jobConfig);
    console.log('🔄 [DEBUG] Generation result:', result);
    
    if (result) {
      console.log('✅ [DEBUG] Generation successful, job ID:', result.id);
      return NextResponse.json({ 
        success: true,
        message: 'Full generation test completed successfully',
        jobId: result.id,
        accountName: account.name
      });
    } else {
      console.log('❌ [DEBUG] Generation failed, result was null');
      return NextResponse.json({ 
        success: false,
        error: 'Generation returned null result'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [DEBUG] Full generation test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;