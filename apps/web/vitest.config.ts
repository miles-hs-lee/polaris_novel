import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    name: "apps/web",
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "./**/*.test.ts",
      "./**/*.test.tsx",
    ],
    exclude: [
      "./node_modules/**",
      "./.next/**",
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
      "@": resolve(__dirname, "."),
    },
  },
});
