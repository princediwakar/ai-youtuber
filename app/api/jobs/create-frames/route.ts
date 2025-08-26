import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob } from '@/lib/database';
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Auth check using CRON_SECRET
    const authHeader = request.headers.get('Authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting PUPPETEER HTML quiz video frame creation...');

    // Get jobs at step 2 (frames_pending)
    const jobs = await getPendingJobs(2, 1);
    
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
        console.log(`Creating PUPPETEER HTML frames for job ${job.id} - ${job.test_type} ${job.subject}`);

        // Create frames using Puppeteer + HTML
        const frames = await createPuppeteerFrames(job.data.question, job.test_type, job.subject);
        
        await updateJob(job.id, {
          step: 3,
          status: 'assembly_pending',
          data: { 
            ...job.data, 
            frames: frames 
          }
        });
        
        processedJobs.push({ id: job.id, test_type: job.test_type, subject: job.subject });
        console.log(`PUPPETEER HTML frame creation completed for job ${job.id}`);

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
    console.error('Frame creation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Frame creation failed' },
      { status: 500 }
    );
  }
}

async function createPuppeteerFrames(question: any, testType: string, subject: string): Promise<string[]> {
  const frames: string[] = [];
  const width = 1080;
  const height = 1920;

  let browser;
  
  try {
    console.log('Launching Puppeteer for HTML frame generation...');
    
    const debugDir = path.join(process.cwd(), 'debug-frames');
    await fs.mkdir(debugDir, { recursive: true });
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width, height });

    let options = question?.options || {};
    if (Array.isArray(options)) {
      options = { A: options[0] || 'Option A', B: options[1] || 'Option B', C: options[2] || 'Option C', D: options[3] || 'Option D' };
    }
    const correctAnswer = question?.answer || 'A';

    // --- Common CSS and Head ---
    const commonHead = `
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
        <style>
          :root {
            --base-font-size: 40px; /* Base for dynamic scaling; adjust here to resize all text proportionally */
            --label-multiplier: 1.25; /* e.g., 50px */
            --footer-multiplier: 1; /* e.g., 40px */
            --heading-multiplier: 3.5; /* e.g., 140px for main headings */
            --subheading-multiplier: 2.5; /* e.g., 100px for secondary titles */
            --body-multiplier: 1.5; /* e.g., 60px for questions/explanations */
            --option-multiplier: 1.25; /* e.g., 50px for options */
            --line-height-body: 1.5; /* Standard for readability */
            --line-height-heading: 1.2; /* Tighter for headings */
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${width}px;
            height: ${height}px;
            font-family: 'Inter', sans-serif;
            color: #1A202C;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: linear-gradient(135deg, #6B7280 0%, #1A202C 100%);
            animation: fadeIn 0.5s ease-in;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .top-label {
            padding: 40px;
            font-size: calc(var(--base-font-size) * var(--label-multiplier));
            line-height: var(--line-height-heading);
            font-weight: 600;
            color: #FFFFFF;
            background: linear-gradient(90deg, #4C51BF, #7F9CF5);
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 2px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
          }
          .footer-label {
            padding: 30px;
            font-size: calc(var(--base-font-size) * var(--footer-multiplier));
            line-height: var(--line-height-heading);
            font-weight: 600;
            color: #E2E8F0;
            background: rgba(0,0,0,0.3);
            text-align: center;
            transition: all 0.3s ease;
          }
          .footer-label:hover {
            background: rgba(0,0,0,0.5);
          }
          .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 50px;
          }
        </style>
      </head>
    `;

    // --- Frame 1: Question ---
    const frame1Html = `
      <!DOCTYPE html>
      <html>
      ${commonHead}
      <style>
        .main-heading {
          font-family: 'Playfair Display', serif;
          font-size: calc(var(--base-font-size) * var(--heading-multiplier));
          line-height: var(--line-height-heading);
          color: #E2E8F0;
          text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
          margin-bottom: 50px;
          animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .question-window {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 80px;
          width: 95%;
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
          margin-bottom: 60px;
          transition: transform 0.3s ease;
        }
        .question-window:hover {
          transform: scale(1.02);
        }
        .question-text {
          font-size: calc(var(--base-font-size) * var(--body-multiplier));
          line-height: var(--line-height-body);
          font-weight: 600;
          color: #1A202C;
        }
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          width: 95%;
        }
        .option {
          background: #EDF2F7;
          border: 2px solid #4C51BF;
          border-radius: 15px;
          padding: 35px;
          font-size: calc(var(--base-font-size) * var(--option-multiplier));
          line-height: var(--line-height-body);
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .option:hover {
          background: #4C51BF;
          color: #FFFFFF;
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
      </style>
      <body>
        <div class="top-label">${testType} - ${subject}</div>
        <div class="content">
          <div class="main-heading">Quiz Challenge</div>
          <div class="question-window">
            <div class="question-text">${question?.question || 'Sample Quiz Question'}</div>
          </div>
          <div class="options-grid">
            <div class="option">A) ${options.A || 'Option A'}</div>
            <div class="option">B) ${options.B || 'Option B'}</div>
            <div class="option">C) ${options.C || 'Option C'}</div>
            <div class="option">D) ${options.D || 'Option D'}</div>
          </div>
        </div>
        <div class="footer-label">@gibbiAI</div>
      </body>
      </html>
    `;
    
    await page.setContent(frame1Html);
    const frame1Screenshot = await page.screenshot({ type: 'png' });
    const frame1Path = path.join(debugDir, `${Date.now()}-frame1-question.png`);
    await fs.writeFile(frame1Path, frame1Screenshot);
    console.log(`HTML Frame 1 (Question) created successfully and saved to: ${frame1Path}`);
    frames.push(`data:image/png;base64,${frame1Screenshot.toString('base64')}`);

    // --- Frame 2: Answer Reveal ---
    const frame2Html = `
      <!DOCTYPE html>
      <html>
      ${commonHead}
      <style>
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          width: 95%;
        }
        .option {
          border: 2px solid #4C51BF;
          border-radius: 15px;
          padding: 35px;
          font-size: calc(var(--base-font-size) * var(--option-multiplier));
          line-height: var(--line-height-body);
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .option.correct {
          background: #48BB78;
          color: #FFFFFF;
          border-color: #2F855A;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          transform: scale(1.05);
        }
        .option.incorrect {
          background: #E2E8F0;
          color: #718096;
          border-color: #CBD5E0;
          opacity: 0.7;
        }
      </style>
      <body>
        <div class="top-label">${testType} - ${subject}</div>
        <div class="content">
          <div class="options-grid">
            <div class="option ${correctAnswer === 'A' ? 'correct' : 'incorrect'}">A) ${options.A || 'Option A'}</div>
            <div class="option ${correctAnswer === 'B' ? 'correct' : 'incorrect'}">B) ${options.B || 'Option B'}</div>
            <div class="option ${correctAnswer === 'C' ? 'correct' : 'incorrect'}">C) ${options.C || 'Option C'}</div>
            <div class="option ${correctAnswer === 'D' ? 'correct' : 'incorrect'}">D) ${options.D || 'Option D'}</div>
          </div>
        </div>
        <div class="footer-label">@gibbiAI</div>
      </body>
      </html>
    `;
    
    await page.setContent(frame2Html);
    const frame2Screenshot = await page.screenshot({ type: 'png' });
    const frame2Path = path.join(debugDir, `${Date.now()}-frame2-answer.png`);
    await fs.writeFile(frame2Path, frame2Screenshot);
    console.log(`HTML Frame 2 (Answer) created successfully and saved to: ${frame2Path}`);
    frames.push(`data:image/png;base64,${frame2Screenshot.toString('base64')}`);

    // --- Frame 3: Explanation ---
    const frame3Html = `
      <!DOCTYPE html>
      <html>
      ${commonHead}
      <style>
        .explanation-window {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 80px;
          width: 95%;
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
          transition: transform 0.3s ease;
        }
        .explanation-window:hover {
          transform: scale(1.02);
        }
        .explanation-title {
          font-family: 'Playfair Display', serif;
          font-size: calc(var(--base-font-size) * var(--subheading-multiplier));
          line-height: var(--line-height-heading);
          color: #4C51BF;
          margin-bottom: 40px;
          animation: slideIn 0.5s ease-out;
        }
        .explanation-text {
          font-size: calc(var(--base-font-size) * var(--body-multiplier));
          line-height: var(--line-height-body);
          font-weight: 400;
          color: #2D3748;
        }
      </style>
      <body>
        <div class="top-label">${testType} - ${subject}</div>
        <div class="content">
          <div class="explanation-window">
            <div class="explanation-title">Explanation</div>
            <div class="explanation-text">${question?.explanation || 'This demonstrates the concept being tested.'}</div>
          </div>
        </div>
        <div class="footer-label">@gibbiAI</div>
      </body>
      </html>
    `;
    
    await page.setContent(frame3Html);
    const frame3Screenshot = await page.screenshot({ type: 'png' });
    const frame3Path = path.join(debugDir, `${Date.now()}-frame3-explanation.png`);
    await fs.writeFile(frame3Path, frame3Screenshot);
    console.log(`HTML Frame 3 (Explanation) created successfully and saved to: ${frame3Path}`);
    frames.push(`data:image/png;base64,${frame3Screenshot.toString('base64')}`);

    console.log(`Created ${frames.length} redesigned HTML frames with Puppeteer.`);
    return frames;

  } catch (error) {
    console.error('Puppeteer frame creation failed:', error);
    throw new Error(`Puppeteer generation failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}