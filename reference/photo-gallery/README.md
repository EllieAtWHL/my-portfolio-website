# Photo Gallery System

Match photo galleries are hosted in an external GitHub repository and served
via CDN, rather than through Supabase Storage. This keeps image hosting at
zero ongoing cost with no storage limits, while Supabase remains the source of
truth for gallery metadata.

## Architecture

- **External repository**: [`spurs-women-photo-gallery`](https://github.com/EllieAtWHL/spurs-women-photo-gallery) - contains all image files, organized by season/match
- **CDN**: jsDelivr (configurable) - serves images directly from the GitHub repo
- **Manifest**: `public/spurs-women/photo-gallery.manifest.json` - maps folder keys to arrays of CDN image URLs, generated from the external repo
- **Loader**: `src/lib/external-photo-loader.ts` - GitHub-only photo loading logic
- **Component**: `src/components/spurs-women/MediaGallery.tsx` - renders the gallery
- **Manifest generation script**: `scripts/generate-external-manifest.js` (top-level, not under `src/`)

### Repository structure

```
spurs-women-photo-gallery/
├── 2023-24/
│   └── 20231216 WSL Spurs vs Arsenal/
│       ├── PXL_20231216_080505678.webp
│       └── ...
├── 2024-25/
└── 2025-26/
```

Folder naming convention: `SEASON/YYYYMMDD Competition Team1 vs Team2/`, e.g.
`2023-24/20231008 WSL Spurs vs Bristol City/`.

### Manifest format

```json
{
  "2023-24/20231008 WSL Spurs vs Bristol City": [
    "https://cdn.jsdelivr.net/gh/EllieAtWHL/spurs-women-photo-gallery@main/2023-24/20231008 WSL Spurs vs Bristol City/001.webp",
    "https://cdn.jsdelivr.net/gh/EllieAtWHL/spurs-women-photo-gallery@main/2023-24/20231008 WSL Spurs vs Bristol City/002.webp"
  ]
}
```

### Database

Photo albums use the `media` table with `type = 'photo album'` (note: a space,
not a hyphen) and `storage_source = 'github'`. The `url` field stores the
GitHub folder key (not a full URL) - the app looks this up in the manifest at
render time.

```sql
UPDATE media
SET url = '2025-26/20260208 WSL Spurs vs Chelsea',
    storage_source = 'github'
WHERE match_id = 'your-match-id'
  AND type = 'photo album';
```

## Adding a New Photo Gallery

### 1. Optimize photos with ImageMagick

```bash
# Install (macOS)
brew install imagemagick

# Batch optimize all JPGs in the current directory
mkdir optimised
magick mogrify \
  -path ./optimised \
  -resize 2000x2000\> \
  -strip \
  -quality 82 \
  -format webp \
  *.jpg
```

Recommended settings: WebP format, 82% quality, max 2000px width, target
<500KB per photo, `-strip` to remove metadata.

### 2. Upload to the external repository

```bash
git clone https://github.com/EllieAtWHL/spurs-women-photo-gallery.git
cd spurs-women-photo-gallery
mkdir -p "2025-26/20260208 WSL Spurs vs Chelsea"
cp /path/to/optimized/photos/*.webp "2025-26/20260208 WSL Spurs vs Chelsea/"
git add "2025-26/20260208 WSL Spurs vs Chelsea/"
git commit -m "Add Chelsea vs Spurs photos"
git push origin main
```

### 3. Update the database

Insert (or update) the media record with the folder key as `url` and
`storage_source = 'github'` (see SQL above). Find the match ID first:

```sql
SELECT id, date, opponent, competition FROM matches ORDER BY date DESC;
```

### 4. Regenerate and validate the manifest

```bash
npm run generate-external-manifest
npm run validate-manifest
```

There is **no** `predev`/`prebuild` hook - manifest generation is a separate,
explicit step, not automatically triggered by `npm run dev` or `npm run
build`. In CI, `.github/workflows/validate-manifest.yml` runs
`generate-external-manifest` then `validate-manifest` and uploads the
manifest as an artifact - it does **not** run `npm run build` itself (that's
a separate job in `.github/workflows/ci.yml`). It triggers on push to
main/develop and PRs to main, but only when the change touches the manifest
script, validator, or manifest file itself (path-filtered, not every push/PR).

**In practice this step happens automatically** for match photos: pushing
image files to `spurs-women-photo-gallery`'s `main` branch triggers that
repo's own `.github/workflows/update-manifest.yml`, which checks out this
repo, runs `generate-external-manifest` + `validate-manifest`, and lands the
regenerated manifest here. Because this repo's `main` is protected with
required status checks (and `enforce_admins`), the Action can't push directly
to `main` - a commit that doesn't exist on the remote yet can never have
already-passed checks, so a plain `git push` is rejected outright. Instead it
commits to a throwaway `auto/update-manifest-<sha>` branch, opens a PR via
`gh pr create`, and enables auto-merge (`gh pr merge --auto --merge
--delete-branch`, a regular merge commit matching this repo's convention) -
the PR merges itself once all 7 required checks pass, no manual step needed.
The trigger's `paths:` filter excludes `player-photos/**` (WEB-29): those
images are referenced via a direct CDN URL pasted into a player's
`profile_image_url`, not the manifest, so there's nothing for this Action to
regenerate, and `generate-external-manifest.js` treats every top-level folder
as its own gallery, so including that folder would add a bogus
`"player-photos"` entry to the manifest. Manual regeneration (steps 1-4
above) is still the right approach for local development/testing.

### 5. Test locally, then deploy

```bash
npm run dev
# Visit match pages to verify photos load
npm run build
```

## Environment Variables

```bash
GITHUB_TOKEN=ghp_your_github_token          # required for private repos / higher rate limits
EXTERNAL_REPO_OWNER=EllieAtWHL
EXTERNAL_REPO_NAME=spurs-women-photo-gallery
EXTERNAL_REPO_BRANCH=main                    # optional, defaults to main
CDN_PROVIDER=jsdelivr                        # optional
CDN_BASE_URL=https://cdn.jsdelivr.net        # optional, this is the default (see scripts/generate-external-manifest.js)
```

Other CDN providers: `unpkg` (https://unpkg.com), `statically`
(https://cdn.statically.io).

## Pre-Deployment Checklist

- [ ] Photos optimized with ImageMagick (WebP, <500KB, ≤2000px)
- [ ] Photos pushed to the external repository
- [ ] Database updated with the correct folder key and `storage_source = 'github'`
- [ ] Manifest generated: `npm run generate-external-manifest`
- [ ] Manifest validated: `npm run validate-manifest`
- [ ] Verified locally with `npm run dev`
- [ ] Build succeeds: `npm run build`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Manifest generation fails | Check `GITHUB_TOKEN` in `.env.local`; verify repo access; check internet connectivity |
| Photos not loading on site | Run `npm run validate-manifest`; verify folder key in DB matches a manifest key exactly; check browser console for 404s |
| Wrong photos showing | Regenerate the manifest; double-check the DB `url` field points to the correct folder key |
| Build fails | Run `npm run validate-manifest`; ensure all env vars are set; check for TypeScript errors |

Debug commands:

```bash
# Check manifest content
cat public/spurs-women/photo-gallery.manifest.json

# Test GitHub API access
curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/repos/EllieAtWHL/spurs-women-photo-gallery

# Test a CDN URL directly
curl -I "https://cdn.jsdelivr.net/gh/EllieAtWHL/spurs-women-photo-gallery@main/2025-26/folder/001.webp"
```

## History

This system replaced an earlier Supabase Storage-based approach (hitting
Supabase's free-tier storage limits). The migration is complete: all photo
albums use `storage_source = 'github'`, there's no remaining Supabase Storage
dependency for images, and images were never copied into
`public/spurs-women/photo-gallery/` in this repo - they live solely in the
external repository and are served via CDN (`public/spurs-women/photo-gallery/`
is only ever created empty, on demand, as a local dev stub by `npm run
init-external-local`).

**Leftover script**: `npm run migrate-storage` / `migrate-storage:dry-run`
(`scripts/migrate-storage-source.js`) is the one-time script that performed
this migration - it backfills the `storage_source` field on existing `media`
rows based on URL pattern. It's now inert (nothing left to migrate) but still
present in `package.json`. Note it reads `SUPABASE_URL`/`SUPABASE_ANON_KEY`,
not the `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` names used
elsewhere in this codebase (e.g. `src/lib/supabase/`) - if it's ever run
again, set both legacy variable names explicitly.
