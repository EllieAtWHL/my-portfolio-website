# Requirements Document

**Status: Implemented.** This was the original planning/spec document for the migration; the system it describes is now fully built (`scripts/generate-external-manifest.js`, `scripts/validate-manifest.js`, wired into `.github/workflows/validate-manifest.yml` on every push/PR to main). A few specifics below drifted from what was actually shipped - see the inline notes (folder-key format, `media.type` value, and MR-1). For the as-built system, prefer `GITHUB_PHOTO_GALLERY_SYSTEM.md` and `PHOTO_GALLERY_SYSTEM_GUIDE.md` in this folder; this doc is kept for historical/rationale context.

## Title

Migration from Supabase Storage to External GitHub Repository Image Hosting

## Background

The project currently uses Supabase Storage to host match photography. The application stores a Supabase folder path and dynamically retrieves all images within that folder at runtime.

Due to Supabase free-tier storage limits and the requirement for a zero-cost, long-term sustainable solution, the project will migrate image hosting to a dedicated external GitHub repository and serve images via CDN.

The new approach must preserve the existing mental model of referencing a photo folder rather than hardcoding individual image URLs.

---

## Goals and Non-Goals

### Goals

- Eliminate dependency on paid or usage-based image storage services
- Host all public images at zero ongoing cost
- Preserve folder-based image grouping per match
- Ensure images are available locally, in preview deployments, and in production
- Maintain good performance through static asset serving and CDN caching
- Minimise future vendor lock-in
- Keep website repository clean and focused on code
- Enable separate image management workflow

### Non-Goals

- No runtime directory listing of images from the browser
- No automatic image optimisation at request time
- No support for uploading images via the live site

---

## High-Level Architecture

### Storage

- Images are stored in a dedicated external GitHub repository (e.g., `spurs-women-photo-gallery`)
- Images are served via GitHub's built-in CDN or image optimization service
- Website repository contains only code and configuration files

### Image Discovery

- A build-time script scans the external repository via GitHub API
- The script generates a JSON manifest describing available images with CDN URLs
- The frontend consumes the manifest to render galleries
- Optional: Local manifest caching for development

---

## Functional Requirements

### FR-1: External Repository Structure

Images must be stored in a deterministic, human-readable folder structure in the external repository.

Example:
```
spurs-women-photo-gallery/
  2024-01-28-chelsea/
    001.webp
    002.webp
    003.webp
  2024-02-11-arsenal/
    001.webp
    002.webp
```

Folder names represent a match identifier (date-opponent or similar).

**As implemented**: the actual adopted convention is richer than this flat slug - folders are nested `SEASON/YYYYMMDD Competition Team1 vs Team2/`, e.g. `2023-24/20231008 WSL Spurs vs Bristol City/`.

---

### FR-2: Image Format and Size

- Images must be optimised prior to commit
- Preferred formats: WebP or AVIF
- Maximum width should be constrained (eg 2000px)
- Original camera files must not be committed
- Original high-resolution images remain archived externally (eg OneDrive)

---

### FR-3: External Manifest Generation

A build-time script must:

- Authenticate with GitHub API
- Scan the external repository for image folders
- Generate a manifest mapping folder keys to CDN URLs
- Output a deterministic, sorted JSON file
- Handle rate limiting and API quotas

Example output (see note above - actual folder keys use the `SEASON/YYYYMMDD Competition Team1 vs Team2` format):
```json
{
  "2024-01-28-chelsea": [
    "https://cdn.jsdelivr.net/gh/EllieAtWHL/spurs-women-photo-gallery@main/2024-01-28-chelsea/001.webp",
    "https://cdn.jsdelivr.net/gh/EllieAtWHL/spurs-women-photo-gallery@main/2024-01-28-chelsea/002.webp"
  ]
}
```

---

### FR-4: Manifest Location and Versioning

- The manifest file must be written to `public/spurs-women/photo-gallery.manifest.json`
- The manifest file must be committed to the website repository
- The manifest is considered part of site content, not a transient build artefact

---

### FR-5: Build Integration

- Manifest generation must run automatically during builds
- The script must run in both local and Vercel environments
- Recommended hooks:
  - `predev`
  - `prebuild`

