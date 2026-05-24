# Coding Agent Rules for my-portfolio-website

## Project Context & Philosophy

**Project Nature**: Personal, non-commercial project and unofficial fan site. Balance professional engineering standards against personal maintainability, learning, and low operational overhead.

**Copyright & Trademark**: 
- Avoid use of official logos, crests, or trademarks as primary design elements
- Prefer original photography or permissibly licensed assets
- Club-related imagery should be contextual and non-commercial
- Avoid creating visuals that could be interpreted as official branding

## Technology Stack

**Mandatory Stack**:
- Framework: Next.js 16.2.6 (App Router)
- Styling: Tailwind CSS v4
- Language: TypeScript 5
- Deployment: Vercel
- Package management: npm
- Data: Supabase for database, RSS Parser for content feeds

## Architecture & Organization

**File Structure**:
- Feature-based organization, not page-based sprawl
- Clear separation between shared/global components and feature-specific code
- Personal site features vs Spurs Women–specific features
- Server components by default, client components only where interaction/browser APIs required

**Component Principles**:
- Components should be small, focused, and composable
- Prefer composition over inheritance
- No hard-coded text inside reusable components
- Props should be explicit and typed
- Components should not assume routing context unless route-level
- Shared components live outside feature folders
- Feature-specific components live within their feature boundary

## CSS & Styling Rules

**CSS Variables (CRITICAL)**:
- **ALWAYS use CSS variables for colors - never hardcode color values in CSS**
- Use CSS variables for: colors (mandatory), spacing where appropriate, font decisions
- **CSS Variable Limitation**: Cannot use with `rgba()` for opacity (e.g., `rgba(var(--color), 0.2)` is invalid)
- When transparency needed: use hardcoded RGB values with opacity, create separate CSS variables for transparent versions, or use opacity CSS properties

**Modular CSS Structure**:
- `variables.css`: Only truly global values (colors, fonts, spacing) - never component-specific variables
- `main-theme.css`: Only styles used on 3+ pages (buttons, navbar, footer, global classes)
- Page-specific CSS files: Only styles used exclusively on that page
- `globals.css`: Only styles that cannot be categorized into a specific file

**CSS Anti-Patterns**:
- ❌ Don't add page-specific styles to `main-theme.css`
- ❌ Don't add global styles to page-specific files
- ❌ Don't use `!important` unless absolutely necessary
- ❌ Don't duplicate styles across files (extract to global class instead)
- ❌ No inline styles unless absolutely unavoidable

**CSS Best Practices**:
- Always use CSS variables from `variables.css` instead of hardcoding
- Group related styles together (component styles, dark mode, responsive)
- Use descriptive class names
- Comment complex styles
- Test in both light and dark modes

**Dark Mode**:
- Define dark mode styles in same file as light mode style
- Pattern: `.dark .component` selector
- Global overrides in `globals.css` (e.g., `.dark body`, `.dark h1`)

**Responsive Design**:
- Define responsive breakpoints in same file as base style
- Universal mobile rules in `globals.css`
- Pattern: `@media (max-width: 768px)` for mobile styles

## TypeScript & Code Quality

**TypeScript Rules**:
- Use TypeScript everywhere
- All components and utilities must have proper typing
- Explicit is better than implicit
- Strict TypeScript configuration

**Code Quality Principles**:
- Clarity over cleverness
- Prefer boring, well-understood solutions
- Treat codebase as something returned to in years, not weeks
- Avoid hacks, one-off overrides, or brittle workarounds
- Optimize for readability and long-term maintainability over speed of delivery

## Testing Requirements (MANDATORY)

**All new components and utilities MUST include tests**:
1. Unit Tests - For utility functions and pure logic
2. Component Tests - For React components using React Testing Library
3. Edge Case Testing - Error states, missing props, invalid inputs
4. Accessibility Testing - ARIA labels, semantic structure
5. TypeScript Coverage - Proper typing for all new code

**Test Organization**:
- Place tests in `__tests__` directories alongside source code
- Naming convention: `ComponentName.test.tsx` or `utilityName.test.ts`
- Use descriptive test names that explain behavior
- Group related tests with `describe` blocks

**Quality Gates**:
- Tests must pass before deployment (CI/CD gate)
- Coverage targets: >90% on new code
- New code should not reduce overall test coverage
- Tests should be maintainable and easy to understand

## Routing & Navigation

- Use Next.js App Router exclusively
- `/` and related routes belong to personal site
- `/spurs-women` and sub-routes belong to Spurs Women site
- Use nested layouts to share global navigation and metadata
- Navigation should feel seamless but clearly indicate which section user is in

## State & Data Management

- Prefer server components by default
- Use client components only where interaction or browser APIs required
- Avoid global state unless absolutely necessary
- If shared state needed, prefer: URL state, props, server-derived data
- Data sources (Supabase) should be abstracted behind small data access layer

## Performance & Optimization

- Prefer static rendering where possible
- Use Next.js image optimisation for all images
- Avoid unnecessary client-side JavaScript
- Monitor bundle size and component boundaries
- Performance decisions should be intentional and documented

## Button Component Usage

**Use the shared Button component** - do not create custom button implementations:
- Import: `import { Button } from '@/components/Button'`
- Variants: `primary`, `secondary`, `ghost`, `spurs`
- Sizes: `sm`, `md` (default), `lg`
- Supports: loading states, icons, full width, asChild for links
- Spurs Women sections: use `variant="spurs"` for branding

