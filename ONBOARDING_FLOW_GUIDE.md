# Onboarding Flow Guide

This document explains how the onboarding setup guide works when users log in to TropiTrack.

## Overview

When users sign up or log in, the system automatically checks if they need to complete onboarding. If onboarding is required, the company setup dialog is shown as the first step.

## Flow Diagram

```
User Login → Dashboard Load → OnboardingCheck → Check Database → Show Company Setup Dialog
     ↓
Company Setup Complete → Next Step (Workers) → Continue Through Steps → Onboarding Complete
```

## Components

### 1. OnboardingCheck Component
**Location**: `components/onboarding/onboarding-check.tsx`

**Purpose**: Checks if onboarding is needed and shows the company setup dialog

**How it works**:
- Runs on every dashboard page load
- Checks user's onboarding status in the database
- If onboarding is needed, starts the onboarding flow
- Shows company setup dialog for the first step

### 2. Dashboard Layout Integration
**Location**: `components/layouts/dashboard-layout-client.tsx`

**Integration**: The `OnboardingCheck` component is included in the dashboard layout, so it runs on every dashboard page.

### 3. Company Setup Dialog
**Location**: `components/onboarding/onboarding-company-setup-dialog.tsx`

**Purpose**: Modal dialog that collects company information

**Features**:
- Form for company name, address, phone, email, website, industry, country, description
- Save & Continue button
- Skip button (closes dialog but keeps onboarding active)
- Integration with onboarding system for proper step completion

## Database Schema

### Profiles Table
```sql
ALTER TABLE profiles 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
```

### Onboarding Progress Table
```sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Onboarding Steps

The system includes 8 onboarding steps:

1. **Company Setup** - Company information
2. **Add Workers** - Add first worker
3. **Add Clients** - Add first client
4. **Create Projects** - Create first project
5. **Enter Timesheets** - Learn timesheet entry
6. **Approve Time** - Learn time approval
7. **Payroll Setup** - Configure payroll
8. **Dashboard Overview** - Complete dashboard tour

## How It Works

### 1. User Login
When a user logs in successfully:
- Login form redirects to `/dashboard`
- Dashboard layout loads with `OnboardingCheck` component

### 2. Onboarding Check
The `OnboardingCheck` component:
- Gets the current user ID
- Calls `checkOnboardingStatus()` to check database
- If `onboarding_completed` is `false`, starts onboarding
- Shows company setup dialog for first step

### 3. Company Setup
When company setup dialog is shown:
- User fills out company information
- Clicks "Save & Continue"
- Data is saved to database
- Step is marked as completed
- User is redirected to workers page

### 4. Subsequent Steps
- Setup guide dropdown shows remaining steps
- User can navigate through steps
- Progress is tracked in database
- Onboarding is marked complete when all steps done

## Code Flow

### Login Success
```typescript
// components/login-form.tsx
router.push("/dashboard"); // Redirects to dashboard
```

### Dashboard Load
```typescript
// components/layouts/dashboard-layout-client.tsx
<OnboardingCheck /> // Checks onboarding status
```

### Onboarding Check
```typescript
// components/onboarding/onboarding-check.tsx
const { shouldShowOnboarding } = await checkOnboardingStatus(userId);
if (shouldShowOnboarding) {
  await startOnboarding(); // Starts onboarding flow
  return <CompanySetupDialog />; // Shows company setup
}
```

### Company Setup Complete
```typescript
// components/onboarding/onboarding-company-setup-dialog.tsx
await saveOnboardingData(data); // Saves company data
closeCurrentStep(); // Closes overlay
router.push("/dashboard/workers"); // Goes to next step
```

## Database Functions

### Check Onboarding Status
```typescript
// lib/actions/onboarding-actions.ts
export async function checkOnboardingStatus(userId: string) {
  // Check profiles.onboarding_completed
  // Get completed steps from onboarding_progress
  // Return shouldShowOnboarding boolean
}
```

### Complete Step
```typescript
// lib/actions/onboarding-actions.ts
export async function completeOnboardingStep(userId, stepName, data) {
  // Save step completion to onboarding_progress
  // Update any related data
}
```

## User Experience

### New User (First Login)
1. User signs up with email/password
2. User logs in for first time
3. Dashboard loads with company setup dialog
4. User fills company information
5. Dialog closes, user sees workers page
6. Setup guide dropdown shows remaining steps

### Returning User (Onboarding Incomplete)
1. User logs in
2. Dashboard loads with company setup dialog (if on first step)
3. Or setup guide dropdown shows progress
4. User can continue from where they left off

### Returning User (Onboarding Complete)
1. User logs in
2. Dashboard loads normally
3. No onboarding overlays shown
4. User can access all features

## Testing

### Test New User Flow
1. Create new account
2. Log in
3. Verify company setup dialog appears
4. Complete company setup
5. Verify redirect to workers page
6. Check setup guide dropdown shows remaining steps

### Test Returning User Flow
1. Log in as existing user
2. If onboarding incomplete, verify appropriate step shown
3. If onboarding complete, verify no overlays shown

### Test Database State
1. Check `profiles.onboarding_completed` field
2. Check `onboarding_progress` table for completed steps
3. Verify data is saved correctly

## Configuration

### Onboarding Steps
Steps are defined in `lib/types/onboarding.ts`:
```typescript
export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 'company-setup', title: 'Company Setup', ... },
  { id: 'workers', title: 'Add Workers', ... },
  // ... more steps
];
```

### Required vs Optional Steps
Each step has a `required` flag:
- `required: true` - Must be completed to finish onboarding
- `required: false` - Can be skipped

## Troubleshooting

### Company Setup Dialog Not Showing
1. Check if user has `onboarding_completed: false` in profiles
2. Check if `OnboardingCheck` component is included in dashboard layout
3. Check browser console for errors
4. Verify onboarding tables exist in database

### Onboarding Not Progressing
1. Check `onboarding_progress` table for completed steps
2. Verify `completeOnboardingStep()` function is working
3. Check if step names match between code and database

### Database Errors
1. Ensure `onboarding_progress` table exists
2. Check RLS policies are correct
3. Verify user has proper permissions

## Future Enhancements

### Smart Completion
- Automatically detect when steps are completed
- Skip steps based on existing data
- Show progress based on actual usage

### Customizable Onboarding
- Allow companies to customize onboarding steps
- Skip steps based on company type
- Add conditional steps

### Analytics
- Track onboarding completion rates
- Identify where users drop off
- A/B test different onboarding flows
