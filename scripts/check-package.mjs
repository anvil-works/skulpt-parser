import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, copyFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import ts from "typescript";
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
    ["print 0755L\nasync = 1\n", { pythonVersion: 2, asyncAwaitAsIdentifiers: true }],
]) {
    assert.equal(
        JSON.stringify(module.namespace.parseModule(source, options)),
        JSON.stringify(root.parseModule(source, options))
    );
}
assert.throws(() => root.parseExpression('"\\N{SNOWMAN}"'), root.UnicodeNameDatabaseRequired);
for (const entry of Object.values(metadata.exports)) assert.ok(readFileSync(entry.types).length);
// Resolve the built public declarations as an external TypeScript consumer.
const consumer = mkdtempSync(join(tmpdir(), "skulpt-parser-types-"));
try {
    mkdirSync(join(consumer, "node_modules/@anvil-works"), { recursive: true });
    symlinkSync(resolve("."), join(consumer, "node_modules/@anvil-works/skulpt-parser"), "dir");
    const source = join(consumer, "consumer.ts");
    copyFileSync("tests/package-types.ts", source);
    const program = ts.createProgram([source], {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        strict: true,
        noEmit: true,
        types: [],
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(
        diagnostics.length,
        0,
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
            getCanonicalFileName: (name) => name,
            getCurrentDirectory: () => consumer,
            getNewLine: () => "\n",
        })
    );
} finally {
    rmSync(consumer, { recursive: true, force: true });
}
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
