import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";

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
    "docs/**",
    "src/generated/**",
  ]),
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    rules: {
      // Each component system (splash, curtains) exposes a single barrel
      // (index.ts). Ban deep alias imports so a symbol has exactly ONE import
      // path — the barrel — and internal refactors never break consumers.
      // Internal files use relative paths, which these alias patterns don't
      // match, so they're unaffected.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/components/systems/splash/*",
                "@/components/systems/curtains/*",
              ],
              message:
                "Import from the system barrel (e.g. '@/components/systems/splash'), not internal paths.",
            },
          ],
        },
      ],
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [["^\\u0000", "^@?\\w", "^[^.]", "^\\."]],
        },
      ],
      "simple-import-sort/exports": "warn",

      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
