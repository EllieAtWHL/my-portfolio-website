# CSS Architecture

## Overview

The site's CSS is organized into a modular structure - separate files for global
theme, variables, and per-page styles - rather than one monolithic `globals.css`.
This guide should be referenced when adding new styles or modifying existing ones.

## Structure

```
src/styles/
├── variables.css          # CSS variables (colors, fonts, etc.)
├── main-theme.css         # Global theme styles (buttons, navbar, footer, global classes)
├── about-me.css          # About-me page specific styles
├── experience.css        # Experience page specific styles
├── projects.css          # Projects page specific styles
└── blog.css              # Blog/Lightning Rollout page specific styles
```

## File Structure and Responsibilities

### `variables.css`
- **Purpose:** Centralized CSS custom properties
- **Contains:** Color variables, background variables, font sizes, spacing values
- **Usage:** All other files import this first
- **Rule:** Never add component-specific variables here - only truly global values

### `main-theme.css`
- **Purpose:** Global theme styles used across the entire site
- **Contains:**
  - Button styles (`.button`, `.button.primary`, `.button.secondary`)
  - Navbar styles (`.navbar`, `.navbar-links`)
  - Footer styles (`.footer`)
  - Global page header classes (`.page-header`, `.page-title`, `.page-subtitle`, `.page-title-solid`)
  - Form label styles (`.form-label`)
  - Dark mode variants for all global styles
- **Rule:** Only add styles that are used on 3+ pages

### `about-me.css`
- **Purpose:** About-me page specific styles
- **Contains:**
  - `.about-container`, `.intro`, `.profile`, `.profile-badge`
  - `.highlight`, `.intro-section`, `.accent-card`
  - `.highlight-link`, `.cta-section`
  - Dark mode variants
  - Responsive breakpoints
- **Rule:** Only styles used exclusively on the about-me page

### `experience.css`
- **Purpose:** Experience page specific styles
- **Contains:**
  - `.experience-container`, `.tab-navigation`, `.experience-card`
  - `.card-header`, `.company-logo`, `.job-title`
  - `.certification-card`, `.award-card`
  - Modal styles (`.modal-overlay`, `.modal-content`)
  - Dark mode variants
  - Responsive breakpoints
- **Rule:** Only styles used exclusively on the experience page

### `projects.css`
- **Purpose:** Projects page specific styles
- **Contains:**
  - `.projects-container`, `.projects-grid`, `.project-card`
  - `.card-header`, `.expand-icon`, `.card-description`
  - `.links-container`, `.project-link`, `.coming-soon`
  - Dark mode variants
  - Responsive breakpoints
- **Rule:** Only styles used exclusively on the projects page

### `blog.css`
- **Purpose:** Blog/Lightning Rollout page specific styles
- **Contains:**
  - `.lightning-rollout-container`, `.blog-intro`, `.blog-posts-grid`
  - `.blog-post-card`, `.blog-article`, `.blog-content`
  - `.topic-block`, `.question`, `.blog-navigation`
  - Dark mode variants
  - Responsive breakpoints
- **Rule:** Only styles used exclusively on blog pages

### `globals.css`
- **Purpose:** Entry point for CSS imports and truly global utilities
- **Contains:**
  - Tailwind imports
  - CSS file imports (variables, main-theme, page-specific files)
  - Theme loading prevention styles
  - Global dark mode overrides (`.dark body`, `.dark h1-h4`, `.dark a`)
  - `.content-with-footer` (shared layout class)
  - Form input styles (`.form-input-tall`, `.form-textarea`)
  - Outdated banner styles
  - Organizations table styles
  - Universal mobile responsiveness rules
- **Rule:** Only add styles that cannot be categorized into a specific file

## Global Classes

To avoid duplication, several global classes were created in `main-theme.css`:

### Page Headers
- `.page-header` - Container for page headers (centered, margin-bottom)
- `.page-title` - Gradient title (uses brand gradient)
- `.page-title-solid` - Solid color title (for pages like projects/blog)
- `.page-subtitle` - Subtitle with opacity

**Usage:**
```tsx
<div className="page-header">
  <h1 className="page-title">Page Title</h1>
  <div className="page-subtitle">Subtitle text</div>
</div>
```

### Form Labels
- `.form-label` - Consistent styling for form labels with dark mode support

**Usage:**
```tsx
<label className="form-label">Label Text</label>
```

## Adding New Styles

### When to Add to `main-theme.css`
Add to `main-theme.css` when:
- The style is used on 3+ pages
- The style is a component (button, navbar, footer)
- The style is a utility that could be reused

