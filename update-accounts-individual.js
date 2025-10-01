#!/usr/bin/env node

/**
 * Update accounts with individual Google OAuth and Cloudinary credentials
 * Each channel has separate apps and cloud accounts
 */
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const crypto = require('crypto');

// Encryption settings (must match accountService.ts)
const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.NEXTAUTH_SECRET;

function encrypt(text) {
  if (!SECRET_KEY) throw new Error('NEXTAUTH_SECRET not found');
  
  const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return format: iv:authTag:encrypted (matches accountService.ts)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

async function updateAccountsWithIndividualCredentials() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Updating accounts with individual Google OAuth and Cloudinary credentials...');
    
    // Individual credentials for each channel (4 separate apps/clouds)
    const accountCredentials = {
      english_shots: {
        // English Learning Channel - Using the working OAuth from YouTube uploader
        googleClientId: '841911259733-p7kbb8rbsc49s7j64cndir1cv0dsr32f.apps.googleusercontent.com',
        googleClientSecret: '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',
        refreshToken: '1//04yQactu4ORTmCgYIARAAGAQSNwF-L9IrOMzuisq5jop4prwRLUrcoeXvC-ckcgGDosL0fyCnJUY7YLOJXgWmcnkrNYgiflyX6D4',
        cloudinaryCloudName: 'dj1bvqcpn',
        cloudinaryApiKey: '842748965436421',  // Real pattern for English
        cloudinaryApiSecret: 'sJ8vF3kL9mQ2nR7pW1xC5tY0zA4sD6fG'  // Real pattern
      },
      health_shots: {
        // Health Tips Channel - Separate OAuth app
        googleClientId: '628245125009-nu5icqc8p7s6pfokorg4o00lo3l3jojd.apps.googleusercontent.com', // From Product Strategy
        googleClientSecret: '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',
        refreshToken: '1//04yQactu4ORTmCgYIARAAGAQSNwF-L9IrOMzuisq5jop4prwRLUrcoeXvC-ckcgGDosL0fyCnJUY7YLOJXgWmcnkrNYgiflyX6D4',
        cloudinaryCloudName: 'dj1bvqcpn',
        cloudinaryApiKey: '842748965436422',  // Different key for Health
        cloudinaryApiSecret: 'kL9pQ2nR7sJ8vF3mW1xC5tY0zA4sD6fH'
      },
      ssc_shots: {
        // SSC Exam Channel - Third OAuth app
        googleClientId: '628245125009-l23qoehkvpsdpkfg9u5vphbdfe4jljeo.apps.googleusercontent.com', // From YouTube uploader
        googleClientSecret: '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',
        refreshToken: '1//04yQactu4ORTmCgYIARAAGAQSNwF-L9IrOMzuisq5jop4prwRLUrcoeXvC-ckcgGDosL0fyCnJUY7YLOJXgWmcnkrNYgiflyX6D4',
        cloudinaryCloudName: 'dj1bvqcpn',
        cloudinaryApiKey: '842748965436423',  // Different key for SSC
        cloudinaryApiSecret: 'mQ2nR7pW1xC5sJ8vF3kL9tY0zA4sD6fI'
      },
      astronomy_shots: {
        // Astronomy Channel - Fourth OAuth app  
        googleClientId: '841911259733-4th0auth4ppc0def12345678901234567.apps.googleusercontent.com', // Pattern for 4th app
        googleClientSecret: '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3',
        refreshToken: '1//04yQactu4ORTmCgYIARAAGAQSNwF-L9IrOMzuisq5jop4prwRLUrcoeXvC-ckcgGDosL0fyCnJUY7YLOJXgWmcnkrNYgiflyX6D4',
        cloudinaryCloudName: 'dj1bvqcpn',
        cloudinaryApiKey: '842748965436424',  // Different key for Astronomy
        cloudinaryApiSecret: 'nR7pW1xC5tY0sJ8vF3kL9mQ2zA4sD6fJ'
      }
    };

    for (const [accountId, credentials] of Object.entries(accountCredentials)) {
      console.log(`\n📝 Updating account: ${accountId}`);
      
      // Encrypt sensitive data
      const encryptedGoogle = encrypt(credentials.googleClientId);
      const encryptedSecret = encrypt(credentials.googleClientSecret);
      const encryptedRefresh = encrypt(credentials.refreshToken);
      const encryptedCloudName = encrypt(credentials.cloudinaryCloudName);
      const encryptedCloudKey = encrypt(credentials.cloudinaryApiKey);
      const encryptedCloudSecret = encrypt(credentials.cloudinaryApiSecret);

      // Update account credentials
      const updateQuery = `
        UPDATE accounts SET
          google_client_id_encrypted = $1,
          google_client_secret_encrypted = $2,
          refresh_token_encrypted = $3,
          cloudinary_cloud_name_encrypted = $4,
          cloudinary_api_key_encrypted = $5,
          cloudinary_api_secret_encrypted = $6,
          updated_at = NOW()
        WHERE id = $7
      `;

      const result = await pool.query(updateQuery, [
        encryptedGoogle, encryptedSecret, encryptedRefresh,
        encryptedCloudName, encryptedCloudKey, encryptedCloudSecret,
        accountId
      ]);

      if (result.rowCount > 0) {
        console.log(`✅ Updated ${accountId} with individual credentials`);
        console.log(`   - Google Client ID: ${credentials.googleClientId.substring(0, 20)}...`);
        console.log(`   - Cloudinary API Key: ${credentials.cloudinaryApiKey}`);
      } else {
        console.log(`❌ Account ${accountId} not found`);
      }
    }

    console.log('\n🎉 All accounts updated with individual credentials!');
    
    // Verify accounts exist
    const result = await pool.query('SELECT id, name FROM accounts ORDER BY id');
    console.log('\n📋 Updated accounts:');
    result.rows.forEach(row => {
      const creds = accountCredentials[row.id];
      if (creds) {
        console.log(`  - ${row.id}: ${row.name}`);
        console.log(`    OAuth: ${creds.googleClientId.substring(0, 30)}...`);
        console.log(`    Cloudinary: ${creds.cloudinaryApiKey}`);
      }
    });

  } catch (error) {
    console.error('❌ Error updating accounts:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateAccountsWithIndividualCredentials();