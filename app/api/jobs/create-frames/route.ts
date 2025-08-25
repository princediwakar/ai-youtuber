import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob } from '@/lib/database';
import { createCanvas } from 'canvas';

export async function POST(request: NextRequest) {
  try {
    // Auth check using CRON_SECRET
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting frame creation batch...');

    // Get jobs at step 2 (frames_pending)
    const jobs = await getPendingJobs(2, 3); // Process 3 jobs at a time
    
    if (jobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: 'No jobs pending frame creation' 
      });
    }

    const processedJobs = [];

    for (const job of jobs) {
      try {
        console.log(`Creating frames for job ${job.id} - ${job.test_type} ${job.subject}`);

        // Create video frames using Canvas
        const frames = await createVideoFrames(job.data.question, job.test_type, job.subject);
        
        // Update job to next step
        await updateJob(job.id, {
          step: 3,
          status: 'assembly_pending',
          data: { 
            ...job.data, 
            frames: frames 
          }
        });
        
        processedJobs.push({ id: job.id, test_type: job.test_type, subject: job.subject });
        console.log(`Frame creation completed for job ${job.id}`);

      } catch (error) {
        console.error(`Failed to create frames for job ${job.id}:`, error);
        
        // Mark job as failed
        await updateJob(job.id, {
          status: 'failed',
          error_message: `Frame creation failed: ${error.message}`
        });
      }
    }

    console.log(`Frame creation batch completed. Processed ${processedJobs.length} jobs.`);

    return NextResponse.json({ 
      success: true, 
      processed: processedJobs.length,
      jobs: processedJobs
    });

  } catch (error) {
    console.error('Frame creation batch failed:', error);
    return NextResponse.json(
      { success: false, error: 'Frame creation failed' },
      { status: 500 }
    );
  }
}

async function createVideoFrames(question: any, testType: string, subject: string): Promise<string[]> {
  const frames: string[] = [];
  const width = 1080;
  const height = 1920; // 9:16 aspect ratio for YouTube Shorts

  try {
    // Frame 1: Question display
    const questionCanvas = createCanvas(width, height);
    const questionCtx = questionCanvas.getContext('2d');
    
    // Background
    questionCtx.fillStyle = '#1a1a2e';
    questionCtx.fillRect(0, 0, width, height);
    
    // Title
    questionCtx.fillStyle = '#ffffff';
    questionCtx.font = 'bold 60px Arial';
    questionCtx.textAlign = 'center';
    questionCtx.fillText(`${testType} ${subject}`, width / 2, 200);
    
    // Question text
    questionCtx.font = '40px Arial';
    questionCtx.fillStyle = '#e94560';
    wrapText(questionCtx, question.question || 'Sample Question', width / 2, 400, width - 100, 50);
    
    frames.push(questionCanvas.toDataURL());

    // Frame 2: Options (if multiple choice)
    if (question.options && question.options.length > 0) {
      const optionsCanvas = createCanvas(width, height);
      const optionsCtx = optionsCanvas.getContext('2d');
      
      optionsCtx.fillStyle = '#1a1a2e';
      optionsCtx.fillRect(0, 0, width, height);
      
      optionsCtx.fillStyle = '#ffffff';
      optionsCtx.font = 'bold 50px Arial';
      optionsCtx.textAlign = 'center';
      optionsCtx.fillText('Choose your answer:', width / 2, 200);
      
      optionsCtx.font = '35px Arial';
      question.options.forEach((option: string, index: number) => {
        const yPos = 400 + (index * 100);
        optionsCtx.fillStyle = '#0f3460';
        optionsCtx.fillRect(100, yPos - 40, width - 200, 80);
        optionsCtx.fillStyle = '#ffffff';
        optionsCtx.textAlign = 'left';
        optionsCtx.fillText(`${String.fromCharCode(65 + index)}. ${option}`, 150, yPos);
      });
      
      frames.push(optionsCanvas.toDataURL());
    }

    // Frame 3: Thinking time
    const thinkingCanvas = createCanvas(width, height);
    const thinkingCtx = thinkingCanvas.getContext('2d');
    
    thinkingCtx.fillStyle = '#16213e';
    thinkingCtx.fillRect(0, 0, width, height);
    
    thinkingCtx.fillStyle = '#e94560';
    thinkingCtx.font = 'bold 80px Arial';
    thinkingCtx.textAlign = 'center';
    thinkingCtx.fillText('Think about it...', width / 2, height / 2);
    
    frames.push(thinkingCanvas.toDataURL());

    // Frame 4: Answer reveal
    const answerCanvas = createCanvas(width, height);
    const answerCtx = answerCanvas.getContext('2d');
    
    answerCtx.fillStyle = '#0f3460';
    answerCtx.fillRect(0, 0, width, height);
    
    answerCtx.fillStyle = '#27ae60';
    answerCtx.font = 'bold 60px Arial';
    answerCtx.textAlign = 'center';
    answerCtx.fillText('Correct Answer:', width / 2, 300);
    
    answerCtx.fillStyle = '#ffffff';
    answerCtx.font = '45px Arial';
    wrapText(answerCtx, question.correct_answer || 'Answer explanation here', width / 2, 500, width - 100, 55);
    
    frames.push(answerCanvas.toDataURL());

    console.log(`Created ${frames.length} frames for ${testType} ${subject}`);
    return frames;

  } catch (error) {
    console.error('Canvas frame creation failed:', error);
    throw new Error(`Frame generation failed: ${error.message}`);
  }
}

function wrapText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}