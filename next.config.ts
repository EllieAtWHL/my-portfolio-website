import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Next.js dev mode (HMR, react-refresh) needs 'unsafe-eval'; production doesn't.
const scriptSrc = ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])];

// Third-party embeds actually used on the site (YouTube videos, Spotify track embed
// on the London 2012 blog, OpenStreetMap on Spurs Women stadium pages) plus the hosts
// VideoGrid calls client-side for oEmbed metadata (src/lib/youtube.ts), Supabase
// (auth + data), FullStory (public/fullstory-init.js) and Vercel Analytics
// (@vercel/analytics/next, which loads its script from va.vercel-scripts.com rather
// than same-origin). img-src is left broad (https:) because the portfolio side of the
// site links out to a wide, one-off set of external preview images (see OG `images`
// arrays across src/app/**/page.tsx) that aren't worth enumerating host-by-host.
// Verified against a live dev-server pass over the home page, Spurs Women home
// (videos/podcasts/news), a match page (icon_svg), the interactive stadium map,
// the London 2012 Spotify embed, and the Lightning Rollout YouTube embeds - see
// WEB-70 PR description for the checklist.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  `script-src ${scriptSrc.join(" ")} https://edge.fullstory.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://www.youtube.com https://noembed.com https://*.fullstory.com",
  "frame-src https://www.youtube.com https://open.spotify.com https://www.openstreetmap.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  // Dev/CI serve plain http://localhost - upgrading that would just break every
  // request (WebKit in particular does not reliably exempt localhost from this,
  // unlike Chromium/Firefox, which silently swallowed navigation in Playwright's
  // WebKit CI job). Meaningless on a non-HTTPS origin anyway, so prod-only.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
];

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES.join("; ") },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // Player profile photos (profile_image_url, admin-entered free text - see
    // WEB-83) are always jsDelivr-served URLs from the spurs-women-photo-gallery
    // repo in practice, matching the match-photo manifest system's CDN_PROVIDER
    // (see reference/photo-gallery/README.md). Scoped to that repo's own path,
    // not the whole jsDelivr host, so next/image won't optimize (and thereby
    // proxy) an unrelated jsDelivr-hosted URL if one ever ended up in the field.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        // jsDelivr's GitHub path is /gh/{user}/{repo}@{ref}/{path} - the ref
        // is appended directly to the repo name with no slash before it, so
        // it needs its own single-segment `*` (a `**` here would only match
        // within one path segment, same as `*` - it only gets "globstar"
        // behaviour spanning slashes as a standalone segment) ahead of the
        // `/**` that matches the rest of the path. Verified against a real
        // manifest URL from reference/photo-gallery/README.md via live
        // /_next/image requests: this pattern proxies a real file (404 from
        // jsDelivr itself, past the allowlist check) while a different repo
        // under the same host, and a different host entirely, both correctly
        // 400 at the allowlist check.
        pathname: "/gh/EllieAtWHL/spurs-women-photo-gallery@*/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