### When to Create a New Page-Specific File
Create a new page-specific CSS file when:
- Adding a new page section (e.g., `/contact-me` if it has unique styles)
- The styles are only used on one page
- The styles are complex (50+ lines)

### When to Add to `globals.css`
Add to `globals.css` only when:
- The style is truly global (affects the entire site)
- The style is a utility that doesn't fit in any other category
- The style is a dark mode override for a global element

## Dark Mode Guidelines

### Where to Define Dark Mode Styles
- **Global styles:** Define in the same file as the light mode style (e.g., `main-theme.css`)
- **Page-specific styles:** Define in the page-specific CSS file
- **Global overrides:** Define in `globals.css` (e.g., `.dark body`, `.dark h1`)

### Pattern
```css
/* Light mode */
.component {
  color: var(--brand-primary-dark);
}

/* Dark mode */
.dark .component {
  color: var(--dark-accent);
}
```

## Responsive Design Guidelines

### Where to Define Responsive Breakpoints
- **Global styles:** Define in the same file as the base style
- **Page-specific styles:** Define in the page-specific CSS file
- **Universal rules:** Define in `globals.css` (e.g., forcing all cards to be mobile responsive)

### Pattern
```css
.component {
  /* Base styles */
}

@media (max-width: 768px) {
  .component {
    /* Mobile styles */
  }
}

@media (max-width: 480px) {
  .component {
    /* Small mobile styles */
  }
}
```

## Anti-Patterns to Avoid

### ❌ Don't add page-specific styles to `main-theme.css`
```css
/* BAD - page-specific in main-theme */
.about-container {
  max-width: 1000px;
}
```

### ❌ Don't add global styles to page-specific files
```css
/* BAD - global in about-me.css */
.button {
  padding: 0.75rem 1.5rem;
}
```

### ❌ Don't use `!important` unless absolutely necessary
```css
/* BAD - avoid !important */
.component {
  color: var(--brand-primary-dark) !important;
}
```

### ❌ Don't duplicate styles across files
```css
/* BAD - duplicated in multiple files */
.card-header {
  display: flex;
  gap: 1rem;
}
```

Instead, extract to a global class in `main-theme.css`.

## Best Practices

### 1. Use CSS Variables
Always use CSS variables from `variables.css` instead of hardcoding values:
```css
/* GOOD */
color: var(--brand-primary-dark);

/* BAD */
color: #2d5a2d;
```

### 2. Group Related Styles
Keep related styles together in the file:
```css
/* Component styles */
.component { }
.component-header { }
.component-body { }

/* Dark mode */
.dark .component { }
.dark .component-header { }

/* Responsive */
@media (max-width: 768px) {
  .component { }
}
```

### 3. Use Descriptive Class Names
```css
/* GOOD */
.project-card-expand-icon

/* BAD */
.pc-ei
```

### 4. Comment Complex Styles
```css
/* Mobile scrollable links container with custom scrollbar */
@media (max-width: 768px) {
  .links-container.expanded {
    max-height: 400px;
    overflow-y: auto;
  }
}
```

### 5. Test in Both Light and Dark Modes
Always verify styles work correctly in both themes before committing.

## Future Considerations

### Potential Further Improvements
1. **Component-specific CSS files:** Consider creating files for reusable components (e.g., `card.css`, `modal.css`)
2. **Utility CSS file:** Extract utility classes to a separate `utilities.css` file
3. **CSS Modules:** Consider using CSS Modules for component-scoped styles
4. **CSS-in-JS:** Evaluate if a CSS-in-JS solution would be beneficial for the project

### When to Re-evaluate
- If `globals.css` grows beyond 500 lines again
- If duplicate styles start appearing across multiple page files
- If dark mode overrides become difficult to manage
- If responsive breakpoints become inconsistent

## Troubleshooting

### Style Not Applying
1. Check if the CSS file is imported in `globals.css`
2. Verify the class name matches exactly (case-sensitive)
3. Check CSS specificity - a more specific selector may be overriding
4. Check if the style is defined in a later import (later imports override earlier ones)

### Dark Mode Not Working
1. Verify the dark mode selector is `.dark .class` (not `.dark.class`)
2. Check if the CSS variable exists in `variables.css`
3. Verify the dark mode class is applied to the HTML element
4. Check if a more specific selector is overriding the dark mode style

### Responsive Styles Not Working
1. Verify the media query syntax is correct
2. Check if the breakpoint values are appropriate
3. Verify the selector matches the element in the mobile view
4. Check if a universal mobile rule in `globals.css` is overriding

## Contact

For questions about this CSS structure or guidance on adding new styles, refer to this guide first. If unsure, err on the side of creating a new page-specific file rather than adding to an existing one.
