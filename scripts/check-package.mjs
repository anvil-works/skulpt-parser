import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createContext, SourceTextModule } from "node:vm";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";
import { runParserFromString } from "@anvil-works/skulpt-parser";
import { runParserFromFile } from "@anvil-works/skulpt-parser/node";

// Execute the web entry without Node or Deno globals; reject all external imports.
const module = new SourceTextModule(readFileSync("dist/index.js", "utf8"), {
    context: createContext({ TextEncoder, TextDecoder }),
});
await module.link((specifier) => {
    throw new Error(`Unexpected browser dependency: ${specifier}`);
});
await module.evaluate();
const source = "x = 42\n";
const expected = JSON.stringify(runParserFromString(source));
assert.equal(JSON.stringify(module.namespace.runParserFromString(source)), expected);
const directory = mkdtempSync(join(tmpdir(), "skulpt-package-"));
try {
    const filename = join(directory, "example.py");
    writeFileSync(filename, source);
    assert.equal(JSON.stringify(runParserFromFile(filename)), expected);
} finally {
    rmSync(directory, { recursive: true });
}
const metadata = JSON.parse(readFileSync("package.json", "utf8"));
for (const entry of Object.values(metadata.exports)) assert.ok(readFileSync(entry.types).length);
const sizes = {};
for (const file of ["dist/index.js", "dist/node.js"]) {
    const bytes = readFileSync(file);
    sizes[file] = {
        bytes: bytes.length,
        gzip: gzipSync(bytes, { level: 9 }).length,
        brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
    };
}
console.log(JSON.stringify({ packageSmoke: "passed", sizes }, null, 2));
