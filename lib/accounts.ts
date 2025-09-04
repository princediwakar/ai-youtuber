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

export const ACCOUNTS: Record<string, AccountConfig> = {
  english_shots: {
    id: 'english_shots',
    name: 'English Shots',
    googleClientId: process.env.ENGLISH_GOOGLE_CLIENT_ID!,
    googleClientSecret: process.env.ENGLISH_GOOGLE_CLIENT_SECRET!,
    refreshToken: process.env.ENGLISH_GOOGLE_REFRESH_TOKEN!,
    cloudinaryCloudName: process.env.ENGLISH_CLOUDINARY_CLOUD_NAME!,
    cloudinaryApiKey: process.env.ENGLISH_CLOUDINARY_API_KEY!,
    cloudinaryApiSecret: process.env.ENGLISH_CLOUDINARY_API_SECRET!,
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
    googleClientId: process.env.HEALTH_GOOGLE_CLIENT_ID!,
    googleClientSecret: process.env.HEALTH_GOOGLE_CLIENT_SECRET!,
    refreshToken: process.env.HEALTH_GOOGLE_REFRESH_TOKEN!,
    cloudinaryCloudName: process.env.HEALTH_CLOUDINARY_CLOUD_NAME!,
    cloudinaryApiKey: process.env.HEALTH_CLOUDINARY_API_KEY!,
    cloudinaryApiSecret: process.env.HEALTH_CLOUDINARY_API_SECRET!,
    personas: ['brain_health_tips', 'eye_health_tips'],
    branding: {
      theme: 'wellness',
      audience: 'health-conscious',
      tone: 'caring-expert'
    }
  }
};

export function getAccountConfig(accountId: string): AccountConfig {
  const config = ACCOUNTS[accountId];
  if (!config) {
    throw new Error(`Account configuration not found for: ${accountId}`);
  }
  return config;
}

export function getAccountForPersona(persona: string): AccountConfig {
  for (const account of Object.values(ACCOUNTS)) {
    if (account.personas.includes(persona)) {
      return account;
    }
  }
  throw new Error(`No account found for persona: ${persona}`);
}

export function getAllAccounts(): AccountConfig[] {
  return Object.values(ACCOUNTS);
}

export function getAccountIds(): string[] {
  return Object.keys(ACCOUNTS);
}