# Flexible Update Banner Management

## Overview
The UpdateBanner component is a **flexible, reusable notification system** that can be configured for different sections of the website. It supports multiple banner types, customizable messages, and can be placed in any layout.

## Current Implementations
- **Spurs Women pages**: ❌ No longer implemented - the warning banner was removed from `src/app/spurs-women/layout.tsx`; that layout no longer imports or renders `UpdateBanner` at all.
- **London 2012 pages**: Info banner in `London2012Sidebar.tsx`, now with a shorter message ("More stories coming soon.") and no `highlightedText` prop set (see Usage Examples below).

## Component Features
- **4 Banner Types**: warning, info, success, notice (each with unique colors and icons)
- **Customizable Messages**: Separate highlighted text and main message
- **Optional Dismissal**: Can be made non-dismissible if needed
- **Flexible Positioning**: Custom className support for positioning
- **Theme-aware**: Works with both light and dark modes
- **Responsive**: Adapts to all screen sizes
- **Accessible**: Proper ARIA labels and semantic HTML

## Location
- **Component**: `/src/components/UpdateBanner.tsx`
- **London 2012 Sidebar**: `/src/components/London2012Sidebar.tsx` (only current usage in the codebase)

## Usage Examples

### London 2012 Banner (Info Type) - current, actual usage
```tsx
// Located in: /src/components/London2012Sidebar.tsx
<UpdateBanner 
  message="More stories coming soon."
  type="info"
  className="mb-6"
/>
```
Note: no `highlightedText` is set for this instance, so the message renders without a bold lead-in.

## Component Props

### BannerProps Interface
```tsx
interface BannerProps {
  message: string;           // Main message text
  highlightedText?: string;   // Optional highlighted/bold text
  type?: 'warning' | 'info' | 'success' | 'notice';  // Banner style
  dismissible?: boolean;     // Show/hide dismiss button (default: true)
  className?: string;        // Additional CSS classes
}
```

## Updating the Banner Text

### Method 1: Edit in Layout/Component (Recommended)
Edit the props directly in the file:
- **London 2012**: `/src/components/London2012Sidebar.tsx` (only current usage)

### Method 2: Create New Banner Instance
Add a new `<UpdateBanner />` instance in any layout or component with custom props.

## Removing the Banner (When Sections Are Complete)

### Spurs Women Banner Removal - already done

The Spurs Women warning banner has already been removed from
`/src/app/spurs-women/layout.tsx`; that layout no longer imports or renders
`UpdateBanner` at all (see "Current Implementations" above). This section is
kept only as a record of what the removal looked like, in case a similar
banner is ever added back to that layout:

```tsx
// Previously removed:
import UpdateBanner from "../../components/UpdateBanner";

<UpdateBanner 
  message="is currently being updated with more data and content. Some information may be incomplete while we work to make it comprehensive."
  highlightedText="Spurs Women section"
  type="warning"
  className="mt-20"
/>
```

### London 2012 Banner Removal

**Step 1: Remove from London 2012 Sidebar**
File: `/src/components/London2012Sidebar.tsx`
```tsx
// Remove this line:
import UpdateBanner from './UpdateBanner';

// Remove this component:
<UpdateBanner 
  message="blog is currently being expanded with more stories and memories from my Olympic journey. Additional content and photos are being added regularly."
  highlightedText="London 2012"
  type="info"
/>
```

**Step 2: Delete Component File (Optional)**
```bash
rm /src/components/UpdateBanner.tsx
```

### Alternative: Temporary Disabling

If you want to keep the component for future use:

**Option 1: Comment out in Spurs Women layout**
```tsx
{/* <UpdateBanner /> */}
```

**Option 2: Disable in component**
File: `/src/components/UpdateBanner.tsx`
```tsx
export default function UpdateBanner() {
  return null; // Always returns null
}
```

## Banner Types & Styling

### Available Types
- **warning**: Amber/yellow theme - for alerts and warnings
- **info**: Blue theme - for informational messages  
- **success**: Green theme - for success messages
- **notice**: Gray theme - for neutral notices

### Colors (by Type)
File: `/src/components/UpdateBanner.tsx`

#### Warning (Amber)
- **Background**: `bg-amber-100 dark:bg-amber-900`
- **Border**: `border-amber-300 dark:border-amber-700`
- **Text**: `text-amber-700 dark:text-amber-200`

#### Info (Blue)
- **Background**: `bg-blue-100 dark:bg-blue-900`
- **Border**: `border-blue-300 dark:border-blue-700`
- **Text**: `text-blue-700 dark:text-blue-200`

#### Success (Green)
- **Background**: `bg-green-100 dark:bg-green-900`
- **Border**: `border-green-300 dark:border-green-700`
- **Text**: `text-green-700 dark:text-green-200`

#### Notice (Gray)
- **Background**: `bg-gray-100 dark:bg-gray-900`
- **Border**: `border-gray-300 dark:border-gray-700`
- **Text**: `text-gray-700 dark:text-gray-200`

### Positioning
- **London 2012**: Top of sidebar component (no additional positioning needed)
- **Spurs Women**: N/A - no longer rendered there (see "Current Implementations" above); when it was, it used `mt-20` to sit below the fixed Spurs navbar (80px)
- **Padding**: `py-3` (vertical padding)
- **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

## Technical Details

### Component Features
- **Dismissible**: Users can close the banner with X button
- **Theme-aware**: Works with light/dark mode
- **Responsive**: Adapts to all screen sizes
- **Accessible**: Proper ARIA labels and semantic HTML
- **In-memory only**: dismissal is local `useState` in `UpdateBanner.tsx`, not persisted to `sessionStorage`/`localStorage` - it resets on every remount, e.g. navigating between London 2012 sub-pages (each mounts a fresh `London2012Layout`/`London2012Sidebar` instance, since there's no shared `layout.tsx` under `src/app/london-2012/`)

### Dependencies
- React hooks: `useState`
- No external dependencies required
- Uses Tailwind CSS classes

## Deployment Notes

### When Going Live
1. The banner is already integrated and working on the London 2012 sidebar only (see "Current Implementations" above)
2. No additional configuration needed
3. Will appear automatically on all London 2012 subpages
4. Will NOT appear on other portfolio sections or on Spurs Women pages

### When Removing
1. Test thoroughly after removal
2. Check that no layout gaps remain in the London 2012 sidebar
3. Verify responsive behavior still works
4. Ensure other portfolio sections remain unaffected

## Future Considerations

### Reusability
The component is generic enough to be repurposed for:
- Maintenance notifications
- Feature announcements
- Holiday messages
- Security alerts

### Enhancement Ideas
- Add different banner types (info, warning, success)
- Add expiration date functionality
- Add analytics tracking for dismissals
- Add animation effects
