import { defineConfig } from "@rstest/core";
export default defineConfig({
    source: { decorators: { version: "legacy" } },
    include: ["tests/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 10000,
});