## Photo Gallery System

**GitHub-based photo hosting**:
- Photos stored in external `spurs-women-photo-gallery` repository
- CDN delivery through jsDelivr
- Manifest file: `public/spurs-women/photo-gallery.manifest.json`
- Generate manifest: `npm run generate-external-manifest`
- Validate manifest: `npm run validate-manifest`

**Image Requirements**:
- Optimize photos before upload (WebP/AVIF preferred)
- Max width: 2000px
- Target file size: < 500KB
- Use ImageMagick: `magick mogrify -path ./optimised -resize 2000x2000\> -strip -quality 82 -format webp *.jpg`

**Database**:
- Photo albums use `storage_source = 'github'`
- URL field contains GitHub folder key
- Supabase remains source of truth for metadata

## Caching System

**Cache Categories**:
- Matches: 30-minute TTL for current season
- Static content: 24-hour TTL
- RSS feeds: 24-hour TTL
- YouTube videos: 1-hour TTL
- Player data: 1-hour TTL
- Player statistics: 30-minute TTL

**Implementation**:
- Use Next.js `unstable_cache` with tag-based invalidation
- Graceful fallback to fresh data on cache failures
- API key protection for cache invalidation endpoints

## FullStory Analytics

**Security**:
- No `dangerouslySetInnerHTML` - uses external file approach
- Environment-based user identification
- Proper data exclusions for sensitive content
- CSP-compatible implementation

**Usage**:
- Script: `/public/fullstory-init.js`
- Load via Next.js Script component with `beforeInteractive` strategy
- Organization ID: `o-1J8NQN-na1`

## Dark Mode Implementation

**Critical Requirement**: Prevent flash of light mode on load
- Blocking script in `layout.tsx` that runs immediately in `<head>`
- `data-theme-loading` attribute on `<html>` element
- CSS to hide content during theme loading
- `suppressHydrationWarning` on `<html>` element

## Git Commands

**Square Brackets in File Paths**:
Always wrap file paths in quotes when using git commands with dynamic routes:
```bash
# ✅ Correct
git add "src/app/spurs-women/matches/[matchId]/page.tsx"

# ❌ Incorrect
git add src/app/spurs-women/matches/[matchId]/page.tsx
```

## Security & Compliance

**Security**:
- Never expose sensitive data in analytics recordings
- Use proper exclusions for forms with personal information
- Regular audits of recorded data
- Limit FullStory dashboard access to authorized team members

**Data Privacy**:
- GDPR compliance for user accounts
- Data minimization principles
- Cookie consent management
- Data backup strategy

## Development Workflow

**Environment Setup**:
- Environment variables via `.env.local` for development
- Vercel environment variables for production
- No secrets committed to repo
- Public vs server-only variables clearly separated

**Deployment**:
- Direct deployment via Vercel
- Git-based deploys from main branch
- No complex CI pipeline (solo developer, low-risk changes)

## Specific Anti-Patterns to Avoid

**CSS Violations** (Resolved):
- ✅ Hardcoded `rgba()` values in globals.css have been replaced
- Tailwind config contains hardcoded color arrays that contradict CSS variable approach
- Button component uses CSS classes instead of Tailwind utilities

**Security Issues** (Mitigated):
- `dangerouslySetInnerHTML` usage in MatchHeader.tsx and MatchCard.tsx for SVG rendering
- ✅ Security comments added explaining content is from trusted Supabase database (admin-controlled only)
- Content limited to SVG icons, not arbitrary HTML. No user-generated content.

**Component Inconsistencies** (Resolved):
- Mixed styling approaches between CSS classes and Tailwind utilities
- ✅ Button migration complete - all files migrated to Button component

## Spurs Women Specific Rules

**Data Layer**:
- Use caching system with appropriate TTLs
- Tag-based cache invalidation
- Graceful fallback mechanisms

**Statistics Calculations**:
- League matches (WSL) used for primary statistics
- Cup matches tracked separately
- Friendlies completely ignored from statistics
- Attendance includes all competitive matches (league + cups)

**Team Colors**:
- Use team primary/secondary colors from database
- Handle CSS override issues with WebkitTextFillColor
- Use `getTeamColor` utility for Tailwind to hex conversion

## Content Management

**Photo Gallery Workflow**:
1. Optimize photos with ImageMagick
2. Add to external GitHub repository
3. Update database with folder key
4. Generate manifest: `npm run generate-external-manifest`
5. Validate manifest: `npm run validate-manifest`
6. Test locally before deployment

**Update Banners**:
- Use UpdateBanner component for notifications
- Supports: warning, info, success, notice types
- Can be dismissed or made non-dismissible
- Theme-aware (light/dark mode)

## Error Handling

- Use Next.js route-level error.tsx and not-found.tsx files
- No global custom error boundary abstraction
- Errors should fail loudly in development and degrade gracefully in production
- Let server errors surface naturally via Next.js error handling
- Use error.tsx per route group where needed
- Avoid try/catch in components unless handling known failure case
- Prefer clear error states over silent fallbacks

## Non-Goals (Explicitly Out of Scope)

- Multi-language support
- Enterprise-grade CI/CD pipelines
- Advanced analytics or tracking
- Full CMS integration
- Automated testing - NOW IMPLEMENTED (see Testing Requirements above)

These may be revisited only if project scope or audience changes significantly.
