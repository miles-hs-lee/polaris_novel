import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "./apps/web/vitest.config.ts",
      "./packages/headless/vitest.config.ts",
    ],
  },
});
