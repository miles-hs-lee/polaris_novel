import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "./apps/web/vitest.config.ts",
      "./packages/headless/vitest.config.ts",
    ],
    coverage: {
      provider: "v8",
      all: false,
      reporter: [
        "text",
        "lcov",
        "json-summary",
      ],
      exclude: [
        "**/dist/**",
        "**/.next/**",
        "**/node_modules/**",
        "**/*.config.*",
        "**/tests/setup.ts",
      ],
      thresholds: {
        lines: 55,
        branches: 45,
        functions: 55,
        statements: 55,
      },
    },
  },
});
