import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { gzipSync, brotliCompressSync } from "node:zlib";

const source = readFileSync("dist-expression/index.js");
const context = vm.createContext({ TextEncoder, TextDecoder });
const module = new vm.SourceTextModule(source.toString(), { context });
await module.link((specifier) => {
    throw new Error(`Unexpected browser dependency: ${specifier}`);
});
await module.evaluate();
const fixtures = JSON.parse(readFileSync("tests/fixtures/python314-expressions.json", "utf8"));
const selected = [
    "lambda a,/,b=2,*args,c,d=4,e=None,**kw: result",
    "lambda: (yield from xs)",
    't"{yield from values}"',
    't"a{x}" t"b{y}"',
    'f"{x!r:{y!s}}"',
    "'\\N{SNOWMAN}'",
    "f(a, *xs, b, key=value, **kw)",
    "[a for (a, [b, *rest]) in rows]",
    "(a\r+b)",
    "a - b - c",
    "résumé + café * 2",
    "(value := 42)",
    "1and x",
];
for (const source of selected) {
    const fixture = fixtures.cases.find((item) => item.source === source);
    assert.ok(fixture, `Missing CPython fixture: ${source}`);
    const warnings = [];
    const tree = module.namespace.parseExpression(source, {
        onWarning: ({ name, message, lineno }) => warnings.push({ name, message, lineno }),
    });
    assert.deepEqual(JSON.parse(JSON.stringify(tree)), fixture.tree);
    assert.deepEqual(warnings, fixture.warnings);
}
console.log(
    JSON.stringify(
        {
            expressionPackageSmoke: "passed",
            cases: selected.length,
            sizes: {
                bytes: source.length,
                gzip: gzipSync(source).length,
                brotli: brotliCompressSync(source).length,
            },
        },
        null,
        2
    )
);
