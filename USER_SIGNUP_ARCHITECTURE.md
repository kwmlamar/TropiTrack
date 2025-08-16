# User Signup Architecture for TropiTrack

This document outlines the complete architecture for handling user signups in TropiTrack, supporting both new company creation and invited user scenarios.

## Overview

The system supports two main signup flows:

1. **Landing Page Signup**: New users create a new company and become the admin
2. **Invite Signup**: Users invited by existing companies join the inviter's company

## Database Architecture

### Core Tables

#### `companies` Table
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  -- ... other fields
);
```

#### `profiles` Table (Actual Structure)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  company_id UUID REFERENCES companies(id),
  role TEXT DEFAULT 'worker',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_started_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `invites` Table
```sql
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  -- ... other fields
);
```

## Signup Flow Architecture

### 1. Landing Page Signup (New Company)

**Flow:**
1. User fills out signup form with name, email, password, and company name
2. Form submits to `/app/actions/auth.ts` `signup()` function
3. Function parses first_name and last_name from full name
4. Function creates user in Supabase Auth with metadata containing company name and parsed names
5. Database trigger `handle_new_user()` fires automatically
6. Trigger creates new company and profile with admin role and all required fields
7. User receives email confirmation

**Code Path:**
```
SignupForm → signup() → Supabase Auth → handle_new_user() trigger → Company + Profile creation
```

### 2. Invite Signup (Existing Company)

**Flow:**
1. Admin invites user via invite system
2. User receives email with invite link containing token
3. User clicks link and fills out onboarding form
4. Form submits to same `signup()` function with invite token
5. Function validates invite token and extracts company_id
6. Function creates user with company_id and role in metadata
7. Database trigger creates profile linked to existing company with all required fields
8. Invite is marked as used

**Code Path:**
```
InviteForm → Email → OnboardingForm → signup() → handle_new_user() trigger → Profile creation (existing company)
```

## Key Components

### 1. Unified Signup Function (`app/actions/auth.ts`)

The `signup()` function handles both scenarios:

```typescript
export async function signup(formData: FormData): Promise<SignupResult> {
  const fullName = formData.get("name") as string;
  const inviteToken = formData.get("invite_token") as string;
  
  // Parse first and last name from full name
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  if (inviteToken) {
    // Validate invite and extract company_id
    // Create user with company_id and role in metadata
  } else {
    // Create user with company_name in metadata
  }
  
  // Supabase Auth creates user with parsed names in metadata
  // Database trigger handles profile/company creation
}
```

### 2. Database Trigger (`handle_new_user()`)

The trigger automatically handles profile creation with all required fields:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  first_name TEXT;
  last_name TEXT;
BEGIN
  -- Extract first and last name from user metadata or split full name
  first_name := COALESCE(
    new.raw_user_meta_data->>'first_name',
    split_part(user_name, ' ', 1)
  );
  
  last_name := COALESCE(
    new.raw_user_meta_data->>'last_name',
    CASE 
      WHEN array_length(string_to_array(user_name, ' '), 1) > 1 
      THEN array_to_string(string_to_array(user_name, ' ')[2:], ' ')
      ELSE ''
    END
  );
  
  -- Check if user has company_id in metadata (invited user)
  existing_company_id := (new.raw_user_meta_data->>'company_id')::UUID;
  
  IF existing_company_id IS NOT NULL THEN
    -- Create profile for invited user (existing company)
    INSERT INTO profiles (
      id, user_id, email, name, first_name, last_name, 
      company_id, role, is_active, onboarding_completed, 
      created_at, updated_at
    )
    VALUES (
      new.id, new.id, user_email, user_name, first_name, last_name,
      existing_company_id, COALESCE(new.raw_user_meta_data->>'role', 'worker'),
      true, false, now(), now()
    );
  ELSE
    -- Create new company and profile for new signup
    INSERT INTO companies (name, email) VALUES (company_name, user_email);
    INSERT INTO profiles (
      id, user_id, email, name, first_name, last_name,
      company_id, role, is_active, onboarding_completed,
      created_at, updated_at
    )
    VALUES (
      new.id, new.id, user_email, user_name, first_name, last_name,
      new_company_id, 'admin', true, false, now(), now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### 3. Form Components

#### SignupForm (`components/auth/signup-form.tsx`)
- Handles landing page signups
- Accepts optional `inviteToken` prop
- Includes company name field for new signups
- Submits full name which gets parsed into first/last name

#### OnboardingForm (`components/onboarding/onboarding-form.tsx`)
- Handles invite signups
- Receives invite token from URL
- Hides company name field for invited users
- Uses same signup function with parsed names

## Field Mapping

### Profile Fields Populated During Signup

| Field | Source | Notes |
|-------|--------|-------|
| `id` | `auth.users.id` | Primary key, same as user_id |
| `user_id` | `auth.users.id` | References auth.users |
| `email` | `auth.users.email` | User's email address |
| `name` | `full_name` from metadata | Full display name |
| `first_name` | Parsed from `full_name` or metadata | First part of name |
| `last_name` | Parsed from `full_name` or metadata | Remaining parts of name |
| `company_id` | From invite or new company | Links to companies table |
| `role` | From invite or 'admin' | 'admin', 'manager', 'worker' |
| `is_active` | Always `true` | User is active by default |
| `onboarding_completed` | Always `false` | Requires onboarding completion |
| `created_at` | `now()` | Current timestamp |
| `updated_at` | `now()` | Current timestamp |

### User Metadata Fields

| Field | Purpose | When Set |
|-------|---------|----------|
| `full_name` | Complete user name | Always |
| `first_name` | Parsed first name | Always |
| `last_name` | Parsed last name | Always |
| `company_id` | For invited users | Invite signup only |
| `company_name` | For new companies | Landing page signup only |
| `role` | User role | Invite signup only |
| `invite_token` | Invite validation | Invite signup only |
| `selected_plan` | Subscription plan | Landing page signup only |

## Security Considerations

### 1. Invite Validation
- Tokens are cryptographically secure (32-byte random)
- Tokens expire after 7 days
- Email addresses must match invite
- Tokens can only be used once

### 2. Row Level Security (RLS)
- Users can only access data from their company
- Profiles are scoped to company_id
- Invites are scoped to company_id

### 3. Role-Based Access
- New company signups get 'admin' role
- Invited users get role specified in invite (defaults to 'worker')
- Roles control access to different features

## Error Handling

### 1. Invite Errors
- Invalid/expired tokens
- Email mismatch
- Already used invites
- Company not found

### 2. Signup Errors
- Email already registered
- Invalid password requirements
- Database constraint violations
- Network/API failures

### 3. Name Parsing
- Handles single names (first_name only)
- Handles multiple word names (first_name + last_name)
- Graceful fallback for edge cases

## Testing Scenarios

### 1. New Company Signup
```bash
# Test landing page signup
curl -X POST /api/auth/signup \
  -d "name=John Doe&email=john@example.com&password=password123&company_name=Acme Corp"
