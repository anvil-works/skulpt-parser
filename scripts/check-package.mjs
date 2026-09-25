import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, SourceTextModule } from "node:vm";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";
import * as root from "@anvil-works/skulpt-parser";
import * as core from "@anvil-works/skulpt-parser/core";

// Both public entry points share one implementation and exclude the name database.
assert.strictEqual(root, core);
assert.equal("runParserFromString" in root, false);
await assert.rejects(import("@anvil-works/skulpt-parser/node"), {
    code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
});

// Execute the web entry without Node or Deno globals; reject all external imports.
const metadata = JSON.parse(readFileSync("package.json", "utf8"));
const file = metadata.exports["."].import;
const module = new SourceTextModule(readFileSync(file, "utf8"), {
    context: createContext({ TextEncoder, TextDecoder }),
});
await module.link((specifier) => {
    throw new Error(`Unexpected browser dependency: ${specifier}`);
});
await module.evaluate();
for (const [source, options] of [
    ["type Alias[T = int] = list[T]\n", {}],
    ["print 0755L\nasync = 1\n", { python2Compat: true, legacyAsyncNames: true }],
]) {
    assert.equal(
        JSON.stringify(module.namespace.parseModule(source, options)),
        JSON.stringify(root.parseModule(source, options))
    );
}
assert.throws(() => root.parseExpression('"\\N{SNOWMAN}"'), root.UnicodeNameDatabaseRequired);
for (const entry of Object.values(metadata.exports)) assert.ok(readFileSync(entry.types).length);
const bytes = readFileSync(file);
console.log(
    JSON.stringify(
        {
            packageSmoke: "passed",
            sizes: {
                [file]: {
                    bytes: bytes.length,
                    gzip: gzipSync(bytes, { level: 9 }).length,
                    brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
                },
            },
        },
        null,
        2
    )
);
