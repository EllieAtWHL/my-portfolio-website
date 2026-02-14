# External Repository Migration Guide

## Overview

This guide explains how to migrate from Supabase Storage to a dedicated external GitHub repository for image hosting, providing better separation of concerns and enabling professional image management workflows.

## Architecture Benefits

### ✅ Advantages of External Repository

- **Clean Repository**: Website repo contains only code and configuration
- **Professional Workflow**: Separate image management with proper versioning
- **CDN Performance**: Images served via GitHub's global CDN
- **Scalability**: No repository size limits for images
- **Collaboration**: Designers can work with images without code access
- **Backup**: GitHub provides version history and backup
- **Cost**: Still zero-cost with better performance

## Migration Process

### Phase 1: Setup External Repository

1. **Create External Repository**
   ```bash
   # Create new repository
   gh repo create spurs-women-photo-gallery
   ```

2. **Configure Environment Variables**
   ```bash
   # Add to .env.local
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   EXTERNAL_REPO_OWNER=EllieAtWHL
   EXTERNAL_REPO_NAME=spurs-women-photo-gallery
   EXTERNAL_REPO_BRANCH=main
   CDN_PROVIDER=jsdelivr  # Options: jsdelivr, unpkg, statically
   ```

3. **Test Configuration**
   ```bash
   npm run generate-external-manifest:help
   ```

### Phase 2: Export and Organize Images

1. **Export from Supabase**
   - Use Supabase Dashboard to download all images
   - Maintain existing folder structure
   - Keep original files as backup

2. **Optimize Images**
   ```bash
   # Recommended tools
   npm install -g sharp imagemin-cli
   
   # Batch optimize (example)
   for folder in */; do
     imagemin $folder/*.jpg --out-dir=optimized/$folder --plugin=webp
   done
   ```

3. **Organize Repository Structure**
   ```
   spurs-women-photos/
   ├── 2024-01-28-chelsea/
   │   ├── 001.webp
   │   ├── 002.webp
   │   └── 003.webp
   ├── 2024-02-11-arsenal/
   │   ├── 001.webp
   │   └── 002.webp
   └── README.md
   ```

### Phase 3: Update Database

1. **Add storage_source Field**
   ```sql
   ALTER TABLE media 
   ADD COLUMN storage_source VARCHAR(20) DEFAULT NULL;
   ```

2. **Update Photo Albums**
   ```bash
   # Generate migration SQL
   npm run migrate-storage:dry-run
   
   # Execute migration
   npm run migrate-storage
   ```

3. **Verify Updates**
   ```sql
   -- Check updated records
   SELECT id, url, storage_source, type 
   FROM media 
   WHERE type = 'photo album';
   ```

### Phase 4: Update Application

1. **Update Photo Loading**
   ```typescript
   // Import new external loader
   import { loadPhotosHybridWithExternal } from '@/lib/external-photo-loader';
   
   // Use in MediaGallery component
   const albumPhotos = await loadPhotosHybridWithExternal(album, manifest);
   ```

2. **Update Build Process**
   ```json
   // Add to package.json scripts
   {
     "predev": "node scripts/generate-external-manifest && node scripts/generate-photo-manifest.js",
     "prebuild": "node scripts/generate-external-manifest && node scripts/generate-photo-manifest.js"
   }
   ```

## Configuration Options

### CDN Providers

| Provider | Base URL | Features |
|-----------|-----------|----------|
| jsdelivr | https://cdn.jsdelivr.net | Fast, reliable |
| unpkg | https://unpkg.com | Simple, popular |
| statically | https://cdn.statically.io | GitHub-focused |

### Environment Variables

| Variable | Required | Description |
|----------|-----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub personal access token |
| `EXTERNAL_REPO_OWNER` | Yes | Repository owner username |
| `EXTERNAL_REPO_NAME` | Yes | Repository name |
| `EXTERNAL_REPO_BRANCH` | No | Branch name (default: main) |
| `CDN_PROVIDER` | No | CDN provider (default: jsdelivr) |
| `CDN_BASE_URL` | No | Custom CDN base URL |

