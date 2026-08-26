# Button Component Migration Guide

## Overview
Your new Button component consolidates all button patterns into a single, reusable component with TypeScript support and enhanced accessibility.

## Available Variants
- **`primary`** - Standard blue button for primary actions
- **`secondary`** - Gray button for secondary actions (used in examples/forms)
- **`ghost`** - Text-only button with hover effects
- **`spurs`** - Navy blue button with Spurs branding (used throughout Spurs Women sections)

## Available Sizes
- **`xs`** - Extra small buttons (px-1.5 py-1 text-sm)
- **`sm`** - Small buttons (px-3 py-1.5 text-sm)
- **`md`** - Medium buttons (px-4 py-2 text-base) - **default**
- **`lg`** - Large buttons (px-6 py-3 text-lg)

## Usage Examples

### Basic Buttons
```tsx
// Before
<button className="button primary">Click me</button>

// After
<Button variant="primary">Click me</Button>
```

### Spurs Branded Buttons (Common in Spurs Women)
```tsx
// Used throughout Spurs Women sections
<Button variant="spurs">Back to Seasons</Button>
<Button variant="spurs" fullWidth>View Match Details</Button>
```

### Icon Buttons
```tsx
// Before
<button className="button secondary">
  <span className="mr-2">→</span>
  Next
</button>

// After
<Button variant="secondary" icon="→" iconPosition="right">
  Next
</Button>
```

### Loading State
```tsx
<Button variant="primary" loading>
  Loading...
</Button>
```

### Full Width Buttons
```tsx
<Button variant="primary" fullWidth>
  Submit Form
</Button>
```

### As Child Elements (Links, etc.)
```tsx
<Button variant="primary" asChild>
  <a href="/about">As Link</a>
</Button>
```

## Common Patterns in Your Codebase

### Spurs Women Sections
```tsx
// Navigation and actions
<Button variant="spurs">Back to Seasons</Button>
<Button variant="spurs">View Match Details</Button>

// Filters and secondary actions
<Button variant="secondary" icon="→" iconPosition="right">
  Filter
</Button>
```

### Forms and General Use
```tsx
// Primary actions
<Button variant="primary">Submit</Button>
<Button variant="primary" loading>Processing...</Button>

// Secondary actions
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">Learn More</Button>
```

## Notes
- The `secondary` variant is actively used in forms and examples
- The `spurs` variant is heavily used throughout Spurs Women sections
- All variants support loading states and icons
- Component is fully accessible with proper ARIA support
```tsx
// For subtle actions
<Button variant="ghost">Edit</Button>
```

## Migration Steps

1. **Import the component:**
   ```tsx
   import { Button } from '@/components/Button';
   ```

2. **Replace button elements:**
   - Find `<button className="button primary">` → `<Button variant="primary">`
   - Find `<button className="button secondary">` → `<Button variant="secondary">`
   - Add `size` prop for different sizes (sm, md, lg)
   - Use `icon` and `iconPosition` for icon buttons

3. **Update custom inline styles:**
   ```tsx
   // Before
   <button className="button primary px-6 py-3">Large Button</button>
   
   // After
   <Button variant="primary" size="lg">Large Button</Button>
   ```

## Migration Status

### ✅ Completed Migration (examples)
- `src/components/spurs-women/MediaGallery.tsx` - Fully migrated to new Button component
- `src/app/about-me/page.tsx` - Migrated
- `src/app/contact-me/page.tsx` - Migrated
- `src/app/contact-me/thank-you/page.tsx` - Migrated
- `src/app/page.tsx` - Migrated
- `src/app/spurs-women/matches/page.tsx` - Migrated
- `src/app/spurs-women/page.tsx` - Migrated
- `src/components/ButtonExamples.tsx` - Migrated
- `src/components/LightningRolloutPart1.tsx` - Migrated
- `src/components/LightningRolloutPart2.tsx` - Migrated
- `src/components/LightningRolloutPart3.tsx` - Migrated

### ⚠️ Migration Incomplete

Migration is **not** complete. As of the last audit (2026-08), 13 production files still render raw `<button>` elements instead of the shared `Button` component (in addition to `Button.tsx` itself, `spurs-women/SpursTabButton.tsx` — a shared Spurs Women tab-button component, same exemption as `Button.tsx`: it legitimately renders a native `<button>` internally so its own two consumers don't have to — and `regicide/StatsIconButton.tsx`, same exemption again: it deliberately does *not* look like a `Button` at all, restoring the original site's low-opacity icon-only stats trigger rather than a filled/labelled button):

- `src/components/admin/TabNav.tsx` (generic tab switcher, used for the admin page's matches/teams/players/stadiums tabs and edit sub-tabs — since the admin page decomposition, `src/app/spurs-women/admin/page.tsx` itself no longer renders any raw `<button>` directly)
- `src/components/Modal.tsx` (close button)
- `src/components/UpdateBanner.tsx` (dismiss button)
- `src/components/ExperienceContent.tsx` (tab switcher)
- `src/components/London2012Layout.tsx` (mobile navigation toggle)
- `src/components/London2012Gallery.tsx` (prev/next/dot navigation)
- `src/components/regicide/StatsScreen.tsx` (close/reset buttons)
- `src/components/regicide/PlayArea.tsx` (sort-hand toggle)
- `src/components/regicide/GameOverModal.tsx` (close button)
- `src/components/regicide/Toast.tsx` (dismiss-on-click toast)
- `src/components/admin/MatchForm.tsx` (collapsible section toggles)
- `src/components/admin/ColorPicker.tsx` (swatch/custom color buttons)
- `src/components/spurs-women/LightboxGallery.tsx` (prev/next/close/thumbnail buttons)

`TeamClient.tsx`'s current/former squad toggle and `TeamLineup.tsx`'s starters/substitutes/unused toggle no longer appear here - both now use the shared `SpursTabButton` above instead of a raw `<button>` each. `PlayerModal.tsx` (previously listed) has been deleted outright - it was dead code, never actually triggered to open from anywhere.

Most of these are small icon-only or tab-toggle buttons with bespoke styling (not the `.button primary`/`.button secondary` CSS classes this guide was originally written to migrate away from), so they may be a lower priority than the original `.button` class cleanup — but they are still raw `<button>` elements outside the shared component, and this list should be treated as the current source of truth rather than the "100% complete" claim below.

### 📊 Migration Progress
**Not 100% complete** — the original `.button primary`/`.button secondary` CSS-class migration described above is done, but 13 files still use native `<button>` elements outside the `Button` component (see list above). Re-run `grep -rn "<button" src --include='*.tsx'` (excluding `Button.tsx`, `SpursTabButton.tsx`, and `__tests__/`) to get a current count.

## Benefits

✅ **Type Safety**: Full TypeScript support  
✅ **Consistency**: Unified button patterns  
✅ **Accessibility**: Focus management, keyboard navigation  
✅ **Flexibility**: Variants, sizes, icons, loading states  
✅ **Maintainability**: Single source of truth for button styles
