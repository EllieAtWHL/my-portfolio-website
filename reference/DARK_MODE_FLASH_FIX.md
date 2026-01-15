# Dark Mode Flash Fix

## Problem
When the page loads on a device with dark mode enabled, there was a brief flash of light mode before the correct dark theme was applied. This happened because the theme was being applied client-side in a React `useEffect` hook, which runs after the initial render.

## Solution
The fix involves three key components:

### 1. Blocking Script in Layout
Added a blocking script in `src/app/layout.tsx` that runs immediately in the `<head>` before any content renders:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        function getSystemPreference() {
          return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        
        function applyTheme() {
          const systemPreference = getSystemPreference();
          
          if (systemPreference) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
          }
          
          // Remove the loading attribute to show content
          document.documentElement.removeAttribute('data-theme-loading');
        }
        
        // Apply theme immediately before page renders
        applyTheme();
      })();
    `,
  }}
/>
```

### 2. Theme Loading Attribute
Added `data-theme-loading` attribute to the `<html>` element by default:

```tsx
<html
  lang="en"
  suppressHydrationWarning
  data-theme-loading
>
```

### 3. CSS Flash Prevention
Updated CSS in `src/app/globals.css` to hide content during theme loading:

```css
/* Hide content until theme is applied to prevent flash */
html[data-theme-loading] {
  visibility: hidden;
}

/* Show content immediately when theme is applied */
html:not([data-theme-loading]) {
  visibility: visible;
}
```

### 4. Hydration Warning Suppression
Added `suppressHydrationWarning` to the `<html>` element to prevent hydration mismatches between server and client rendering.

## How It Works
1. The HTML element starts with `data-theme-loading` attribute, which hides the content via CSS
2. The blocking script runs immediately, detects system preference, and applies the appropriate theme classes
3. The script removes the `data-theme-loading` attribute, making the content visible
4. The ThemeProvider component still runs client-side for user-initiated theme changes, but the initial flash is prevented

## Testing
To verify the fix works:
1. Set your system to dark mode
2. Open the site in a new tab/incognito window
3. The page should load directly in dark mode without any flash of light mode

## If This Fix Gets Broken
If the dark mode flash returns, check these components in order:
1. Ensure the blocking script is present in `layout.tsx`
2. Verify `data-theme-loading` attribute is on the `<html>` element
3. Check CSS rules for `html[data-theme-loading]` are present
4. Confirm `suppressHydrationWarning` is on the `<html>` element

## Alternative Approaches Considered
- **CSS-only solution**: Using `prefers-color-scheme` in CSS, but this doesn't work with the custom theme system
- **Server-side detection**: Not possible for client-side preferences
- **Loading spinner**: Adds unnecessary UX complexity

This solution provides the best balance of preventing the flash while maintaining the existing theme system architecture.
