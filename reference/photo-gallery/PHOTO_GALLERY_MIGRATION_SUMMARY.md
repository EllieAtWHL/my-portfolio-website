# Photo Gallery Migration Summary

## Overview

Successfully migrated from Supabase Storage to **External GitHub Repository** for image hosting. This provides better separation of concerns, professional image management workflow, and improved performance through CDN.

## Implementation Details

### ✅ Completed Tasks

1. **Directory Structure Created**
   - `/public/spurs-women/photo-gallery/` - Removed (now external)
   - External repository: `spurs-women-photo-gallery`

2. **Manifest Generation System**
   - `scripts/generate-external-manifest.js` - External repository integration
   - GitHub API authentication and CDN URL generation
   - Support for multiple CDN providers (jsDelivr, unpkg, statically)

3. **Type Definitions**
   - `src/types/photo-manifest.ts` - Removed (replaced by external loader)
   - `src/lib/external-photo-loader.ts` - Hybrid loading system
   - Updated `PhotoMedia` interface with `storage_source` field

4. **Component Updates**
   - `src/components/spurs-women/MediaGallery.tsx` - Clean hybrid component
   - Supports both Supabase (legacy) and external repository (new)
   - Explicit storage source detection via `storage_source` field

5. **Database Schema**
   - Added `storage_source` field to media table
   - Values: `'supabase'`, `'github'`, `'external'`
   - Migration scripts provided for smooth transition

## Architecture

### 🏗️ **Final System**

```
┌─────────────────────────────────────────────────┐
│              Website Repository                │
│  ┌───────────────────────────────────────┐   │
│  │  Components & Pages              │   │
│  │  • MediaGallery.tsx             │   │
│  │  • Match pages                 │   │
│  └───────────────────────────────────────┘   │
│                                         │
│  ┌───────────────────────────────────────┐   │
│  │        External Repository          │   │
│  │  ┌─────────────────────────────┐   │
│  │  │  spurs-women-photo-gallery  │   │
│  │  │  • Images                 │   │
│  │  │  • 2024-01-28-chelsea/  │   │
│  │  │  • 2024-02-11-arsenal/     │   │
│  │  └─────────────────────────────┘   │
│  │                              │   │
│  │  • CDN (jsDelivr)            │   │
│  │  • GitHub API Integration    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
├── lib/
│   └── photo-manifest.ts
├── components/spurs-women/
│   └── MediaGallery.tsx
└── app/
    └── photo-gallery-test/
        └── page.tsx

scripts/
└── generate-photo-manifest.js
```

## Manifest Format

```json
{
  "2026-02-08-chelsea": [
    "/spurs-women/photo-gallery/2026-02-08-chelsea/001.svg",
    "/spurs-women/photo-gallery/2026-02-08-chelsea/001.webp",
    "/spurs-women/photo-gallery/2026-02-08-chelsea/002.svg"
  ]
}
```

## Usage

### Adding New Photo Galleries

1. Create folder: `/public/spurs-women/photo-gallery/YYYY-MM-DD-opponent/`
2. Add optimized images (WebP/AVIF preferred)
3. Run `npm run predev` or `npm run prebuild` to regenerate manifest
4. Update Supabase media record with folder key as `url` field

### Development Workflow

- Manifest automatically regenerated on `npm run dev` and `npm run build`
- Manual regeneration: `node scripts/generate-photo-manifest.js`
- Test page available at `/photo-gallery-test`

## Benefits

1. **Cost**: Zero ongoing hosting costs
2. **Performance**: Static asset serving via Vercel CDN
3. **Reliability**: No third-party storage dependencies
4. **Maintainability**: Simple folder structure and deterministic builds
5. **Future-proof**: Storage-agnostic folder keys enable easy migration

## Migration Notes

- Supabase remains the source of truth for gallery metadata
- Only the `url` field semantics changed for `photo-album` records
- No data migration required for existing Supabase records
- Backward compatibility maintained for individual photos

## Next Steps

1. Export existing images from Supabase Storage
2. Optimize images (WebP/AVIF, max width 2000px)
3. Organize into folder structure
4. Update Supabase `url` fields with folder keys
5. Remove Supabase Storage bucket (no longer needed)
