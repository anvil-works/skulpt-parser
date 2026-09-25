import { defineConfig } from "@rslib/core";

// Independent bundles: the name resolver has no parser or runtime dependency.
export default defineConfig({
    source: {
        decorators: { version: "legacy" },
        entry: {
            index: "./src/index.ts",
            "unicode-names": "./src/string_names.ts",
        },
    },
    lib: [{ format: "esm", syntax: "es2020", dts: true }],
    output: { target: "web", minify: true, distPath: { root: "dist-core" } },
});
