import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import drizzle from "eslint-plugin-drizzle";
import storybook from "eslint-plugin-storybook";

const config = [
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "storybook-static/**",
    "next-env.d.ts",
  ]),
  ...nextVitals,
  {
    files: ["**/*.{ts,tsx,js,mjs,cjs}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      drizzle,
    },
    rules: {
      ...tsPlugin.configs["recommended-type-checked"]?.rules,
      ...tsPlugin.configs["stylistic-type-checked"]?.rules,
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      "drizzle/enforce-delete-with-where": [
        "error",
        {
          drizzleObjectName: ["db", "ctx.db"],
        },
      ],
      "drizzle/enforce-update-with-where": [
        "error",
        {
          drizzleObjectName: ["db", "ctx.db"],
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: tsPlugin.configs["eslint-recommended"]?.overrides?.[0]?.rules,
  },
  ...storybook.configs["flat/recommended"],
];

export default config;
