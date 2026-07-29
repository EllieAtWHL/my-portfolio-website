# Spurs Women Website - Development TODO List

## Overview
This document outlines the remaining work and improvements needed for the Tottenham Hotspur Women website. Items are prioritized by impact and complexity.

## High Priority Items

### 1. Match Statistics Enhancement
**Status**: Pending
**Effort**: Medium
**Impact**: High

**Tasks**:
- [ ] Add additional match statistics (fouls, yellow cards, red cards, offsides)
- [ ] Implement shot accuracy calculations
- [ ] Add heat map visualization for shot locations
- [ ] Create comparison tools for head-to-head statistics
- [ ] Implement season-long performance trends

**Files to modify**:
- `src/components/spurs-women/MatchStats.tsx`
- `src/lib/data/matches.ts`
- Database schema updates needed

### 2. Live Score Integration
**Status**: Pending
**Effort**: High
**Impact**: High

**Tasks**:
- [ ] Research and integrate live score API (e.g., Sportradar, Opta)
- [ ] Implement real-time match updates
- [ ] Add live match commentary integration
- [ ] Create notification system for score changes
- [ ] Add match status indicators (in progress, half-time, full-time)

**Files to create/modify**:
- `src/lib/api/live-scores.ts`
- `src/components/spurs-women/LiveMatchCard.tsx`
- Update match data structures

### 3. Mobile App Optimization
**Status**: Pending
**Effort**: Medium
**Impact**: High

**Tasks**:
- [ ] Improve touch interactions on mobile devices
- [ ] Optimize image loading and display for mobile
- [ ] Implement swipe gestures for match navigation
- [ ] Add mobile-specific features (add to home screen)
- [ ] Optimize performance for slower mobile connections

**Files to modify**:
- All component files for mobile responsiveness
- `src/app/spurs-women/layout.tsx`

### 4. Search Functionality
**Status**: Pending
**Effort**: Medium
**Impact**: High

**Tasks**:
- [ ] Implement global search across matches, news, and media
- [ ] Add advanced search filters
- [ ] Create search results page with proper pagination
- [ ] Implement search autocomplete/suggestions
- [ ] Add search history and saved searches

**Files to create**:
- `src/app/spurs-women/search/page.tsx`
- `src/components/spurs-women/SearchBar.tsx`
- `src/components/spurs-women/SearchResults.tsx`

## Medium Priority Items

### 5. Player Profiles
**Status**: ✅ Done - implemented
**Effort**: High
**Impact**: Medium

Player database schema, profile pages, statistics tracking, and photo management are implemented. Remaining/open work:
- [ ] Implement player comparison tools

**Files that now exist**:
- `src/app/spurs-women/players/[playerId]/page.tsx`
- `src/components/spurs-women/PlayerCard.tsx`
- `src/lib/data/players.ts`

### 6. Interactive Charts
**Status**: ✅ Done - implemented (Recharts)
**Effort**: Medium
**Impact**: Medium

Recharts (`recharts` in package.json) is integrated and used for season performance charts (`src/components/spurs-women/SeasonStatsChart.tsx`). Remaining/open work:
- [ ] Add team comparison visualizations
- [ ] Implement attendance trend charts
- [ ] Create goal timeline visualizations

### 7. Social Sharing
**Status**: Pending
**Effort**: Low
**Impact**: Medium

**Tasks**:
- [ ] Add share buttons for matches and news
- [ ] Implement custom share images generation
- [ ] Add social media meta tags
- [ ] Create shareable match summaries
- [ ] Add embed functionality for match widgets

**Files to modify**:
- `src/components/spurs-women/MatchCard.tsx`
- `src/components/spurs-women/NewsCard.tsx`
- Add metadata generation

### 8. Dark Mode Support
**Status**: ✅ Done - implemented site-wide
**Effort**: Medium
**Impact**: Medium

Theme switching, dark mode color palette, localStorage persistence, and flash-of-light-mode prevention are all implemented (see `reference/DARK_MODE_FLASH_FIX.md`, `ThemeProvider`, `tailwind.config.ts` `darkMode: 'class'`). No remaining open tasks identified for the base implementation; ongoing work is just ensuring new components follow the existing `.dark` pattern.

