# Prompt for Claude: Improve Profile Page Flow for PWA Mobile View

## Context
TropiTrack is a PWA (Progressive Web App) workforce management application designed for construction companies in The Bahamas. The app uses a mobile-first design approach, with a dedicated mobile dashboard and bottom navigation bar for PWA/standalone mode.

## Current State
The profile page (`/dashboard/profile`) currently uses a desktop-focused layout with:
- A two-column grid (sidebar with profile overview + main form area)
- Multiple Card components for organization
- Form fields laid out in a grid
- Desktop-oriented spacing and typography
- Security settings section below the main form

This layout doesn't work well on mobile devices and doesn't match the native app-like experience of other mobile pages (like the mobile dashboard).

## Design Inspiration: Connecteam Profile Page
The profile page should closely match Connecteam's mobile profile page design and layout:

### Connecteam Profile Page Structure (Top to Bottom):
1. **Profile Header Section** (Hero-style area)
   - Large avatar/profile picture at the top (centered or left-aligned)
   - User's full name (prominent, large text)
   - Role/position below name
   - Company name (if applicable)
   - Optional: QR code badge/icon for quick identification

2. **Quick Info Cards** (Horizontal scrollable or stacked)
   - Contact information (email, phone)
   - Employee ID/ID number
   - Department/Team
   - Join date/Member since

3. **Editable Sections** (List-style with chevrons/arrows)
   - Personal Information (tap to edit)
   - Contact Details (tap to edit)
   - Emergency Contacts (tap to edit)
   - Documents/Attachments (tap to view/manage)

4. **Action Sections** (Grouped by category)
   - Settings & Preferences
   - Security & Privacy
   - Account Management

5. **Additional Sections** (If applicable)
   - Activity Timeline/History
   - Recognition & Rewards
   - Performance Metrics

### Key Connecteam Design Characteristics:
- **Clean, Minimal Design**: White backgrounds, subtle borders, generous spacing
- **Card-based Layout**: Information grouped in distinct cards/sections
- **List-style Navigation**: Tap-to-edit fields with chevron indicators (→)
- **Large Touch Targets**: All interactive elements are easily tappable
- **Visual Hierarchy**: Most important info (name, photo) at top, less critical info below
- **In-context Editing**: Forms appear in-place or in modals, not separate pages
- **Consistent Spacing**: Generous padding between sections (16px-24px gaps)
- **Subtle Separators**: Thin borders or dividers between sections
- **Rounded Corners**: Cards and buttons have rounded corners (8px-12px radius)

## Mobile Design Philosophy
The mobile/PWA view follows these principles (as seen in the mobile dashboard):
1. **Native App Feel**: Clean, simple, native mobile app aesthetic (exactly like Connecteam)
2. **Mobile-First**: Optimized for phone screens (typically 375px - 414px width)
3. **Vertical Stacking**: Content flows vertically, not in grids
4. **Touch-Friendly**: Large tap targets (minimum 44px height), generous spacing
5. **Clear Hierarchy**: Prominent headers, clear section separation
6. **Minimal Distractions**: Focus on essential actions and information
7. **Consistent Navigation**: Fixed bottom navigation bar (MobileBottomNav component)
8. **Clean Headers**: Simple header with back button and page title
9. **Bottom Padding**: Account for fixed bottom nav (pb-28 or similar)
10. **Card-based Sections**: Information organized in distinct, tappable cards
11. **In-place Editing**: Edit forms appear modally or inline, maintaining context

## Requirements

### 1. Layout Structure
- **Full-width single column** layout (no sidebars or grids on mobile)
- **Vertical stacking** of all sections
- **Proper bottom padding** (pb-28 or pb-32) to account for fixed MobileBottomNav
- **Header consistency** with other mobile pages (back button + title, sticky at top)

