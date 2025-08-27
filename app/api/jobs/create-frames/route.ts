import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, updateJob } from '@/lib/database';
import puppeteer, { Page } from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import chromium from '@sparticuz/chromium';

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
    
    browser = await puppeteer.launch({
      headless: true,
      args: isProduction 
        ? chromium.args.concat([
            '--no-sandbox',
            '--disable-setuid-sandbox', 
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ])
        : [
            '--no-sandbox',
            '--disable-setuid-sandbox', 
            '--disable-web-security'
          ],
      executablePath: isProduction ? await chromium.executablePath() : undefined,
    });

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

    // --- Common Head with Dynamic Font Sizing Script ---
    const commonHead = `
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --bg-gradient: linear-gradient(135deg, #FF6FD8 0%, #3813C2 50%, #2E8BFD 100%);
            --card-bg: rgba(255, 255, 255, 0.15);
            --text-light: #ffffff;
            --correct-gradient: linear-gradient(90deg, #38E54D, #1FAA59);
            --radius: 25px;
            --padding-container: 60px;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${width}px; height: ${height}px; font-family: 'Inter', sans-serif;
            background: var(--bg-gradient); color: var(--text-light);
            display: flex; flex-direction: column; justify-content: space-between;
            align-items: center; padding: 40px; overflow: hidden;
          }
          .header-label, .footer-label { font-family: 'Poppins', sans-serif; font-weight: 700; flex-shrink: 0; }
          .header-label {
            font-size: 2rem; text-transform: uppercase; letter-spacing: 3px;
            background: var(--card-bg); border-radius: var(--radius);
            padding: 20px 40px; backdrop-filter: blur(10px);
          }
          .footer-label {
            font-size: 1.5rem; background: linear-gradient(90deg, #FF6FD8, #2E8BFD);
            border-radius: 999px; padding: 15px 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
          }
          .content-container {
            flex-grow: 1; display: flex; flex-direction: column;
            justify-content: space-evenly; align-items: center;
            width: 100%; padding: 20px var(--padding-container); text-align: center;
          }
          .card {
            background: none;
            backdrop-filter: none;
            box-shadow: none;
            padding: 0;
            width: 100%;
            max-width: 900px;
          }
          .title-text { font-family: 'Poppins', sans-serif; font-size: 3.5rem; font-weight: 800; margin-bottom: 40px; text-shadow: 2px 4px 12px rgba(0,0,0,0.5); }
          .question-text, .explanation-text { line-height: 1.5; font-weight: 600; }
          .options-grid { display: grid; grid-template-columns: 1fr; gap: 25px; width: 100%; max-width: 800px; }
          .option {
            background: var(--card-bg); border-radius: var(--radius); padding: 25px;
            font-size: 2.2rem; font-weight: 700; backdrop-filter: blur(8px);
            transition: all 0.3s ease; word-wrap: break-word;
            position: relative;
          }
          .option.correct { 
            background: var(--correct-gradient); 
            transform: scale(1.05); 
            box-shadow: 0 8px 20px rgba(56,229,77,0.5); 
            overflow: hidden;
          }
          .option.incorrect { opacity: 0.6; }
          .explanation-title { font-family: 'Poppins', sans-serif; font-size: 3rem; font-weight: 700; margin-bottom: 30px; color: #FFD93D; }

          .sparkle-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
          .sparkle {
            position: absolute; width: 8px; height: 8px;
            background: white; border-radius: 50%;
            box-shadow: 0 0 10px 2px #fff, 0 0 20px 5px #FFD93D;
            opacity: 1;
            transform: scale(1.5);
          }
          .sparkle:nth-child(1) { top: 20%; left: 15%; }
          .sparkle:nth-child(2) { top: 80%; left: 30%; }
          .sparkle:nth-child(3) { top: 50%; right: 20%; }
          .sparkle:nth-child(4) { top: 10%; right: 40%; }
          .sparkle:nth-child(5) { top: 90%; left: 80%; }

        </style>
        <script>
          function adjustFontSizes() {
            const adjustText = (element, maxLength, baseSize, minSize) => {
              if (!element) return;
              const textLength = element.textContent.length;
              if (textLength > maxLength) {
                const newSize = Math.max(minSize, baseSize * (maxLength / textLength));
                element.style.fontSize = \`\${newSize}rem\`;
              } else {
                element.style.fontSize = \`\${baseSize}rem\`;
              }
            };
            adjustText(document.querySelector('.question-text'), 100, 3.2, 1.8);
            adjustText(document.querySelector('.explanation-text'), 200, 2.8, 1.6);
            document.querySelectorAll('.option').forEach(opt => adjustText(opt, 25, 2.2, 1.5));
          }
        </script>
      </head>
    `;

    const sparkleHtml = `<div class="sparkle-container">
        <div class="sparkle"></div><div class="sparkle"></div>
        <div class="sparkle"></div><div class="sparkle"></div>
        <div class="sparkle"></div></div>`;

    // --- Frame 1: Question ---
    const page1 = await browser.newPage();
    await page1.setViewport({ width, height });
    const frame1Html = `<!DOCTYPE html><html>${commonHead}<body>
        <div class="header-label">${persona} - ${category}</div>
        <div class="content-container">
          <div class="card"><div class="question-text">${escapedQuestionText || 'Default Question'}</div></div>
          <div class="options-grid">
            <div class="option">A) ${escapedOptions.A || 'Opt A'}</div>
            <div class="option">B) ${escapedOptions.B || 'Opt B'}</div>
            <div class="option">C) ${escapedOptions.C || 'Opt C'}</div>
            <div class="option">D) ${escapedOptions.D || 'Opt D'}</div>
          </div>
        </div>
        <div class="footer-label">@gibbiAI</div></body></html>`;
    frames.push(await generateFrame(page1, frame1Html, 'question', debugDir));
    await page1.close();

    // --- Frame 2: Answer Reveal (with question and sparkles) ---
    const page2 = await browser.newPage();
    await page2.setViewport({ width, height });
    const frame2Html = `<!DOCTYPE html><html>${commonHead}<body>
        <div class="header-label">${persona} - ${category}</div>
        <div class="content-container">
          <div class="card"><div class="question-text">${escapedQuestionText || 'Default Question'}</div></div>
          <div class="options-grid">
            <div class="option ${correctAnswer === 'A' ? 'correct' : 'incorrect'}">A) ${escapedOptions.A || 'Opt A'} ${correctAnswer === 'A' ? sparkleHtml : ''}</div>
            <div class="option ${correctAnswer === 'B' ? 'correct' : 'incorrect'}">B) ${escapedOptions.B || 'Opt B'} ${correctAnswer === 'B' ? sparkleHtml : ''}</div>
            <div class="option ${correctAnswer === 'C' ? 'correct' : 'incorrect'}">C) ${escapedOptions.C || 'Opt C'} ${correctAnswer === 'C' ? sparkleHtml : ''}</div>
            <div class="option ${correctAnswer === 'D' ? 'correct' : 'incorrect'}">D) ${escapedOptions.D || 'Opt D'} ${correctAnswer === 'D' ? sparkleHtml : ''}</div>
          </div>
        </div>
        <div class="footer-label">@gibbiAI</div></body></html>`;
    frames.push(await generateFrame(page2, frame2Html, 'answer', debugDir));
    await page2.close();

    // --- Frame 3: Explanation ---
    const page3 = await browser.newPage();
    await page3.setViewport({ width, height });
    const frame3Html = `<!DOCTYPE html><html>${commonHead}<body>
        <div class="header-label">${persona} - ${category}</div>
        <div class="content-container">
          <div class="card">
            <div class="explanation-title">Explanation</div>
            <div class="explanation-text">${escapedExplanationText || 'Sample explanation.'}</div>
          </div>
        </div>
        <div class="footer-label">@gibbiAI</div></body></html>`;
    frames.push(await generateFrame(page3, frame3Html, 'explanation', debugDir));
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

// Configure for Vercel deployment
export const runtime = 'nodejs';
export const maxDuration = 300;
