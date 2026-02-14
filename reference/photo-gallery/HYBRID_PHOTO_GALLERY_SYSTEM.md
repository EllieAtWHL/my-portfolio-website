# Hybrid Photo Gallery System

## 📋 **IMPORTANT: This documentation has been superseded**

For the most comprehensive and up-to-date documentation, please see:
**[PHOTO_GALLERY_SYSTEM_GUIDE.md](./PHOTO_GALLERY_SYSTEM_GUIDE.md)**

---

## Quick Overview

The hybrid photo gallery system supports loading photos from both:
- **Supabase Storage** (legacy)
- **External GitHub Repository + CDN** (new)

### Essential Commands

```bash
# Generate manifest from GitHub repository
npm run generate-external-manifest

# Validate manifest
npm run validate-manifest

# Build with validation
npm run build
```

### Environment Variables

```bash
GITHUB_TOKEN=ghp_your_token
EXTERNAL_REPO_OWNER=EllieAtWHL
EXTERNAL_REPO_NAME=spurs-women-photo-gallery
```

### Database Update Example

```sql
UPDATE media 
SET url = '2025-26/20260208 WSL Spurs vs Chelsea',
    storage_source = 'github'
WHERE match_id = 'your-match-id' 
  AND type = 'photo album';
```

---

## For Complete Documentation

See **[PHOTO_GALLERY_SYSTEM_GUIDE.md](./PHOTO_GALLERY_SYSTEM_GUIDE.md)** for:
- ✅ Complete technical architecture
- ✅ Step-by-step user workflow  
- ✅ Image optimization with ImageMagick
- ✅ Repository structure guidelines
- ✅ Database migration guide
- ✅ Troubleshooting and best practices
- ✅ Pre-deployment checklist

## URL Format Guide

### GitHub-based (New System)
```typescript
{
  id: 'album-123',
  type: 'photo album',
  url: '2024-01-28-chelsea', // Simple folder key
  caption: 'Match photos'
}
```

### Supabase Storage (Legacy System)
```typescript
{
  id: 'album-456', 
  type: 'photo album',
  url: 'storage/match-photos/2024-01-28-arsenal', // Storage path
  caption: 'Match photos'
}
```

## Migration Workflow

### 1. Identify Albums to Migrate
```typescript
import { createMigrationPlan } from '@/lib/migration-helper';

const plan = createMigrationPlan(photoAlbums);
console.log(`GitHub: ${plan.githubAlbums}, Supabase: ${plan.supabaseAlbums}`);
```

### 2. Create Folder Structure
```bash
mkdir -p public/spurs-women/photo-gallery/2024-01-28-arsenal
```

### 3. Export and Optimize Images
1. Export images from Supabase Storage
2. Optimize (WebP/AVIF, max width 2000px)
3. Place in corresponding folder

### 4. Update Database Record
```sql
UPDATE media 
SET url = '2024-01-28-arsenal' 
WHERE id = 456 AND type = 'photo album';
```

### 5. Regenerate Manifest
```bash
npm run predev
# or
node scripts/generate-photo-manifest.js
```

## Development Tools

### Migration Helper
```typescript
import { 
  createMigrationPlan, 
  generateMigrationSQL,
  generateFolderStructureCommands 
} from '@/lib/migration-helper';

// Create migration plan
const plan = createMigrationPlan(photos);

// Generate SQL updates
const sqlStatements = generateMigrationSQL(plan);

// Generate folder commands
const folderCommands = generateFolderStructureCommands(plan);
```

### Progress Tracking
```typescript
import { MigrationProgress } from '@/lib/migration-helper';

// Track migration progress
MigrationProgress.markInProgress('2024-01-28-arsenal');
MigrationProgress.markCompleted('2024-01-28-arsenal');

// View progress
const progress = MigrationProgress.getProgress();
```

### Validation
```typescript
import { validateGitHubMigration } from '@/lib/migration-helper';

const validation = validateGitHubMigration(photos, manifest);
console.log(`Valid albums: ${validation.validAlbums}`);
console.log(`Missing folders: ${validation.missingFolders}`);
```

## Testing

### Hybrid Test Page
Visit `/hybrid-photo-test` to see both systems working together.

### Console Statistics
Open browser console to see migration statistics:
```
Photo Storage Stats: {
  total: 5,
  github: 2,
  supabase: 3,
  unknown: 0
}
```

## File Structure

```
src/
├── lib/
│   ├── hybrid-photo-loader.ts     # Core hybrid loading logic
│   ├── migration-helper.ts        # Migration utilities
│   └── photo-manifest.ts         # GitHub manifest utilities
├── components/spurs-women/
│   └── MediaGallery.tsx          # Updated component
└── app/
    └── hybrid-photo-test/         # Test page

public/
├── spurs-women/
│   ├── photo-gallery/            # GitHub-based images
│   │   ├── 2024-01-28-chelsea/
│   │   └── 2024-01-28-arsenal/
│   └── photo-gallery.manifest.json
```

## Benefits

### During Migration
- ✅ **Zero Downtime**: Existing galleries continue working
- ✅ **Gradual Migration**: Move one gallery at a time
- ✅ **Risk Mitigation**: Test each migration step
- ✅ **Rollback Support**: Easy to revert if needed

### After Migration
- ✅ **Zero Cost**: No ongoing storage fees
- ✅ **Better Performance**: Static asset serving
- ✅ **Simplicity**: No third-party dependencies
- ✅ **Reliability**: No API rate limits

## Best Practices

### Image Organization
- Use consistent naming: `YYYY-MM-DD-opponent`
- Keep images under 2000px width
- Use WebP or AVIF for better compression
- Maintain original files separately

### Database Updates
- Always backup before bulk updates
- Test with single record first
- Update one gallery at a time
- Verify each migration step

### Validation
- Check manifest generation after each migration
- Test gallery display in browser
- Verify all images load correctly
- Monitor console for errors

## Troubleshooting

### Common Issues

**Images not loading from GitHub**
- Check manifest file exists and is valid
- Verify folder structure matches folder key
- Ensure images have correct extensions

**Supabase images not loading**
- Verify Supabase credentials
- Check storage bucket permissions
- Ensure storage path is correct

**Mixed content issues**
- Check URL format detection
- Verify storage type classification
- Review console error messages

### Debug Commands
```bash
# Check manifest
cat public/spurs-women/photo-gallery.manifest.json

# Regenerate manifest
node scripts/generate-photo-manifest.js

# Test individual album
curl http://localhost:3000/spurs-women/photo-gallery.manifest.json
```

## Migration Checklist

### Pre-Migration
- [ ] Backup Supabase data
- [ ] Test hybrid system with sample data
- [ ] Prepare image optimization workflow
- [ ] Plan folder naming convention

### During Migration
- [ ] Export images from Supabase
- [ ] Optimize and organize images
- [ ] Create folder structure
- [ ] Update database records
- [ ] Regenerate manifest
- [ ] Test each gallery

### Post-Migration
- [ ] Validate all galleries work
- [ ] Remove Supabase Storage bucket
- [ ] Update documentation
- [ ] Monitor performance
- [ ] Clean up unused code
