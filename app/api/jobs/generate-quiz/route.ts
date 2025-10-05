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
      preferredFormat = body.format;
    } catch {
      // No body or invalid JSON - use default
    }

    console.log(`🚀 Starting synchronous generation for account: ${accountId}`);

    // --- FIX: The main logic is now directly inside the handler and awaited ---
    const result = await processGenerationWithValidation(accountId, preferredFormat);

    console.log(`✅ Generation process finished for account: ${accountId}.`);
    
    return NextResponse.json({ 
      success: true, 
      accountId,
      message: 'Generation process completed.',
      result: result
    });

  } catch (error) {
    console.error(`❌ Generation failed for account ${accountId}:`, error);
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
 */
async function processGenerationInBackground(
  accountId: string, 
  account: any, 
  personasToGenerate: string[],
  preferredFormat?: string
) {
  let totalCreatedJobs = 0;

  console.log(`🔄 Starting content generation for ${personasToGenerate.length} persona(s) for ${account.name}`);

  for (const personaKey of personasToGenerate) {
    const personaConfig = MasterPersonas[personaKey];
    if (!personaConfig) {
      console.warn(`-- Persona "${personaKey}" not in MasterPersonas config. Skipping.`);
      continue;
    }

    console.log(`-- Starting batch for persona: "${personaConfig.displayName}"`);
    const generationDate = new Date();
    
    const shuffledSubCategories = [...personaConfig.subCategories].sort(() => 0.5 - Math.random());
    const topicsForBatch = shuffledSubCategories.slice(0, config.GENERATE_BATCH_SIZE);

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
    totalCreatedJobs += createdCount;
    console.log(`-- Batch completed for ${personaConfig.displayName}. Created ${createdCount} jobs.`);
  }

  console.log(`✅ Content generation completed for ${account.name}. Total created: ${totalCreatedJobs} jobs.`);
  return { success: true, jobsCreated: totalCreatedJobs, account: account.name };
}

export const runtime = 'nodejs';
export const maxDuration = 300;

