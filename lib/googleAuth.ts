import { google } from 'googleapis';
import { getAccountConfig } from './accounts';

/**
 * Creates and configures a Google OAuth2 client for accessing YouTube APIs.
 * Now supports multi-account authentication by accepting an account ID parameter.
 * 
 * @param accountId - The account identifier to get credentials for
 * @returns An authenticated OAuth2 client instance for the specified account
 */
export async function getOAuth2Client(accountId: string) {
  const accountConfig = await getAccountConfig(accountId);
  
  const oauth2Client = new google.auth.OAuth2(
    accountConfig.googleClientId,
    accountConfig.googleClientSecret,
    // This redirect URI is required for the OAuth flow but not directly used in the server-to-server cron job.
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );

  // Set the credentials from the account configuration to allow the client to refresh access tokens.
  oauth2Client.setCredentials({
    refresh_token: accountConfig.refreshToken,
  });

  return oauth2Client;
}