```

### 2. Invite Signup
```bash
# Test invite signup
curl -X POST /api/auth/signup \
  -d "name=Jane Smith&email=jane@example.com&password=password123&invite_token=abc123"
```

### 3. Name Parsing Tests
```bash
# Single name
curl -X POST /api/auth/signup \
  -d "name=Madonna&email=madonna@example.com&password=password123&company_name=Music Corp"

# Multiple names
curl -X POST /api/auth/signup \
  -d "name=John Michael Smith&email=john@example.com&password=password123&company_name=Acme Corp"
```

## Migration Strategy

### 1. Database Changes
- Update `handle_new_user()` trigger to support invited users
- Ensure all profile fields are properly populated
- Add proper indexes for performance

### 2. Code Changes
- Modify signup function to handle invite tokens and name parsing
- Update form components to support both flows
- Add proper error handling and validation

### 3. Testing
- Test both signup flows end-to-end
- Verify invite validation and expiration
- Test name parsing with various formats
- Test error scenarios and edge cases

## Benefits of This Architecture

### 1. Unified Codebase
- Single signup function handles both scenarios
- Consistent error handling and validation
- Shared database trigger logic

### 2. Security
- Proper invite validation and expiration
- Role-based access control
- Row-level security enforcement

### 3. Scalability
- Database triggers handle automatic profile creation
- Supports multiple user roles
- Easy to extend with additional fields

### 4. User Experience
- Seamless flow for both signup types
- Clear error messages
- Proper email confirmations
- Complete profile data from the start

## Future Enhancements

### 1. Additional Roles
- Support for more granular permissions
- Role inheritance and hierarchies
- Custom role definitions

### 2. Advanced Invites
- Bulk invite functionality
- Invite templates and customization
- Invite analytics and tracking

### 3. Company Management
- Company merging and splitting
- Multi-company user accounts
- Company hierarchy support

### 4. Profile Enhancements
- Avatar upload during signup
- Additional profile fields
- Profile completion workflows
