import { query } from './database';
import crypto from 'crypto';

export interface Account {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
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
  createdAt: Date;
  updatedAt: Date;
}

interface EncryptedAccountRow {
  id: string;
  name: string;
  status: string;
  google_client_id_encrypted: string;
  google_client_secret_encrypted: string;
  refresh_token_encrypted: string;
  cloudinary_cloud_name_encrypted: string;
  cloudinary_api_key_encrypted: string;
  cloudinary_api_secret_encrypted: string;
  personas: any[];
  branding: any;
  created_at: Date;
  updated_at: Date;
}

class AccountService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private accountCache: Map<string, Account> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    const key = process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('NEXTAUTH_SECRET or ENCRYPTION_KEY environment variable is required for account encryption');
    }
    
    // Create a 32-byte key for AES-256
    this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted: string;
    try {
      decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
    } catch (e: any) {
      // Provide a clearer hint when decryption fails due to wrong secret
      const hint = 'Failed to decrypt account credentials. Ensure NEXTAUTH_SECRET matches the key used to encrypt database secrets.';
      const err = new Error(`${hint} (${e?.message || 'decryption error'})`);
      throw err;
    }
    
    return decrypted;
  }

  private isValidCache(accountId: string): boolean {
    const expiry = this.cacheExpiry.get(accountId);
    return expiry ? Date.now() < expiry : false;
  }

  private setCacheEntry(accountId: string, account: Account): void {
    this.accountCache.set(accountId, account);
    this.cacheExpiry.set(accountId, Date.now() + this.cacheTimeout);
  }

  private mapRowToAccount(row: EncryptedAccountRow): Account {
    return {
      id: row.id,
      name: row.name,
      status: row.status as Account['status'],
      googleClientId: this.decrypt(row.google_client_id_encrypted),
      googleClientSecret: this.decrypt(row.google_client_secret_encrypted),
      refreshToken: this.decrypt(row.refresh_token_encrypted),
      cloudinaryCloudName: this.decrypt(row.cloudinary_cloud_name_encrypted),
      cloudinaryApiKey: this.decrypt(row.cloudinary_api_key_encrypted),
      cloudinaryApiSecret: this.decrypt(row.cloudinary_api_secret_encrypted),
      personas: row.personas,
      branding: row.branding,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async getAccount(accountId: string): Promise<Account | null> {
    // Check cache first
    if (this.isValidCache(accountId)) {
      return this.accountCache.get(accountId) || null;
    }

    try {
      const result = await query(
        'SELECT * FROM accounts WHERE id = $1 AND status = $2',
        [accountId, 'active']
      );

      if (result.rows.length === 0) {
        return null;
      }

      const account = this.mapRowToAccount(result.rows[0]);
      this.setCacheEntry(accountId, account);
      return account;
    } catch (error) {
      console.error('Error fetching account:', error);
      throw new Error(`Failed to fetch account: ${accountId}`);
    }
  }

  async getAllAccounts(): Promise<Account[]> {
    try {
      const result = await query(
        'SELECT * FROM accounts WHERE status = $1 ORDER BY created_at',
        ['active']
      );

      return result.rows.map(row => this.mapRowToAccount(row));
    } catch (error) {
      console.error('Error fetching all accounts:', error);
      throw new Error('Failed to fetch accounts');
    }
  }

  async createAccount(accountData: Omit<Account, 'createdAt' | 'updatedAt'>): Promise<Account> {
    try {
      const result = await query(`
        INSERT INTO accounts (
          id, name, status,
          google_client_id_encrypted, google_client_secret_encrypted, refresh_token_encrypted,
          cloudinary_cloud_name_encrypted, cloudinary_api_key_encrypted, cloudinary_api_secret_encrypted,
          personas, branding
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        accountData.id,
        accountData.name,
        accountData.status,
        this.encrypt(accountData.googleClientId),
        this.encrypt(accountData.googleClientSecret),
        this.encrypt(accountData.refreshToken),
        this.encrypt(accountData.cloudinaryCloudName),
        this.encrypt(accountData.cloudinaryApiKey),
        this.encrypt(accountData.cloudinaryApiSecret),
        JSON.stringify(accountData.personas),
        JSON.stringify(accountData.branding)
      ]);

      const account = this.mapRowToAccount(result.rows[0]);
      this.setCacheEntry(account.id, account);
      return account;
    } catch (error) {
      console.error('Error creating account:', error);
      throw new Error(`Failed to create account: ${accountData.id}`);
    }
  }

  async updateAccount(accountId: string, updates: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Account> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        switch (key) {
          case 'googleClientId':
            setClause.push(`google_client_id_encrypted = $${paramIndex++}`);
            values.push(this.encrypt(value as string));
            break;
          case 'googleClientSecret':
            setClause.push(`google_client_secret_encrypted = $${paramIndex++}`);
            values.push(this.encrypt(value as string));
            break;
          case 'refreshToken':
            setClause.push(`refresh_token_encrypted = $${paramIndex++}`);
            values.push(this.encrypt(value as string));
            break;
          case 'cloudinaryCloudName':
            setClause.push(`cloudinary_cloud_name_encrypted = $${paramIndex++}`);
            values.push(this.encrypt(value as string));
            break;
          case 'cloudinaryApiKey':
            setClause.push(`cloudinary_api_key_encrypted = $${paramIndex++}`);
            values.push(this.encrypt(value as string));
            break;
          case 'cloudinaryApiSecret':
            setClause.push(`cloudinary_api_secret_encrypted = $${paramIndex++}`);
            values.push(this.encrypt(value as string));
            break;
          case 'personas':
            setClause.push(`personas = $${paramIndex++}`);
            values.push(JSON.stringify(value));
            break;
          case 'branding':
            setClause.push(`branding = $${paramIndex++}`);
            values.push(JSON.stringify(value));
            break;
          default:
            setClause.push(`${key} = $${paramIndex++}`);
            values.push(value);
        }
      }
    });

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(accountId);
    
    try {
      const result = await query(`
        UPDATE accounts 
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        throw new Error(`Account not found: ${accountId}`);
      }

      const account = this.mapRowToAccount(result.rows[0]);
      this.setCacheEntry(accountId, account);
      return account;
    } catch (error) {
      console.error('Error updating account:', error);
      throw new Error(`Failed to update account: ${accountId}`);
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    try {
      const result = await query(
        'UPDATE accounts SET status = $1 WHERE id = $2',
        ['inactive', accountId]
      );

      if (result.rowCount === 0) {
        throw new Error(`Account not found: ${accountId}`);
      }

      // Remove from cache
      this.accountCache.delete(accountId);
      this.cacheExpiry.delete(accountId);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error(`Failed to delete account: ${accountId}`);
    }
  }

  async getAccountForPersona(persona: string): Promise<Account | null> {
    try {
      const result = await query(`
        SELECT * FROM accounts 
        WHERE status = 'active' 
        AND personas @> $1
      `, [JSON.stringify([persona])]);

      if (result.rows.length === 0) {
        return null;
      }

      const account = this.mapRowToAccount(result.rows[0]);
      this.setCacheEntry(account.id, account);
      return account;
    } catch (error) {
      console.error('Error finding account for persona:', error);
      throw new Error(`Failed to find account for persona: ${persona}`);
    }
  }

  clearCache(): void {
    this.accountCache.clear();
    this.cacheExpiry.clear();
  }
}

// Export singleton instance
export const accountService = new AccountService();
export default accountService;