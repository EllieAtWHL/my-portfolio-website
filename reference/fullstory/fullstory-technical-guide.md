# FullStory Technical Implementation Guide

## Quick Start

This guide provides technical details for developers working with the FullStory integration.

## Architecture

### File Structure
```
my-portfolio-website/
├── public/
│   └── fullstory-init.js     # FullStory initialization script
├── src/app/
│   └── layout.tsx            # Root layout with Script component
└── docs/
    ├── fullstory-implementation.md
    └── fullstory-technical-guide.md
```

### Implementation Pattern

```tsx
// src/app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src="/fullstory-init.js"
          strategy="beforeInteractive"
        />
        {/* Other head elements */}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

## Script Configuration

### Organization Settings

```javascript
// /public/fullstory-init.js
window['_fs_host'] = 'fullstory.com';
window['_fs_script'] = 'edge.fullstory.com/s/fs.js';
window['_fs_org'] = 'o-1J8NQN-na1';  // Production org ID
window['_fs_namespace'] = 'FS';
```

### Environment-Specific Configuration

For different environments, consider:

```javascript
// Conditional configuration (if needed)
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  // Development-specific settings
  window['_fs_debug'] = true;
}
```

## API Usage

### TypeScript Types

```typescript
// types/fullstory.d.ts
declare global {
  interface Window {
    _fs_host?: string;
    _fs_script?: string;
    _fs_org?: string;
    _fs_namespace?: string;
    FS?: {
      event: (name: string, properties?: Record<string, any>) => void;
      identify: (uid: string, vars?: Record<string, any>) => void;
      setUserVars: (vars: Record<string, any>) => void;
      anonymize: () => void;
      shutdown: () => void;
      restart: () => void;
      log: (level: string, message: string) => void;
      consent: (granted: boolean) => void;
    };
  }
}
```

### Event Tracking

```typescript
// Custom event tracking
const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.FS) {
    window.FS.event(eventName, properties);
  }
};

// Usage examples
trackEvent('Navigation', {
  from: '/home',
  to: '/about-me',
  method: 'click'
});

trackEvent('Form Interaction', {
  formName: 'contact',
  action: 'validation_error',
  field: 'email'
});
```

### User Identification

```typescript
// Safe user identification
const identifyUser = (userId: string, userVars?: Record<string, any>) => {
  if (typeof window !== 'undefined' && 
      window.FS && 
      window.location.hostname !== 'localhost') {
    // Only identify in production
    window.FS.identify(userId, userVars);
  }
};

// Usage
identifyUser('user-123', {
  displayName: 'John Doe',
  email: 'john@example.com',
  accountType: 'premium'
});
```

## Development Workflow

### Local Development

1. **Start dev server**: `npm run dev`
2. **Verify script loading**: Check browser console
3. **Test events**: Use `window.FS` in dev tools
4. **View sessions**: Check FullStory dashboard

### Debug Commands

```javascript
// In browser console
console.log('FullStory loaded:', !!window.FS);
console.log('FullStory version:', window.FS?._v);

// Test event
window.FS?.event('Debug Test', { timestamp: Date.now() });
```

### Environment Variables

Add to `.env.local` if needed:

```env
# FullStory configuration
NEXT_PUBLIC_FULLSTORY_ORG=o-1J8NQN-na1
NEXT_PUBLIC_FULLSTORY_DEBUG=false
```

## Performance Optimization

### Loading Strategies

| Strategy | Use Case | Impact |
|----------|----------|---------|
| `beforeInteractive` | Critical analytics | Loads before hydration |
| `afterInteractive` | Non-critical analytics | Loads after page ready |
| `lazyOnload` | Optional analytics | Loads on user interaction |

### Monitoring Performance

```javascript
// Performance monitoring
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name.includes('fullstory')) {
      console.log('FullStory load time:', entry.duration);
    }
  }
});

observer.observe({ entryTypes: ['resource'] });
```

## Testing

### Unit Tests

```typescript
// __tests__/fullstory.test.ts
describe('FullStory Integration', () => {
  beforeEach(() => {
    // Mock window.FS
    Object.defineProperty(window, 'FS', {
      value: {
        event: jest.fn(),
        identify: jest.fn(),
      },
      writable: true,
    });
  });

  it('should track events correctly', () => {
    trackEvent('Test Event', { test: true });
    expect(window.FS.event).toHaveBeenCalledWith('Test Event', { test: true });
  });
});
```

### E2E Testing

```typescript
// e2e/fullstory.spec.ts
import { test, expect } from '@playwright/test';

test('FullStory script loads', async ({ page }) => {
  await page.goto('/');
  
  // Check if FullStory script is loaded
  const fullStoryScript = await page.locator('script[src*="fullstory"]');
  await expect(fullStoryScript).toBeAttached();
  
  // Check if FS object is available
  const fsObject = await page.evaluate(() => window.FS);
  expect(fsObject).toBeTruthy();
});
```

## Security Best Practices

### Content Security Policy

If using CSP, add:

```html
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self' https://edge.fullstory.com https://www.fullstory.com;">
```

### Data Exclusions

```html
<!-- Exclude sensitive content -->
<form data-fs-exclude>
  <input type="password" name="password" />
  <input type="text" name="ssn" data-fs-exclude />
</form>

<!-- Exclude entire sections -->
<div data-fs-exclude class="sensitive-content">
  <!-- Private user information -->
</div>
```

## Troubleshooting

### Common Issues

#### Script Not Loading
```bash
# Check if file exists
ls -la public/fullstory-init.js

# Check Next.js build
npm run build
npm run dev
```

#### TypeScript Errors
```typescript
// Ensure types are declared
declare global {
  interface Window {
    FS?: any; // Use proper types in production
  }
}
```

#### Production Issues
```javascript
// Check environment
console.log('Environment:', process.env.NODE_ENV);
console.log('Hostname:', window.location.hostname);
console.log('FullStory org:', window._fs_org);
```

## Migration Guide

### From dangerouslySetInnerHTML

If migrating from an old implementation:

1. **Remove old script**:
```tsx
// Remove this
<script dangerouslySetInnerHTML={{ __html: '...' }} />
```

2. **Add new approach**:
```tsx
// Add this
<Script src="/fullstory-init.js" strategy="beforeInteractive" />
```

3. **Move script content** to `/public/fullstory-init.js`

### Version Updates

When updating FullStory:

1. **Check breaking changes** in FullStory release notes
2. **Update script content** in `/public/fullstory-init.js`
3. **Test in development** before production deployment
4. **Monitor dashboard** for issues

## Resources

- [FullStory Documentation](https://help.fullstory.com/hc/en-us)
- [Next.js Script Component](https://nextjs.org/docs/app/api-reference/components/script)
- [TypeScript Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

## Support

For implementation issues:
1. Check this documentation
2. Review FullStory official docs
3. Check browser console for errors
4. Test in different environments