### 9. Accessibility Improvements
**Status**: Pending
**Effort**: Medium
**Impact**: Medium

**Tasks**:
- [ ] Conduct WCAG 2.1 accessibility audit
- [ ] Improve keyboard navigation
- [ ] Add screen reader support for complex components
- [ ] Implement focus management
- [ ] Add ARIA labels and descriptions

**Files to modify**:
- All interactive components
- Add accessibility testing to CI/CD

## Low Priority Items

### 10. Notification System
**Status**: Pending
**Effort**: High
**Impact**: Low

**Tasks**:
- [ ] Implement email notifications for match updates
- [ ] Add push notification support
- [ ] Create notification preferences management
- [ ] Add digest emails for weekly summaries
- [ ] Implement browser notification API

### 11. Fan Integration Features
**Status**: Pending
**Effort**: High
**Impact**: Low

**Tasks**:
- [ ] Create user authentication system
- [ ] Implement user profiles
- [ ] Add favorite teams/matches functionality
- [ ] Create fan forums or discussion areas
- [ ] Add user-generated content features

### 12. Historical Data Import
**Status**: Pending
**Effort**: Medium
**Impact**: Low

**Tasks**:
- [ ] Research historical Spurs Women data sources
- [ ] Create data import scripts
- [ ] Validate and clean historical data
- [ ] Add historical season reviews
- [ ] Create timeline of key moments

### 13. Multi-language Support
**Status**: Pending
**Effort**: High
**Impact**: Low

**Tasks**:
- [ ] Implement internationalization (i18n)
- [ ] Translate all UI text
- [ ] Add language switcher
- [ ] Implement date/time localization
- [ ] Add RTL language support

## Technical Debt

### 14. Database Optimization
**Status**: Pending
**Effort**: Medium
**Impact**: Medium

**Tasks**:
- [ ] Review and optimize database queries
- [ ] Add proper database indexes
- [ ] Implement query result caching
- [ ] Add database connection pooling
- [ ] Create database backup procedures

### 15. Component Refactoring
**Status**: Pending
**Effort**: Medium
**Impact**: Medium

**Tasks**:
- [ ] Consolidate similar components
- [ ] Extract common patterns into reusable hooks
- [ ] Improve component prop interfaces
- [ ] Add component composition patterns
- [ ] Implement proper error boundaries

### 16. Error Handling Improvements
**Status**: Pending
**Effort**: Low
**Impact**: Medium

**Tasks**:
- [ ] Implement global error boundaries
- [ ] Add comprehensive error logging
- [ ] Create user-friendly error messages
- [ ] Add retry mechanisms for failed requests
- [ ] Implement offline functionality

### 17. Performance Monitoring
**Status**: Pending
**Effort**: Low
**Impact**: Medium

**Tasks**:
- [ ] Set up performance monitoring (e.g., Vercel Analytics)
- [ ] Implement Core Web Vitals tracking
- [ ] Add bundle size monitoring
- [ ] Create performance budgets
- [ ] Optimize image loading strategies (see #24 below for the concrete first step)

### 24. Migrate `<img>` to `next/image`
**Status**: Pending
**Effort**: Medium
**Impact**: Medium

ESLint's `@next/next/no-img-element` currently flags 26 raw `<img>` tags across 16 files (warnings only, doesn't fail `next build`). All of them render externally-hosted, dynamic-URL images (Supabase-stored player/media photos, RSS podcast art, the external photo-gallery CDN) - `next.config.ts` has no `images.remotePatterns` configured yet, so switching to `<Image>` without first allowlisting every source domain would break these images in production rather than just warn.

**Tasks**:
- [ ] Enumerate every external image domain in use (Supabase storage, RSS/podcast art hosts, `spurs-women-photo-gallery` CDN) and add them to `images.remotePatterns` in `next.config.ts`
- [ ] Convert each `<img>` to `<Image>` with explicit `width`/`height` or `fill` + a sized/relative parent, matching existing `object-cover`/`object-contain` styling
- [ ] Browser-test each affected page/gallery afterward (layout shift, aspect ratio, lazy-loading behavior)

