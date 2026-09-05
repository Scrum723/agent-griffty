import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@griffty/domain": path.resolve(__dirname, "packages/domain/src/index.ts"),
      "@griffty/scoring": path.resolve(__dirname, "packages/scoring/src/index.ts"),
      "@griffty/prompts": path.resolve(__dirname, "packages/prompts/src/index.ts"),
      "@griffty/connectors": path.resolve(__dirname, "packages/connectors/src/index.ts"),
      "@griffty/runtime": path.resolve(__dirname, "packages/runtime/src/index.ts"),
      "@griffty/store": path.resolve(__dirname, "packages/store/src/index.ts"),
    },
  },
  test: {
    include: ["packages/**/*.test.ts", "functions/**/*.test.ts"],
    environment: "node",
  },
});
