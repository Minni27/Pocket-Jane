import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored, minified, and not ours to fix: the pdf.js worker is copied
    // from node_modules into public/ so it is served from this origin rather
    // than a CDN. See SECURITY.md.
    "public/pdf.worker.min.mjs",
    "public/sw.js",
  ]),
]);

export default eslintConfig;
