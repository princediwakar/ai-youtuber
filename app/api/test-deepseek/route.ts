import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!deepseekApiKey) {
      return NextResponse.json({ 
        error: 'DEEPSEEK_API_KEY not found in environment variables' 
      }, { status: 500 });
    }

    // Test DeepSeek API with a simple request
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'Test message. Reply with just "API working"'
          }
        ],
        max_tokens: 10,
        temperature: 0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        error: 'DeepSeek API error',
        status: response.status,
        statusText: response.statusText,
        details: errorText
      }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true,
      apiResponse: data,
      message: 'DeepSeek API is working correctly'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to test DeepSeek API',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}