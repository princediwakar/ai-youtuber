// app/api/jobs/generate-quiz/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MasterPersonas } from '@/lib/personas';
import { generateAndStoreContent } from '@/lib/generationService';
import { config } from '@/lib/config';
import { getScheduledPersonasForGeneration } from '@/lib/schedule';
import { getAccountConfig } from '@/lib/accounts';

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


/**
 * Multi-account content generation endpoint for cron jobs.
 * Now supports accountId parameter to generate content for specific accounts.
 * Defaults to 'english_shots' for backward compatibility.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse request body to get accountId (optional)
    let accountId = 'english_shots'; // Default for backward compatibility
    try {
      const body = await request.json();
      accountId = body.accountId || accountId;
    } catch {
      // No body or invalid JSON - use default
    }

    // Validate account exists
    let account;
    try {
      account = getAccountConfig(accountId);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid accountId: ${accountId}` 
      }, { status: 400 });
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
        return NextResponse.json({ success: true, message, accountId });
      }
    }

    console.log(`🚀 Found scheduled personas for ${account.name}: ${personasToGenerate.join(', ')}`);
    let totalCreatedJobs = 0;

    // 3. Loop through and generate content for each scheduled persona.
    for (const personaKey of personasToGenerate) {
      const personaConfig = MasterPersonas[personaKey];
      if (!personaConfig) {
        console.warn(`-- Persona "${personaKey}" found in ${account.name} schedule but not in personas config. Skipping.`);
        continue;
      }

      console.log(`-- Starting ${account.name} generation batch for persona: "${personaConfig.displayName}"`);
      const generationDate = new Date();
      
      const generationPromises = Array(config.GENERATE_BATCH_SIZE).fill(null).map(async () => {
          // With subject-specific personas, directly select from subCategories
          const subCategory = getRandomElement(personaConfig.subCategories);

          const jobConfig = {
              persona: personaKey,
              generationDate,
              topic: subCategory.key,
              accountId, // Include account information
          };

          return generateAndStoreContent(jobConfig);
      });

      const results = await Promise.allSettled(generationPromises);
      const createdCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      totalCreatedJobs += createdCount;
      console.log(`-- ${account.name} batch completed for ${personaConfig.displayName}. Created ${createdCount} jobs.`);
    }

    return NextResponse.json({ 
      success: true, 
      created: totalCreatedJobs, 
      personas: personasToGenerate,
      accountId,
      accountName: account.name
    });

  } catch (error) {
    console.error('❌ Scheduled quiz generation failed:', error);
    return NextResponse.json({ success: false, error: 'Scheduled generation failed' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;
