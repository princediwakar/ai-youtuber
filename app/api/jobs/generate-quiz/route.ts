// app/api/jobs/generate-quiz/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MasterCurriculum } from '@/lib/curriculum';
import { generateAndStoreQuiz } from '@/lib/generationService';
import { config } from '@/lib/config';
import { GenerationSchedule } from '@/lib/schedule'; // Import the new schedule

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * This API is the single endpoint for a frequent cron job (e.g., hourly).
 * It checks the central schedule to determine if any personas should be generated
 * during the current hour and then processes them.
 * In DEBUG_MODE, it randomly selects personas instead of following the schedule.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let personasToGenerate: string[] = [];

    // Check if we're in DEBUG_MODE
    if (process.env.DEBUG_MODE === 'true') {
      // In DEBUG_MODE, randomly select only one persona from available curriculum
      const availablePersonas = Object.keys(MasterCurriculum);
      const randomPersona = getRandomElement(availablePersonas);
      personasToGenerate.push(randomPersona);
      
      console.log(`🐞 DEBUG_MODE: Randomly selected persona: ${randomPersona}`);
    } else {
      // 1. Check the schedule to see what needs to be generated right now.
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
      const hourOfDay = now.getHours();

      personasToGenerate = GenerationSchedule[dayOfWeek]?.[hourOfDay] || [];

      // 2. If no personas are scheduled for this hour, exit gracefully.
      if (personasToGenerate.length === 0) {
        const message = `No personas scheduled for generation at ${hourOfDay}:00 on day ${dayOfWeek}.`;
        console.log(message);
        return NextResponse.json({ success: true, message });
      }
    }

    console.log(`🚀 Found scheduled personas for this hour: ${personasToGenerate.join(', ')}`);
    let totalCreatedJobs = 0;

    // 3. Loop through and generate content for each scheduled persona.
    for (const personaKey of personasToGenerate) {
      const personaConfig = MasterCurriculum[personaKey];
      if (!personaConfig) {
        console.warn(`-- Persona "${personaKey}" found in schedule but not in curriculum. Skipping.`);
        continue;
      }

      console.log(`-- Starting generation batch for persona: "${personaConfig.displayName}"`);
      const generationDate = new Date();
      
      const generationPromises = Array(config.GENERATE_BATCH_SIZE).fill(null).map(async () => {
          const category = getRandomElement(personaConfig.structure);
          const subCategory = category.subCategories ? getRandomElement(category.subCategories) : category;

          const jobConfig = {
              persona: personaKey,
              generationDate,
              category: category.key,
              subCategory: subCategory.key,
          };

          return generateAndStoreQuiz(jobConfig);
      });

      const results = await Promise.allSettled(generationPromises);
      const createdCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      totalCreatedJobs += createdCount;
      console.log(`-- Batch completed for ${personaConfig.displayName}. Created ${createdCount} jobs.`);
    }

    return NextResponse.json({ success: true, created: totalCreatedJobs, personas: personasToGenerate });

  } catch (error) {
    console.error('❌ Scheduled quiz generation failed:', error);
    return NextResponse.json({ success: false, error: 'Scheduled generation failed' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 25;
