-- Migration to create transactions for existing payrolls
-- This migration will create liability transactions for pending payrolls
-- and expense transactions for payrolls that are already paid/confirmed

-- Function to create transactions for existing payrolls
CREATE OR REPLACE FUNCTION create_transactions_for_existing_payrolls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payroll_record RECORD;
    transaction_count INTEGER := 0;
    liability_count INTEGER := 0;
    expense_count INTEGER := 0;
    period_text TEXT;
BEGIN
    -- Loop through all payroll records
    FOR payroll_record IN 
        SELECT 
            p.id,
            p.company_id,
            p.worker_name,
            p.gross_pay,
            p.net_pay,
            p.status,
            p.pay_period_start,
            p.pay_period_end,
            COALESCE(p.created_at, NOW()) as created_at,
            COALESCE(p.updated_at, NOW()) as updated_at
        FROM payroll p
        WHERE p.company_id IS NOT NULL
    LOOP
        -- Create period text for notes
        period_text := CASE 
            WHEN payroll_record.pay_period_start IS NOT NULL AND payroll_record.pay_period_end IS NOT NULL 
            THEN payroll_record.pay_period_start::text || ' to ' || payroll_record.pay_period_end::text
            WHEN payroll_record.pay_period_start IS NOT NULL 
            THEN payroll_record.pay_period_start::text || ' onwards'
            WHEN payroll_record.pay_period_end IS NOT NULL 
            THEN 'until ' || payroll_record.pay_period_end::text
            ELSE 'Period not specified'
        END;

        -- For pending payrolls, create liability transaction if it doesn't exist
        IF payroll_record.status NOT IN ('paid', 'confirmed') AND NOT EXISTS (
            SELECT 1 FROM transactions 
            WHERE reference = 'LIABILITY-' || payroll_record.id
        ) THEN
            -- Create liability transaction
            INSERT INTO transactions (
                company_id,
                transaction_id,
                date,
                description,
                category,
                type,
                amount,
                status,
                account,
                reference,
                notes,
                created_at,
                updated_at
            ) VALUES (
                payroll_record.company_id,
                'TXN-LIABILITY-' || payroll_record.id,
                payroll_record.created_at::date,
                'Wages Payable - ' || COALESCE(payroll_record.worker_name, 'Unknown Worker'),
                'Wages Payable',
                'liability',
                COALESCE(payroll_record.gross_pay, 0),
                'pending',
                'Business Account',
                'LIABILITY-' || payroll_record.id,
                'Wages payable for ' || COALESCE(payroll_record.worker_name, 'Unknown Worker') || ' - Period: ' || period_text,
                payroll_record.created_at,
                payroll_record.updated_at
            );
            liability_count := liability_count + 1;
        END IF;

        -- For paid/confirmed payrolls, create expense transaction if it doesn't exist
        IF payroll_record.status IN ('paid', 'confirmed') AND NOT EXISTS (
            SELECT 1 FROM transactions 
            WHERE reference = 'PAYROLL-' || payroll_record.id
        ) THEN
            -- Create expense transaction
            INSERT INTO transactions (
                company_id,
                transaction_id,
                date,
                description,
                category,
                type,
                amount,
                status,
                account,
                reference,
                notes,
                created_at,
                updated_at
            ) VALUES (
                payroll_record.company_id,
                'TXN-PAYROLL-' || payroll_record.id,
                payroll_record.updated_at::date,
                'Payroll - ' || COALESCE(payroll_record.worker_name, 'Unknown Worker'),
                'Payroll',
                'expense',
                COALESCE(payroll_record.gross_pay, 0),
                'completed',
                'Business Account',
                'PAYROLL-' || payroll_record.id,
                'Payroll expense for ' || COALESCE(payroll_record.worker_name, 'Unknown Worker') || ' - Period: ' || period_text || 
                '. Net pay: $' || COALESCE(payroll_record.net_pay, 0),
                payroll_record.updated_at,
                payroll_record.updated_at
            );
            expense_count := expense_count + 1;
        END IF;

        transaction_count := transaction_count + 1;
    END LOOP;

    -- Log the results
    RAISE NOTICE 'Migration completed: Processed % payroll records, created % liability transactions, created % expense transactions', 
        transaction_count, liability_count, expense_count;
END;
$$;

-- Execute the function
SELECT create_transactions_for_existing_payrolls();

-- Clean up the function
DROP FUNCTION create_transactions_for_existing_payrolls();

-- Add comment for documentation
COMMENT ON TABLE transactions IS 'Contains all financial transactions including payroll liabilities and expenses'; 