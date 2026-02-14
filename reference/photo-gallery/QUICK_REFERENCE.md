# Photo Gallery Quick Reference

## Essential Commands

```bash
# Create optimised folder
mkdir optimised

# Optimize photos with ImageMagick
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

## Pre-deployment Checklist

- [ ] Photos optimized with ImageMagick
- [ ] Photos uploaded to GitHub repository
- [ ] Database updated with correct folder keys
- [ ] Manifest generated: `npm run generate-external-manifest`
- [ ] Manifest validated: `npm run validate-manifest`
- [ ] Local testing completed
- [ ] Build successful: `npm run build`

## Folder Key Examples

```
2025-26/20260208 WSL Spurs vs Chelsea
2025-26/20260201 WSL West Ham vs Spurs
2025-26/20260118 WFA Cup Spurs vs Leicester City
```

## Database Update Template

```sql
UPDATE media 
SET url = '2025-26/20260208 WSL Spurs vs Chelsea',
    storage_source = 'github'
WHERE match_id = 'your-match-id' 
  AND type = 'photo album';
```

## Environment Variables

```bash
GITHUB_TOKEN=ghp_your_token
EXTERNAL_REPO_OWNER=EllieAtWHL
EXTERNAL_REPO_NAME=spurs-women-photo-gallery
EXTERNAL_REPO_BRANCH=main
CDN_PROVIDER=jsdelivr
CDN_BASE_URL=https://cdn.jsdelivr.net
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Manifest generation fails | Check GitHub token in `.env.local` |
| Photos not loading | Run `npm run validate-manifest` |
| Wrong photos showing | Regenerate manifest and check database URLs |
| Build fails | Ensure all environment variables are set |

## Repository Structure

```
spurs-women-photo-gallery/
├── 2025-26/
│   ├── 20260118 WFA Cup Spurs vs Leicester City/
│   ├── 20260201 WSL West Ham vs Spurs/
│   └── 20260208 WSL Spurs vs Chelsea/
```

## Image Optimization Settings

- **Format**: WebP
- **Quality**: 82%
- **Max Dimensions**: 2000x2000
- **Target File Size**: < 500KB

---

**For complete documentation**: See [PHOTO_GALLERY_SYSTEM_GUIDE.md](./PHOTO_GALLERY_SYSTEM_GUIDE.md)
