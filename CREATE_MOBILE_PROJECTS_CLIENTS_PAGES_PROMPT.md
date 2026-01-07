# Prompt for Claude: Create PWA Mobile Pages for Projects and Clients

## Context
TropiTrack is a PWA (Progressive Web App) workforce management application for construction companies in The Bahamas. The app uses a mobile-first design approach with dedicated mobile views for PWA/standalone mode, following Connecteam-inspired design patterns.

## Existing Mobile Pages Reference
The app already has mobile pages that follow consistent patterns:
- **Mobile Dashboard** (`components/dashboard/mobile-dashboard.tsx`) - Greeting header, primary action buttons, stats cards
- **Mobile Assets Page** (`components/assets/mobile-assets-page.tsx`) - Section-based card layout with navigation buttons
- **Mobile Payroll Overview** (`components/payroll/mobile-payroll-overview.tsx`) - List view with cards, sticky header, period navigation
- **Mobile Workers** (`components/workers/mobile-workers-list.tsx`) - List of workers with avatars and details

## Design Philosophy
All mobile pages follow these principles:
1. **Native App Feel**: Clean, simple, native mobile app aesthetic (Connecteam-inspired)
2. **Mobile-First**: Optimized for phone screens (375px - 414px width)
3. **Vertical Stacking**: Content flows vertically, not in grids
4. **Touch-Friendly**: Large tap targets (minimum 44px height), generous spacing
5. **Clear Hierarchy**: Prominent headers, clear section separation
6. **Card-Based Layout**: Information organized in distinct, tappable cards
7. **Consistent Navigation**: Fixed bottom navigation bar (`MobileBottomNav` component)
8. **Bottom Padding**: Account for fixed bottom nav (`pb-28` or `pb-32`)
9. **Clean Headers**: Simple header with back button and page title (provided by `DashboardLayout`)

## Task: Create Two Mobile Pages

### 1. Mobile Projects Page
**File**: `components/projects/mobile-projects-list.tsx`

**Requirements**:
- Display a list of all projects for the company
- Each project card should show:
  - Project name (prominent, large text)
  - Location (secondary text, gray)
  - Client name (if available)
  - Number of workers assigned (with icon)
  - Start date (formatted nicely)
  - Status badge (if applicable: Active, Completed, On Hold)
- Cards should be tappable and navigate to `/dashboard/projects/[id]`
- Use card-based layout similar to mobile payroll overview
- Include loading state with spinner
- Include empty state when no projects exist
- Fetch projects using client-side Supabase query (similar to mobile payroll)
- Use `createClient` from `@/utils/supabase/client`

**Data to Display**:
- Project name
- Location
- Client name (from client_id relationship)
- Workers assigned count
- Start date
- Status (if available)

**Visual Design**:
- White cards with subtle border and shadow
- Rounded corners (rounded-xl)
- Proper spacing between cards (space-y-3)
- ChevronRight icon on the right side of each card
- Avatar/icon placeholder for project (can use FolderKanban icon in colored circle)

### 2. Mobile Clients Page
**File**: `components/clients/mobile-clients-list.tsx`

**Requirements**:
- Display a list of all clients for the company
- Each client card should show:
  - Client name (prominent, large text)
  - Email (secondary text, gray)
  - Phone number (if available)
  - Company name (if available)
- Cards should be tappable and navigate to `/dashboard/clients/[id]`
- Use card-based layout similar to mobile projects
- Include loading state with spinner
- Include empty state when no clients exist
- Fetch clients using client-side Supabase query
- Use `createClient` from `@/utils/supabase/client`

**Data to Display**:
- Client name
- Email
- Phone (if available)
- Company name (if available)

**Visual Design**:
- White cards with subtle border and shadow
- Rounded corners (rounded-xl)
- Proper spacing between cards (space-y-3)
- ChevronRight icon on the right side of each card
- Avatar with initials (similar to mobile workers list)

## Technical Requirements

### Client-Side Data Fetching
Both pages should use client-side Supabase queries (not server-side functions):
```typescript
import { createClient } from "@/utils/supabase/client"

const supabase = createClient()
// Query data directly using supabase.from()
```

### Component Structure
1. **Client Component Wrapper** (similar to `ProjectsPageClient`):
   - File: `components/projects/projects-page-client.tsx` (update existing)
   - File: `components/clients/clients-page-client.tsx` (create new)
   - Detects mobile/PWA mode using `useIsMobile()` and `isPWAStandalone()`
   - Conditionally renders mobile or desktop view

