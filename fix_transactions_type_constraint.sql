-- Fix transactions table type constraint to include 'liability'
-- Run this in your Supabase SQL editor

-- Drop the existing check constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add the updated check constraint with 'liability' type
ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('income', 'expense', 'liability')); 