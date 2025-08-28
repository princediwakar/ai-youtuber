import { google } from 'googleapis';

/**
 * Creates and configures a Google OAuth2 client for accessing YouTube APIs.
 * It uses the refresh token from environment variables to authenticate.
 * @returns An authenticated OAuth2 client instance.
 */
export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // This redirect URI is required for the OAuth flow but not directly used in the server-to-server cron job.
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );

  // Set the credentials from the environment variable to allow the client to refresh access tokens.
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
}
