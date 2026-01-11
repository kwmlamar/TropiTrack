# Move Project Details Tabs to Site Header and Improve UI

## Objective
Move the project details page tabs (Overview, QR Codes, Documents, Invoices) from the main content area into the SiteHeader component, and improve the UI to match Toggl Track's clean, modern tab design.

## Current State
- The project details page (`app/dashboard/projects/[id]/page.tsx`) currently has tabs rendered in the main content area (lines 220-256)
- Tabs are using a custom design with underline animation
- The SiteHeader component already supports similar tab patterns for Reports and Settings

## Reference Implementation
Look at how Reports tabs are implemented:
- `components/reports/reports-header-wrapper.tsx` - Wrapper component that uses SiteHeader with tabs
- `components/site-header.tsx` - Has `showReportsTabs` prop that displays tabs in the center section (lines 137-169)
- The Reports tabs use a clean design with icons and rounded borders

## Toggl Track Tab Design Reference
Based on the screenshot provided, the tabs should have:
- Clean, minimal design with subtle borders
- Active tab indicated by a purple underline (similar to current implementation but refined)
- Tabs positioned in the header, not in the content area
- Smooth transitions and hover states
- Professional spacing and typography

## Tasks

### 1. Update SiteHeader Component
**File:** `components/site-header.tsx`

Add support for project tabs similar to reports tabs:
- Add new props:
  - `showProjectTabs?: boolean`
  - `activeProjectTab?: string` (default: "overview")
  - `onProjectTabChange?: (tab: string) => void`
- In the center section (around line 136), add conditional rendering for project tabs when `showProjectTabs` is true
- Style the tabs to match Toggl Track's design:
  - Use rounded borders similar to reports tabs
  - Add a purple underline indicator for the active tab (refine the current underline animation)
  - Ensure proper spacing and typography
  - Make tabs responsive (hide text on mobile, show icons only if needed)
- The tabs should be: Overview, QR Codes, Documents, Invoices

### 2. Create Project Tabs Context (Optional but Recommended)
**File:** `context/project-tabs-context.tsx` (create new file)

Create a context provider similar to `context/reports-tabs-context.tsx`:
- Manage active tab state
- Provide `useProjectTabs()` hook
- Default tab should be "overview"

### 3. Create Project Header Wrapper Component
**File:** `components/projects/project-header-wrapper.tsx` (create new file)

Create a wrapper component similar to `components/reports/reports-header-wrapper.tsx`:
- Accept `title` and `children` props
- Use the project tabs context (or local state if context not used)
- Render `SiteHeader` with:
  - `showProjectTabs={true}`
  - `activeProjectTab` from context/state
  - `onProjectTabChange` handler
  - `hideDateRangePicker={true}` (project details don't need date picker in header)

### 4. Update Project Details Page
**File:** `app/dashboard/projects/[id]/page.tsx`

- Remove the tabs from the main content area (lines 220-256)
- Remove the `TabsList` and `TabsTrigger` components from the content
- Keep the `Tabs` wrapper and `TabsContent` components but move them to use the header tabs
- Wrap the page content with the new `ProjectHeaderWrapper` component
- Update the `Tabs` component to be controlled by the header tab state:
  - Use `value={activeTab}` from context/state
  - Use `onValueChange={setActiveTab}` handler
- Ensure all tab content sections remain functional:
  - Overview (lines 258-297)
  - QR Codes (lines 299-301)
  - Documents (lines 303-305)
  - Invoices (lines 307-313)

### 5. Update DashboardLayout Integration
**File:** `components/layouts/dashboard-layout.tsx` or wherever DashboardLayout is used

If needed, ensure the project header wrapper integrates properly with the dashboard layout structure. The wrapper should replace or work alongside the existing title prop.

## UI Design Specifications

### Tab Styling (Toggl Track Inspired)
- **Container**: Clean, minimal design with subtle background
- **Active Tab Indicator**: Purple underline (2px height) that animates smoothly
- **Tab Text**: 
  - Font: Medium weight, readable size (14px base)
  - Inactive: Gray text (#6B7280 or similar)
  - Active: Dark text with purple accent
- **Hover State**: Subtle background change or text color shift
- **Spacing**: Adequate padding (px-4 py-2.5 minimum)
- **Border**: Subtle border on tabs (similar to reports tabs) or clean borderless design
- **Transitions**: Smooth 300ms transitions for all state changes

### Layout
- Tabs should be positioned in the center section of SiteHeader (where date picker normally appears)
- Tabs should be left-aligned within the center section
- Maintain responsive behavior (consider mobile layout)

## Implementation Notes

1. **State Management**: 
   - Use React Context for tab state (recommended for consistency with reports)
   - Or use local state in the wrapper component
   - Ensure state persists or resets appropriately on navigation

2. **URL Integration** (Optional Enhancement):
   - Consider adding URL hash or query params to reflect active tab
   - This allows direct linking to specific tabs

3. **Accessibility**:
   - Ensure proper ARIA labels on tabs
   - Keyboard navigation should work correctly
   - Focus states should be visible

4. **Mobile Responsiveness**:
   - On mobile, tabs might need to scroll horizontally or stack
   - Consider icon-only tabs on very small screens

## Testing Checklist

- [ ] Tabs appear in SiteHeader on project details page
- [ ] Tabs are no longer visible in the main content area
- [ ] Clicking tabs changes the content correctly
- [ ] Active tab has purple underline indicator
- [ ] Hover states work properly
- [ ] Transitions are smooth
- [ ] Mobile layout is responsive
- [ ] All four tabs (Overview, QR Codes, Documents, Invoices) work correctly
- [ ] Default tab is "overview"
- [ ] Tab state persists during navigation within the page

## Files to Modify/Create

1. **Modify:**
   - `components/site-header.tsx` - Add project tabs support
   - `app/dashboard/projects/[id]/page.tsx` - Remove tabs from content, integrate header tabs

2. **Create (Recommended):**
   - `context/project-tabs-context.tsx` - Tab state management
   - `components/projects/project-header-wrapper.tsx` - Header wrapper component

## Example Code Structure

```tsx
// In SiteHeader center section:
{showProjectTabs ? (
  <Tabs value={activeProjectTab} onValueChange={onProjectTabChange} className="w-auto">
    <TabsList className="inline-flex h-auto items-center justify-start p-0 bg-transparent border-none gap-1">
      <TabsTrigger value="overview" className="...">
        Overview
        {/* Purple underline indicator */}
      </TabsTrigger>
      {/* Other tabs */}
    </TabsList>
  </Tabs>
) : (
  !hideDateRangePicker && <DateRangePicker />
)}
```

## Success Criteria

✅ Tabs are successfully moved to SiteHeader
✅ UI matches Toggl Track's clean, professional design
✅ All functionality remains intact
✅ Responsive design works on all screen sizes
✅ Code follows existing patterns (similar to Reports tabs implementation)
