# Inactive Workers Handling - Optimal Implementation

## Current State Analysis

### ✅ Already Implemented:
- `is_active` boolean field exists on workers table
- Worker type includes `is_active: boolean`
- `getWorkers()` supports optional filtering by `is_active`
- `getAvailableWorkers()` already filters to active workers only
- Workers API endpoint (`/api/workers`) filters to active workers only
- Worker table UI shows Active/Inactive badges

### ❌ Current Issues:
1. **`fetchWorkersForCompany()`** returns ALL workers (no filtering)
   - Used in timesheets page for worker selection
   - Inactive workers appear in timesheet assignment dropdowns
   - No distinction between active/inactive in timesheet views

2. **No UI toggle** to show/hide inactive workers in main list

3. **Historical data** doesn't clearly indicate if workers were active at that time

## Optimal Solution: Progressive Filtering Strategy

### Principle: **"Hide by default, preserve history, allow access when needed"**

## Implementation Plan

### 1. **Timesheet & Payroll Creation (EXCLUDE Inactive)**

#### A. Update `fetchWorkersForCompany()` 
**File:** `lib/data/data.ts`

```typescript
export async function fetchWorkersForCompany(
  userId: string,
  options: { includeInactive?: boolean } = {}
) {
  const profile = await getProfile(userId);
  
  if (!profile) {
    return [];
  }

  let query = supabase
    .from("workers")
    .select("*")
    .eq("company_id", profile.company_id);

  // By default, only return active workers
  if (!options.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = query.order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch workers: " + error.message);
  return data ?? [];
}
```

**Impact:**
- ✅ Timesheets page: Only active workers in selection
- ✅ Payroll generation: Only active workers
- ✅ Bulk timesheet: Only active workers
- ✅ Project assignments: Only active workers

#### B. Update Payroll Generation
**File:** `lib/data/payroll.ts`

Ensure `getAggregatedPayrolls()` and generation functions skip inactive workers unless they have existing timesheets for the period.

### 2. **Worker Management List (TOGGLE to Show/Hide)**

#### A. Add Filter Toggle
**File:** `components/workers/worker-table.tsx`

```typescript
const [showInactive, setShowInactive] = useState(false);

// In the filter section
<div className="flex items-center space-x-2">
  <Switch
    id="show-inactive"
    checked={showInactive}
    onCheckedChange={setShowInactive}
  />
  <Label htmlFor="show-inactive">Show Inactive Workers</Label>
</div>

// Update the fetch call
useEffect(() => {
  fetchWorkers({ includeInactive: showInactive });
}, [showInactive]);
```

**Benefits:**
- Clean list by default (only active workers)
- Easy access to inactive workers when needed
- Clear visual separation

### 3. **Historical Data (PRESERVE & DISPLAY)**

#### A. Timesheets - Show All Historical Records
**File:** `components/timesheets/timesheets-page.tsx`

```typescript
// When displaying existing timesheets, show ALL workers
const loadWorkers = async () => {
  // Load active workers for NEW assignments
  const activeWorkers = await fetchWorkersForCompany(user.id);
  setActiveWorkers(activeWorkers);
  
  // Load ALL workers (including inactive) for historical display
  const allWorkers = await fetchWorkersForCompany(user.id, { includeInactive: true });
  setAllWorkers(allWorkers);
}

// Use activeWorkers for new timesheet creation
// Use allWorkers for displaying existing timesheets
```

**Result:**
- ✅ Historical timesheets show worker names correctly (even if now inactive)
- ✅ New timesheets can only be assigned to active workers
- ✅ Visual indicator shows inactive status on historical entries

#### B. Payroll - Preserve Historical Records
Similar approach: Display all payroll records but only generate new ones for active workers.

### 4. **Visual Indicators**

#### A. Inactive Worker Badge in Timesheet Rows
```tsx
{worker.is_active ? null : (
  <Badge variant="outline" className="ml-2 text-xs">
    Inactive
  </Badge>
)}
```

#### B. Grayed Out Style for Inactive Workers
```tsx
<tr className={worker.is_active ? "" : "opacity-60 bg-gray-50 dark:bg-gray-900"}>
```

### 5. **Worker Status Change Workflow**

