#!/usr/bin/env node

/**
 * Script to populate accounts table with data from environment variables
 * Run this script after running the database migration to set up initial account data
 */
require('dotenv').config({ path: '.env.local' });
const { accountService } = require('./lib/accountService');

async function populateAccounts() {
  console.log('🚀 Starting account population from environment variables...');
  
  try {
    // Define account data from environment variables
    const accounts = [
      {
        id: 'english_shots',
        name: 'English Shots',
        status: 'active',
        googleClientId: process.env.ENGLISH_GOOGLE_CLIENT_ID,
        googleClientSecret: process.env.ENGLISH_GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.ENGLISH_GOOGLE_REFRESH_TOKEN,
        cloudinaryCloudName: process.env.ENGLISH_CLOUDINARY_CLOUD_NAME,
        cloudinaryApiKey: process.env.ENGLISH_CLOUDINARY_API_KEY,
        cloudinaryApiSecret: process.env.ENGLISH_CLOUDINARY_API_SECRET,
        personas: ['english_vocab_builder'],
        branding: {
          theme: 'educational',
          audience: 'english-learners',
          tone: 'professional-friendly'
        }
      },
      {
        id: 'health_shots',
        name: 'Health Shots',
        status: 'active',
        googleClientId: process.env.HEALTH_GOOGLE_CLIENT_ID,
        googleClientSecret: process.env.HEALTH_GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.HEALTH_GOOGLE_REFRESH_TOKEN,
        cloudinaryCloudName: process.env.HEALTH_CLOUDINARY_CLOUD_NAME,
        cloudinaryApiKey: process.env.HEALTH_CLOUDINARY_API_KEY,
        cloudinaryApiSecret: process.env.HEALTH_CLOUDINARY_API_SECRET,
        personas: ['brain_health_tips', 'eye_health_tips'],
        branding: {
          theme: 'wellness',
          audience: 'health-conscious',
          tone: 'caring-expert'
        }
      },
      {
        id: 'ssc_shots',
        name: 'SSC Exam Preparation',
        status: 'active',
        googleClientId: process.env.SSC_GOOGLE_CLIENT_ID,
        googleClientSecret: process.env.SSC_GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.SSC_GOOGLE_REFRESH_TOKEN,
        cloudinaryCloudName: process.env.SSC_CLOUDINARY_CLOUD_NAME,
        cloudinaryApiKey: process.env.SSC_CLOUDINARY_API_KEY,
        cloudinaryApiSecret: process.env.SSC_CLOUDINARY_API_SECRET,
        personas: ['ssc_shots'],
        branding: { theme: 'professional', audience: 'students', tone: 'academic' },
      },
      {
        id: 'astronomy_shots',
        name: 'Space Facts & Astronomy',
        status: 'active',
        googleClientId: process.env.ASTRONOMY_GOOGLE_CLIENT_ID,
        googleClientSecret: process.env.ASTRONOMY_GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.ASTRONOMY_GOOGLE_REFRESH_TOKEN,
        cloudinaryCloudName: process.env.ASTRONOMY_CLOUDINARY_CLOUD_NAME,
        cloudinaryApiKey: process.env.ASTRONOMY_CLOUDINARY_API_KEY,
        cloudinaryApiSecret: process.env.ASTRONOMY_CLOUDINARY_API_SECRET,
        personas: ['space_facts_quiz'],
        branding: { theme: 'dark', audience: 'enthusiasts', tone: 'awe-inspiring' },
      },
    ];

    let successCount = 0;
    let skipCount = 0;

    for (const accountData of accounts) {
      console.log(`\n📝 Processing account: ${accountData.name} (${accountData.id})`);
      
      // Validate required environment variables
      const requiredFields = [
        'googleClientId', 'googleClientSecret', 'refreshToken',
        'cloudinaryCloudName', 'cloudinaryApiKey', 'cloudinaryApiSecret'
      ];
      
      const missingFields = requiredFields.filter(field => !accountData[field]);
      
      if (missingFields.length > 0) {
        console.log(`❌ Missing required environment variables for ${accountData.id}:`);
        missingFields.forEach(field => {
          const envVar = field.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase();
          const prefix = accountData.id === 'english_shots' ? 'ENGLISH' : 'HEALTH';
          console.log(`   - ${prefix}${envVar}`);
        });
        console.log(`   Skipping ${accountData.id}...`);
        skipCount++;
        continue;
      }

      try {
        // Check if account already exists
        const existingAccount = await accountService.getAccount(accountData.id);
        if (existingAccount) {
          console.log(`⚠️  Account ${accountData.id} already exists. Updating credentials...`);
          await accountService.updateAccount(accountData.id, {
            googleClientId: accountData.googleClientId,
            googleClientSecret: accountData.googleClientSecret,
            refreshToken: accountData.refreshToken,
            cloudinaryCloudName: accountData.cloudinaryCloudName,
            cloudinaryApiKey: accountData.cloudinaryApiKey,
            cloudinaryApiSecret: accountData.cloudinaryApiSecret,
            personas: accountData.personas,
            branding: accountData.branding
          });
          console.log(`✅ Updated account: ${accountData.name}`);
        } else {
          // Create new account
          await accountService.createAccount(accountData);
          console.log(`✅ Created account: ${accountData.name}`);
        }
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to process account ${accountData.id}:`, error.message);
      }
    }

    console.log(`\n🎉 Account population completed!`);
    console.log(`   ✅ Processed: ${successCount} accounts`);
    console.log(`   ⚠️  Skipped: ${skipCount} accounts (missing env vars)`);
    
    if (successCount > 0) {
      console.log(`\n📋 Next steps:`);
      console.log(`   1. Verify accounts in your database`);
      console.log(`   2. Run the migration to update existing quiz_jobs with account_id`);
      console.log(`   3. Test the application with the new account system`);
      console.log(`\n💡 You can now manage accounts through the database instead of environment variables!`);
    }
    
  } catch (error) {
    console.error('❌ Failed to populate accounts:', error);
    process.exit(1);
  }
}

// Check for required environment variables
const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease set these variables and try again.');
  process.exit(1);
}

// Load environment variables from .env.local if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  // dotenv not available or no .env.local file - that's okay
}

// Run the population
populateAccounts();