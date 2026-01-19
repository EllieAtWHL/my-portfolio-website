# Flexible Update Banner Management

## Overview
The UpdateBanner component is a **flexible, reusable notification system** that can be configured for different sections of the website. It supports multiple banner types, customizable messages, and can be placed in any layout.

## Current Implementations
- **Spurs Women pages**: Warning banner about ongoing data updates
- **London 2012 pages**: Info banner about blog expansion with more content being added

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
- **Spurs Women Layout**: `/src/app/spurs-women/layout.tsx`
- **London 2012 Sidebar**: `/src/components/London2012Sidebar.tsx`

## Usage Examples

### Spurs Women Banner (Warning Type)
```tsx
<UpdateBanner 
  message="is currently being updated with more data and content. Some information may be incomplete while we work to make it comprehensive."
  highlightedText="Spurs Women section"
  type="warning"
  className="mt-20"
/>
```

### London 2012 Banner (Info Type)
```tsx
// Located in: /src/components/London2012Sidebar.tsx
<UpdateBanner 
  message="blog is currently being expanded with more stories and memories from my Olympic journey. Additional content and photos are being added regularly."
  highlightedText="London 2012"
  type="info"
/>
```

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
Edit the props directly in the files:
- **Spurs Women**: `/src/app/spurs-women/layout.tsx`
- **London 2012**: `/src/components/London2012Sidebar.tsx`

### Method 2: Create New Banner Instance
Add a new `<UpdateBanner />` instance in any layout or component with custom props.

## Removing the Banner (When Sections Are Complete)

### Spurs Women Banner Removal

**Step 1: Remove from Spurs Women Layout**
File: `/src/app/spurs-women/layout.tsx`
```tsx
// Remove this line:
import UpdateBanner from "../../components/UpdateBanner";

// Remove this component:
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
- **Spurs Women**: `mt-20` (positions below fixed Spurs navbar - 80px)
- **London 2012**: Top of sidebar component (no additional positioning needed)
- **Padding**: `py-3` (vertical padding)
- **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

## Technical Details

### Component Features
- **Dismissible**: Users can close the banner with X button
- **Theme-aware**: Works with light/dark mode
- **Responsive**: Adapts to all screen sizes
- **Accessible**: Proper ARIA labels and semantic HTML
- **Session-based**: Stays dismissed during current session

### Dependencies
- React hooks: `useState`
- No external dependencies required
- Uses Tailwind CSS classes

## Deployment Notes

### When Going Live
1. The banner is already integrated and working on Spurs Women pages only
2. No additional configuration needed
3. Will appear automatically on all Spurs Women subpages
4. Will NOT appear on other portfolio sections

### When Removing
1. Test thoroughly after removal
2. Check that no layout gaps remain in Spurs Women pages
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
