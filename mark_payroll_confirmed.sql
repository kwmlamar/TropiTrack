-- SQL Script to Mark All Payroll as Confirmed for Past 3 Pay Periods
-- This script updates payroll records from 'pending' to 'confirmed' status
-- for payroll records in the past 3 pay periods

-- First, let's see what payroll records exist and their current status
SELECT 
    COUNT(*) as total_records,
    status,
    MIN(pay_period_start) as earliest_period,
    MAX(pay_period_end) as latest_period
FROM payroll 
GROUP BY status
ORDER BY status;

-- Get the 3 most recent pay periods
WITH recent_periods AS (
    SELECT DISTINCT 
        pay_period_start,
        pay_period_end
    FROM payroll 
    WHERE pay_period_end <= CURRENT_DATE
    ORDER BY pay_period_end DESC
    LIMIT 3
)
SELECT 
    rp.pay_period_start,
    rp.pay_period_end,
    COUNT(*) as records_in_period
FROM payroll p
INNER JOIN recent_periods rp 
    ON p.pay_period_start = rp.pay_period_start 
    AND p.pay_period_end = rp.pay_period_end
GROUP BY rp.pay_period_start, rp.pay_period_end
ORDER BY rp.pay_period_end DESC;

-- Update all payroll records to 'confirmed' status for the past 3 pay periods
-- Only update records that are currently 'pending'
WITH recent_periods AS (
    SELECT DISTINCT 
        pay_period_start,
        pay_period_end
    FROM payroll 
    WHERE pay_period_end <= CURRENT_DATE
    ORDER BY pay_period_end DESC
    LIMIT 3
)
UPDATE payroll 
SET 
    status = 'confirmed',
    updated_at = NOW()
WHERE 
    status = 'pending'
    AND EXISTS (
        SELECT 1 
        FROM recent_periods rp 
        WHERE payroll.pay_period_start = rp.pay_period_start 
        AND payroll.pay_period_end = rp.pay_period_end
    );

-- Verify the update by showing the results
SELECT 
    COUNT(*) as updated_records,
    status,
    MIN(pay_period_start) as earliest_period,
    MAX(pay_period_end) as latest_period
FROM payroll 
GROUP BY status
ORDER BY status;

-- Show detailed breakdown of the past 3 pay periods
WITH recent_periods AS (
    SELECT DISTINCT 
        pay_period_start,
        pay_period_end
    FROM payroll 
    WHERE pay_period_end <= CURRENT_DATE
    ORDER BY pay_period_end DESC
    LIMIT 3
)
SELECT 
    p.pay_period_start,
    p.pay_period_end,
    p.status,
    COUNT(*) as record_count,
    SUM(p.gross_pay) as total_gross_pay,
    SUM(p.net_pay) as total_net_pay
FROM payroll p
INNER JOIN recent_periods rp 
    ON p.pay_period_start = rp.pay_period_start 
    AND p.pay_period_end = rp.pay_period_end
GROUP BY p.pay_period_start, p.pay_period_end, p.status
ORDER BY p.pay_period_end DESC, p.status; 