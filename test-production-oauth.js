#!/usr/bin/env node

// Test YouTube OAuth with real production domain
require('dotenv').config({ path: '.env.local' });
process.env.NODE_ENV = 'production';
process.env.NEXTAUTH_URL = 'https://youtube-playlist-uploader.vercel.app';

const { google } = require('googleapis');

async function testProductionOAuth() {
  console.log('=== Testing YouTube OAuth (Production Mode) ===\n');

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://youtube-playlist-uploader.vercel.app/api/auth/callback/google'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    console.log('1. OAuth Client: ✅ Created with production settings');
    console.log('   Client ID:', process.env.GOOGLE_CLIENT_ID);
    console.log('   Redirect URI: https://youtube-playlist-uploader.vercel.app/api/auth/callback/google');
    console.log('   Refresh Token:', process.env.GOOGLE_REFRESH_TOKEN.substring(0, 20) + '...');

    // Test token refresh
    console.log('\n2. Testing Token Refresh...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    console.log('   ✅ SUCCESS: Access token refreshed!');
    console.log('   Access Token:', credentials.access_token ? 'RECEIVED' : 'MISSING');
    console.log('   Token Type:', credentials.token_type);
    console.log('   Expires In:', credentials.expiry_date ? new Date(credentials.expiry_date) : 'Unknown');

    // Test YouTube API connection
    console.log('\n3. Testing YouTube API Connection...');
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    // Try to get channel info (basic test)
    const channelResponse = await youtube.channels.list({
      part: ['snippet'],
      mine: true
    });

    if (channelResponse.data.items && channelResponse.data.items.length > 0) {
      const channel = channelResponse.data.items[0];
      console.log('   ✅ SUCCESS: Connected to YouTube API!');
      console.log('   Channel:', channel.snippet.title);
      console.log('   Channel ID:', channel.id);
    } else {
      console.log('   ⚠️  Connected to API but no channel found');
    }

  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    
    if (error.response && error.response.data) {
      console.log('   Error Details:', JSON.stringify(error.response.data, null, 2));
    }

    if (error.message.includes('unauthorized_client')) {
      console.log('\n💡 Fix: The refresh token lacks YouTube upload scope.');
      console.log('   1. Go to OAuth Playground: https://developers.google.com/oauthplayground/');
      console.log('   2. Select scope: https://www.googleapis.com/auth/youtube.upload');
      console.log('   3. Generate new refresh token');
      console.log('   4. Make sure your OAuth client has this redirect URI:');
      console.log('      https://youtube-playlist-uploader.vercel.app/api/auth/callback/google');
    }
  }

  console.log('\n=== Test Complete ===');
}

testProductionOAuth();