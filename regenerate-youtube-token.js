require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function regenerateRefreshToken() {
  console.log('🔄 Regenerating YouTube refresh token with playlist permissions...\n');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
      : 'http://localhost:3000/api/auth/callback/google'
  );

  // The scopes we need for full YouTube functionality
  const scopes = [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ];

  // Generate the authorization URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Forces re-consent to get refresh token
  });

  console.log('📋 STEP 1: Open this URL in your browser:');
  console.log(authUrl);
  console.log('\n🔐 STEP 2: After authorizing, you\'ll be redirected to a URL.');
  console.log('Copy the "code" parameter from the redirect URL.');
  console.log('\n📝 STEP 3: Run this script again with the code:');
  console.log('node regenerate-youtube-token.js YOUR_CODE_HERE');
  console.log('\n📋 Required Scopes:');
  scopes.forEach(scope => console.log(`   ✓ ${scope}`));
  
  // If code is provided as command line argument
  const authCode = process.argv[2];
  if (authCode) {
    try {
      console.log('\n🔄 Exchanging authorization code for tokens...');
      
      const { tokens } = await oauth2Client.getToken(authCode);
      oauth2Client.setCredentials(tokens);

      console.log('\n✅ SUCCESS! New tokens generated:');
      console.log('📝 Add this to your .env.local file:');
      console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
      
      // Test the token by making a simple API call
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      
      console.log('\n🧪 Testing token with YouTube API...');
      const channelResponse = await youtube.channels.list({
        part: ['snippet'],
        mine: true
      });
      
      if (channelResponse.data.items && channelResponse.data.items.length > 0) {
        const channel = channelResponse.data.items[0];
        console.log(`✅ Token verified! Connected to channel: ${channel.snippet.title}`);
        
        // Test playlist permissions
        try {
          console.log('🧪 Testing playlist permissions...');
          const playlistResponse = await youtube.playlists.list({
            part: ['snippet'],
            mine: true,
            maxResults: 1
          });
          console.log('✅ Playlist permissions confirmed!');
        } catch (playlistError) {
          console.error('❌ Playlist permission test failed:', playlistError.message);
        }
      } else {
        console.log('⚠️  Token works but no channel found');
      }
      
    } catch (error) {
      console.error('❌ Error exchanging code for tokens:', error.message);
    }
  }
}

regenerateRefreshToken().catch(console.error);