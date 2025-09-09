import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import crypto from 'crypto';

// Encryption key - in production, use a proper key management system
const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET || 'fallback-key-for-dev';

function encrypt(text: string): string {
  const algorithm = 'aes-256-ctr';
  const secretKey = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, secretKey);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

interface CreateAccountRequest {
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
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAccountRequest = await request.json();

    // Validate required fields
    const requiredFields = [
      'id', 'name', 'googleClientId', 'googleClientSecret', 'refreshToken',
      'cloudinaryCloudName', 'cloudinaryApiKey', 'cloudinaryApiSecret', 'personas', 'branding'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate account ID format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(body.id)) {
      return NextResponse.json(
        { error: 'Account ID must contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // Validate personas array
    if (!Array.isArray(body.personas) || body.personas.length === 0) {
      return NextResponse.json(
        { error: 'At least one persona must be specified' },
        { status: 400 }
      );
    }

    // Check if account already exists
    const existingAccount = await query(
      'SELECT id FROM accounts WHERE id = $1',
      [body.id]
    );

    if (existingAccount.rows.length > 0) {
      return NextResponse.json(
        { error: 'Account with this ID already exists' },
        { status: 409 }
      );
    }

    // Encrypt sensitive credentials
    const encryptedGoogleClientId = encrypt(body.googleClientId);
    const encryptedGoogleClientSecret = encrypt(body.googleClientSecret);
    const encryptedRefreshToken = encrypt(body.refreshToken);
    const encryptedCloudinaryCloudName = encrypt(body.cloudinaryCloudName);
    const encryptedCloudinaryApiKey = encrypt(body.cloudinaryApiKey);
    const encryptedCloudinaryApiSecret = encrypt(body.cloudinaryApiSecret);

    // Insert new account
    const result = await query(`
      INSERT INTO accounts (
        id, name, status,
        google_client_id_encrypted, google_client_secret_encrypted, refresh_token_encrypted,
        cloudinary_cloud_name_encrypted, cloudinary_api_key_encrypted, cloudinary_api_secret_encrypted,
        personas, branding
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, name, status, personas, branding, created_at
    `, [
      body.id,
      body.name,
      'active',
      encryptedGoogleClientId,
      encryptedGoogleClientSecret,
      encryptedRefreshToken,
      encryptedCloudinaryCloudName,
      encryptedCloudinaryApiKey,
      encryptedCloudinaryApiSecret,
      JSON.stringify(body.personas),
      JSON.stringify(body.branding)
    ]);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      account: result.rows[0]
    });

  } catch (error) {
    console.error('Account creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please check your input and try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // List all accounts (without sensitive data)
    const result = await query(`
      SELECT id, name, status, personas, branding, created_at, updated_at
      FROM accounts
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      accounts: result.rows
    });

  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}