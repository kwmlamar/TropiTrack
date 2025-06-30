-- Add WebAuthn data column to biometric_enrollments table
-- Run this script in your Supabase SQL Editor

-- Add the webauthn_data column
ALTER TABLE biometric_enrollments 
ADD COLUMN IF NOT EXISTS webauthn_data JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN biometric_enrollments.webauthn_data IS 'Stores WebAuthn credential data including credentialId, publicKey, attestationObject, clientDataJSON, and rawId for real biometric authentication';

-- Create index for efficient querying of WebAuthn data
CREATE INDEX IF NOT EXISTS idx_biometric_enrollments_webauthn_data ON biometric_enrollments USING GIN (webauthn_data);

-- Add constraint to ensure webauthn_data is valid JSON when present
ALTER TABLE biometric_enrollments 
DROP CONSTRAINT IF EXISTS check_webauthn_data_valid;

ALTER TABLE biometric_enrollments 
ADD CONSTRAINT check_webauthn_data_valid 
CHECK (webauthn_data IS NULL OR jsonb_typeof(webauthn_data) = 'object');

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'biometric_enrollments' 
AND column_name = 'webauthn_data'; 