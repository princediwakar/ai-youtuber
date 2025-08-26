#!/usr/bin/env node

// Test script to debug the upload authentication and flow
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

console.log('=== Testing Upload Flow Authentication ===\n');

// 1. Check environment variables
console.log('1. Environment Variables:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   CRON_SECRET:', process.env.CRON_SECRET ? 'SET' : 'MISSING');
console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING');
console.log('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING');
console.log('   GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? 'SET' : 'MISSING');
console.log('   NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NOT SET');

// 2. Test the exact curl command that should work locally
const cronSecret = process.env.CRON_SECRET;
console.log('\n2. Testing Local curl command:');
console.log(`curl -X POST http://localhost:3001/api/jobs/upload-quiz-videos \\`);
console.log(`  -H "Authorization: Bearer ${cronSecret}" \\`);
console.log(`  -H "Content-Type: application/json"`);

// 3. Test Google OAuth setup
console.log('\n3. Testing Google OAuth Client Setup:');
try {
  const { google } = require('googleapis');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : 'http://localhost:3000/api/auth/callback/google'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  console.log('   OAuth2 Client: ✅ Created successfully');
  console.log('   Redirect URI:', process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : 'http://localhost:3000/api/auth/callback/google');

  // Test token refresh
  oauth2Client.refreshAccessToken()
    .then(({ credentials }) => {
      console.log('   Token Refresh: ✅ Success');
      console.log('   Access Token:', credentials.access_token ? 'RECEIVED' : 'MISSING');
    })
    .catch((error) => {
      console.log('   Token Refresh: ❌ Failed');
      console.log('   Error:', error.message);
      if (error.response && error.response.data) {
        console.log('   Details:', error.response.data);
      }
    });

} catch (error) {
  console.log('   OAuth Setup: ❌ Failed');
  console.log('   Error:', error.message);
}

// 4. Check if there are any pending jobs
console.log('\n4. Checking for pending upload jobs...');
setTimeout(async () => {
  try {
    // Import database functions
    const dbPath = path.join(__dirname, 'lib', 'database.js');
    if (fs.existsSync(dbPath)) {
      const { getPendingJobs } = require('./lib/database');
      const jobs = await getPendingJobs(4, 5); // Step 4 = upload_pending
      console.log(`   Found ${jobs.length} jobs pending upload`);
      if (jobs.length > 0) {
        console.log('   Job IDs:', jobs.map(j => j.id).join(', '));
      }
    } else {
      console.log('   Database module not found, skipping job check');
    }
  } catch (error) {
    console.log('   Job check failed:', error.message);
  }
}, 2000);

console.log('\n=== Test Complete ===');
console.log('If token refresh fails, you need to regenerate your Google refresh token.');
console.log('If curl returns "Unauthorized", check the CRON_SECRET value.');