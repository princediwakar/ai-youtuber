import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob } from '@/lib/database';
import puppeteer, { Page } from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import chromium from '@sparticuz/chromium';

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

        // Generate frames using the improved Puppeteer and HTML/CSS logic
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
 * A robust helper function to generate a single frame.
 * It sets content, adjusts fonts, takes a screenshot, and saves a debug file.
 * @param page - The Puppeteer Page object.
 * @param htmlContent - The full HTML string for the frame.
 * @param frameName - A descriptive name for the frame (e.g., 'question').
 * @param debugDir - The directory to save debug images.
 * @returns {Promise<string>} A promise that resolves to the base64 encoded PNG image string.
 */
async function generateFrame(page: Page, htmlContent: string, frameName: string, debugDir: string): Promise<string> {
    console.log(`Generating frame: ${frameName}...`);
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.evaluate('adjustFontSizes()');
    
    // Directly get the base64 encoded string from Puppeteer
    const screenshotBase64 = await page.screenshot({ type: 'png', encoding: 'base64' });
    
    const framePath = path.join(debugDir, `${Date.now()}-frame-${frameName}.png`);
    // Save the base64 string as an image file
    await fs.writeFile(framePath, screenshotBase64, 'base64');
    console.log(`Successfully saved frame to: ${framePath}`);
    
    return `data:image/png;base64,${screenshotBase64}`;
}


/**
 * Creates video frames using Puppeteer by rendering dynamic HTML.
 * This version uses a new browser page for each frame to ensure reliability.
 * @param {object} question - The question data object.
 * @param {string} testType - The type of test (e.g., 'GRE').
 * @param {string} category - The category of the quiz (e.g., 'english').
 * @returns {Promise<string[]>} A promise that resolves to an array of base64 encoded PNG image strings.
 */
async function createOptimizedFrames(question: any, persona: string, category: string): Promise<string[]> {
  const frames: string[] = [];
  const width = 1080;
  const height = 1920;

  let browser;
  
  try {
    console.log('Launching Puppeteer for frame generation...');
    
    // Use temp directory for serverless environments  
    const debugDir = process.env.NODE_ENV === 'production' 
      ? path.join('/tmp', 'debug-frames') 
      : path.join(process.cwd(), 'debug-frames');
    await fs.mkdir(debugDir, { recursive: true });
    
    // Configure for serverless environment
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Configure browser for production vs development
    if (isProduction) {
      // Force Chromium to use /tmp directory in Vercel
      process.env.PUPPETEER_CACHE_DIR = '/tmp/.cache/puppeteer';
      process.env.XDG_CACHE_HOME = '/tmp';
      
      browser = await puppeteer.launch({
        headless: true,
        args: chromium.args,
        executablePath: await chromium.executablePath(),
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security'
        ]
      });
    }

    // Helper function to escape HTML special characters
    const escapeHtml = (text: string | undefined | null) => {
        if (text === null || typeof text === 'undefined') return '';
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/`/g, "&#96;");
    };

    // Normalize and escape data
    let options = question?.options || {};
    if (Array.isArray(options)) {
      options = { A: options[0], B: options[1], C: options[2], D: options[3] };
    }
    const correctAnswer = question?.answer || 'A';

    const escapedQuestionText = escapeHtml(question?.question);
    const escapedExplanationText = escapeHtml(question?.explanation);
    const escapedOptions = {
        A: escapeHtml(options.A), B: escapeHtml(options.B),
        C: escapeHtml(options.C), D: escapeHtml(options.D),
    };

    // Common head with styling
    const commonHead = `
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${width}px; height: ${height}px; font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #FF6FD8 0%, #3813C2 50%, #2E8BFD 100%);
            color: white; display: flex; flex-direction: column; justify-content: center;
            align-items: center; padding: 40px; text-align: center;
          }
          .question { font-size: 24px; margin-bottom: 30px; }
          .options { font-size: 20px; margin: 20px 0; }
          .option { margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 10px; }
          .correct { background: linear-gradient(90deg, #38E54D, #1FAA59) !important; }
          .explanation { font-size: 18px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 15px; }
        </style>
      </head>
    `;

    const frames = [];

    // Frame 1: Question
    const page1 = await browser.newPage();
    await page1.setViewport({ width, height });
    await page1.setContent(`<!DOCTYPE html><html>${commonHead}<body>
      <div class="question">${escapedQuestionText || 'Sample Question'}</div>
      <div class="options">
        <div class="option">A) ${escapedOptions.A || 'Option A'}</div>
        <div class="option">B) ${escapedOptions.B || 'Option B'}</div>
        <div class="option">C) ${escapedOptions.C || 'Option C'}</div>
        <div class="option">D) ${escapedOptions.D || 'Option D'}</div>
      </div>
    </body></html>`);
    
    const frame1 = await page1.screenshot({ type: 'png', encoding: 'base64' });
    frames.push(`data:image/png;base64,${frame1}`);
    await page1.close();

    // Frame 2: Answer
    const page2 = await browser.newPage();
    await page2.setViewport({ width, height });
    await page2.setContent(`<!DOCTYPE html><html>${commonHead}<body>
      <div class="question">${escapedQuestionText || 'Sample Question'}</div>
      <div class="options">
        <div class="option ${correctAnswer === 'A' ? 'correct' : ''}">A) ${escapedOptions.A || 'Option A'}</div>
        <div class="option ${correctAnswer === 'B' ? 'correct' : ''}">B) ${escapedOptions.B || 'Option B'}</div>
        <div class="option ${correctAnswer === 'C' ? 'correct' : ''}">C) ${escapedOptions.C || 'Option C'}</div>
        <div class="option ${correctAnswer === 'D' ? 'correct' : ''}">D) ${escapedOptions.D || 'Option D'}</div>
      </div>
    </body></html>`);
    
    const frame2 = await page2.screenshot({ type: 'png', encoding: 'base64' });
    frames.push(`data:image/png;base64,${frame2}`);
    await page2.close();

    // Frame 3: Explanation
    const page3 = await browser.newPage();
    await page3.setViewport({ width, height });
    await page3.setContent(`<!DOCTYPE html><html>${commonHead}<body>
      <div class="explanation">${escapedExplanationText || 'Sample explanation text.'}</div>
    </body></html>`);
    
    const frame3 = await page3.screenshot({ type: 'png', encoding: 'base64' });
    frames.push(`data:image/png;base64,${frame3}`);
    await page3.close();

    console.log(`Successfully created ${frames.length} frames.`);
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

