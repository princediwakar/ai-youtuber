-- =================================================================
--      Migration: Add Accounts Table and Update quiz_jobs
-- =================================================================

-- This migration adds the accounts table and updates quiz_jobs to include account_id

BEGIN;

-- =================================================================
--  Step 1: Create accounts table
-- =================================================================

CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'english_shots', 'health_shots'
    name VARCHAR(100) NOT NULL, -- Display name
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- OAuth Credentials (encrypted)
    google_client_id_encrypted TEXT NOT NULL,
    google_client_secret_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    
    -- Cloudinary Credentials (encrypted)
    cloudinary_cloud_name_encrypted TEXT NOT NULL,
    cloudinary_api_key_encrypted TEXT NOT NULL,
    cloudinary_api_secret_encrypted TEXT NOT NULL,
    
    -- Account Configuration
    personas JSONB NOT NULL, -- Array of persona names
    branding JSONB NOT NULL, -- Theme, audience, tone settings
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =================================================================
--  Step 2: Add account_id column to quiz_jobs (if not exists)
-- =================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='quiz_jobs' AND column_name='account_id') THEN
        ALTER TABLE quiz_jobs ADD COLUMN account_id VARCHAR(50);
    END IF;
END $$;

-- =================================================================
--  Step 3: Populate account_id based on existing persona data
-- =================================================================

-- Update English shots account
UPDATE quiz_jobs 
SET account_id = 'english_shots' 
WHERE persona = 'english_vocab_builder' AND account_id IS NULL;

-- Update Health shots account
UPDATE quiz_jobs 
SET account_id = 'health_shots' 
WHERE persona IN ('brain_health_tips', 'eye_health_tips') AND account_id IS NULL;

-- =================================================================
--  Step 4: Add foreign key constraint and make account_id NOT NULL
-- =================================================================

-- First ensure all rows have account_id populated
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM quiz_jobs WHERE account_id IS NULL) THEN
        RAISE EXCEPTION 'Some quiz_jobs rows still have NULL account_id. Migration cannot continue.';
    END IF;
END $$;

-- Make account_id NOT NULL
ALTER TABLE quiz_jobs ALTER COLUMN account_id SET NOT NULL;

-- Add foreign key constraint (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='quiz_jobs_account_id_fkey' 
                   AND table_name='quiz_jobs') THEN
        ALTER TABLE quiz_jobs ADD CONSTRAINT quiz_jobs_account_id_fkey 
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- =================================================================
--  Step 5: Add new indexes
-- =================================================================

-- Index for account-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_account_persona ON quiz_jobs(account_id, persona);
CREATE INDEX IF NOT EXISTS idx_jobs_account_status ON quiz_jobs(account_id, status);

-- =================================================================
--  Step 6: Add trigger for accounts table
-- =================================================================

CREATE TRIGGER IF NOT EXISTS set_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

COMMIT;

-- =================================================================
--  Migration complete
-- =================================================================