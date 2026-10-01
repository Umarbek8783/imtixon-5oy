-- Existing installations: migrate plaintext OTPs to SHA-256 hashes.
-- Requires PostgreSQL pgcrypto only for this one-time migration.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE otp_codes
  ADD COLUMN IF NOT EXISTS code_hash VARCHAR(64);

ALTER TABLE otp_codes
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;

-- Old schema used otp_codes.code. Hash it before removing the plaintext column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'otp_codes' AND column_name = 'code'
  ) THEN
    EXECUTE 'UPDATE otp_codes
             SET code_hash = encode(digest(code, ''sha256''), ''hex'')
             WHERE code_hash IS NULL AND code IS NOT NULL';
    EXECUTE 'ALTER TABLE otp_codes DROP COLUMN code';
  END IF;
END $$;

UPDATE otp_codes
SET attempts = 0
WHERE attempts IS NULL;

ALTER TABLE otp_codes
  ALTER COLUMN code_hash SET NOT NULL;

ALTER TABLE otp_codes
  ALTER COLUMN code_hash TYPE VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_otp_user_purpose_created
  ON otp_codes(user_id, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_expiry
  ON otp_codes(expires_at);
