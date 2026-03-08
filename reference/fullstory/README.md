# FullStory Documentation

This folder contains comprehensive documentation for the FullStory analytics integration in the EllieAtWHL portfolio website.

## Documentation Files

### 📋 [FullStory Implementation Guide](./fullstory-implementation.md)
**Complete implementation overview for all stakeholders**

- Architecture and file structure
- Configuration details
- Environment detection
- Privacy and compliance
- Performance considerations
- Monitoring and debugging
- Maintenance procedures

### 🔧 [Technical Guide](./fullstory-technical-guide.md)
**In-depth technical documentation for developers**

- Implementation patterns
- TypeScript types and API usage
- Development workflow
- Testing strategies
- Performance optimization
- Security best practices
- Troubleshooting guide

### ⚡ [Quick Reference](./fullstory-quick-reference.md)
**Fast lookup for common tasks and commands**

- Essential commands
- Common issues and solutions
- File locations
- Testing checklist
- Emergency procedures
- Support links

## Quick Start

1. **Verify Installation**: Check that `/public/fullstory-init.js` exists
2. **Test Locally**: Run `npm run dev` and check browser console
3. **Confirm Loading**: Verify `window.FS` object is available
4. **Track Events**: Use `FS.event('Event Name', properties)` for custom tracking

## File Structure

```
reference/fullstory/
├── README.md                    # This file
├── fullstory-implementation.md  # Complete implementation guide
├── fullstory-technical-guide.md  # Technical documentation
└── fullstory-quick-reference.md  # Quick reference guide
```

## Related Files in Project

```
my-portfolio-website/
├── public/
│   └── fullstory-init.js        # FullStory initialization script
├── src/app/
│   └── layout.tsx               # Root layout with Script component
└── reference/
    └── fullstory/               # This documentation folder
```

## Getting Help

- **FullStory Dashboard**: https://app.fullstory.com
- **Organization ID**: `o-1J8NQN-na1`
- **Help Center**: https://help.fullstory.com
- **Project Issues**: Check the troubleshooting section in each document

## Environment Information

- **Development**: `localhost:3000` - FullStory automatically records
- **Production**: Live domain - FullStory tracks real user sessions
- **Staging**: Any staging domains - Separate from production data

## Security Notes

- No `dangerouslySetInnerHTML` used - secure external file approach
- Environment-based user identification
- Proper data exclusions for sensitive content
- CSP-compatible implementation

## Next Steps

1. Read the [Implementation Guide](./fullstory-implementation.md) for overview
2. Review the [Technical Guide](./fullstory-technical-guide.md) for development details
3. Use the [Quick Reference](./fullstory-quick-reference.md) for daily tasks
4. Test the implementation in your development environment
