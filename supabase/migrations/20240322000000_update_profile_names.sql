-- Update existing profiles with name from user metadata
UPDATE public.profiles p
SET name = u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE p.id = u.id
AND p.name IS NULL
AND u.raw_user_meta_data->>'full_name' IS NOT NULL; 