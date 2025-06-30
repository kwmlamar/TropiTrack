-- Add WebAuthn data column to biometric_enrollments table
-- This column will store the actual WebAuthn credential data for real biometric authentication

ALTER TABLE biometric_enrollments 
ADD COLUMN webauthn_data JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN biometric_enrollments.webauthn_data IS 'Stores WebAuthn credential data including credentialId, publicKey, attestationObject, clientDataJSON, and rawId for real biometric authentication';

-- Create index for efficient querying of WebAuthn data
CREATE INDEX idx_biometric_enrollments_webauthn_data ON biometric_enrollments USING GIN (webauthn_data);

-- Add constraint to ensure webauthn_data is valid JSON when present
ALTER TABLE biometric_enrollments 
ADD CONSTRAINT check_webauthn_data_valid 
CHECK (webauthn_data IS NULL OR jsonb_typeof(webauthn_data) = 'object'); 