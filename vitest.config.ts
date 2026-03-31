import { defineConfig } from "vitest/config";
import tintype from "tintype/plugin";

export default defineConfig({
  plugins: [tintype()],
  test: {
    setupFiles: ["tintype/setup"],
  },
});
