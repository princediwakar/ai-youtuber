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

// CRITICAL OPTIMIZATION: In-memory cache for fetched account configurations
const accountCache: { [accountId: string]: AccountConfig } = {};


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
  
  // 1. Check cache first for immediate return (fastest path)
  if (accountCache[accountId]) {
    console.log(`[getAccountConfig:${callId}] Cache HIT for account: ${accountId}`);
    return accountCache[accountId];
  }
  
  console.log(`[getAccountConfig:${callId}] Attempting to fetch account: ${accountId} (Cache MISS)`);
  
  const account = await accountService.getAccount(accountId);
  console.log(`[getAccountConfig:${callId}] Database query result for ${accountId}:`, account ? 'Found' : 'Not found');
  
  if (!account) {
    throw new Error(`Account configuration not found in database for: ${accountId}`);
  }
  
  const config = accountToAccountConfig(account);
  
  // 2. Store result in cache before returning
  accountCache[accountId] = config;
  
  console.log(`[getAccountConfig:${callId}] Successfully converted and CACHED config. Personas: ${config.personas?.join(', ')}`);
  return config;
}

// Synchronous version - deprecated, use async version instead
export function getAccountConfigSync(accountId: string): AccountConfig {
  throw new Error(`getAccountConfigSync is deprecated. Use getAccountConfig (async) instead for account: ${accountId}`);
}

export async function getAccountForPersona(persona: string): Promise<AccountConfig> {
  // NOTE: This function inherently requires a DB lookup unless you cache by Persona as well,
  // which is more complex. We only optimize the core getAccountConfig path.
  const account = await accountService.getAccountForPersona(persona);
  
  if (!account) {
    throw new Error(`No account found in database for persona: ${persona}`);
  }
  
  const config = accountToAccountConfig(account);
  // Cache the result by accountId in case the accountId is requested later directly
  accountCache[config.id] = config; 
  
  return config;
}

// Synchronous version - deprecated, use async version instead
export function getAccountForPersonaSync(persona: string): AccountConfig {
  throw new Error(`getAccountForPersonaSync is deprecated. Use getAccountForPersona (async) instead for persona: ${persona}`);
}

export async function getAllAccounts(): Promise<AccountConfig[]> {
  const accounts = await accountService.getAllAccounts();
  const configs = accounts.map(accountToAccountConfig);

  // Cache all fetched accounts
  configs.forEach(config => {
      accountCache[config.id] = config;
  });

  return configs;
}

// Synchronous version - deprecated, use async version instead
export function getAllAccountsSync(): AccountConfig[] {
  throw new Error(`getAllAccountsSync is deprecated. Use getAllAccounts (async) instead`);
}

export async function getAccountIds(): Promise<string[]> {
  const accounts = await accountService.getAllAccounts();
  return accounts.map(account => account.id);
}

// Synchronous version - deprecated, use async version instead
export function getAccountIdsSync(): string[] {
  throw new Error(`getAccountIdsSync is deprecated. Use getAccountIds (async) instead`);
}

// Export the service for direct access
export { accountService } from './accountService';
