import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    name: "packages/headless",
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "./src/**/*.test.ts",
      "./src/**/*.test.tsx",
    ],
    exclude: [
      "./node_modules/**",
      "./dist/**",
    ],
    coverage: {
      provider: "v8",
      all: false,
      reporter: [
        "text",
        "lcov",
        "json-summary",
      ],
      thresholds: {
        lines: 55,
        branches: 45,
        functions: 55,
        statements: 55,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
