import { NextRequest, NextResponse } from 'next/server';
import { MasterPersonas } from '@/lib/personas';
import { generateAndStoreContent } from '@/lib/generation/core/generationService';
import { config } from '@/lib/config';
import { getScheduledPersonasForGeneration } from '@/lib/schedule';
import { getAccountConfig } from '@/lib/accounts';

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('🔄 [DEBUG] Starting background flow test...');
    
    const accountId = 'english_shots';
    let result: any = {};
    
    try {
      // Step 1: Get account
      console.log('🔄 [DEBUG] Step 1: Getting account config...');
      const account = await getAccountConfig(accountId);
      console.log(`🔄 [DEBUG] Account retrieved: ${account.name}`);
      result.step1_account = { success: true, name: account.name };
      
      // Step 2: Check personas
      console.log('🔄 [DEBUG] Step 2: Checking personas...');
      let personasToGenerate: string[] = [];
      
      if (process.env.DEBUG_MODE === 'true') {
        const availablePersonas: string[] = account.personas;
        const randomPersona = getRandomElement(availablePersonas);
        personasToGenerate.push(randomPersona);
        console.log(`🔄 [DEBUG] DEBUG_MODE: Selected ${randomPersona}`);
      } else {
        console.log('🔄 [DEBUG] Using scheduling logic');
        const now = new Date();
        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        const dayOfWeek = istTime.getDay();
        const hourOfDay = istTime.getHours();
        personasToGenerate = getScheduledPersonasForGeneration(accountId, dayOfWeek, hourOfDay);
      }
      
      result.step2_personas = { 
        success: true, 
        debugMode: process.env.DEBUG_MODE,
        personas: personasToGenerate 
      };
      
      if (personasToGenerate.length === 0) {
        console.log('🔄 [DEBUG] No personas to generate');
        result.step2_personas.noPersonas = true;
        return NextResponse.json({ success: true, result, message: 'No personas to generate' });
      }
      
      // Step 3: Process first persona
      console.log('🔄 [DEBUG] Step 3: Processing persona generation...');
      const personaKey = personasToGenerate[0];
      const personaConfig = MasterPersonas[personaKey];
      
      if (!personaConfig) {
        console.log(`🔄 [DEBUG] Persona config not found: ${personaKey}`);
        result.step3_generation = { success: false, error: 'Persona config not found' };
        return NextResponse.json({ success: false, result });
      }
      
      console.log(`🔄 [DEBUG] Found persona config: ${personaConfig.displayName}`);
      
      // Step 4: Generate one job (simplified)
      console.log('🔄 [DEBUG] Step 4: Generating single content...');
      const shuffledSubCategories = [...personaConfig.subCategories].sort(() => 0.5 - Math.random());
      const topic = shuffledSubCategories[0];
      
      const jobConfig = {
        persona: personaKey,
        generationDate: new Date(),
        topic: topic.key,
        accountId: accountId,
      };
      
      console.log('🔄 [DEBUG] Job config:', jobConfig);
      
      const generationResult = await generateAndStoreContent(jobConfig);
      
      if (generationResult) {
        console.log(`🔄 [DEBUG] ✅ Generation successful: ${generationResult.id}`);
        result.step4_generation = { 
          success: true, 
          jobId: generationResult.id,
          layoutType: generationResult.layoutType 
        };
      } else {
        console.log('🔄 [DEBUG] ❌ Generation failed: null result');
        result.step4_generation = { success: false, error: 'Generation returned null' };
      }
      
    } catch (error) {
      console.error('🔄 [DEBUG] Error in background flow:', error);
      result.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
    }
    
    return NextResponse.json({ 
      success: result.step4_generation?.success || false,
      result,
      message: 'Background flow test completed'
    });

  } catch (error) {
    console.error('❌ [DEBUG] Background flow test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;