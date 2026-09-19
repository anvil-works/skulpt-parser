import { defineConfig } from "@rslib/core";
export default defineConfig({
    source: { decorators: { version: "legacy" }, entry: { index: "./src/mod.ts", node: "./src/node.ts" } },
    lib: [{ format: "esm", syntax: "es2020", dts: true }],
    output: { target: "web", minify: true, externals: ["node:fs"] },
});
