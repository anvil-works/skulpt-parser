import { defineConfig } from "@rstest/core";
export default defineConfig({
    include: ["tests/legacy.case.ts"],
    source: { decorators: { version: "legacy" }, tsconfigPath: "./tsconfig.legacy.json" },
});
