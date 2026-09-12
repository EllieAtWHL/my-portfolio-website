# Mobile Upload Pipeline

**Status**: WEB-148 (a spike) proved the core mechanism end-to-end against a
real phone upload. The actual admin-facing feature (batch upload, `media`
row linking, real UI) is tracked separately as WEB-149 and isn't built yet -
everything below is the reusable technical groundwork that feature will
build on, not a description of a finished feature. See
`MOBILE_UPLOAD_OVERVIEW.md` in this folder for a plain-English summary of
what this means for actually using the site.

## What's proven

A photo can go: phone → authenticated `/api/admin/*` request → resized and
compressed server-side with `sharp` (replacing the ImageMagick step, which
can't run in a Vercel serverless function) → committed into
`spurs-women-photo-gallery` via the GitHub Contents API (no local
`git clone`) → picked up by the existing `update-manifest.yml` webhook →
reachable via its CDN URL. Verified against real phone photos (3.6-3.9MB
originals): resize+compress under 1 second, GitHub commit ~1-2 seconds,
comfortably under the 500KB/webp target from a single request.

## Required Next.js/Vercel config for `sharp`

`sharp` does not work in a Vercel serverless function without this config in
`next.config.ts` - don't remove it, even if the route using `sharp` changes:

```ts
serverExternalPackages: ["sharp"],
outputFileTracingIncludes: {
  "/api/**/*": ["./node_modules/sharp/**/*", "./node_modules/@img/**/*"],
},
```

- `serverExternalPackages` stops Next's bundler mis-tracing the native
  module for the serverless target.
- `outputFileTracingIncludes` is the non-obvious part: `sharp`'s actual
  native binaries live in separate `@img/sharp-<platform>-<arch>` /
  `@img/sharp-libvips-<platform>-<arch>` packages, and `libvips` is loaded
  dynamically via `dlopen()` at the C++ level - invisible to Next's
  automatic `require()`/`import()`-based file tracing. Without this, the
  deployed function fails at runtime with
  `ERR_DLOPEN_FAILED: libvips-cpp.so.<version>: cannot open shared object file`,
  even though it works locally and even though `serverExternalPackages` is
  set. Verify the fix is working by checking that a route's
  `.next/server/.../route.js.nft.json` trace manifest includes `@img/*`
  entries after a production build.
- Import `sharp` with a dynamic `await import('sharp')` inside the route
  handler's own `try/catch`, not a top-level `import sharp from 'sharp'`. A
  top-level import that throws (e.g. the native-load failure above) crashes
  the whole route module before any error handling runs, which surfaces
  client-side as Next's generic `__next_error__` HTML crash page instead of
  a real error message - costly to debug from a phone with no server log
  access.

## Constraints to design around (WEB-148 findings, for WEB-149)

- **Mobile screen-lock can kill an in-flight upload.** Uploading a
  multi-MB original photo over a real mobile connection can take longer
  than a phone's screen-lock timeout; both iOS Safari and Android Chrome
  suspend backgrounded network activity, which surfaces as a generic
  `Failed to fetch`. Client-side pre-compression before upload (shrinking
  the payload) is the highest-leverage fix; a Screen Wake Lock request
  during upload is a smaller mitigation.
- **Batch strategy**: prefer one request per photo over one large batched
  request - keeps well clear of serverless function duration limits and
  isolates a failure to one photo instead of a whole album.
- **Webhook/manifest-exclusion ordering**: `spurs-women-photo-gallery`'s
  `update-manifest.yml` webhook always regenerates the manifest against
  this repo's `main` branch, regardless of which branch is under test. Any
  new non-gallery/staging folder convention (matching the existing
  `player-photos`/`NON_GALLERY_FOLDERS` pattern in
  `scripts/generate-external-manifest.js`) needs its exclusion merged to
  `main` *before* the first commit to that path, or the webhook will treat
  it as a real gallery and open an auto-merging PR against `main` with
  bogus manifest content.
- **Supabase OAuth + Vercel previews**: testing the admin login on a Vercel
  preview URL requires that preview's origin to be in Supabase's
  Authentication → URL Configuration → Redirect URLs allow-list (a wildcard
  like `https://<project>-git-*-<org>.vercel.app/**` covers all branch
  previews) - otherwise Google OAuth silently redirects back to
  production's callback instead.

Full findings, including exact measured numbers: WEB-148 on Jira.
