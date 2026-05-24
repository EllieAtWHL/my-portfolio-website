# Button Component Migration Guide

## Overview
Your new Button component consolidates all button patterns into a single, reusable component with TypeScript support and enhanced accessibility.

## Available Variants
- **`primary`** - Standard blue button for primary actions
- **`secondary`** - Gray button for secondary actions (used in examples/forms)
- **`ghost`** - Text-only button with hover effects
- **`spurs`** - Navy blue button with Spurs branding (used throughout Spurs Women sections)

## Available Sizes
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

### ✅ Completed Migration
- `src/components/spurs-women/MediaGallery.tsx` - Fully migrated to new Button component
- `src/app/about-me/page.tsx` - Migrated
- `src/app/contact-me/page.tsx` - Migrated (has redundant className)
- `src/app/contact-me/thank-you/page.tsx` - Migrated (has redundant className)
- `src/app/page.tsx` - Migrated
- `src/app/spurs-women/matches/page.tsx` - Migrated
- `src/app/spurs-women/page.tsx` - Migrated
- `src/components/ButtonExamples.tsx` - Migrated
- `src/components/LightningRolloutPart1.tsx` - Migrated
- `src/components/LightningRolloutPart2.tsx` - Migrated
- `src/components/LightningRolloutPart3.tsx` - Migrated

### ✅ Migration Complete

All files have been successfully migrated to use the Button component. No files remain with old button class usage patterns.

### 📊 Migration Progress
**100% Complete** - All files migrated to Button component

## Benefits

✅ **Type Safety**: Full TypeScript support  
✅ **Consistency**: Unified button patterns  
✅ **Accessibility**: Focus management, keyboard navigation  
✅ **Flexibility**: Variants, sizes, icons, loading states  
✅ **Maintainability**: Single source of truth for button styles
