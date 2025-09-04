import { accountService, type Account } from './accountService';

export interface AccountConfig {
  id: string;
  name: string;
  googleClientId: string;
  googleClientSecret: string;
  refreshToken: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  personas: string[];
  branding: {
    theme: string;
    audience: string;
    tone: string;
  };
}

// Legacy fallback configuration (only used if database is not available)
const FALLBACK_ACCOUNTS: Record<string, AccountConfig> = {
  english_shots: {
    id: 'english_shots',
    name: 'English Shots',
    googleClientId: process.env.ENGLISH_GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.ENGLISH_GOOGLE_CLIENT_SECRET || '',
    refreshToken: process.env.ENGLISH_GOOGLE_REFRESH_TOKEN || '',
    cloudinaryCloudName: process.env.ENGLISH_CLOUDINARY_CLOUD_NAME || '',
    cloudinaryApiKey: process.env.ENGLISH_CLOUDINARY_API_KEY || '',
    cloudinaryApiSecret: process.env.ENGLISH_CLOUDINARY_API_SECRET || '',
    personas: ['english_vocab_builder'],
    branding: {
      theme: 'educational',
      audience: 'english-learners',
      tone: 'professional-friendly'
    }
  },
  health_shots: {
    id: 'health_shots',
    name: 'Health Shots',
    googleClientId: process.env.HEALTH_GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.HEALTH_GOOGLE_CLIENT_SECRET || '',
    refreshToken: process.env.HEALTH_GOOGLE_REFRESH_TOKEN || '',
    cloudinaryCloudName: process.env.HEALTH_CLOUDINARY_CLOUD_NAME || '',
    cloudinaryApiKey: process.env.HEALTH_CLOUDINARY_API_KEY || '',
    cloudinaryApiSecret: process.env.HEALTH_CLOUDINARY_API_SECRET || '',
    personas: ['brain_health_tips', 'eye_health_tips'],
    branding: {
      theme: 'wellness',
      audience: 'health-conscious',
      tone: 'caring-expert'
    }
  }
};

// Convert Account to AccountConfig format
function accountToAccountConfig(account: Account): AccountConfig {
  return {
    id: account.id,
    name: account.name,
    googleClientId: account.googleClientId,
    googleClientSecret: account.googleClientSecret,
    refreshToken: account.refreshToken,
    cloudinaryCloudName: account.cloudinaryCloudName,
    cloudinaryApiKey: account.cloudinaryApiKey,
    cloudinaryApiSecret: account.cloudinaryApiSecret,
    personas: account.personas,
    branding: account.branding
  };
}

export async function getAccountConfig(accountId: string): Promise<AccountConfig> {
  const callId = Math.random().toString(36).substring(2, 8);
  console.log(`[getAccountConfig:${callId}] Attempting to fetch account: ${accountId}`);
  try {
    const account = await accountService.getAccount(accountId);
    console.log(`[getAccountConfig:${callId}] Database query result for ${accountId}:`, account ? 'Found' : 'Not found');
    if (account) {
      const config = accountToAccountConfig(account);
      console.log(`[getAccountConfig:${callId}] Successfully converted to config. Personas: ${config.personas?.join(', ')}`);
      return config;
    }
  } catch (error) {
    console.error(`[getAccountConfig:${callId}] Failed to fetch account ${accountId} from database, falling back to environment variables:`, error);
  }

  // Fallback to environment variables
  console.log(`[getAccountConfig:${callId}] Using fallback environment variables for ${accountId}`);
  const config = FALLBACK_ACCOUNTS[accountId];
  if (!config) {
    throw new Error(`Account configuration not found for: ${accountId}`);
  }
  console.log(`[getAccountConfig:${callId}] Fallback config personas: ${config.personas?.join(', ')}`);
  return config;
}

// Synchronous version for backward compatibility (uses cache if available)
export function getAccountConfigSync(accountId: string): AccountConfig {
  const config = FALLBACK_ACCOUNTS[accountId];
  if (!config) {
    throw new Error(`Account configuration not found for: ${accountId}`);
  }
  return config;
}

export async function getAccountForPersona(persona: string): Promise<AccountConfig> {
  try {
    const account = await accountService.getAccountForPersona(persona);
    if (account) {
      return accountToAccountConfig(account);
    }
  } catch (error) {
    console.error('Failed to fetch account for persona from database, falling back to environment variables:', error);
  }

  // Fallback to environment variables
  for (const account of Object.values(FALLBACK_ACCOUNTS)) {
    if (account.personas.includes(persona)) {
      return account;
    }
  }
  throw new Error(`No account found for persona: ${persona}`);
}

// Synchronous version for backward compatibility
export function getAccountForPersonaSync(persona: string): AccountConfig {
  for (const account of Object.values(FALLBACK_ACCOUNTS)) {
    if (account.personas.includes(persona)) {
      return account;
    }
  }
  throw new Error(`No account found for persona: ${persona}`);
}

export async function getAllAccounts(): Promise<AccountConfig[]> {
  try {
    const accounts = await accountService.getAllAccounts();
    return accounts.map(accountToAccountConfig);
  } catch (error) {
    console.error('Failed to fetch accounts from database, falling back to environment variables:', error);
    return Object.values(FALLBACK_ACCOUNTS);
  }
}

// Synchronous version for backward compatibility
export function getAllAccountsSync(): AccountConfig[] {
  return Object.values(FALLBACK_ACCOUNTS);
}

export async function getAccountIds(): Promise<string[]> {
  try {
    const accounts = await accountService.getAllAccounts();
    return accounts.map(account => account.id);
  } catch (error) {
    console.error('Failed to fetch account IDs from database, falling back to environment variables:', error);
    return Object.keys(FALLBACK_ACCOUNTS);
  }
}

// Synchronous version for backward compatibility
export function getAccountIdsSync(): string[] {
  return Object.keys(FALLBACK_ACCOUNTS);
}

// Export the service for direct access
export { accountService } from './accountService';