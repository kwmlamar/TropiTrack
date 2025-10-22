# NIB Toggle Feature ✅ (Enhanced with Per-Worker Control)

## Overview
Company-level toggle setting for NIB (National Insurance Board) deductions, enhanced with per-worker exemption controls. This provides flexible NIB management for businesses with mixed workforce types.

**Status:** ✅ **FULLY IMPLEMENTED AND FUNCTIONAL**

**New:** Per-worker NIB exemption controls have been added! See `PER_WORKER_NIB_CONTROL.md` for complete details.

The NIB system now operates on two levels:
1. **Company-level**: Master switch to enable/disable NIB for the entire company
2. **Worker-level**: Individual exemptions for contractors, part-time workers, etc.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/20240350000000_add_nib_enabled_to_payroll_settings.sql`

- Added `nib_enabled` boolean column to `payroll_settings` table
- Defaults to `true` for existing and new records
- Includes documentation comment explaining the field's purpose

### 2. Type Definitions
**File:** `lib/types/payroll-settings.ts`

- Added `nib_enabled: boolean` to `PayrollSettings` type
- Input types (`CreatePayrollSettingsInput`, `UpdatePayrollSettingsInput`) automatically include the new field

### 3. Default Settings Hook
**File:** `lib/hooks/use-payroll-settings.ts`

- Updated `DEFAULT_PAYROLL_SETTINGS` to include:
  - `nib_rate: 4.65`
  - `nib_enabled: true`
- Modified `calculateDeductions` function to respect the `nib_enabled` setting:
  - When `nib_enabled` is `true`: Uses the configured NIB rate
  - When `nib_enabled` is `false`: NIB rate becomes 0

### 4. Payroll Settings Form
**File:** `components/settings/payroll/payroll-settings-form.tsx`

Added three form fields with full database integration:
1. **Enable NIB Deductions Toggle** (Switch)
   - Prominent toggle control with description
   - Located at the top of the form
   - **Saves to database on submit**
   
2. **NIB Rate (%)** (Input)
   - Number input for percentage rate
   - Range: 0% to 15%
   - Step: 0.01
   - Default: 4.65%
   - **Disabled when NIB is turned off**
   - **Saves to database on submit**
   
3. **Overtime Rate Multiplier** (Input) - Existing field
   - No changes, remains functional
   - **Saves to database on submit**

**Key Implementation Details:**
- Loads existing settings from database on mount
- Creates new settings if none exist for the company
- Updates existing settings when they exist
- Proper error handling and user feedback via toast notifications

### 5. Payroll Generation Logic
**File:** `lib/data/payroll.ts`

- Imported `getPayrollSettings` function
- Updated `generatePayrollForWorkerAndPeriod` to:
  - Fetch payroll settings before calculating NIB deductions
  - Respect the `nib_enabled` flag
  - Use the configured `nib_rate` from settings
  - Fall back to defaults (enabled: true, rate: 4.65%) if settings not found
  - Added console logging for debugging NIB calculations

### 6. Payroll Page
**File:** `components/payroll/page.tsx`

- Displays NIB deductions directly from payroll records (lines 1487-1497)
- NIB deductions are pre-calculated server-side when payroll is generated
- Stats card shows total NIB remittance based on actual stored values (line 919)
- All NIB values respect the company's `nib_enabled` and `nib_rate` settings
- **Added "Regenerate Period" button** in the page header to regenerate payroll for the current week/period
  - Updates all workers' payroll in the selected period with current settings
  - Shows confirmation dialog before regenerating
  - Displays loading state with spinning icon during regeneration
  - Provides success/error feedback for each worker processed

## How It Works

### For Users With NIB:
1. Navigate to Settings → Company → Payroll tab (or Settings → Payroll)
2. The "Enable NIB Deductions" toggle is ON by default
3. NIB Rate field shows 4.65% (or custom rate)
4. NIB deductions are calculated normally

### For Users Without NIB:
1. Navigate to Settings → Company → Payroll tab (or Settings → Payroll)
2. Toggle OFF "Enable NIB Deductions"
3. NIB Rate field becomes disabled
4. Save the settings
5. **Go to Payroll page and click "Regenerate Period"** to apply changes to existing payroll
6. All NIB deductions are calculated as $0.00
7. Future payroll generations will automatically use 0% NIB

## Technical Details

### Database Schema
```sql
ALTER TABLE payroll_settings
ADD COLUMN IF NOT EXISTS nib_enabled BOOLEAN NOT NULL DEFAULT true;
```

### Calculation Logic
```typescript
const nibEnabled = payrollSettingsResult.data?.nib_enabled ?? true;
const nibRate = payrollSettingsResult.data?.nib_rate ?? 4.65;
const EMPLOYEE_NIB_RATE = nibEnabled ? (nibRate / 100) : 0;
const nibDeduction = grossPay * EMPLOYEE_NIB_RATE;
```

## Benefits

1. **Flexibility**: Businesses can gradually transition to NIB compliance
2. **Accuracy**: Prevents incorrect NIB calculations for non-compliant businesses
3. **User-Friendly**: Simple toggle interface
4. **Safe Defaults**: Existing users maintain NIB enabled by default
5. **Transparent**: Clear indication when NIB is disabled

## Migration Path

For existing companies:
- The migration automatically sets `nib_enabled = true` for all existing records
- No action required from existing users
- Behavior remains unchanged unless explicitly modified

For new companies:
- Default setting is NIB enabled with 4.65% rate
- Can be disabled during initial setup if not applicable

## Testing Checklist

- [x] Toggle NIB on/off in settings
- [x] Verify NIB rate field disables when toggle is off
- [x] Settings save to database properly
- [x] Generate payroll with NIB enabled - verify deductions
- [x] Generate payroll with NIB disabled - verify $0.00 deductions
- [x] Update NIB rate and verify it applies to new payroll records
- [ ] Check existing payroll records are not affected by setting changes
- [x] Verify form validation (rate between 0-15%)
- [x] Verify payroll page displays NIB deductions correctly

## Regenerating Existing Payroll

When you change NIB settings, the changes only apply to:
- **New payroll periods** - Automatically uses current settings
- **Regenerated periods** - Use the "Regenerate Period" button

### How to Apply Settings to Existing Payroll:
1. Change your NIB settings in Settings → Payroll
2. Save the settings
3. Navigate to the Payroll page
4. Select the week/period you want to update using the date picker
5. Click the **"Regenerate Period"** button in the header
6. Confirm the regeneration
7. All workers in that period will have their payroll recalculated with the new settings

### What Regeneration Does:
- Fetches approved timesheets for all workers in the period
- Recalculates gross pay, NIB deductions, and net pay
- Updates existing payroll records with new values
- Applies current NIB settings (enabled/disabled, rate)
- Shows progress and results for all workers processed

## Enhanced Feature: Per-Worker NIB Control

**NEW (2024):** NIB exemptions can now be set **per worker**!

This allows companies to:
- Mark specific workers as exempt from NIB deductions (e.g., contractors, part-time)
- Maintain company-wide NIB settings while handling exceptions
- See "NIB Exempt" badges in the worker table for exempt workers

**See:** `PER_WORKER_NIB_CONTROL.md` for complete documentation on the enhanced system.

### How It Works Now

```
Company NIB Enabled = YES  +  Worker NOT Exempt  →  Apply NIB
Company NIB Enabled = YES  +  Worker IS Exempt   →  No NIB  
Company NIB Enabled = NO   +  Any Worker         →  No NIB
```

## Future Enhancements

Potential improvements:
1. Add employer NIB rate configuration (currently hardcoded at 6.65%)
2. Make employer NIB also respect the toggle and exemptions
3. Add NIB configuration to payroll reports
4. Historical tracking of NIB setting changes
5. Audit log for when NIB is enabled/disabled
6. Batch regenerate multiple periods at once
7. Show visual indicator of which settings version was used for each payroll record
8. Bulk worker exemption management
9. Exemption reason tracking


