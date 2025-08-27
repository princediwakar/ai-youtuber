import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob } from '@/lib/database';
import { createCanvas } from 'canvas';

// Runtime configuration exports for Vercel
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // Authentication check using CRON_SECRET
    const authHeader = request.headers.get('Authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting optimized video frame creation...');

    // Fetch pending jobs for frame creation (step 2)
    const jobs = await getPendingJobs(2, 1);
    console.log('Found', jobs.length, 'jobs to process');
    
    if (jobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: 'No jobs pending frame creation.'
      });
    }

    const processedJobs = [];

    for (const job of jobs) {
      try {
        console.log(`Creating frames for job ${job.id} - ${job.persona} ${job.category}`);

        // Generate frames using the Canvas API
        const frames = await createOptimizedFrames(job.data.question, job.persona, job.category);
        
        // Update the job to the next step (assembly_pending)
        await updateJob(job.id, {
          step: 3,
          status: 'assembly_pending',
          data: { 
            ...job.data, 
            frames: frames 
          }
        });
        
        processedJobs.push({ id: job.id, persona: job.persona, category: job.category });
        console.log(`Frame creation completed for job ${job.id}`);

      } catch (error) {
        console.error(`Failed to create frames for job ${job.id}:`, error);
        await updateJob(job.id, {
          status: 'failed',
          error_message: `Frame creation failed: ${error.message}`
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedJobs.length,
      jobs: processedJobs
    });

  } catch (error) {
    console.error('Frame creation process failed:', error);
    return NextResponse.json(
      { success: false, error: 'Frame creation failed' },
      { status: 500 }
    );
  }
}

/**
 * Creates video frames using Canvas API.
 * @param {object} question - The question data object.
 * @param {string} persona - The type of quiz (e.g., 'vocabulary').
 * @param {string} category - The category of the quiz (e.g., 'english').
 * @returns {Promise<string[]>} A promise that resolves to an array of base64 encoded PNG image strings.
 */
async function createOptimizedFrames(question: any, persona: string, category: string): Promise<string[]> {
  const width = 1080;
  const height = 1920;

  try {
    console.log('Creating frames using Canvas API...');

    // Normalize and escape data
    let options = question?.options || {};
    if (Array.isArray(options)) {
      options = { A: options[0], B: options[1], C: options[2], D: options[3] };
    }
    const correctAnswer = question?.answer || 'A';

    const questionText = question?.question || 'Sample Question';
    const explanationText = question?.explanation || 'Sample explanation text.';
    const optionTexts = {
        A: options.A || 'Option A',
        B: options.B || 'Option B', 
        C: options.C || 'Option C',
        D: options.D || 'Option D',
    };

    const frames = [];

    // Helper to create canvas with gradient background
    const createBaseCanvas = () => {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#FF6FD8');
      gradient.addColorStop(0.5, '#3813C2');
      gradient.addColorStop(1, '#2E8BFD');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      return { canvas, ctx };
    };

    // Helper to wrap text
    const wrapText = (ctx: any, text: string, maxWidth: number) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    // Frame 1: Question
    const frame1 = createBaseCanvas();
    frame1.ctx.fillStyle = 'white';
    frame1.ctx.font = 'bold 24px Arial';
    frame1.ctx.textAlign = 'center';
    
    // Question text
    const questionLines = wrapText(frame1.ctx, questionText, width - 80);
    let y = height / 3;
    questionLines.forEach((line: string) => {
      frame1.ctx.fillText(line, width / 2, y);
      y += 30;
    });
    
    // Options
    y += 20;
    frame1.ctx.font = '20px Arial';
    Object.entries(optionTexts).forEach(([key, value]) => {
      const optionText = `${key}) ${value}`;
      const optionLines = wrapText(frame1.ctx, optionText, width - 100);
      optionLines.forEach((line: string) => {
        frame1.ctx.fillText(line, width / 2, y);
        y += 25;
      });
      y += 10;
    });
    
    frames.push(`data:image/png;base64,${frame1.canvas.toBuffer().toString('base64')}`);

    // Frame 2: Answer (with correct option highlighted)
    const frame2 = createBaseCanvas();
    frame2.ctx.fillStyle = 'white';
    frame2.ctx.font = 'bold 24px Arial';
    frame2.ctx.textAlign = 'center';
    
    // Question text (same as frame 1)
    const questionLines2 = wrapText(frame2.ctx, questionText, width - 80);
    let y2 = height / 3;
    questionLines2.forEach((line: string) => {
      frame2.ctx.fillText(line, width / 2, y2);
      y2 += 30;
    });
    
    // Options with correct answer highlighted
    y2 += 20;
    frame2.ctx.font = '20px Arial';
    Object.entries(optionTexts).forEach(([key, value]) => {
      if (key === correctAnswer) {
        // Highlight correct answer
        frame2.ctx.fillStyle = '#38E54D';
        frame2.ctx.fillRect(50, y2 - 20, width - 100, 30);
        frame2.ctx.fillStyle = 'white';
      } else {
        frame2.ctx.fillStyle = 'rgba(255,255,255,0.7)';
      }
      
      const optionText = `${key}) ${value}`;
      const optionLines = wrapText(frame2.ctx, optionText, width - 100);
      optionLines.forEach((line: string) => {
        frame2.ctx.fillText(line, width / 2, y2);
        y2 += 25;
      });
      y2 += 10;
    });
    
    frames.push(`data:image/png;base64,${frame2.canvas.toBuffer().toString('base64')}`);

    // Frame 3: Explanation
    const frame3 = createBaseCanvas();
    frame3.ctx.fillStyle = 'white';
    frame3.ctx.font = 'bold 28px Arial';
    frame3.ctx.textAlign = 'center';
    frame3.ctx.fillText('Explanation', width / 2, 100);
    
    frame3.ctx.font = '18px Arial';
    const explanationLines = wrapText(frame3.ctx, explanationText, width - 80);
    let y3 = 150;
    explanationLines.forEach((line: string) => {
      frame3.ctx.fillText(line, width / 2, y3);
      y3 += 22;
    });
    
    frames.push(`data:image/png;base64,${frame3.canvas.toBuffer().toString('base64')}`);

    console.log(`Successfully created ${frames.length} frames using Canvas API.`);
    return frames;

  } catch (error) {
    console.error('Canvas frame creation failed:', error);
    throw new Error(`Frame creation failed: ${error.message}`);
  }
}