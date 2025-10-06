#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import { accountService, type Account } from '../lib/accountService';

// Explicitly load environment variables from the .env.local file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });


// All Account Data is Centralized Here
const accountsToSeed: Omit<Account, 'createdAt' | 'updatedAt' | 'status'>[] = [
  {
    id: 'english_shots',
    name: 'English Learning Channel',
    googleClientId: "841911259733-p7kbb8rbsc49s7j64cndir1cv0dsr32f.apps.googleusercontent.com",
    googleClientSecret: "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",
    refreshToken: "1//04yQactu4ORTmCgYIARAAGAQSNwF-L9IrOMzuisq5jop4prwRLUrcoeXvC-ckcgGDosL0fyCnJUY7YLOJXgWmcnkrNYgiflyX6D4",
    cloudinaryCloudName: "dnyivzi71",
    cloudinaryApiKey: "867286887969697",
    cloudinaryApiSecret: "cW8hX2Svhk6Q2s-tVSrH_qB9V-8",
    personas: ['english_vocab_builder'],
    branding: { theme: 'light', audience: 'learners', tone: 'encouraging' },
  },
  {
    id: 'health_shots',
    name: 'Health Tips Channel',
    googleClientId: "553520473791-s43evk5gf6khoqdqj7d6tnjnv257ueq8.apps.googleusercontent.com",
    googleClientSecret: "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",
    refreshToken: "1//04XXUe-swzWXxCgYIARAAGAQSNwF-L9Irr0FotuFpW2vV9G_AbTEuTLdlW4tLZTxQ627Hf8rDoLlyA4k1XAkWkWFLjudOd97Nie0",
    cloudinaryCloudName: "dsvuqcxgy",
    cloudinaryApiKey: "525224711855931",
    cloudinaryApiSecret: "pss9UT7CYX4H8j6RDtUWRLB9834",
    personas: ['brain_health_tips', 'eye_health_tips'],
    branding: { theme: 'clean', audience: 'health-conscious', tone: 'informative' },
  },
  {
    id: 'ssc_shots',
    name: 'SSC Exam Preparation',
    googleClientId: "222506534660-cqhh69555p52ckijg26cbgsb54kffe95.apps.googleusercontent.com",
    googleClientSecret: "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",
    refreshToken: "1//04dZGucYrFoIGCgYIARAAGAQSNwF-L9IrDUKXyeRxkn5m8oYQ2wpWynw2stV-3VVw_MdF0cB6UsxLceNQzFvNicx2TcIDDsUZz4I",
    cloudinaryCloudName: "dnoembucx",
    cloudinaryApiKey: "169965452824116",
    cloudinaryApiSecret: "C43ifD1qG_rog4mfTdWNPOzoGBI",
    personas: ['ssc_shots'],
    branding: { theme: 'professional', audience: 'students', tone: 'academic' },
  },
  {
    id: 'astronomy_shots',
    name: 'Space Facts & Astronomy',
    googleClientId: "723631950513-b1maeeilno44gpd7hm3sfsrj5i78dpju.apps.googleusercontent.com",
    googleClientSecret: "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",
    refreshToken: "1//04CctyU8vCT5KCgYIARAAGAQSNwF-L9IrtjGtQy1MxpoVIGD459LrmrAarnhw7jvP4P1Bkie9o1lVttqxTnjNMdFEzLIajD0gDcA",
    cloudinaryCloudName: "dtrtklw3v",
    cloudinaryApiKey: "557542266167892",
    cloudinaryApiSecret: "tBoowvLneWsapzbAiNnOKbt-fu4",
    personas: ['space_facts_quiz'],
    branding: { theme: 'dark', audience: 'enthusiasts', tone: 'awe-inspiring' },
  },
];

async function seedDatabase() {
  console.log('🌱 Starting to seed the database...');
  for (const accountData of accountsToSeed) {
    try {
      const existing = await accountService.getAccount(accountData.id);
      if (existing) {
        console.log(`- Account "${accountData.id}" already exists. Skipping creation.`);
      } else {
        await accountService.createAccount({ ...accountData, status: 'active' });
        console.log(`✅ Created account: ${accountData.id}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process account ${accountData.id}:`, error);
    }
  }
  console.log('🌲 Seeding complete.');
}

async function updateRefreshToken(accountId: string, newRefreshToken: string) {
    if (!accountId || !newRefreshToken) {
        console.error('Usage: tsx scripts/seedAccounts.ts update <accountId> <newRefreshToken>');
        return;
    }
    
    console.log(`🔄 Attempting to update refresh token for account: ${accountId}`);
    try {
        const account = await accountService.getAccount(accountId);
        if (!account) {
            console.error(`❌ Account "${accountId}" not found.`);
            return;
        }
        
        await accountService.updateAccount(accountId, { refreshToken: newRefreshToken });
        console.log(`✅ Successfully updated refresh token for ${accountId}.`);

    } catch (error) {
        console.error(`❌ Failed to update refresh token for ${accountId}:`, error);
    }
}


async function main() {
    const command = process.argv[2];
    const accountId = process.argv[3];
    const newRefreshToken = process.argv[4];

    if (command === 'update') {
        await updateRefreshToken(accountId, newRefreshToken);
    } else if (command === 'seed') {
        await seedDatabase();
    } else {
        console.log('Usage:');
        console.log('  - To seed all accounts: tsx scripts/seedAccounts.ts seed');
        console.log('  - To update a refresh token: tsx scripts/seedAccounts.ts update <accountId> <newRefreshToken>');
    }
}

main().catch(console.error);

