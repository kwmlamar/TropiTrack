-- Add PIN support to workers table for QR clock verification
-- This migration adds secure PIN functionality for worker authentication

-- ============================================================================
-- ADD PIN FIELDS TO WORKERS TABLE
-- ============================================================================
ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS pin_set_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pin_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pin_last_used TIMESTAMP WITH TIME ZONE;

-- Add indexes for PIN-related queries
CREATE INDEX IF NOT EXISTS idx_workers_pin_hash ON workers(pin_hash) WHERE pin_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workers_pin_locked ON workers(pin_locked_until) WHERE pin_locked_until IS NOT NULL;

-- Add comments
COMMENT ON COLUMN workers.pin_hash IS 'Hashed PIN for worker authentication (bcrypt)';
COMMENT ON COLUMN workers.pin_set_at IS 'When the PIN was last set';
COMMENT ON COLUMN workers.pin_attempts IS 'Number of failed PIN attempts';
COMMENT ON COLUMN workers.pin_locked_until IS 'PIN locked until this timestamp (for security)';
COMMENT ON COLUMN workers.pin_last_used IS 'Last successful PIN usage';

-- ============================================================================
-- CREATE PIN VERIFICATION FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION verify_worker_pin(
  worker_uuid UUID,
  provided_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  worker_record RECORD;
  verify_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Get worker record with PIN data
  SELECT 
    id,
    pin_hash,
    pin_attempts,
    pin_locked_until,
    is_active
  INTO worker_record
  FROM workers
  WHERE id = worker_uuid;
  
  -- Check if worker exists and is active
  IF NOT FOUND OR NOT worker_record.is_active THEN
    RETURN FALSE;
  END IF;
  
  -- Check if PIN is locked
  IF worker_record.pin_locked_until IS NOT NULL AND worker_record.pin_locked_until > verify_time THEN
    RETURN FALSE;
  END IF;
  
  -- Check if PIN is set
  IF worker_record.pin_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify PIN using bcrypt
  IF worker_record.pin_hash = crypt(provided_pin, worker_record.pin_hash) THEN
    -- Successful verification - reset attempts and update last used
    UPDATE workers 
    SET 
      pin_attempts = 0,
      pin_locked_until = NULL,
      pin_last_used = verify_time
    WHERE id = worker_uuid;
    
    RETURN TRUE;
  ELSE
    -- Failed verification - increment attempts
    UPDATE workers 
    SET 
      pin_attempts = pin_attempts + 1,
      pin_locked_until = CASE 
        WHEN pin_attempts + 1 >= 5 THEN verify_time + INTERVAL '15 minutes'
        ELSE NULL
      END
    WHERE id = worker_uuid;
    
    RETURN FALSE;
  END IF;
END;
$$;

-- ============================================================================
-- CREATE PIN SETTING FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION set_worker_pin(
  worker_uuid UUID,
  new_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  set_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Validate PIN length (4 digits only)
  IF LENGTH(new_pin) != 4 OR new_pin !~ '^[0-9]+$' THEN
    RETURN FALSE;
  END IF;
  
  -- Update worker with hashed PIN
  UPDATE workers 
  SET 
    pin_hash = crypt(new_pin, gen_salt('bf')),
    pin_set_at = set_time,
    pin_attempts = 0,
    pin_locked_until = NULL
  WHERE id = worker_uuid;
  
  RETURN FOUND;
END;
$$;

-- ============================================================================
-- CREATE PIN RESET FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION reset_worker_pin(
  worker_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE workers 
  SET 
    pin_hash = NULL,
    pin_set_at = NULL,
    pin_attempts = 0,
    pin_locked_until = NULL,
    pin_last_used = NULL
  WHERE id = worker_uuid;
  
  RETURN FOUND;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION verify_worker_pin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_worker_pin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_worker_pin(UUID) TO authenticated;