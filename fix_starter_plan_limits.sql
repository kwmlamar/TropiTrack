-- Fix Starter Plan Limits
-- Run this in your Supabase SQL Editor to fix the project limits

-- First, let's see what plans exist and their current limits
SELECT 
  id,
  name,
  slug,
  limits->>'projects' as projects_field,
  limits->>'projects_limit' as projects_limit_field,
  limits->>'workers' as workers_field,
  limits->>'workers_limit' as workers_limit_field
FROM subscription_plans 
WHERE slug = 'starter';

-- Update the starter plan to have the correct limits (5 projects, 15 workers)
UPDATE subscription_plans 
SET limits = jsonb_set(
  jsonb_set(
    limits,
    '{projects}',
    '5'::jsonb
  ),
  '{workers}',
  '15'::jsonb
)
WHERE slug = 'starter';

-- Also update the alternative field names for backward compatibility
UPDATE subscription_plans 
SET limits = jsonb_set(
  jsonb_set(
    limits,
    '{projects_limit}',
    '5'::jsonb
  ),
  '{workers_limit}',
  '15'::jsonb
)
WHERE slug = 'starter';

-- Verify the changes
SELECT 
  id,
  name,
  slug,
  limits->>'projects' as projects_field,
  limits->>'projects_limit' as projects_limit_field,
  limits->>'workers' as workers_field,
  limits->>'workers_limit' as workers_limit_field
FROM subscription_plans 
WHERE slug = 'starter';
