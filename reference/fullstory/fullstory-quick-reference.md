# FullStory Quick Reference

## Essential Commands

### Check if FullStory is Loaded
```javascript
// In browser console
console.log('FullStory loaded:', !!window.FS);
console.log('FullStory version:', window.FS?._v);
```

### Track Custom Events
```javascript
// Simple event
FS.event('Button Clicked');

// Event with properties
FS.event('Form Submitted', {
  formType: 'contact',
  success: true
});
```

### Identify Users
```javascript
// Basic identification
FS.identify('user-123');

// With user properties
FS.identify('user-123', {
  displayName: 'John Doe',
  email: 'john@example.com'
});
```

### Set User Properties
```javascript
FS.setUserVars({
  plan: 'premium',
  lastLogin: '2024-03-08'
});
```

## File Locations

| File | Purpose |
|------|---------|
| `/public/fullstory-init.js` | FullStory initialization script |
| `/src/app/layout.tsx` | Root layout with Script component |
| `/reference/fullstory/fullstory-implementation.md` | Full documentation |
| `/reference/fullstory/fullstory-technical-guide.md` | Technical details |

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Script not loading | Check `/public/fullstory-init.js` exists |
| No sessions recorded | Verify org ID: `o-1J8NQN-na1` |
| TypeScript errors | Add global type declarations |
| Performance issues | Consider `afterInteractive` strategy |

## Environment Detection

```javascript
// Check current environment
const isProduction = window.location.hostname !== 'localhost';
const isDevelopment = window.location.hostname === 'localhost';

// Only track in production
if (isProduction) {
  FS.event('Production Event');
}
```

## Excluding Content

```html
<!-- Exclude specific elements -->
<input type="password" data-fs-exclude />

<!-- Exclude entire sections -->
<div data-fs-exclude>_sensitive_content_</div>
```

## Testing Checklist

- [ ] Script loads without errors
- [ ] `window.FS` object is available
- [ ] Events fire correctly
- [ ] User identification works
- [ ] Exclusions are respected
- [ ] Performance impact is minimal
- [ ] Works in all target environments

## Emergency Commands

### Stop Recording
```javascript
FS.shutdown();
```

### Restart Recording
```javascript
FS.restart();
```

### Anonymize Current User
```javascript
FS.anonymize();
```

## Support Links

- **FullStory Dashboard**: https://app.fullstory.com
- **Help Center**: https://help.fullstory.com
- **Organization ID**: `o-1J8NQN-na1`
