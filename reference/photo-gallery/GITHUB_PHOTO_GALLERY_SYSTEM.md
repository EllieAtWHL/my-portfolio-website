# GitHub Photo Gallery System

## Overview

The photo gallery system uses GitHub repository hosting with CDN delivery for all photo albums. This provides a simple, reliable, and cost-effective solution for serving match photos.

## Architecture

### System Components

#### 1. GitHub Repository Storage
- **Repository**: `spurs-women-photo-gallery` 
- **CDN**: jsDelivr (or configured provider)
- **Format**: Organized folder structure by match date

#### 2. Photo Manifest System
- **File**: `public/spurs-women/photo-gallery.manifest.json`
- **Generation**: Automatic during build process
- **Purpose**: Maps folder keys to CDN URLs

#### 3. Loading System
- **Component**: `MediaGallery.tsx`
- **Loader**: `external-photo-loader.ts`
- **Method**: Direct GitHub CDN loading

## File Structure

### Repository Organization
```
spurs-women-photo-gallery/
├── 2024-25/
│   ├── 20241116 WSL Spurs vs Arsenal/
│   │   ├── 001.webp
│   │   ├── 002.webp
│   │   └── ...
│   └── 20241123 WLeague Cup Spurs vs Villa/
├── 2025-26/
│   ├── 20250907 WSL Spurs vs West Ham/
│   └── 20251019 WLeague Cup Spurs vs Birmingham/
└── README.md
```

### Website Integration
```
src/
├── lib/
│   └── external-photo-loader.ts     # GitHub photo loading
└── components/spurs-women/
    └── MediaGallery.tsx             # Gallery component

scripts/                              # top-level, not under src/
└── generate-external-manifest.js     # Manifest generation

public/
└── spurs-women/
    └── photo-gallery.manifest.json   # Generated manifest
```

## Usage

### Adding New Photo Galleries

1. **Create Folder in Repository**
   ```bash
   # Format: YYYY-MM-DD Competition - Spurs vs Opponent
   mkdir "2025-26/20250215 WSL - Spurs vs Manchester United"
   ```

2. **Add Optimized Images**
   - Use WebP or AVIF format
   - Max width: 2000px
   - Reasonable file sizes (< 500KB per image)
   - Sequential naming: 001.webp, 002.webp, etc.

3. **Update Database**
   ```sql
   INSERT INTO media (
     match_id,
     type,
     url,
     caption,
     storage_source,
     sort_order
   ) VALUES (
     'your-match-id',
     'photo album',
     '2025-26/20250215 WSL - Spurs vs Manchester United',
     'Match photos: Spurs vs Manchester United',
     'github',
     1
   );
   ```

4. **Regenerate Manifest**
   ```bash
   npm run generate-external-manifest
   # or manually:
   node scripts/generate-external-manifest.js
   ```

### Development Workflow

There is no `predev`/`prebuild` script - manifest generation is a separate, explicit step, not automatically triggered by `npm run dev` or `npm run build`:

```bash
# Manual manifest regeneration
npm run generate-external-manifest

# Validate manifest
npm run validate-manifest

# Build for production (manifest is NOT auto-generated as part of this)
npm run build
```

In CI, `.github/workflows/validate-manifest.yml` runs `generate-external-manifest` then `validate-manifest` before `npm run build`, on every push/PR to main.

## Configuration

### Environment Variables
```bash
# Required
EXTERNAL_REPO_OWNER=EllieAtWHL
EXTERNAL_REPO_NAME=spurs-women-photo-gallery

# Optional
EXTERNAL_REPO_BRANCH=main
CDN_PROVIDER=jsdelivr
CDN_BASE_URL=https://cdn.jsdelivr.net  # defaults to this if unset (see scripts/generate-external-manifest.js)
GITHUB_TOKEN=ghp_your_token  # For private repos
```

### CDN Providers

