-- Fix transactions table foreign key constraint
-- Run this in your Supabase SQL editor

-- Drop the existing foreign key constraint if it exists
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_created_by_fkey;

-- Add the correct foreign key constraint referencing profiles table
ALTER TABLE transactions 
ADD CONSTRAINT transactions_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL; 