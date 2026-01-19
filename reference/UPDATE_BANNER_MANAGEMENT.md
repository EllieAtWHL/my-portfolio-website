# Update Banner Management

## Overview
The UpdateBanner component displays a notification to inform visitors about ongoing updates to the Spurs Women section. It now appears **only on Spurs Women pages** for better user experience and relevance.

## Location
- **Component**: `/src/components/UpdateBanner.tsx`
- **Layout Integration**: `/src/app/spurs-women/layout.tsx` (Spurs Women pages only)
- **Previously**: `/src/app/layout.tsx` (global - moved for better targeting)

## Updating the Banner Text

### Where to Edit
File: `/src/components/UpdateBanner.tsx`
Lines: **30-33**

```tsx
<p className="text-sm text-amber-700 dark:text-amber-200">
  <span className="font-medium">Spurs Women section</span> is currently being updated with more data and content. 
  Some information may be incomplete while we work to make it comprehensive.
</p>
```

### Customization Options
- **Main message**: Edit the text between the `<p>` tags
- **Highlighted section**: Modify the `<span className="font-medium">` content
- **Tone**: Keep it informative but friendly
- **Length**: Keep it concise for better UX

## Removing the Banner (When Spurs Women Section is Complete)

### Complete Removal (Recommended)

**Step 1: Remove from Spurs Women Layout**
File: `/src/app/spurs-women/layout.tsx`
```tsx
// Remove this line:
import UpdateBanner from "../../components/UpdateBanner";

// Remove this component:
<UpdateBanner />
```

**Step 2: Delete Component File**
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

## Styling Customization

### Colors (if you want to change the theme)
File: `/src/components/UpdateBanner.tsx`
- **Background**: `bg-amber-100 dark:bg-amber-900`
- **Border**: `border-amber-300 dark:border-amber-700`
- **Text**: `text-amber-700 dark:text-amber-200`
- **Icon**: `text-amber-600 dark:text-amber-400`

### Positioning
- **Margin**: `mt-20` (positions below fixed Spurs navbar - 80px)
- **Padding**: `py-3` (vertical padding)
- **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Location**: Positioned between SpursHeader and main content wrapper

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
