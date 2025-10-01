import { NextRequest, NextResponse } from 'next/server';
import { getAccountConfig } from '@/lib/accounts';
import { getScheduledPersonasForGeneration } from '@/lib/schedule';

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const accountId = 'english_shots';
    console.log(`🔄 [DEBUG] Testing scheduling logic for: ${accountId}`);
    
    // Test account retrieval
    console.log(`🔄 [DEBUG] Getting account config...`);
    const account = await getAccountConfig(accountId);
    console.log(`🔄 [DEBUG] Account: ${account.name}, Personas: ${account.personas.join(', ')}`);
    
    // Test environment variables
    console.log(`🔄 [DEBUG] DEBUG_MODE: ${process.env.DEBUG_MODE}`);
    console.log(`🔄 [DEBUG] DEBUG_MODE === 'true': ${process.env.DEBUG_MODE === 'true'}`);
    
    let personasToGenerate: string[] = [];
    let debugInfo: any = {};

    // Check if we're in DEBUG_MODE
    if (process.env.DEBUG_MODE === 'true') {
      console.log(`🔄 [DEBUG] In DEBUG_MODE branch`);
      const availablePersonas: string[] = account.personas;
      const randomPersona = getRandomElement(availablePersonas);
      personasToGenerate.push(randomPersona);
      
      debugInfo.mode = 'DEBUG_MODE';
      debugInfo.availablePersonas = availablePersonas;
      debugInfo.selectedPersona = randomPersona;
      
      console.log(`🐞 DEBUG_MODE: Randomly selected persona for ${account.name}: ${randomPersona}`);
    } else {
      console.log(`🔄 [DEBUG] In production scheduling branch`);
      const now = new Date();
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const dayOfWeek = istTime.getDay();
      const hourOfDay = istTime.getHours();
      
      debugInfo.mode = 'PRODUCTION_SCHEDULING';
      debugInfo.currentTime = now.toISOString();
      debugInfo.istTime = istTime.toISOString();
      debugInfo.dayOfWeek = dayOfWeek;
      debugInfo.hourOfDay = hourOfDay;
      
      console.log(`🔄 [DEBUG] Checking schedule for day ${dayOfWeek}, hour ${hourOfDay}`);
      personasToGenerate = getScheduledPersonasForGeneration(accountId, dayOfWeek, hourOfDay);
      debugInfo.scheduledPersonas = personasToGenerate;
      
      if (personasToGenerate.length === 0) {
        const message = `No personas scheduled for ${account.name} generation at ${hourOfDay}:00 on day ${dayOfWeek}.`;
        console.log(`🔄 [DEBUG] ${message}`);
        debugInfo.noSchedule = message;
      }
    }

    console.log(`🔄 [DEBUG] Final personas to generate: ${personasToGenerate.join(', ')}`);
    
    return NextResponse.json({ 
      success: true,
      accountName: account.name,
      personasToGenerate,
      debugInfo,
      envDebugMode: process.env.DEBUG_MODE,
      willGenerate: personasToGenerate.length > 0
    });

  } catch (error) {
    console.error('❌ [DEBUG] Scheduling test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;