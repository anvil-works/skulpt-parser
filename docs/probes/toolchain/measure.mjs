import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, brotliCompressSync } from "node:zlib";
import { createHash } from "node:crypto";
const js = readFileSync("dist/index.js");
const dts = readFileSync("dist/modern.d.ts");
const { ProbeParser } = await import("./dist/index.js?" + Date.now());
if (new ProbeParser("1+2+3").sum() !== 6) throw Error("built ESM smoke failed");
const result = {
    bytes: js.length,
    gzip: gzipSync(js).length,
    brotli: brotliCompressSync(js).length,
    dtsBytes: dts.length,
    sha256: createHash("sha256").update(js).digest("hex"),
};
console.log(JSON.stringify(result));
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(result, null, 2) + "\n");
