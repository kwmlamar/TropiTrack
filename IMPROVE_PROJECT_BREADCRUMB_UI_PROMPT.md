# Improve Project Breadcrumb UI in Site Header

## Objective
Enhance the visual design and functionality of the "Project / [Project Name]" breadcrumb in the SiteHeader component on the project details page. Make it more aesthetically pleasing, modern, and user-friendly with better typography, spacing, and interactive elements.

## Current State
- **Location:** `app/dashboard/projects/[id]/page.tsx` (lines 214-218)
- **Current Implementation:**
  ```tsx
  title={
    <>
      <span className="text-gray-500">Project</span> <span className="text-gray-500"> / </span> {project.name}
    </>
  }
  ```
- **Rendering:** The title is rendered in `components/site-header.tsx` as a simple `<h1>` element (line 114)
- **Styling:** Basic gray text with a plain "/" separator

## Available Resources
- There's an existing `Breadcrumb` component in `components/ui/breadcrumb.tsx` with proper semantic structure
- The component includes `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator` with ChevronRight icons
- Other pages in the codebase use more polished navigation (e.g., checkout page with back buttons)

## Design Goals

### Visual Improvements
1. **Better Typography Hierarchy:**
   - "Project" should be subtle (gray/muted)
   - Project name should be prominent (dark/foreground)
   - Use proper font weights (medium/semibold for project name)
   - Better font size and spacing

2. **Modern Separator:**
   - Replace plain "/" with a chevron icon (ChevronRight from lucide-react)
   - Proper spacing around separator
   - Subtle color that doesn't compete with text

3. **Interactive Elements:**
   - Make "Project" clickable/linkable to navigate back to `/dashboard/projects`
   - Add hover state on "Project" link
   - Smooth transition effects

4. **Layout & Spacing:**
   - Proper padding and margins
   - Better alignment with other header elements
   - Responsive design (handle long project names gracefully with truncation)
   - Consider adding a subtle icon before the breadcrumb (optional)

### Optional Enhancements
- Add a back button (ArrowLeft icon) before the breadcrumb for quick navigation
- Add a subtle background or border for visual separation (optional)
- Add an icon (e.g., FolderIcon) next to "Project" for visual interest
- Show project status badge next to name (optional, if project has status)

## Implementation Tasks

### 1. Update Project Details Page Title
**File:** `app/dashboard/projects/[id]/page.tsx`

Replace the simple title structure with a proper breadcrumb component:
- Use the `Breadcrumb` component from `@/components/ui/breadcrumb`
- Import necessary components: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`
- Structure:
  ```tsx
  title={
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard/projects">
            Project
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {project.name}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  }
  ```

### 2. Enhance SiteHeader Title Rendering
**File:** `components/site-header.tsx`

Improve how the title is rendered in the header:
- Update the title rendering section (around line 108-114)
- Detect if title is a ReactNode with breadcrumb structure
- Apply appropriate styling for breadcrumb vs plain text titles
- Ensure proper spacing and alignment

**Styling considerations:**
- Breadcrumb should have consistent font sizes
- "Project" link should be muted but clearly clickable
- Project name should be bold/semibold
- Proper hover states on links
- Responsive truncation for long project names

### 3. Custom Breadcrumb Styling
**Option A:** Update the existing breadcrumb component styling if needed
**Option B:** Add custom classes in the project page for specific styling

Create a styled version that:
- Uses proper color hierarchy (muted for parent, bold for current)
- Has smooth hover transitions
- Handles long text with ellipsis
- Maintains visual balance with header tabs

### 4. Add Back Button (Optional Enhancement)
**File:** `components/site-header.tsx` or create new component

If adding a back button:
- Add an optional `showBackButton` prop to SiteHeader
- Render ArrowLeft icon button before breadcrumb
- Navigate to `/dashboard/projects` on click
- Style consistently with other header elements
- Only show on project details page

### 5. Responsive Behavior
Ensure the breadcrumb works well on all screen sizes:
- Mobile: May need to hide "Project" text, show icon only, or truncate
- Tablet: Full breadcrumb with proper truncation
- Desktop: Full breadcrumb with all elements visible
- Long project names: Truncate with ellipsis and show tooltip on hover (optional)

## Design Specifications

### Typography
- **"Project" (Link):**
  - Font size: `text-sm` or `text-base`
  - Font weight: `font-medium` or `font-normal`
  - Color: Muted (`text-muted-foreground` or `text-gray-500`)
  - Hover: Darker color (`text-foreground` or `text-gray-700`)
  - Transition: `transition-colors duration-200`

- **Separator:**
  - Icon: `ChevronRight` from lucide-react
  - Size: `h-3.5 w-3.5` or `h-4 w-4`
  - Color: Muted (`text-muted-foreground` or `text-gray-400`)
  - Spacing: `mx-1` or `mx-2`

- **Project Name (Current):**
  - Font size: `text-base` or `text-lg`
  - Font weight: `font-semibold` or `font-bold`
  - Color: Foreground (`text-foreground`)
  - Truncate: `truncate max-w-[200px] sm:max-w-[300px]` or similar

### Spacing
- Overall breadcrumb container: Proper padding and margin
- Items: `gap-1.5` or `gap-2` between items
- Consistent with header height (h-16)

### Interactive States
- **Link hover:**
  - Underline (optional): `hover:underline`
  - Color change: `hover:text-foreground`
  - Cursor: `cursor-pointer`
  
- **Focus states:**
  - Visible focus ring for accessibility
  - `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`

## Example Code Structure

```tsx
// In project details page:
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

title={
  <Breadcrumb>
    <BreadcrumbList className="flex items-center">
      <BreadcrumbItem>
        <BreadcrumbLink 
          href="/dashboard/projects"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Project
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="text-muted-foreground" />
      <BreadcrumbItem>
        <BreadcrumbPage className="text-base font-semibold truncate max-w-[300px]">
          {project.name}
        </BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
}
```

## Testing Checklist

- [ ] Breadcrumb displays correctly with proper spacing
- [ ] "Project" link is clickable and navigates to projects list
- [ ] Hover states work properly on the link
- [ ] Separator (chevron) displays correctly
- [ ] Project name is prominent and readable
- [ ] Long project names truncate gracefully
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Keyboard navigation works (Tab, Enter on link)
- [ ] Focus states are visible for accessibility
- [ ] Visual hierarchy is clear (muted parent, bold current)
- [ ] Styling matches overall design system

## Files to Modify

1. **Modify:**
   - `app/dashboard/projects/[id]/page.tsx` - Update title prop with breadcrumb component
   - `components/site-header.tsx` - Potentially update title rendering for better breadcrumb support

2. **Consider:**
   - `components/ui/breadcrumb.tsx` - Review if any default styles need adjustment

## Success Criteria

✅ Breadcrumb looks modern and aesthetically pleasing
✅ Clear visual hierarchy (muted parent, bold current)
✅ Interactive "Project" link with smooth hover states
✅ Professional separator using chevron icon
✅ Responsive design handles all screen sizes
✅ Long project names handled gracefully
✅ Accessibility features work (keyboard navigation, focus states)
✅ Consistent with overall design system

## Inspiration References

- Modern breadcrumb patterns from tools like Linear, Notion, or Figma
- Clean navigation with subtle hover states
- Professional typography hierarchy
- Consistent spacing and alignment
