import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Bobbin builds into the Next.js site's public folder, so Vercel serves it as
// static files at /bobbin/ (see reference/bobbin/README.md). public/bobbin/ is
// gitignored - it's a build output, never edit it by hand.
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "/bobbin/",
  build: {
    outDir: fileURLToPath(new URL("../../public/bobbin", import.meta.url)),
    emptyOutDir: true,
  },
  server: {
    // Lets the dev server read files shared with the main site, e.g.
    // src/styles/variables.css (Bobbin uses the site's design tokens).
    fs: { allow: [repoRoot] },
  },
});