**Files affected** (26 instances):
- `src/app/spurs-women/players/[playerId]/PlayerClient.tsx`
- `src/components/ExperienceContent.tsx` (x5)
- `src/components/FantasyFootballContent.tsx` (x2)
- `src/components/LightningRolloutContent.tsx`, `LightningRolloutPart1.tsx` (x2), `LightningRolloutPart2.tsx` (x3), `LightningRolloutPart3.tsx`
- `src/components/Modal.tsx` (x2)
- `src/components/ProjectsContent.tsx`
- `src/components/SalesforceOrgsContent.tsx`
- `src/components/__tests__/Header.test.tsx`
- `src/components/spurs-women/LightboxGallery.tsx` (x2), `MediaGallery.tsx`, `PlayerCard.tsx`, `PodcastCard.tsx`, `VideoCard.tsx`

## Content Management

### 18. Season Reviews
**Status**: Pending
**Effort**: Medium
**Impact**: Low

**Tasks**:
- [ ] Write comprehensive season reviews for 2023-2024
- [ ] Create template for future season reviews
- [ ] Add season highlight reels
- [ ] Implement season award tracking
- [ ] Create season comparison tools

### 19. Stadium Information
**Status**: Pending
**Effort**: Low
**Impact**: Low

**Tasks**:
- [ ] Complete stadium data for all venues
- [ ] Add historical stadium information
- [ ] Create stadium photo galleries
- [ ] Add travel information for away matches
- [ ] Implement stadium capacity tracking

### 20. Team Branding
**Status**: Pending
**Effort**: Low
**Impact**: Low

**Tasks**:
- [ ] Verify all team color schemes
- [ ] Add team logo management
- [ ] Create team style guide documentation
- [ ] Add alternative team kits
- [ ] Implement team branding consistency

### 23. SEO & Discovery
**Status**: Pending
**Effort**: Low
**Impact**: Low

**Tasks**:
- [ ] Add schema.org structured data for matches and player profiles
- [ ] Generate XML sitemaps covering matches/seasons/players/stadiums
- [ ] Add Open Graph tags for match and player pages (social sharing previews)

## Security and Compliance

### 21. Security Audit
**Status**: Pending
**Effort**: Medium
**Impact**: High

**Tasks**:
- [ ] Conduct security review of data handling
- [ ] Implement input validation
- [ ] Add CSRF protection
- [ ] Review API security
- [ ] Implement security headers
- [ ] Add API rate limiting for external integrations (YouTube/RSS proxying, admin endpoints)

### 22. GDPR Compliance
**Status**: Pending
**Effort**: Medium
**Impact**: High

**Tasks**:
- [ ] Review data collection practices
- [ ] Implement cookie consent management
- [ ] Add privacy policy
- [ ] Create data deletion procedures
- [ ] Add user data export functionality

## Implementation Timeline

### Phase 1 (Next 2-3 months)
- Match Statistics Enhancement
- Mobile App Optimization
- Search Functionality
- Security Audit

### Phase 2 (3-6 months)
- Live Score Integration
- Player Profiles
- Interactive Charts
- Social Sharing

### Phase 3 (6-12 months)
- Dark Mode Support
- Accessibility Improvements
- Notification System
- Fan Integration Features

### Phase 4 (Ongoing)
- Content Management
- Technical Debt
- Performance Optimization
- Historical Data Import

## Dependencies and Considerations

### External APIs
- Live score API selection and integration
- Potential costs for premium data feeds
- Rate limiting and API key management

### Infrastructure
- Database scaling considerations
- CDN setup for static assets
- Monitoring and alerting setup

### Team Resources
- Frontend development time allocation
- Content creation for historical data
- Testing and QA requirements

---

## Notes

This TODO list should be reviewed and updated regularly based on:
- User feedback and analytics
- Technical debt accumulation
- New feature requests
- Performance monitoring results
- Security vulnerability reports

Priority levels should be reassessed quarterly based on business impact and user needs.