#### A. Add Deactivation Confirmation Dialog
```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Deactivate Worker?</AlertDialogTitle>
      <AlertDialogDescription>
        {workerName} will be removed from:
        • New timesheet assignments
        • Payroll generation
        • Project assignments
        
        Historical data will be preserved.
        You can reactivate this worker anytime.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogAction onClick={handleDeactivate}>
        Deactivate Worker
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### B. Easy Reactivation
- Add "Reactivate" button on inactive worker rows
- Simple toggle, no data loss

## Database Indexes (Performance)

```sql
-- Add index for active worker queries
CREATE INDEX IF NOT EXISTS idx_workers_company_active 
ON workers(company_id, is_active) 
WHERE is_active = true;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_workers_active_created 
ON workers(is_active, created_at DESC) 
WHERE is_active = true;
```

## Summary of Changes Required

### Files to Modify:

1. **`lib/data/data.ts`**
   - Update `fetchWorkersForCompany()` with `includeInactive` option

2. **`components/workers/worker-table.tsx`**
   - Add "Show Inactive" toggle switch
   - Update worker fetching logic

3. **`components/timesheets/timesheets-page.tsx`**
   - Fetch active workers for new assignments
   - Fetch all workers for historical display
   - Add inactive badge to rows

4. **`components/timesheets/add-timesheet-dialog.tsx`**
   - Only show active workers in dropdown

5. **`components/forms/bulk-timesheet-form.tsx`**
   - Only show active workers

6. **`lib/data/payroll.ts`**
   - Skip inactive workers in new payroll generation
   - Preserve historical records

7. **Database Migration** (optional performance)
   - Add indexes for active worker queries

## UX Flow Examples

### Scenario 1: Manager Creating Timesheet
1. Opens timesheet creation dialog
2. Sees dropdown with ONLY active workers
3. Cannot assign timesheet to inactive workers
4. ✅ Clean, focused selection

### Scenario 2: Viewing Historical Timesheets
1. Views timesheet list for previous month
2. Sees all timesheets including those for now-inactive workers
3. Inactive workers have grayed rows + "Inactive" badge
4. ✅ Full historical visibility

### Scenario 3: Managing Worker List
1. Views worker list (only active by default)
2. Toggles "Show Inactive Workers"
3. Sees inactive workers in grayed section
4. Can reactivate with one click
5. ✅ Clean default, easy access when needed

### Scenario 4: Running Payroll
1. Generates payroll for period
2. System automatically skips inactive workers
3. If inactive worker has approved timesheets, shows warning:
   "Worker X is inactive but has approved timesheets. Include in payroll?"
4. ✅ Smart handling of edge cases

## Benefits of This Approach

### For Users:
- ✅ **Cleaner UI** - Only see relevant workers
- ✅ **Prevents Errors** - Can't assign work to inactive workers
- ✅ **Historical Integrity** - All past data preserved
- ✅ **Flexibility** - Easy to view inactive when needed
- ✅ **Clear Indicators** - Always know worker status

### For Business:
- ✅ **Compliance** - Complete audit trail
- ✅ **Data Integrity** - No orphaned records
- ✅ **Efficiency** - Faster dropdowns, focused lists
- ✅ **Scalability** - Performance optimized with indexes

### For Development:
- ✅ **Backward Compatible** - Doesn't break existing data
- ✅ **Consistent Pattern** - Same approach across all modules
- ✅ **Performance** - Smaller result sets by default
- ✅ **Maintainable** - Clear separation of concerns

## Alternative Approaches (Not Recommended)

### ❌ Soft Delete (archive inactive workers)
- **Problem:** Breaks foreign key relationships
- **Problem:** Loses historical context
- **Problem:** Complex to implement

### ❌ Show All Workers Always
- **Problem:** Cluttered UI as company grows
- **Problem:** Confusing for users
- **Problem:** Performance issues with large datasets

### ❌ Hard Delete Inactive Workers
- **Problem:** Loses historical data
- **Problem:** Breaks audit trail
- **Problem:** Cannot reverse decision

## Implementation Priority

### Phase 1 (Critical - Do First):
1. Update `fetchWorkersForCompany()` with filtering
2. Update timesheets page to use filtered workers
3. Add inactive badge to historical displays

### Phase 2 (Important):
4. Add toggle to worker list
5. Update bulk timesheet form
6. Update payroll generation logic

### Phase 3 (Nice to Have):
7. Add indexes for performance
8. Add reactivation workflow
9. Add deactivation confirmation dialog
10. Add analytics for inactive worker trends

## Testing Checklist

- [ ] Create timesheet → only active workers shown
- [ ] View historical timesheet → inactive workers visible with badge
- [ ] Generate payroll → inactive workers excluded
- [ ] Worker list default → only active workers
- [ ] Worker list with toggle → inactive workers shown
- [ ] Deactivate worker → disappears from new assignments
- [ ] Deactivate worker → still visible in historical data
- [ ] Reactivate worker → appears in dropdowns again
- [ ] Performance test with 1000+ workers
- [ ] Verify no orphaned data after deactivation


