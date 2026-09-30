import { defineConfig } from "@rslib/core";

// Keep optional compiler/name helpers separate from the self-contained parser.
export default defineConfig({
    source: {
        decorators: { version: "legacy" },
        entry: {
            index: "./src/index.ts",
            "unicode-names": "./src/string_names.ts",
            optimize: "./src/optimize_ast.ts",
        },
    },
    lib: [{ format: "esm", syntax: "es2020", dts: true }],
    output: { target: "web", minify: true, distPath: { root: "dist-core" } },
});
