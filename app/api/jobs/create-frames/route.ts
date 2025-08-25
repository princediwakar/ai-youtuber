import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import { getPendingJobs, updateJob } from '@/lib/database';

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

        // Create quiz frames from the generated question
        const frames = await createQuizFrames(job.data.question, job.test_type, job.subject);
        
        // Update job to next step
        await updateJob(job.id, {
          step: 3,
          status: 'assembly_pending',
          data: { 
            ...job.data, 
            frames: frames.map(frame => frame.toString('base64')) // Store as base64
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

async function createQuizFrames(question: any, testType: string, subject: string): Promise<Buffer[]> {
  const frames: Buffer[] = [];
  
  // Canvas settings for vertical video (1080x1920 - YouTube Shorts format)
  const width = 1080;
  const height = 1920;
  
  const colors = {
    SAT: '#2196F3',
    GMAT: '#9C27B0', 
    GRE: '#FF9800'
  };
  
  const bgColor = '#1a1a1a';
  const textColor = '#ffffff';
  const accentColor = colors[testType] || '#666666';

  // Frame 1: Question Display (3 seconds)
  {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Test type badge
    ctx.fillStyle = accentColor;
    ctx.fillRect(50, 100, 200, 80);
    ctx.fillStyle = textColor;
    ctx.font = 'bold 32px Arial';
    ctx.fillText(testType, 70, 150);
    
    // Subject badge
    ctx.fillStyle = '#444444';
    ctx.fillRect(270, 100, 200, 80);
    ctx.fillStyle = textColor;
    ctx.font = 'bold 28px Arial';
    ctx.fillText(subject, 290, 150);
    
    // Question text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    wrapText(ctx, question.question, width / 2, 400, width - 100, 60);
    
    frames.push(canvas.toBuffer());
  }

  // Frame 2: Multiple Choice Options (8 seconds)
  {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Smaller badges at top
    ctx.fillStyle = accentColor;
    ctx.fillRect(50, 50, 150, 60);
    ctx.fillStyle = textColor;
    ctx.font = 'bold 24px Arial';
    ctx.fillText(testType, 70, 85);
    
    ctx.fillStyle = '#444444';
    ctx.fillRect(220, 50, 150, 60);
    ctx.fillStyle = textColor;
    ctx.font = 'bold 22px Arial';
    ctx.fillText(subject, 240, 85);
    
    // Question text (smaller)
    ctx.fillStyle = textColor;
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    wrapText(ctx, question.question, width / 2, 200, width - 100, 45);
    
    // Options
    const options = ['A', 'B', 'C', 'D'];
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'left';
    
    options.forEach((option, i) => {
      const y = 700 + (i * 140);
      
      // Option background
      ctx.fillStyle = '#333333';
      ctx.fillRect(80, y - 50, width - 160, 100);
      
      // Option text
      ctx.fillStyle = textColor;
      const optionText = `${option}) ${question.options[option]}`;
      wrapText(ctx, optionText, 100, y, width - 200, 38);
    });
    
    frames.push(canvas.toBuffer());
  }

  // Frame 3: Thinking Time (3 seconds)
  {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Thinking prompt
    ctx.fillStyle = textColor;
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Think about it...', width / 2, 800);
    
    // Timer emoji
    ctx.font = 'bold 120px Arial';
    ctx.fillText('⏰', width / 2, 1000);
    
    // Countdown dots
    ctx.font = 'bold 48px Arial';
    ctx.fillText('• • •', width / 2, 1200);
    
    frames.push(canvas.toBuffer());
  }

  // Frame 4: Answer Reveal (6 seconds)
  {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Correct answer highlight
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(80, 400, width - 160, 120);
    
    // Answer text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Answer: ${question.answer}`, width / 2, 475);
    
    // Show the correct option text
    ctx.font = 'bold 42px Arial';
    wrapText(ctx, question.options[question.answer], width / 2, 600, width - 100, 50);
    
    // Explanation
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#cccccc';
    wrapText(ctx, question.explanation, width / 2, 800, width - 100, 45);
    
    // Checkmark
    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = '#4CAF50';
    ctx.fillText('✓', width / 2, 1200);
    
    frames.push(canvas.toBuffer());
  }

  return frames;
}

function wrapText(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  x: number, 
  y: number, 
  maxWidth: number, 
  lineHeight: number
) {
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