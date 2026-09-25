import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["backend/**/*.test.js", "frontend/**/*.test.{ts,tsx}"],
    setupFiles: ["./frontend/test/setup.ts"],
  },
});
