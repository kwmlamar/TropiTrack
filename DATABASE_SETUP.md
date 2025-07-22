# Database Setup for TropiTrack User Signup

This document outlines the database structure and setup required for user signup functionality in TropiTrack.

## Overview

The database setup includes core tables, functions, triggers, and policies that work together to handle user registration and company management.

## Core Tables

### 1. Companies Table (`companies`)

Stores company information for multi-tenant architecture.

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  logo_url TEXT,
  industry TEXT,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- Auto-generated UUID primary key
- Company contact information
- Industry and size classification
- Automatic timestamp management

### 2. Profiles Table (`profiles`)

Stores user profile information linked to Supabase Auth.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  phone TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- Links to Supabase Auth users
- Role-based access control
- Company association
- Profile customization fields

## Core Functions

### 1. `handle_new_user()`

Automatically creates company and profile when a new user signs up.

**Triggers:**
- Fires on `INSERT` to `auth.users`
- Creates company with default name
- Creates profile with admin role
- Updates user metadata

### 2. `get_user_company_id()`

Utility function to get the current user's company ID.

**Usage:**
```sql
SELECT get_user_company_id();
```

### 3. `update_updated_at_column()`

Automatically updates the `updated_at` timestamp on table updates.

## Row Level Security (RLS)

### Companies Policies

- **View Policy:** Users can view their own company
- **Update Policy:** Users can update their own company
- **Insert Policy:** System can insert companies (for triggers)

### Profiles Policies

- **View Policy:** Users can view their own profile and company profiles
- **Update Policy:** Users can update their own profile
- **Insert Policy:** System can insert profiles (for triggers)

## Storage Setup

### Avatar Storage

- **Bucket:** `avatars`
- **Access:** Public read, authenticated upload/update/delete
- **Structure:** `avatars/{user_id}/{filename}`

## Migration Files

### 1. `20240318000000_create_core_tables.sql`
Main migration that creates all core tables, functions, and policies.

### 2. `20240318000000_create_core_tables.down.sql`
Down migration for clean rollback.

### 3. `20240318000001_test_core_tables.sql`
Verification migration to test the setup.

## User Signup Flow

1. **User Registration:**
   - User submits signup form with email, password, name, and company name
   - Supabase Auth creates user in `auth.users`
   - `handle_new_user()` trigger fires automatically

2. **Company Creation:**
   - Trigger creates company with provided name
   - Sets company email to user's email
   - Generates unique company ID

3. **Profile Creation:**
   - Trigger creates profile linked to user
   - Sets role to 'admin' for first user
   - Links profile to company

4. **Metadata Update:**
   - Updates user metadata with company_id
   - Stores full_name in metadata

## Indexes

### Companies Indexes
- `idx_companies_email` - Email lookups
- `idx_companies_created_at` - Time-based queries

### Profiles Indexes
- `idx_profiles_email` - Email lookups
- `idx_profiles_company_id` - Company-based queries
- `idx_profiles_role` - Role-based filtering
- `idx_profiles_created_at` - Time-based queries

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies ensure users only access their own data
- Company-based data isolation

### Function Security
- `SECURITY DEFINER` functions for system operations
- Proper permission grants for authenticated users

### Storage Security
- User-specific avatar uploads
- Public read access for avatars
- Authenticated write access

## Testing

Run the test migration to verify setup:

```bash
supabase db reset
```

The test migration will verify:
- Tables exist with correct structure
- Functions are properly created
- Triggers are attached
- RLS policies are enabled
- Storage bucket is configured

## Troubleshooting

### Common Issues

1. **"Companies table does not exist"**
   - Ensure migrations are run in correct order
   - Check that `20240318000000_create_core_tables.sql` was applied

2. **"handle_new_user function does not exist"**
   - Verify the function was created in the migration
   - Check for syntax errors in the function definition

3. **"RLS not enabled"**
   - Ensure `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` was executed
   - Verify policies were created successfully

### Debugging

Enable detailed logging in the `handle_new_user()` function:

```sql
-- Check trigger logs
SELECT * FROM pg_stat_activity WHERE query LIKE '%handle_new_user%';

-- Test function manually
SELECT handle_new_user();
```

## Next Steps

After running these migrations:

1. **Test User Signup:**
   - Create a test user through your application
   - Verify company and profile are created automatically

2. **Verify Data Isolation:**
   - Create multiple test users
   - Ensure they can only access their own company data

3. **Test Storage:**
   - Upload avatar images
   - Verify proper access controls

4. **Monitor Performance:**
   - Check query performance with indexes
   - Monitor trigger execution times

## Dependencies

This setup requires:
- Supabase Auth enabled
- PostgreSQL with UUID extension
- Storage buckets configured
- Proper network access to Supabase

## Support

For issues with this database setup:
1. Check the test migration output
2. Review Supabase logs
3. Verify migration order
4. Test with minimal data first 