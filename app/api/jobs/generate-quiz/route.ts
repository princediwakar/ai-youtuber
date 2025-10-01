// app/api/jobs/generate-quiz/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MasterPersonas } from '@/lib/personas';
import { generateAndStoreContent } from '@/lib/generation/core/generationService';
import { config } from '@/lib/config';
import { getScheduledPersonasForGeneration } from '@/lib/schedule';
import { getAccountConfig } from '@/lib/accounts';

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


/**
 * Multi-account content generation endpoint for cron jobs.
 * Fire-and-forget implementation to avoid timeout issues.
 * Now supports accountId parameter to generate content for specific accounts.
 * Defaults to 'english_shots' for backward compatibility.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse request body to get accountId and format (optional)
    let accountId = 'english_shots'; // Default for backward compatibility
    let preferredFormat: string | undefined;
    try {
      const body = await request.json();
      accountId = body.accountId || accountId;
      preferredFormat = body.format; // Extract format parameter
    } catch {
      // No body or invalid JSON - use default
    }

    console.log(`🚀 Starting generation for account: ${accountId}${preferredFormat ? ` with format: ${preferredFormat}` : ''}`);

    // Fire-and-forget pattern for cron-job.org 30s timeout
    processGenerationWithValidation(accountId, preferredFormat).catch(error => {
      console.error('Background generation failed:', error);
    });

    // Immediate response to avoid cron timeout
    return NextResponse.json({ 
      success: true, 
      accountId,
      message: 'Generation started in background'
    });

  } catch (error) {
    console.error('❌ Scheduled quiz generation failed:', error);
    return NextResponse.json({ success: false, error: 'Scheduled generation failed' }, { status: 500 });
  }
}

/**
 * Background processing function that includes validation and generation.
 * Runs asynchronously without blocking the API response.
 */
async function processGenerationWithValidation(accountId: string, preferredFormat?: string) {
  try {
    console.log(`🔄 Background processing started for account: ${accountId}`);

    // Validate account exists (moved to background)
    let account;
    try {
      account = await getAccountConfig(accountId);
    } catch (error) {
      console.error(`❌ Invalid accountId in background: ${accountId}`, error);
      return;
    }

    let personasToGenerate: string[] = [];

    // Check if we're in DEBUG_MODE
    if (process.env.DEBUG_MODE === 'true') {
      // In DEBUG_MODE, randomly select one persona from this account's personas
      const availablePersonas: string[] = account.personas;
      const randomPersona = getRandomElement(availablePersonas);
      personasToGenerate.push(randomPersona);
      
      console.log(`🐞 DEBUG_MODE: Randomly selected persona for ${account.name}: ${randomPersona}`);
    } else {
      // 1. Check the account-specific schedule to see what needs to be generated right now.
      const now = new Date();
      // Convert to IST (UTC + 5:30)
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const dayOfWeek = istTime.getDay(); // 0 for Sunday, 1 for Monday, etc.
      const hourOfDay = istTime.getHours();
      personasToGenerate = getScheduledPersonasForGeneration(accountId, dayOfWeek, hourOfDay);

      // 2. If no personas are scheduled for this hour, exit gracefully.
      if (personasToGenerate.length === 0) {
        const message = `No personas scheduled for ${account.name} generation at ${hourOfDay}:00 on day ${dayOfWeek}.`;
        console.log(message);
        return;
      }
    }

    console.log(`🚀 Found scheduled personas for ${account.name}: ${personasToGenerate.join(', ')}`);

    // Process generation
    await processGenerationInBackground(accountId, account, personasToGenerate, preferredFormat);

  } catch (error) {
    console.error(`❌ Background validation/generation failed for ${accountId}:`, error);
  }
}

/**
 * Background processing function for content generation.
 * Runs asynchronously without blocking the API response.
 */
async function processGenerationInBackground(
  accountId: string, 
  account: any, 
  personasToGenerate: string[],
  preferredFormat?: string
) {
  let totalCreatedJobs = 0;

  try {
    console.log(`🔄 Background processing started for ${account.name} with ${personasToGenerate.length} personas`);

    // 3. Loop through and generate content for each scheduled persona.
    for (const personaKey of personasToGenerate) {
      const personaConfig = MasterPersonas[personaKey];
      if (!personaConfig) {
        console.warn(`-- Persona "${personaKey}" found in ${account.name} schedule but not in personas config. Skipping.`);
        continue;
      }

      console.log(`-- Starting ${account.name} generation batch for persona: "${personaConfig.displayName}"`);
      const generationDate = new Date();
      
      const generationPromises = Array(config.GENERATE_BATCH_SIZE).fill(null).map(async (_, index) => {
          // Use time-based seeded selection to ensure topic variety within batches
          const seed = Date.now() + index * 1000; // Different seed for each quiz
          const topicIndex = Math.floor((seed / 1000) % personaConfig.subCategories.length);
          const subCategory = personaConfig.subCategories[topicIndex];

          const jobConfig = {
              persona: personaKey,
              generationDate,
              topic: subCategory.key,
              accountId, // Include account information
              preferredFormat, // Pass through the format parameter
          };

          return generateAndStoreContent(jobConfig);
      });

      const results = await Promise.allSettled(generationPromises);
      
      // DEBUG: Log promise results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`🔄 [DEBUG] Promise ${index} fulfilled with result:`, result.value);
        } else {
          console.log(`❌ [DEBUG] Promise ${index} rejected:`, result.reason);
        }
      });
      
      const createdCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      totalCreatedJobs += createdCount;
      console.log(`-- ${account.name} batch completed for ${personaConfig.displayName}. Created ${createdCount} jobs.`);
    }

    console.log(`✅ Background processing completed for ${account.name}. Total created: ${totalCreatedJobs} jobs.`);

  } catch (error) {
    console.error(`❌ Background generation failed for ${account.name}:`, error);
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;
