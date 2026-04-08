import { defineConfig } from "vitest/config";
import tintype from "tintype/plugin";

export default defineConfig({
  plugins: [tintype({
    formatCommand: "deno fmt -",
  })],
  test: {
    setupFiles: ["tintype/setup"],
  },
});