### 2. Profile Header Section (Connecteam-style)
- **Large avatar** at the top (80px-100px, centered or left-aligned)
- **Full name** displayed prominently (text-2xl or text-3xl, bold)
- **Role/position** below name (text-base, text-gray-600)
- **Company name** (text-sm, text-gray-500)
- **Hero-style area**: White background, optional subtle gradient or border-bottom
- **Layout**: Stacked vertically, centered or left-aligned
- **Spacing**: Generous padding (pt-6 pb-6 px-5)
- **Optional**: QR code icon/badge for identification (top-right corner)

### 3. Quick Info Section (Connecteam-style Cards)
- **Horizontal cards** or **stacked cards** showing key information
- **Each card** contains:
  - Icon (left side, small, colored or gray)
  - Label (small text, gray)
  - Value (medium text, black)
- **Card styling**: White background, border-gray-200, rounded-lg, shadow-sm
- **Information to display**:
  - Email address (with Mail icon)
  - Phone number (with Phone icon)
  - Company/Department (with Building2 icon)
  - Member since/Join date (with Calendar icon)
- **Layout**: Full-width cards stacked vertically (gap-3 or gap-4)
- **Interactive**: Cards can be tappable to edit (with chevron-right icon)

### 4. Editable Sections (Connecteam-style List)
- **List-style layout**: Each section is a card with tappable rows
- **Section structure**:
  - Section header (e.g., "Personal Information", "Contact Details")
  - Multiple rows, each row showing:
    - Icon (optional, left side)
    - Label (e.g., "Full Name", "Email")
    - Value (current value or "Not set")
    - Chevron-right icon (→) indicating tappable
  - Border between rows (border-b border-gray-100)
  - Last row has no border-bottom
- **Tap to edit**: Tapping a row opens edit modal/form for that field or section
- **Visual style**: 
  - White card background
  - Rounded corners (rounded-xl)
  - Subtle shadow (shadow-sm)
  - Padding inside (p-4)
- **Sections to include**:
  - Personal Information (name, role, bio)
  - Contact Details (email, phone, location)
  - Additional Info (website, notes)
  - Security Settings (password, 2FA, account deletion)

### 5. Security & Account Settings
- **Separate card section**: Distinct from profile info
- **List-style rows**: Each security option is a row in a card
- **Row structure**:
  - Icon + Label (left side)
  - Toggle/Switch or Chevron (right side)
  - Optional description text below label (small, gray)
- **Security options**:
  - Change Password (chevron → opens modal)
  - Two-Factor Authentication (toggle switch)
  - Privacy Settings (chevron → opens settings)
- **Danger zone** (at bottom):
  - Separated with divider
  - Delete Account (red text, chevron → opens confirmation modal)
- **Visual distinction**: Danger actions use text-red-600 or text-red-500

### 6. Edit/Save Pattern (Connecteam-style)
- **In-place editing**: No global "Save" button on profile page
- **Per-section editing**: Each row/section opens its own edit modal/form
- **Modal forms**: When tapping a row, open a modal with:
  - Header with title (e.g., "Edit Full Name")
  - Form fields (Input, Textarea, Select)
  - Cancel button (left)
  - Save button (right, primary color)
- **Immediate feedback**: 
  - Toast notification on save success
  - Updated value reflected immediately in the list
  - Loading state in modal while saving
- **Validation**: Show errors inline in the modal form
- **No bulk editing**: Each field/section is edited independently

### 7. Navigation Integration
- **MobileBottomNav**: Must be visible and functional (Profile button should be active)
- **Page header**: 
  - Back button (left, ArrowLeft icon)
  - Page title "Profile" (center or left-aligned)
  - Optional: Settings/More icon (right, only if needed)
- **No desktop sidebar**: Hide desktop sidebars on mobile/PWA mode
- **Smooth transitions**: Page transitions and modal animations should feel native
- **Scroll behavior**: Content scrolls smoothly, header stays sticky

## Design Patterns to Follow

### Reference Components
- **Mobile Dashboard** (`components/dashboard/mobile-dashboard.tsx`): Clean header, vertical stacking, prominent actions
- **Mobile Bottom Nav** (`components/mobile-bottom-nav.tsx`): Fixed navigation, white background, icon + label
- **Log Hours Form** (`components/timesheets/log-hours-form.tsx`): Mobile-first form layout, sticky header, bottom padding

