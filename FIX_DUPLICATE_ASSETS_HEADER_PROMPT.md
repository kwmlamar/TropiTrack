# Prompt for Claude: Fix Duplicate "Assets" Header in Mobile PWA View

## Problem
The Assets page in the PWA mobile view currently displays two "Assets" headers:
1. One from the `DashboardLayout` component (via `title="Assets"` prop in `app/dashboard/projects/page.tsx`)
2. Another from the `MobileAssetsPage` component's internal sticky header (line 129 in `components/assets/mobile-assets-page.tsx`)

This creates a duplicate header that looks unprofessional and wastes vertical space on mobile devices.

## Current Implementation

### File: `app/dashboard/projects/page.tsx`
```tsx
<DashboardLayout 
  title="Assets" 
  fullWidth={true}
  headerActions={<AssetsHeaderActions desktopActions={<ProjectsHeaderActions userId={user.id} />} />}
>
  <ProjectsPageClient user={user} />
</DashboardLayout>
```

### File: `components/assets/mobile-assets-page.tsx`
The component has its own sticky header section (lines 126-154) that includes:
- A title "Assets" (line 129)
- A search bar (lines 133-153)

## Requirements

1. **Remove the duplicate "Assets" title** from `MobileAssetsPage` component
2. **Remove the search bar** - remove the search functionality entirely for now
3. **Remove search-related state and logic** - clean up any search-related code (searchQuery state, filteredSections, clearSearch function, etc.)
4. **Simplify the component** - display all asset sections without filtering
5. **Only affect mobile/PWA view** - desktop view should remain unchanged

## Expected Result

After the fix:
- Only ONE "Assets" header should appear (from `DashboardLayout`)
- No search bar or search functionality
- All asset sections should be displayed directly without any filtering
- Cleaner, simpler component structure

## Technical Notes

- The `DashboardLayout` component already provides the page title via the `title` prop
- The `MobileAssetsPage` component should remove both the title and search bar from the sticky header
- Remove all search-related state: `searchQuery`, `filteredSections` (use `assetSections` directly instead)
- Remove search-related functions: `clearSearch`, search filtering logic
- Remove the sticky header section entirely (lines 126-154)
- Remove the empty state for search results (lines 158-176)
- Remove the results count display (lines 221-226)
- Simplify the asset sections rendering to use `assetSections` directly instead of `filteredSections`

## Files to Modify

1. `components/assets/mobile-assets-page.tsx` - Remove the entire sticky header section and all search-related code

## Implementation Guidance

1. Remove the sticky header section (lines 126-154) completely
2. Remove `searchQuery` state (line 46)
3. Remove `filteredSections` useMemo (lines 99-113) - use `assetSections` directly instead
4. Remove `clearSearch` function (lines 119-121)
5. Remove search-related imports if no longer needed (`Search`, `X` icons)
6. Update the asset sections rendering to use `assetSections` directly instead of `filteredSections`
7. Remove the empty state check for search results
8. Remove the results count display
9. Adjust padding/spacing at the top of the asset sections container to account for the removed header

