import fs from "node:fs";
import zlib from "node:zlib";
import crypto from "node:crypto";
const files = [
    "dist/reference.js",
    "dist/loader/index.js",
    "dist/lexer-Oz.wasm",
    "dist/lexer-O2.wasm",
    "dist/lexer-binary-Oz.wasm",
    "dist/lexer-binary-O2.wasm",
];
const artifacts = {};
for (const file of files) {
    const b = fs.readFileSync(file);
    const record = {
        bytes: b.length,
        gzipBytes: zlib.gzipSync(b, { level: 9 }).length,
        brotliBytes: zlib.brotliCompressSync(b, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
        sha256: crypto.createHash("sha256").update(b).digest("hex"),
    };
    if (file.endsWith(".wasm")) {
        const m = new WebAssembly.Module(b);
        record.imports = WebAssembly.Module.imports(m);
        record.exports = WebAssembly.Module.exports(m);
    }
    artifacts[file] = record;
}
const totals = {};
for (const file of files.filter((f) => f.endsWith(".wasm"))) {
    const a = artifacts[file],
        l = artifacts["dist/loader/index.js"];
    totals[file] = {
        bytes: a.bytes + l.bytes,
        gzipBytes: a.gzipBytes + l.gzipBytes,
        brotliBytes: a.brotliBytes + l.brotliBytes,
    };
}
fs.writeFileSync("results/sizes.json", JSON.stringify({ artifacts, wasmPlusLoader: totals }, null, 2) + "\n");
console.log(JSON.stringify({ reference: artifacts["dist/reference.js"], totals }, null, 2));
