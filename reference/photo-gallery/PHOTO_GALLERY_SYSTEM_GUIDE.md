# Photo Gallery System Guide

## Overview

This guide covers the complete photo gallery system that supports both Supabase storage and external GitHub repository hosting with CDN delivery.

## Table of Contents

1. [Technical Architecture](#technical-architecture)
2. [User Workflow](#user-workflow)
3. [Migration Guide](#migration-guide)
4. [Troubleshooting](#troubleshooting)

---

## Technical Architecture

### System Components

#### 1. Hybrid Storage System
The photo gallery supports two storage sources:
- **Supabase Storage**: Legacy storage for existing photos
- **GitHub Repository + CDN**: New system for external photo hosting

#### 2. Photo Manifest System
- **Location**: `/public/spurs-women/photo-gallery.manifest.json`
- **Purpose**: Maps folder keys to arrays of CDN image URLs
- **Format**: JSON object with folder paths as keys
- **Example**:
```json
{
  "2025-26/20260201 WSL West Ham vs Spurs": [
    "https://cdn.jsdelivr.net/gh/EllieAtWHL/spurs-women-photo-gallery@main/2025-26/20260201 WSL West Ham vs Spurs/image1.webp"
  ]
}
```

#### 3. CDN Configuration
- **Provider**: jsDelivr (configurable)
- **Base URL**: `https://cdn.jsdelivr.net`
- **Repository**: `EllieAtWHL/spurs-women-photo-gallery@main`

### Data Flow

1. **Database**: Stores photo metadata with folder keys as URLs
2. **Manifest**: Maps folder keys to actual image URLs
3. **MediaGallery Component**: Loads manifest and displays images
4. **CDN**: Serves optimized images from GitHub repository

### Key Files

| File | Purpose |
|------|---------|
| `src/components/spurs-women/MediaGallery.tsx` | Main gallery component |
| `src/lib/photo-manifest.ts` | Manifest loading utilities |
| `src/lib/external-photo-loader.ts` | Hybrid photo loading logic |
| `scripts/generate-external-manifest.js` | Manifest generation script |
| `scripts/validate-manifest.js` | Manifest validation |
| `public/spurs-women/photo-gallery.manifest.json` | Generated manifest file |

---

## User Workflow

### Step 1: Prepare Photos with ImageMagick

#### Install ImageMagick CLI
```bash
# macOS with Homebrew
brew install imagemagick

# Verify installation
magick -version
```

#### Optimize Photos
```bash
# Create optimized folder (if it doesn't exist)
mkdir optimised

# Batch optimize all JPG files in current directory
magick mogrify \
  -path ./optimised \
  -resize 2000x2000\> \
  -strip \
  -quality 82 \
  -format webp \
  *.jpg
```

#### Recommended Settings
- **Format**: WebP (better compression than JPEG)
- **Quality**: 82% (good balance of quality/size)
- **Max Dimensions**: 2000x2000 (only resizes if larger)
- **File Size**: Aim for under 500KB per photo
- **Additional**: `-strip` removes metadata for smaller files

### Step 2: Add Photos to External Repository

#### Repository Structure
```
spurs-women-photo-gallery/
├── 2025-26/
│   ├── 20260118 WFA Cup Spurs vs Leicester City/
│   │   ├── photo1.webp
│   │   └── photo2.webp
│   ├── 20260201 WSL West Ham vs Spurs/
│   │   └── photo1.webp
│   └── 20260208 WSL Spurs vs Chelsea/
│       └── photo1.webp
```

#### Naming Convention
- **Season Folder**: `YYYY-YY/` (e.g., `2025-26/`)
- **Match Folder**: `YYYYMMDD Competition Team1 vs Team2/`
- **Photos**: Descriptive names or sequential numbers

#### Upload Process
```bash
# Clone your photo repository
git clone https://github.com/EllieAtWHL/spurs-women-photo-gallery.git
cd spurs-women-photo-gallery

# Create season folder if needed
mkdir -p "2025-26"

# Create match folder
mkdir -p "2025-26/20260208 WSL Spurs vs Chelsea"

# Copy optimized photos
cp /path/to/optimized/photos/*.webp "2025-26/20260208 WSL Spurs vs Chelsea/"

# Commit and push
git add "2025-26/20260208 WSL Spurs vs Chelsea/"
git commit -m "Add Chelsea vs Spurs photos"
git push origin main
```

### Step 3: Update Supabase Database

#### Database Schema
```sql
-- Media table structure
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  type TEXT CHECK (type IN ('photo', 'photo album')),
  url TEXT NOT NULL,
  caption TEXT,
  title TEXT,
  thumbnail_url TEXT,
  description TEXT,
  source TEXT,
  date DATE,
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  storage_source TEXT CHECK (storage_source IN ('supabase', 'github', NULL))
);
```

#### Update Photo Album Records
```sql
-- For new photo albums (GitHub-based)
INSERT INTO media (
  id,
  match_id,
  type,
  url,
  caption,
  storage_source,
  sort_order,
  created_at
) VALUES (
  gen_random_uuid(),
  'your-match-id',
  'photo album',
  '2025-26/20260208 WSL Spurs vs Chelsea',
  'Chelsea vs Spurs Women',
  'github',
  1,
  NOW()
);

-- For existing photo albums (migrate to GitHub)
UPDATE media 
SET 
  url = '2025-26/20260208 WSL Spurs vs Chelsea',
  storage_source = 'github'
WHERE match_id = 'your-match-id' 
  AND type = 'photo album';
```

#### Finding Match IDs
```sql
-- List all matches to find the right ID
SELECT id, date, opponent, competition 
FROM matches 
ORDER BY date DESC;

-- Check existing media for a match
SELECT * FROM media 
WHERE match_id = 'your-match-id' 
ORDER BY sort_order;
```

### Step 4: Generate and Validate Manifest

#### Generate Manifest
```bash
# Always run before deployment
npm run generate-external-manifest
```

#### Validate Manifest
```bash
# Manual validation
npm run validate-manifest

# Full build with validation
npm run build
```

#### Expected Output
```
🖼️  Generating external photo gallery manifest...
📁 2025-26/20260118 WFA Cup Spurs vs Leicester City: 16 images
📁 2025-26/20260201 WSL West Ham vs Spurs: 16 images
📁 2025-26/20260208 WSL Spurs vs Chelsea: 21 images
✅ Manifest written to: /Users/user/Code/my-portfolio-website/public/spurs-women/photo-gallery.manifest.json
📁 Total folders: 3
📸 Total images: 53
```

### Step 5: Pre-deployment Checklist

#### Before Deploying
```bash
# 1. Ensure all photos are optimized and uploaded to GitHub
# 2. Update database with correct folder keys
# 3. Generate fresh manifest
npm run generate-external-manifest

# 4. Validate manifest
npm run validate-manifest

# 5. Test locally
npm run dev
# Visit match pages to verify photos load

# 6. Build and validate
npm run build
```

#### Environment Variables Required
```bash
# .env.local
GITHUB_TOKEN=ghp_your_github_token
EXTERNAL_REPO_OWNER=EllieAtWHL
EXTERNAL_REPO_NAME=spurs-women-photo-gallery
EXTERNAL_REPO_BRANCH=main
CDN_PROVIDER=jsdelivr
CDN_BASE_URL=https://cdn.jsdelivr.net
```

---

## Migration Guide

### From Supabase to GitHub Storage

#### 1. Identify Supabase Photos
```sql
-- Find all photo albums using Supabase storage
SELECT id, match_id, url, caption 
FROM media 
WHERE type = 'photo album' 
  AND (storage_source = 'supabase' OR storage_source IS NULL);
```

#### 2. Create GitHub Folders
Follow the repository structure guidelines and upload photos to GitHub.

#### 3. Update Database Records
```sql
-- Update records to point to GitHub folders
UPDATE media 
SET 
  storage_source = 'github',
  url = 'new-github-folder-key'
WHERE id IN ('photo-album-id-1', 'photo-album-id-2');
```

#### 4. Verify Migration
```sql
-- Check migration status
SELECT 
  storage_source,
  COUNT(*) as count
FROM media 
WHERE type = 'photo album'
GROUP BY storage_source;
```

---

## Troubleshooting

### Common Issues

#### 1. Manifest Generation Fails
**Problem**: `npm run generate-external-manifest` fails
**Solutions**:
- Check GitHub token in `.env.local`
- Verify repository exists and is accessible
- Ensure internet connectivity

```bash
# Test GitHub API access
curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/repos/EllieAtWHL/spurs-women-photo-gallery
```

#### 2. Photos Not Loading on Website
**Problem**: Gallery shows but no images appear
**Solutions**:
- Check manifest is generated: `npm run validate-manifest`
- Verify folder key in database matches manifest key
- Check browser console for 404 errors
- Ensure images exist in GitHub repository

#### 3. Wrong Photos Showing
**Problem**: Chelsea match shows West Ham photos
**Solutions**:
- Regenerate manifest: `npm run generate-external-manifest`
- Check database URL field points to correct folder key
- Verify folder structure in GitHub repository

#### 4. Build Fails
**Problem**: `npm run build` fails during deployment
**Solutions**:
- Run `npm run validate-manifest` to check manifest
- Ensure all environment variables are set
- Check for TypeScript errors

### Debug Commands

```bash
# Check manifest content
cat public/spurs-women/photo-gallery.manifest.json

# Validate manifest
npm run validate-manifest

# Test manifest loading locally
curl http://localhost:3000/spurs-women/photo-gallery.manifest.json

# Check GitHub repository structure
gh repo view EllieAtWHL/spurs-women-photo-gallery --tree
```

### Performance Optimization

#### Image Optimization
```bash
# Create optimized folder
mkdir -p optimised

# Optimize all images for responsive loading
magick mogrify \
  -path ./optimised \
  -resize 2000x2000\> \
  -strip \
  -quality 82 \
  -format webp \
  *.jpg
```

#### CDN Caching
- Images are cached by jsDelivr CDN
- Cache invalidation happens automatically on new commits
- Force cache refresh by adding version parameter if needed

---

## Best Practices

### Photo Management
1. **Always optimize photos before upload**
2. **Use consistent naming conventions**
3. **Organize by season and competition**
4. **Keep original files as backup**

### Database Management
1. **Use descriptive captions for accessibility**
2. **Set proper sort_order for display sequence**
3. **Update storage_source when migrating**
4. **Test changes in development first**

### Deployment
1. **Always generate manifest before deploying**
2. **Validate manifest in CI/CD pipeline**
3. **Test photo loading after deployment**
4. **Monitor for 404 errors**

### Security
1. **Keep GitHub token secure**
2. **Use environment variables for secrets**
3. **Limit repository permissions if possible**
4. **Regular token rotation**

---

## Quick Reference

### Essential Commands
```bash
# Optimize photos with ImageMagick
mkdir optimised
magick mogrify \
  -path ./optimised \
  -resize 2000x2000\> \
  -strip \
  -quality 82 \
  -format webp \
  *.jpg

# Generate manifest from GitHub repository
npm run generate-external-manifest

# Validate manifest
npm run validate-manifest

# Build with validation
npm run build

# Test locally
npm run dev
```

### Folder Key Examples
```
2025-26/20260208 WSL Spurs vs Chelsea
2025-26/20260201 WSL West Ham vs Spurs
2025-26/20260118 WFA Cup Spurs vs Leicester City
```

### Database Update Template
```sql
UPDATE media 
SET url = '2025-26/20260208 WSL Spurs vs Chelsea',
    storage_source = 'github'
WHERE match_id = 'your-match-id' 
  AND type = 'photo album';
```

This guide covers the complete workflow from photo optimization to deployment. Follow these steps to ensure your photo gallery works reliably with the hybrid storage system.
