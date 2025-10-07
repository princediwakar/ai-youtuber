// app/api/jobs/generate-quiz/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MasterPersonas } from '@/lib/personas';
import { generateAndStoreContent } from '@/lib/generation/core/generationService';
import { config } from '@/lib/config';
import { getScheduledPersonasForGeneration } from '@/lib/schedule';
import { getAccountConfig } from '@/lib/accounts';

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * --- REFACTORED FOR SERVERLESS RELIABILITY ---
 * This endpoint now runs the generation process synchronously within the request.
 * It no longer uses a "fire-and-forget" approach, ensuring that the serverless
 * function stays alive until the job creation process is complete, preventing
 * premature termination by the Vercel runtime.
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now(); // <<< START: Overall request timer
  let accountId = 'english_shots'; // Default for backward compatibility
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let preferredFormat: string | undefined;
    try {
      const body = await request.json();
      accountId = body.accountId || accountId;
      preferredFormat = body.format; // Restored to use 'format'
    } catch {
      // No body or invalid JSON - use default
    }

    console.log(`🚀 Starting synchronous generation for account: ${accountId}`);

    const validationStartTime = Date.now(); // <<< START: Validation and scheduling timer
    const result = await processGenerationWithValidation(accountId, preferredFormat);
    const validationDuration = (Date.now() - validationStartTime) / 1000; // <<< END: Validation and scheduling timer

    const requestDuration = (Date.now() - requestStartTime) / 1000; // <<< END: Overall request timer
    
    console.log(`✅ Generation process finished for account: ${accountId}. Validation/Scheduling Time: ${validationDuration.toFixed(2)}s. Total Request Time: ${requestDuration.toFixed(2)}s.`);
    
    return NextResponse.json({ 
      success: true, 
      accountId,
      message: 'Generation process completed.',
      result: result
    });

  } catch (error) {
    const requestDuration = (Date.now() - requestStartTime) / 1000; // Capture time on failure
    console.error(`❌ Generation failed for account ${accountId} (Time: ${requestDuration.toFixed(2)}s):`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: 'Generation failed', details: errorMessage }, { status: 500 });
  }
}

/**
 * Processing function that includes validation and generation.
 */
async function processGenerationWithValidation(accountId: string, preferredFormat?: string) {
    console.log(`🔄 Validating account and schedule for: ${accountId}`);

    let account;
    try {
      account = await getAccountConfig(accountId);
    } catch (error) {
      console.error(`❌ Invalid accountId: ${accountId}`, error);
      // Re-throw to be caught by the main handler
      throw error;
    }

    let personasToGenerate: string[] = [];

    if (process.env.DEBUG_MODE === 'true') {
      const availablePersonas: string[] = account.personas;
      if (!availablePersonas || availablePersonas.length === 0) {
        console.warn(`🐞 DEBUG_MODE: Account ${account.name} has no personas.`);
        return { success: true, message: "No personas to generate for." };
      }
      const randomPersona = getRandomElement(availablePersonas);
      personasToGenerate.push(randomPersona);
      console.log(`🐞 DEBUG_MODE: Randomly selected persona for ${account.name}: ${randomPersona}`);
    } else {
      const now = new Date();
      const istDateString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const istTime = new Date(istDateString);
      const dayOfWeek = istTime.getDay();
      const hourOfDay = istTime.getHours();

      personasToGenerate = getScheduledPersonasForGeneration(accountId, dayOfWeek, hourOfDay);

      if (personasToGenerate.length === 0) {
        const message = `No personas scheduled for ${account.name} generation at ${hourOfDay}:00 on day ${dayOfWeek} (IST).`;
        console.log(message);
        return { success: true, message };
      }
    }

    console.log(`🚀 Found scheduled personas for ${account.name}: ${personasToGenerate.join(', ')}`);
    return await processGenerationInBackground(accountId, account, personasToGenerate, preferredFormat);
}

/**
 * Internal processing function for content generation.
 * OPTIMIZED: Runs all persona batches concurrently using Promise.all.
 */
async function processGenerationInBackground(
  accountId: string, 
  account: any, 
  personasToGenerate: string[],
  preferredFormat?: string
) {
  const generationStartTime = Date.now(); // <<< START: Content generation timer
  
  console.log(`🔄 Starting concurrent content generation for ${personasToGenerate.length} persona(s) for ${account.name}`);

  // Create an array of promises, where each promise handles the full batch for one persona.
  const personaPromises = personasToGenerate.map(async (personaKey) => {
    const personaStartTime = Date.now(); // <<< START: Single persona timer
    const personaConfig = MasterPersonas[personaKey];
    
    if (!personaConfig) {
      console.warn(`-- Persona "${personaKey}" not in MasterPersonas config. Skipping.`);
      return { persona: personaKey, createdCount: 0 };
    }

    console.log(`-- Starting batch for persona: "${personaConfig.displayName}"`);
    const generationDate = new Date();
    
    const shuffledSubCategories = [...personaConfig.subCategories].sort(() => 0.5 - Math.random());
    const topicsForBatch = shuffledSubCategories.slice(0, config.GENERATE_BATCH_SIZE);

    // Run topic generation concurrently within this persona's batch
    const generationPromises = topicsForBatch.map(subCategory => {
        const jobConfig = {
            persona: personaKey,
            generationDate,
            topic: subCategory.key,
            accountId,
            preferredFormat,
        };
        return generateAndStoreContent(jobConfig);
    });

    const results = await Promise.allSettled(generationPromises);
    
    const createdCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    const personaDuration = (Date.now() - personaStartTime) / 1000; // <<< END: Single persona timer
    console.log(`-- Batch completed for ${personaConfig.displayName}. Created ${createdCount} jobs. Duration: ${personaDuration.toFixed(2)}s.`);
    
    return { persona: personaKey, createdCount };
  });

  // Await ALL persona batches concurrently
  const allResults = await Promise.all(personaPromises);
  
  const totalCreatedJobs = allResults.reduce((sum, result) => sum + result.createdCount, 0);

  const generationDuration = (Date.now() - generationStartTime) / 1000; // <<< END: Content generation timer
  console.log(`✅ Content generation completed for ${account.name}. Total created: ${totalCreatedJobs} jobs. Total Generation Time: ${generationDuration.toFixed(2)}s.`);
  
  return { success: true, jobsCreated: totalCreatedJobs, account: account.name };
}

export const runtime = 'nodejs';
export const maxDuration = 300;
