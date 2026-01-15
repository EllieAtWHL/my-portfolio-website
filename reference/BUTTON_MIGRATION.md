# Button Component Migration Guide

## Overview
Your new Button component consolidates all button patterns into a single, reusable component with TypeScript support and enhanced accessibility.

## Usage Examples

### Basic Buttons
```tsx
// Before
<button className="button primary">Click me</button>
<button className="button secondary">Cancel</button>

// After
<Button variant="primary">Click me</Button>
<Button variant="secondary">Cancel</Button>
```

### Icon Buttons
```tsx
// Before
<button className="button secondary">
  <span className="mr-2">→</span>
  Next
</button>

// After
<Button variant="secondary" icon="→" iconPosition="left">
  Next
</Button>
```

### Loading States
```tsx
// Before
<button className="button primary" disabled>
  <span className="animate-spin">⟳</span>
  Loading...
</button>

// After
<Button variant="primary" loading>
  Loading...
</Button>
```

### Full Width Buttons
```tsx
// Before
<button className="button primary w-full">Submit</button>

// After
<Button variant="primary" fullWidth>Submit</Button>
```

### Ghost Buttons (New)
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

### ❌ Files Still Needing Migration

#### High Priority (Direct button class usage)
- `src/components/regicide/GameControls.tsx` - Lines 14, 28: Uses `className="button secondary"` and `className="button primary"`
- `src/components/regicide/GameStart.tsx` - Line 30: Uses `className="button secondary"`
- `src/components/regicide/PlayArea.tsx` - Line 39: Uses `className="button secondary"`
- `src/components/regicide/StatsScreen.tsx` - Line 154: Uses inline button styling instead of Button component

#### Medium Priority (Cleanup needed)
- `src/app/contact-me/page.tsx` - Line 152: Has redundant `className="button primary"` on Button component
- `src/app/contact-me/thank-you/page.tsx` - Line 58: Has redundant `className="button primary"` on Button component

#### Low Priority (Specialized buttons - may not need migration)
- `src/components/spurs-women/LightboxGallery.tsx` - Uses `lightbox-nav-button` class (custom styling for lightbox)
- `src/components/ExperienceContent.tsx` - Uses `tab-button` class (tab navigation styling)
- `src/components/Header.tsx` - Uses `toggle-button` class (menu toggle styling)
- `src/components/spurs-women/SpursHeader.tsx` - Uses `toggle-button` class (menu toggle styling)

#### Not Found
- `src/components/Navbar.tsx` - Not found in codebase
- `src/app/matches/page.tsx` - Not found (likely `src/app/spurs-women/matches/page.tsx`)

### 📊 Migration Progress
**~70% Complete** - 11 files migrated, 6 files still need migration, 2 files need cleanup

## Benefits

✅ **Type Safety**: Full TypeScript support  
✅ **Consistency**: Unified button patterns  
✅ **Accessibility**: Focus management, keyboard navigation  
✅ **Flexibility**: Variants, sizes, icons, loading states  
✅ **Maintainability**: Single source of truth for button styles
