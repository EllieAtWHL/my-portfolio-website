import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next's core-web-vitals only wires up 6 jsx-a11y rules, all
  // as "warn" - this pulls in the plugin's full recommended rule set at its
  // default "error" level, so violations actually fail CI instead of being
  // silently ignorable. Only `rules` (not the whole flat config object) to
  // avoid re-registering the "jsx-a11y" plugin, which nextVitals already
  // registers under the same name - ESLint's flat config throws on that.
  { rules: jsxA11y.flatConfigs.recommended.rules },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Standalone CommonJS Node CLI scripts, run directly via `node scripts/x.js`.
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
