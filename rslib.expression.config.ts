import { defineConfig } from "@rslib/core";

// Standalone migration build; does not change the published package entry points.
export default defineConfig({
    source: { decorators: { version: "legacy" }, entry: { index: "./src/python314/expression.ts" } },
    lib: [{ format: "esm", syntax: "es2020", dts: false }],
    output: { target: "web", minify: true, distPath: { root: "dist-expression" } },
});