## Usage Examples

### Development

```bash
# Generate manifest from external repo
npm run generate-external-manifest

# Start development with both manifests
npm run dev

# Test configuration
npm run generate-external-manifest:help
```

### Production

```bash
# Build with external manifest generation
npm run build

# Deploy to Vercel (manifest included automatically)
vercel --prod
```

## Migration Commands

### Initial Setup

```bash
# 1. Create external repository
gh repo create spurs-women-photos

# 2. Configure environment
echo "GITHUB_TOKEN=ghp_xxx" >> .env.local
echo "EXTERNAL_REPO_OWNER=EllieAtWHL" >> .env.local
echo "EXTERNAL_REPO_NAME=spurs-women-photo-gallery" >> .env.local

# 3. Test configuration
npm run generate-external-manifest:help
```

### Migration Execution

```bash
# 1. Update database schema
# Run in Supabase SQL editor or migration script

# 2. Migrate existing records
npm run migrate-storage

# 3. Generate external manifest
npm run generate-external-manifest

# 4. Test locally
npm run dev
```

### Validation

```bash
# Check external configuration
node -e "console.log(require('./src/lib/external-photo-loader.js').validateExternalRepoConfig())"

# Test manifest generation (will use EllieAtWHL by default)
npm run generate-external-manifest

# Verify CDN URLs work (replace with your username)
curl -I "https://cdn.jsdelivr.net/gh/EllieAtWHL/spurs-women-photo-gallery@main/2024-01-28-chelsea/001.webp"
```

## Troubleshooting

### Common Issues

**GitHub API Rate Limiting**
- Use authentication token
- Implement caching in manifest script
- Use conditional requests for large repositories

**CDN URL Issues**
- Verify repository is public
- Check branch name matches
- Validate file paths in manifest

**Database Migration**
- Backup before migration
- Test with single record first
- Verify storage_source values

**Build Failures**
- Check environment variables
- Validate external repository access
- Review manifest generation logs

## Best Practices

### Repository Management

1. **Semantic Versioning**: Use tags for releases
2. **Descriptive Commits**: Clear commit messages
3. **README Documentation**: Include setup instructions
4. **Branch Strategy**: Use `main` for production, `develop` for testing
5. **File Naming**: Consistent, date-based folder structure

### Image Optimization

1. **Format Standards**: WebP for photos, AVIF for new uploads
2. **Size Limits**: Max 2000px width, reasonable file sizes
3. **Progressive Enhancement**: Include multiple quality levels
4. **Metadata**: Consider EXIF data preservation

### Performance Monitoring

1. **CDN Analytics**: Monitor GitHub Pages traffic
2. **Image Loading**: Track load times and errors
3. **Build Performance**: Monitor manifest generation time
4. **User Experience**: Core Web Vitals for gallery pages

## Rollback Plan

If issues arise, rollback steps:

1. **Database**: Update `storage_source` back to `'supabase'` for affected records
2. **Code**: Revert to previous photo loading implementation
3. **Configuration**: Remove external repository environment variables
4. **Verification**: Test Supabase loading works correctly

## Security Considerations

### GitHub Token Security

- Use fine-grained personal access tokens
- Limit token scope to repository access only
- Rotate tokens regularly
- Store tokens securely in environment variables
- Never commit tokens to repository

### Repository Access

- Keep repository public for CDN access
- Use branch protection for main branch
- Monitor for unauthorized access
- Consider repository visibility for sensitive content

## Next Steps

1. **Complete Migration**: Move all photo albums to external repository
2. **Remove Supabase Storage**: Delete bucket and update remaining records
3. **Optimize Workflow**: Set up automated image optimization pipeline
4. **Monitor Performance**: Track CDN performance and user experience
5. **Document Process**: Create team documentation for image management workflow

---

*This guide provides a comprehensive approach for migrating to external repository hosting while maintaining system reliability and improving performance.*
