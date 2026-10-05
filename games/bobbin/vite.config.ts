import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

// Bobbin builds into the Next.js site's public folder, so Vercel serves it as
// static files at /bobbin (see reference/bobbin/README.md). public/bobbin/ is
// gitignored - it's a build output, never edit it by hand.
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const outDir = fileURLToPath(new URL("../../public/bobbin", import.meta.url));
const BASE = "/bobbin/";

// Writes the service worker after the build: sw-template.js plus the list of
// every built file to precache, and a version hash of their contents (so any
// change to the game produces a new worker, which the browser then installs
// as an update). No plugin dependency - the worker is ~60 lines.
function serviceWorker(): Plugin {
  return {
    name: "bobbin-service-worker",
    apply: "build",
    closeBundle() {
      const files = readdirSync(outDir, { recursive: true, withFileTypes: true })
        .filter((d) => d.isFile())
        .map((d) => relative(outDir, join(d.parentPath, d.name)).split("\\").join("/"))
        // Not the worker itself; not the .woff font fallbacks, which every
        // browser that can install the app skips in favour of .woff2.
        .filter((f) => f !== "sw.js" && !f.endsWith(".woff"))
        .sort();
      const template = readFileSync(fileURLToPath(new URL("./sw-template.js", import.meta.url)), "utf8");
      // The version covers the worker's own code too, so a change to its
      // logic alone still gets a fresh cache.
      const hash = createHash("sha256").update(template);
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const precache = files.map((f) => BASE + f);
      const sw = template
        .replace('"__VERSION__"', JSON.stringify(hash.digest("hex").slice(0, 12)))
        .replace("__PRECACHE__", JSON.stringify(precache, null, 2));
      writeFileSync(join(outDir, "sw.js"), sw);
    },
  };
}

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: BASE,
  build: {
    outDir,
    emptyOutDir: true,
  },
  plugins: [serviceWorker()],
  server: {
    // Lets the dev server read files shared with the main site, e.g.
    // src/styles/variables.css (Bobbin uses the site's design tokens).
    fs: { allow: [repoRoot] },
  },
});
