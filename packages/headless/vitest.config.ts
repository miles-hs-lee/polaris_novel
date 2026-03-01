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
      reporter: [
        "text",
        "lcov",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});

