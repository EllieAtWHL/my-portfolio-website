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

## Files to Update

Based on your codebase, consider updating these files:
- `src/components/MediaGallery.tsx`
- `src/components/LightboxGallery.tsx`
- `src/components/ExperienceContent.tsx`
- `src/components/regicide/GameControls.tsx`
- `src/components/regicide/GameStart.tsx`
- `src/components/regicide/StatsScreen.tsx`
- `src/components/Navbar.tsx`
- `src/app/matches/page.tsx`

## Benefits

✅ **Type Safety**: Full TypeScript support  
✅ **Consistency**: Unified button patterns  
✅ **Accessibility**: Focus management, keyboard navigation  
✅ **Flexibility**: Variants, sizes, icons, loading states  
✅ **Maintainability**: Single source of truth for button styles
