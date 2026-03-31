import { defineConfig } from "vitest/config";
import { typeSnapshots } from "./scripts/vitest-type-snapshots.ts";

export default defineConfig({
	plugins: [typeSnapshots()],
	test: {
		setupFiles: ["./src/__tests__/vitest-setup.ts"],
	},
});
