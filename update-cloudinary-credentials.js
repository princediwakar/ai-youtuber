require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');
const { Client } = require('pg');

// Encryption configuration - use same key as accountService.ts
const SECRET_KEY = process.env.NEXTAUTH_SECRET;
const algorithm = 'aes-256-gcm';

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_iTD3xcFj2WPX@ep-lucky-smoke-ad12pllj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

function encrypt(text) {
  if (!SECRET_KEY) throw new Error('NEXTAUTH_SECRET not found');
  
  // Create a 32-byte key for AES-256 using scrypt (same as accountService)
  const encryptionKey = crypto.scryptSync(SECRET_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  // Return: iv:authTag:encrypted (same format as accountService)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Complete credentials for each account (Cloudinary + Google OAuth)
const accountCredentials = {
  astronomy_shots: {
    // Cloudinary
    cloudinaryCloudName: 'dtrtklw3v',
    cloudinaryApiKey: '557542266167892',
    cloudinaryApiSecret: 'tBoowvLneWsapzbAiNnOKbt-fu4',
    // Google OAuth - UNIQUE ASTRONOMY CHANNEL CREDENTIALS:
    googleClientId: '723631950513-b1maeeilno44gpd7hm3sfsrj5i78dpju.apps.googleusercontent.com',
    googleClientSecret: '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',
    refreshToken: '1//04CctyU8vCT5KCgYIARAAGAQSNwF-L9IrtjGtQy1MxpoVIGD459LrmrAarnhw7jvP4P1Bkie9o1lVttqxTnjNMdFEzLIajD0gDcA'
  },
  health_shots: {
    // Cloudinary
    cloudinaryCloudName: 'dsvuqcxgy',
    cloudinaryApiKey: '525224711855931',
    cloudinaryApiSecret: 'pss9UT7CYX4H8j6RDtUWRLB9834',
    // Google OAuth - UNIQUE HEALTH CHANNEL CREDENTIALS:
    googleClientId: '553520473791-s43evk5gf6khoqdqj7d6tnjnv257ueq8.apps.googleusercontent.com',
    googleClientSecret: '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',
    refreshToken: '1//04XXUe-swzWXxCgYIARAAGAQSNwF-L9Irr0FotuFpW2vV9G_AbTEuTLdlW4tLZTxQ627Hf8rDoLlyA4k1XAkWkWFLjudOd97Nie0'
  },
  english_shots: {
    // Cloudinary
    cloudinaryCloudName: 'dnyivzi71',
    cloudinaryApiKey: '867286887969697',
    cloudinaryApiSecret: 'cW8hX2Svhk6Q2s-tVSrH_qB9V-8',
    // Google OAuth - FROM .env.production (need to be re-encrypted with ENCRYPTION_KEY):
    googleClientId: '841911259733-p7kbb8rbsc49s7j64cndir1cv0dsr32f.apps.googleusercontent.com',
    googleClientSecret: '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',
    refreshToken: '1//04yQactu4ORTmCgYIARAAGAQSNwF-L9IrOMzuisq5jop4prwRLUrcoeXvC-ckcgGDosL0fyCnJUY7YLOJXgWmcnkrNYgiflyX6D4'
  },
  ssc_shots: {
    // Cloudinary
    cloudinaryCloudName: 'dnoembucx',
    cloudinaryApiKey: '169965452824116',
    cloudinaryApiSecret: 'C43ifD1qG_rog4mfTdWNPOzoGBI',
    // Google OAuth - UNIQUE SSC CHANNEL CREDENTIALS:
    googleClientId: '222506534660-cqhh69555p52ckijg26cbgsb54kffe95.apps.googleusercontent.com',
    googleClientSecret: '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',
    refreshToken: '1//04dZGucYrFoIGCgYIARAAGAQSNwF-L9IrDUKXyeRxkn5m8oYQ2wpWynw2stV-3VVw_MdF0cB6UsxLceNQzFvNicx2TcIDDsUZz4I'
  }
};

async function updateAccountCredentials() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    for (const [accountId, credentials] of Object.entries(accountCredentials)) {
      console.log(`\n📝 Updating all credentials for: ${accountId}`);

      // Encrypt Cloudinary credentials
      const encryptedCloudName = encrypt(credentials.cloudinaryCloudName);
      const encryptedApiKey = encrypt(credentials.cloudinaryApiKey);
      const encryptedApiSecret = encrypt(credentials.cloudinaryApiSecret);

      // Encrypt Google OAuth credentials (if provided)
      let encryptedGoogleClientId = null;
      let encryptedGoogleClientSecret = null;
      let encryptedRefreshToken = null;

      if (credentials.googleClientId) {
        encryptedGoogleClientId = encrypt(credentials.googleClientId);
      }
      if (credentials.googleClientSecret) {
        encryptedGoogleClientSecret = encrypt(credentials.googleClientSecret);
      }
      if (credentials.refreshToken) {
        encryptedRefreshToken = encrypt(credentials.refreshToken);
      }

      // Build update query based on what credentials are provided
      let updateQuery = `
        UPDATE accounts 
        SET 
          cloudinary_cloud_name_encrypted = $1,
          cloudinary_api_key_encrypted = $2,
          cloudinary_api_secret_encrypted = $3,
          updated_at = NOW()
      `;
      let params = [encryptedCloudName, encryptedApiKey, encryptedApiSecret];
      let paramIndex = 4;

      if (encryptedGoogleClientId) {
        updateQuery += `, google_client_id_encrypted = $${paramIndex}`;
        params.push(encryptedGoogleClientId);
        paramIndex++;
      }
      if (encryptedGoogleClientSecret) {
        updateQuery += `, google_client_secret_encrypted = $${paramIndex}`;
        params.push(encryptedGoogleClientSecret);
        paramIndex++;
      }
      if (encryptedRefreshToken) {
        updateQuery += `, refresh_token_encrypted = $${paramIndex}`;
        params.push(encryptedRefreshToken);
        paramIndex++;
      }

      updateQuery += ` WHERE id = $${paramIndex}`;
      params.push(accountId);

      const result = await client.query(updateQuery, params);

      if (result.rowCount > 0) {
        console.log(`✅ Updated ${accountId} successfully`);
        console.log(`   - Cloudinary: ✅`);
        console.log(`   - Google OAuth: ${encryptedGoogleClientId ? '✅' : '⚠️  (not provided)'}`);
      } else {
        console.log(`⚠️  Account ${accountId} not found or no changes made`);
      }
    }

    console.log('\n🎉 All account credentials updated successfully!');

  } catch (error) {
    console.error('❌ Error updating credentials:', error);
  } finally {
    await client.end();
  }
}

// Run the update
updateAccountCredentials();