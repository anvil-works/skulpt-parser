import { defineConfig } from "@rslib/core";
export default defineConfig({
    source: { entry: { index: process.env.TOKENIZER_ENTRY! } },
    lib: [{ format: "esm", dts: false }],
    output: { target: "web", minify: true, distPath: { root: process.env.TOKENIZER_DIST! } },
});