2. **Mobile List Components**:
   - `components/projects/mobile-projects-list.tsx` (create new)
   - `components/clients/mobile-clients-list.tsx` (create new)
   - Self-contained mobile views with data fetching

3. **Page Updates**:
   - `app/dashboard/projects/page.tsx` - Already uses `ProjectsPageClient`, should work
   - `app/dashboard/clients/page.tsx` - Update to use `ClientsPageClient`

### Navigation
- Include `MobileBottomNav` component at the bottom
- Use `useRouter` from `next/navigation` for navigation
- Cards should use `onClick` handlers to navigate

### Styling
- Use Tailwind CSS classes
- Follow existing mobile page patterns:
  - `min-h-screen bg-gray-50 pb-28` for main container
  - `bg-white border border-gray-200 rounded-xl` for cards
  - `text-base font-semibold text-gray-900` for primary text
  - `text-sm text-gray-500` for secondary text
  - Proper spacing: `px-4 pt-6 space-y-3`

### Loading States
- Show spinner while loading (use Loader2 from lucide-react)
- Center the spinner with proper spacing

### Empty States
- Show friendly empty state message
- Include icon (Search or FolderKanban for projects, Building2 for clients)
- Suggest action if applicable

## Implementation Steps

1. **Create Mobile Projects List Component**:
   - Create `components/projects/mobile-projects-list.tsx`
   - Implement client-side data fetching
   - Create card-based list layout
   - Add loading and empty states
   - Include MobileBottomNav

2. **Create Mobile Clients List Component**:
   - Create `components/clients/mobile-clients-list.tsx`
   - Implement client-side data fetching
   - Create card-based list layout
   - Add loading and empty states
   - Include MobileBottomNav

3. **Create/Update Client Wrappers**:
   - Update `components/projects/projects-page-client.tsx` to conditionally render mobile view
   - Create `components/clients/clients-page-client.tsx` with mobile/desktop detection

4. **Update Page Routes**:
   - Ensure `app/dashboard/projects/page.tsx` works with updated client wrapper
   - Update `app/dashboard/clients/page.tsx` to use `ClientsPageClient`

## Code Patterns to Follow

### Data Fetching Pattern (from mobile-payroll-overview.tsx):
```typescript
const [projects, setProjects] = useState<Project[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  loadProjects()
}, [])

const loadProjects = async () => {
  setLoading(true)
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("projects")
      .select("*, clients(id, name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
    
    if (error) {
      console.error("Error loading projects:", error)
      toast.error("Failed to load projects")
      return
    }
    
    if (data) {
      setProjects(data)
    }
  } catch (error) {
    console.error("Error loading projects:", error)
    toast.error("Failed to load projects")
  } finally {
    setLoading(false)
  }
}
```

### Card Layout Pattern (from mobile-payroll-overview.tsx):
```typescript
<button
  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
  className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 active:bg-gray-50 transition-all"
>
  {/* Avatar/Icon */}
  <div className="flex-shrink-0 w-12 h-12 bg-[#2596be]/10 rounded-xl flex items-center justify-center">
    <FolderKanban className="w-6 h-6 text-[#2596be]" />
  </div>
  
  {/* Content */}
  <div className="flex-1 min-w-0 text-left">
    <p className="text-base font-semibold text-gray-900">{project.name}</p>
    <p className="text-sm text-gray-500">{project.location || "No location"}</p>
  </div>
  
  {/* Chevron */}
  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
</button>
```

## Deliverables

1. `components/projects/mobile-projects-list.tsx` - Mobile projects list component
2. `components/clients/mobile-clients-list.tsx` - Mobile clients list component
3. `components/clients/clients-page-client.tsx` - Client wrapper for clients page
4. Updated `components/projects/projects-page-client.tsx` - Add mobile view support
5. Updated `app/dashboard/clients/page.tsx` - Use ClientsPageClient

## Notes

- Ensure all components are properly typed with TypeScript
- Use existing type definitions from `@/lib/types`
- Follow the same error handling patterns as other mobile pages
- Test that navigation works correctly
- Ensure bottom navigation is visible and functional
- Make sure pages work in both PWA standalone mode and mobile browser view

