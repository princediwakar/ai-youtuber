#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://aiyoutuber.vercel.app'
  : 'http://localhost:3000';

async function makeRequest(path, method = 'POST', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const lib = url.protocol === 'https:' ? https : http;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add auth header if CRON_SECRET is available
    if (process.env.CRON_SECRET) {
      headers['Authorization'] = `Bearer ${process.env.CRON_SECRET}`;
    }
    
    const bodyData = body ? JSON.stringify(body) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: headers,
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function runPipeline(accountId = 'english_shots') {
  console.log(`🚀 Starting Multi-Account Educational Quiz Pipeline for ${accountId}...\n`);

  try {
    // Step 1: Generate Quiz with account ID
    console.log(`📝 Step 1: Generating quiz questions for ${accountId}...`);
    const step1 = await makeRequest('/api/jobs/generate-quiz', 'POST', { accountId });
    console.log(`Status: ${step1.status}`);
    console.log(`Response: ${JSON.stringify(step1.data, null, 2)}\n`);

    if (step1.status !== 200) {
      throw new Error(`Step 1 failed with status ${step1.status}`);
    }

    // Step 2: Create Frames with account ID
    console.log(`🎨 Step 2: Creating video frames for ${accountId}...`);
    const step2 = await makeRequest('/api/jobs/create-frames', 'POST', { accountId });
    console.log(`Status: ${step2.status}`);
    console.log(`Response: ${JSON.stringify(step2.data, null, 2)}\n`);

    if (step2.status !== 200) {
      throw new Error(`Step 2 failed with status ${step2.status}`);
    }

    // Step 3: Assemble Video with account ID
    console.log(`🎬 Step 3: Assembling video for ${accountId}...`);
    const step3 = await makeRequest('/api/jobs/assemble-video', 'POST', { accountId });
    console.log(`Status: ${step3.status}`);
    console.log(`Response: ${JSON.stringify(step3.data, null, 2)}\n`);

    if (step3.status !== 200) {
      throw new Error(`Step 3 failed with status ${step3.status}`);
    }

    // // Step 4: Upload to YouTube with account ID
    // console.log(`📺 Step 4: Uploading to YouTube for ${accountId}...`);
    // const step4 = await makeRequest('/api/jobs/upload-quiz-videos', 'POST', { accountId });
    // console.log(`Status: ${step4.status}`);
    // console.log(`Response: ${JSON.stringify(step4.data, null, 2)}\n`);

    // if (step4.status !== 200) {
    //   throw new Error(`Step 4 failed with status ${step4.status}`);
    // }

    // console.log(`✅ Pipeline completed successfully for ${accountId}!`);

  } catch (error) {
    console.error('❌ Pipeline failed:', error.message);
    process.exit(1);
  }
}

// Define available accounts
// const ACCOUNTS = ['english_shots'];
const ACCOUNTS = ['english_shots', 'health_shots', 'ssc_shots', 'astronomy_shots'];

// Allow account ID to be passed as command line argument, or randomize by default
let accountId = process.argv[2];

if (accountId) {
  if (!ACCOUNTS.includes(accountId)) {
    console.error('❌ Invalid account ID. Use "english_shots" or "health_shots" or "ssc_shots" or "astronomy_shots"');
    process.exit(1);
  }
} else {
  // Randomize account selection
  accountId = ACCOUNTS[Math.floor(Math.random() * ACCOUNTS.length)];
  console.log(`🎲 Randomly selected account: ${accountId}\n`);
}

runPipeline(accountId);