**As implemented**: no `predev`/`prebuild` hook was added. Manifest generation is instead an explicit step (`npm run generate-external-manifest`) run manually in local dev and as its own CI job step in `.github/workflows/validate-manifest.yml` before the build step - not auto-triggered by `npm run dev`/`npm run build`.

---

### FR-6: Frontend Consumption

- The frontend must fetch `/spurs-women/photo-gallery.manifest.json`
- Given a stored folder key, the app must:
  - Look up the corresponding array of image URLs
  - Render all images dynamically
- No individual image URLs should be hardcoded in application logic

---

### FR-7: Data Model Compatibility

- Existing records that store a Supabase folder path must be migrated to store a folder key only
- Folder keys must be storage-agnostic and must not include base paths
- The `photo-album` media type must be retained to represent the existence of a gallery (as implemented, the actual DB/code value is `'photo album'` with a space, not the hyphenated `photo-album` used throughout this doc)
- Supabase remains the source of truth for gallery metadata and relationships (eg match, title, publish state)
- No Supabase Storage SDK calls should remain for image retrieval

---


## Non-Functional Requirements

### NFR-1: Cost

- Solution must operate at zero ongoing cost
- No usage-based billing or bandwidth charges

---

### NFR-2: Performance

- Images must be served as static assets
- CDN caching via Vercel must be utilised
- No runtime API calls for image listing

---

### NFR-3: Reliability

- Image URLs must be stable over time
- Site must not depend on third-party storage APIs
- Builds must be deterministic and repeatable

---

### NFR-4: Maintainability

- Folder structure must be easy to understand
- Manifest diffs must be human-readable in PRs
- Adding a new match gallery should require only:
  - Adding optimised images
  - Regenerating the manifest

---

## Supabase Media Table Requirements

### SMR-1: Retention of photo-album Media Type

- The `photo-album` media type must remain in the Supabase `media` table
- The media record represents a logical photo gallery, not physical storage
- Removal of the media record is out of scope

---

### SMR-2: Required `url` Field Handling

- The existing `url` field in the `media` table remains required
- For `photo-album` records, the `url` field must not contain a full image URL
- The `url` field must store the `folder_key` value
- The `folder_key` must be a logical identifier only (eg `2024-01-28-chelsea`)
- Application code must treat the `url` field as a folder key when `media.type = 'photo-album'`
- The `url` field must be ignored for storage concerns

---

### SMR-3: Storage-Agnostic Semantics

- Media records must not reference Supabase, GitHub, Vercel, or any storage provider by name
- Media semantics must describe *what exists*, not *where it is stored*
- This ensures future storage migrations do not require data model changes

---

## Migration Requirements

### MR-1: Existing Images

- Existing images must be exported from Supabase Storage
- Images must be optimised before committing to GitHub
- Folder structure must be recreated under `public/spurs-women/photo-gallery`

**As implemented**: images were never recreated under `public/spurs-women/photo-gallery` in this repo - they live solely in the external `spurs-women-photo-gallery` repository and are served via the jsDelivr CDN. `public/spurs-women/` only contains the generated manifest JSON (plus two unrelated logo images). `public/spurs-women/photo-gallery/` is created empty, on demand, only as a local dev stub by `npm run init-external-local`.

---

### MR-2: Code Changes

- Remove Supabase Storage image listing logic
- Introduce manifest-based lookup logic
- Ensure graceful handling of missing folders or empty galleries

---

## Risks and Mitigations

| Risk                            | Mitigation                                 |
| ------------------------------- | ------------------------------------------ |
| Repository size growth          | Enforce image optimisation and size limits |
| Forgotten manifest regeneration | Automate via build hooks                   |
| Future storage migration        | Keep folder keys storage-agnostic          |

---

## Future Considerations (Out of Scope)

- Migration to a dedicated image CDN if monetisation occurs
- Automated image optimisation pipelines
- Admin UI for managing galleries

---

## Acceptance Criteria

- Site builds and displays images locally without Supabase
- Preview and production deployments show identical galleries
- No Supabase Storage usage remains
- No paid services are required to keep images online

---

## Summary

This change replaces runtime object storage with deterministic, static image hosting. It trades dynamic listing for build-time certainty, enabling a zero-cost, low-risk, long-term solution suitable for a personal fan site.