### Visual Style (Connecteam-inspired)
- **Colors**: 
  - Primary brand color: `#2596be` (for accents, links, active states)
  - Text: `text-gray-900` (primary), `text-gray-600` (secondary), `text-gray-500` (tertiary)
  - Backgrounds: `bg-white` (cards), `bg-gray-50` (page background)
  - Borders: `border-gray-200` (subtle separators)
- **Typography**: 
  - Name: `text-2xl` or `text-3xl`, `font-bold`
  - Role: `text-base`, `font-medium`, `text-gray-600`
  - Section headers: `text-base`, `font-semibold`, `text-gray-900`
  - Labels: `text-sm`, `font-medium`, `text-gray-700`
  - Values: `text-sm` or `text-base`, `text-gray-900`
- **Spacing**: 
  - Page padding: `px-5` or `px-6`
  - Section gaps: `gap-4` or `gap-6` (24px)
  - Card padding: `p-4` (16px)
  - Row padding: `py-3` or `py-4`
- **Cards/Borders**: 
  - White backgrounds: `bg-white`
  - Subtle borders: `border border-gray-200`
  - Rounded corners: `rounded-xl` (12px) or `rounded-lg` (8px)
  - Shadows: `shadow-sm` (minimal) or none
- **Icons**: 
  - Size: `h-5 w-5` (20px) for list icons
  - Color: `text-gray-400` or `text-gray-500`
  - Chevrons: `h-5 w-5`, `text-gray-400` (for tappable rows)

### Interaction Patterns
- **Touch targets**: Minimum 44px height for buttons and clickable elements
- **Active states**: Visual feedback on tap (active:scale-[0.98] or bg-gray-50)
- **Transitions**: Smooth transitions (transition-all, duration-200)
- **Loading states**: Spinners, disabled states, skeleton screens

## Technical Requirements

### Mobile Detection
- Only apply mobile layout when:
  - Screen width < 768px (Tailwind `md:` breakpoint) OR
  - PWA standalone mode detected (`isPWAStandalone()` utility)
- Desktop layout should remain unchanged

### Component Structure
- Create a mobile-specific profile component or conditionally render mobile layout
- Use existing UI components (Button, Input, Card, Avatar, etc.) but adapt layout
- Maintain form validation and submission logic
- Keep server-side data fetching (if applicable)

### File Structure
- **Option 1**: Create `components/profile/mobile-profile-form.tsx` and conditionally render
- **Option 2**: Update `components/profile/profile-form.tsx` to be responsive
- **Option 3**: Create mobile wrapper in `app/dashboard/profile/page.tsx`

### Accessibility
- Proper semantic HTML (form, section, header elements)
- ARIA labels for icons and buttons
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Specific Improvements to Focus On

1. **Information Hierarchy**: Make the most important info (name, role, company) most prominent
2. **Scanability**: Use visual grouping, spacing, and typography to make content easy to scan
3. **Action Clarity**: Make it clear what actions are available (edit, save, security settings)
4. **Reduced Cognitive Load**: Don't show everything at once; use progressive disclosure if needed
5. **Context Preservation**: User should always know where they are (header, breadcrumbs if helpful)
6. **Error Prevention**: Clear validation, helpful error messages, confirmation for destructive actions
7. **Performance**: Fast load times, smooth scrolling, no layout shifts

## Deliverables

Please provide:
1. **Component file(s)** created or updated
2. **Layout structure** explanation
3. **Key design decisions** and rationale
4. **Responsive breakpoints** used
5. **Any helper components** introduced
6. **Accessibility considerations** implemented
7. **Testing notes** (what to test on mobile devices)

## Notes

- The app uses **Next.js 14+** with App Router
- **Tailwind CSS** for styling
- **React Hook Form** + **Zod** for form management
- **shadcn/ui** components (Button, Input, Card, Avatar, etc.)
- **Lucide React** for icons
- **TypeScript** for type safety

Focus on creating a smooth, intuitive mobile experience that feels like a native app while maintaining all existing functionality.

