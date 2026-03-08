# FullStory Analytics Implementation

## Overview

This document describes the FullStory analytics integration in the EllieAtWHL portfolio website. FullStory is used for user session recording and analytics to understand user behavior and improve the user experience.

## Implementation Details

### Files Involved

- **`/public/fullstory-init.js`** - FullStory initialization script
- **`/src/app/layout.tsx`** - Root layout where FullStory is loaded
- **`/src/lib/fullstory.ts`** - FullStory tracking utilities and helper functions
- **`/src/hooks/useFullStory.ts`** - React hook for FullStory integration
- **`/reference/fullstory/`** - Documentation for FullStory implementation

### Architecture

The FullStory integration uses a clean, secure approach:

1. **External Script File**: The FullStory initialization code is stored in `/public/fullstory-init.js`
2. **Next.js Script Component**: Uses Next.js `Script` component with `beforeInteractive` strategy
3. **Global Scope**: Script loads on all pages through the root layout
4. **Security**: No `dangerouslySetInnerHTML` - uses external file approach

### Configuration

```javascript
// FullStory configuration in /public/fullstory-init.js
window['_fs_host'] = 'fullstory.com';
window['_fs_script'] = 'edge.fullstory.com/s/fs.js';
window['_fs_org'] = 'o-1J8NQN-na1';  // Your organization ID
window['_fs_namespace'] = 'FS';
```

## Environment Detection

FullStory automatically detects the environment based on the domain:

- **Production**: `ellieatwhl.co.uk` or custom domain
- **Development**: `localhost:3000` and other local domains
- **Staging**: Any staging domains

You can create segments in FullStory based on `window.location.hostname` to separate data by environment.

## Implemented Tracking Features

### Current Implementation

The following FullStory tracking features are actively implemented:

#### Page View Tracking
- **Home page**: Tracks visits to `/` with title "Home"
- **Contact page**: Tracks visits to `/contact-me` with title "Contact Me"
- **Thank you page**: Tracks visits to `/contact-me/thank-you` with title "Contact Thank You"

#### Form Interaction Tracking
- **Contact form start**: Tracked when user begins form interaction
- **Contact form success**: Tracked when form is successfully submitted
- **Form completion**: Tracked on thank you page visit

#### Button Click Tracking
- **Contact Me button**: Tracks clicks from home page hero section
- **Navigation buttons**: Tracks clicks between pages (ready for implementation)

#### Session-Level Data
- **Session properties**: Can set session-level data like traffic source, device type
- **No user identification**: Appropriate for portfolio site where users don't log in

#### Event Properties Captured
- **Timestamp**: All events include ISO timestamp
- **Page context**: Current page where event occurred
- **Section context**: UI section where interaction happened
- **User flow**: Form start → success → completion tracking

### Usage Examples in Code

#### Page View Tracking
```typescript
// In any page component
useEffect(() => {
  trackPageView('/contact-me', 'Contact Me');
}, []);
```

#### Button Click Tracking
```typescript
const handleContactClick = () => {
  trackEvent('Button Clicked', {
    buttonName: 'Contact Me',
    page: '/',
    section: 'hero',
    timestamp: new Date().toISOString()
  });
};
```

#### Form Interaction Tracking
```typescript
// Track form start
trackFormInteraction('contact', 'start');

// Track form success
trackFormInteraction('contact', 'success');
```

## Usage Examples

### Tracking Custom Events

```javascript
// Track custom events
FS.event('Button Clicked', {
  button_name: 'Contact Me',
  page: '/contact-me'
});

// Track user interactions
FS.event('Form Submitted', {
  form_type: 'contact',
  success: true
});
```

### Setting Session Properties

```typescript
// Set session-level properties
setUserVars({
  sessionSource: 'direct_traffic',
  deviceType: 'desktop',
  lastInteraction: '2024-03-08'
});
```

## Privacy and Compliance

### Data Collection

- **Session Recording**: Captures user interactions, clicks, scrolls, and form inputs
- **Network Requests**: Monitors API calls and page navigation
- **Console Logs**: Captures JavaScript errors and console output

### Exclusion Rules

FullStory automatically excludes:
- Password fields and sensitive inputs
- Credit card information
- Personal health information (when properly marked)

### Custom Exclusions

To exclude specific elements:

```html
<div data-fs-exclude>_sensitive_content_</div>
```

## Performance Impact

### Loading Strategy

- **Strategy**: `beforeInteractive` ensures FullStory loads before page interaction
- **Impact**: Minimal - FullStory script is ~50KB gzipped
- **Async**: Non-blocking for other resources

### Optimization Tips

1. **Environment-based loading**: Consider conditionally loading in development only
2. **Sampling**: Use FullStory's sampling features for high-traffic sites
3. **Exclusions**: Exclude non-production environments from recording

## Monitoring and Debugging

### FullStory Console

1. Log into FullStory dashboard
2. Navigate to your organization (`o-1J8NQN-na1`)
3. View sessions, funnels, and user segments

### Local Development

- FullStory automatically records localhost sessions
- Use browser dev tools to verify script loading
- Check `window.FS` object in console to confirm initialization

### Common Issues

| Issue | Solution |
|-------|----------|
| Script not loading | Check browser console for errors |
| No sessions recorded | Verify organization ID is correct |
| Performance issues | Consider `afterInteractive` strategy |

## Maintenance

### Regular Tasks

- **Monthly**: Review FullStory dashboards and insights
- **Quarterly**: Update exclusion rules and privacy settings
- **Annually**: Review data retention policies

### Updates

- FullStory script updates automatically
- Monitor for breaking changes in FullStory API
- Test after major Next.js updates

## Security Considerations

### Best Practices

1. **Never expose sensitive data** in FullStory recordings
2. **Use proper exclusions** for forms with personal information
3. **Regular audits** of recorded data
4. **Compliance checks** with GDPR/CCPA requirements

### Access Control

- Limit FullStory dashboard access to authorized team members
- Use role-based permissions in FullStory
- Regular review of user access

## Integration with Other Analytics

FullStory complements other analytics tools:

- **Google Analytics**: Traffic and conversion metrics
- **Vercel Analytics**: Performance and hosting metrics  
- **FullStory**: User behavior and session recordings

## Troubleshooting

### Script Not Loading

1. Check browser console for JavaScript errors
2. Verify `/public/fullstory-init.js` file exists
3. Ensure Next.js Script component is properly configured

### No Data in FullStory

1. Verify organization ID: `o-1J8NQN-na1`
2. Check network tab for FullStory requests
3. Confirm domain is not blocked by ad blockers

### Performance Issues

1. Monitor Core Web Vitals
2. Consider lazy loading for non-critical pages
3. Review FullStory sampling settings

## Contact

For questions about this implementation:
- **Developer**: Ellie Matthewman
- **FullStory Support**: https://help.fullstory.com/hc/en-us
- **Documentation**: This file and FullStory official docs