| Provider | Base URL | Features |
|----------|----------|----------|
| jsdelivr | https://cdn.jsdelivr.net | Fast, reliable, default |
| unpkg | https://unpkg.com | Simple, popular |
| statically | https://cdn.statically.io | GitHub-focused |

## Database Schema

### Media Table Updates
```sql
-- Photo album records use GitHub storage
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  type TEXT CHECK (type IN ('photo', 'photo album', 'article', 'social media', 'video-external')),
  url TEXT, -- Folder key for GitHub albums
  storage_source TEXT CHECK (storage_source IN ('github', NULL)),
  caption TEXT,
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Details

### Photo Loading Logic
```typescript
// Load photos from GitHub repository
import { loadPhotosFromGitHub } from '@/lib/external-photo-loader';

const albumPhotos = loadPhotosFromGitHub(photo, manifest);
```

### Manifest Format
```json
{
  "2025-26/20250215 WSL - Spurs vs Manchester United": [
    "https://cdn.jsdelivr.net/gh/EllieAtWHL/spurs-women-photo-gallery@main/2025-26/20250215 WSL - Spurs vs Manchester United/001.webp",
    "https://cdn.jsdelivr.net/gh/EllieAtWHL/spurs-women-photo-gallery@main/2025-26/20250215 WSL - Spurs vs Manchester United/002.webp"
  ]
}
```

## Best Practices

### Image Organization
- **Consistent Naming**: Use date-based folder format
- **Sequential Files**: Number images 001, 002, 003...
- **Optimization**: WebP/AVIF with reasonable compression
- **Size Limits**: Max 2000px width, < 500KB files

### Repository Management
- **Public Repository**: Required for CDN access
- **Branch Strategy**: Use `main` for production
- **Commit Messages**: Descriptive, include match details
- **README Documentation**: Include setup instructions

### Performance
- **CDN Caching**: Automatic through GitHub + CDN
- **Image Optimization**: Modern formats with compression
- **Lazy Loading**: Implemented in gallery component
- **Progressive Enhancement**: Fallbacks for loading errors

## Troubleshooting

### Common Issues

**Images Not Loading**
- Check manifest file exists and is valid JSON
- Verify folder structure matches database URL field
- Ensure repository is public for CDN access
- Check CDN provider configuration

**Manifest Generation Issues**
- Verify environment variables are set
- Check GitHub repository access
- Validate folder structure in repository
- Review script error logs

**Build Failures**
- Check external repository connectivity
- Validate environment configuration
- Review manifest generation output
- Ensure proper file permissions

### Debug Commands
```bash
# Check manifest content
cat public/spurs-women/photo-gallery.manifest.json

# Test CDN URL (replace with actual path)
curl -I "https://cdn.jsdelivr.net/gh/EllieAtWHL/spurs-women-photo-gallery@main/2025-26/folder/001.webp"

# Validate configuration (file is .ts, not .js - use a TS-aware run, e.g. via ts-node or a small test script)
# node -e "console.log(require('./src/lib/external-photo-loader.ts').validateExternalRepoConfig())"
```

## Migration Notes

### From Previous Systems
- All photo albums now use `storage_source = 'github'`
- URL field contains folder key instead of storage path
- No Supabase Storage dependencies for photos
- Simplified loading logic with single source

### Data Consistency
```sql
-- Verify all photo albums use GitHub storage
SELECT COUNT(*) as github_albums
FROM media 
WHERE type = 'photo album' 
  AND storage_source = 'github';

-- Check for any remaining legacy records
SELECT id, url, storage_source 
FROM media 
WHERE type = 'photo album' 
  AND (storage_source != 'github' OR storage_source IS NULL);
```

## Benefits

1. **Cost**: Zero ongoing hosting costs
2. **Performance**: Global CDN delivery
3. **Reliability**: No third-party storage dependencies
4. **Simplicity**: Single storage source
5. **Scalability**: No storage limits
6. **Version Control**: Image history and backup

---

*This system provides a robust, scalable solution for photo gallery management with minimal complexity and maximum performance.*
