import { NextRequest, NextResponse } from 'next/server';
import { MasterCurriculum } from '@/lib/curriculum';
import { getDynamicContext } from '@/lib/contentSource';
import { generateAndStoreQuiz } from '@/lib/generationService';
import { config } from '@/lib/config';

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log("🚀 Starting daily content generation for all personas...");
    const allPersonas = Object.keys(MasterCurriculum);
    const generationDate = new Date().toISOString();
    const summary = [];

    for (const personaKey of allPersonas) {
      const personaConfig = MasterCurriculum[personaKey];
      console.log(`--- Processing batch for: ${personaConfig.displayName} ---`);
      
      try {
        const generationPromises = Array(config.GENERATE_BATCH_SIZE).fill(null).map(async () => {
            const category = getRandomElement(personaConfig.structure);
            const topic = category.subCategories ? getRandomElement(category.subCategories) : category;

            const jobConfig = {
                persona: personaKey,
                generationDate,
                category: { key: category.key, displayName: category.displayName },
                topic: { key: topic.key, displayName: topic.displayName },
                context: await getDynamicContext(personaKey, topic.displayName),
            };

            return generateAndStoreQuiz(jobConfig);
        });

        const results = await Promise.allSettled(generationPromises);
        const createdCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
        summary.push({ persona: personaConfig.displayName, created: createdCount });
        console.log(`--- Finished batch for ${personaConfig.displayName}. Created ${createdCount} jobs. ---`);
      } catch (personaError) {
        console.error(`❌ Failed to process batch for persona "${personaKey}":`, personaError);
        summary.push({ persona: personaConfig.displayName, created: 0, error: true });
      }
    }

    console.log("✅ Daily content generation completed for all personas.");
    return NextResponse.json({ success: true, summary });

  } catch (error) {
    console.error('❌ Master generation process failed:', error);
    return NextResponse.json({ success: false, error: 'Master generation process failed' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;