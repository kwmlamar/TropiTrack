-- Down migration to remove transactions created for existing payrolls
-- This will remove liability and expense transactions that were created by the migration

-- Function to remove transactions for existing payrolls
CREATE OR REPLACE FUNCTION remove_transactions_for_existing_payrolls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    transaction_record RECORD;
    removed_count INTEGER := 0;
BEGIN
    -- Remove all liability and expense transactions that reference payroll IDs
    FOR transaction_record IN 
        SELECT id, reference, type
        FROM transactions 
        WHERE reference LIKE 'LIABILITY-%' OR reference LIKE 'PAYROLL-%'
    LOOP
        DELETE FROM transactions WHERE id = transaction_record.id;
        removed_count := removed_count + 1;
    END LOOP;

    -- Log the results
    RAISE NOTICE 'Down migration completed: Removed % transactions', removed_count;
END;
$$;

-- Execute the function
SELECT remove_transactions_for_existing_payrolls();

-- Clean up the function
DROP FUNCTION remove_transactions_for_existing_payrolls(); 