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

    // Process asynchronously to prevent timeout
    processGenerationWithValidation(accountId, preferredFormat).catch(error => {
      console.error('Background generation failed:', error);
    });

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
 * Processing function that includes validation and generation.
 * Now runs synchronously to ensure completion in serverless environment.
 */
async function processGenerationWithValidation(accountId: string, preferredFormat?: string) {
  try {
    console.log(`🔄 Processing started for account: ${accountId}`);

    // Validate account exists (moved to background)
    let account;
    try {
      account = await getAccountConfig(accountId);
    } catch (error) {
      console.error(`❌ Invalid accountId: ${accountId}`, error);
      throw error;
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
      // --- FIX: Correctly calculate the current time in IST ---
      // 1. Get the current time in UTC from the server.
      const now = new Date();
      
      // 2. Create a new Date object representing the time in India.
      // toLocaleString correctly converts the time to the specified timezone.
      const istDateString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const istTime = new Date(istDateString);

      const dayOfWeek = istTime.getDay(); // 0 for Sunday, 1 for Monday, etc.
      const hourOfDay = istTime.getHours();
      // --- END FIX ---

      personasToGenerate = getScheduledPersonasForGeneration(accountId, dayOfWeek, hourOfDay);

      // 2. If no personas are scheduled for this hour, exit gracefully.
      if (personasToGenerate.length === 0) {
        const message = `No personas scheduled for ${account.name} generation at ${hourOfDay}:00 on day ${dayOfWeek} (IST).`;
        console.log(message);
        return { success: false, message };
      }
    }

    console.log(`🚀 Found scheduled personas for ${account.name}: ${personasToGenerate.join(', ')}`);

    // Process generation
    const result = await processGenerationInBackground(accountId, account, personasToGenerate, preferredFormat);
    return result;

  } catch (error) {
    console.error(`❌ Validation/generation failed for ${accountId}:`, error);
    console.error(`❌ Error stack for ${accountId}:`, error instanceof Error ? error.stack : 'No stack trace available');
    console.error(`❌ Error details for ${accountId}:`, JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Processing function for content generation.
 * Runs synchronously to ensure completion.
 */
async function processGenerationInBackground(
  accountId: string, 
  account: any, 
  personasToGenerate: string[],
  preferredFormat?: string
) {
  let totalCreatedJobs = 0;

  try {
    console.log(`🔄 Processing started for ${account.name} with ${personasToGenerate.length} personas`);

    // 3. Loop through and generate content for each scheduled persona.
    for (const personaKey of personasToGenerate) {
      const personaConfig = MasterPersonas[personaKey];
      if (!personaConfig) {
        console.warn(`-- Persona "${personaKey}" found in ${account.name} schedule but not in personas config. Skipping.`);
        continue;
      }

      console.log(`-- Starting ${account.name} generation batch for persona: "${personaConfig.displayName}"`);
      const generationDate = new Date();
      
      // Shuffle subcategories to get a random, unique set of topics for the batch
      const shuffledSubCategories = [...personaConfig.subCategories].sort(() => 0.5 - Math.random());
      const topicsForBatch = shuffledSubCategories.slice(0, config.GENERATE_BATCH_SIZE);

      const generationPromises = topicsForBatch.map((subCategory, index) => {
          const jobConfig = {
              persona: personaKey,
              generationDate,
              topic: subCategory.key,
              accountId, // Include account information
              preferredFormat, // Pass through the format parameter
          };

          console.log(`🔄 [DEBUG] Creating promise ${index} for topic: ${subCategory.key}`);
          return generateAndStoreContent(jobConfig);
      });

      console.log(`🔄 [DEBUG] About to await ${generationPromises.length} promises for ${personaKey}`);
      const results = await Promise.allSettled(generationPromises);
      console.log(`🔄 [DEBUG] Promise.allSettled completed with ${results.length} results`);
      
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

    console.log(`✅ Processing completed for ${account.name}. Total created: ${totalCreatedJobs} jobs.`);
    return { success: true, jobsCreated: totalCreatedJobs, account: account.name };

  } catch (error) {
    console.error(`❌ Generation failed for ${account.name}:`, error);
    console.error(`❌ Error stack for ${account.name}:`, error instanceof Error ? error.stack : 'No stack trace available');
    console.error(`❌ Error details for ${account.name}:`, JSON.stringify(error, null, 2));
    throw error;
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;
