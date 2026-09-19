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
const moduleFixtures = JSON.parse(readFileSync("tests/fixtures/python314-modules.json", "utf8"));
const selectedModules = [
    "match subject:\n    case 0: zero()\n    case [x,*xs] if xs: use(x)\n    case _: fallback()\nafter()",
    "match subject:\n    case {None: x, True: y, 1+2j: z, module.KEY: rest}:\n        pass",
    "match subject:\n    case Point(first,y=second,):\n        pass",
    "async def f():\n    async with a as x:\n        await use(x)",
    "try: pass\nexcept* E1: one()\nexcept* E2: two()\nelse: success()\nfinally: cleanup()",
    "try: pass\nexcept A,B: pass",
    "def f[T: int = int, *Ts = *tuple[()], **P = ...](x:T) -> tuple[T,*Ts]: return x",
    "async def f[T](a:T,/,b=1,*,c,**kw)->T:\n    async for x in xs:\n        await use(x)\n    return a",
    "@outer\n@inner(1)\nclass Café:\n    def méthode(self, 𝒙): return 𝒙",
    "if x: pass\nelif y: return 1\nelif z: return 2\nelse: return 3",
    "while x:\n    x -= 1\n    if x: continue\n    break\nelse:\n    done()\nafter()",
    "for a,(b,[c,*rest]) in values:\n    pass",
    "async for x,*rest in await source():\n    await use(x)\nelse:\n    done()",
    "from .....a.b import c",
    "type Alias[T = int, *Ts = *tuple[()], **P = ...] = tuple[T,*Ts]",
    "from __future__ import barry_as_FLUFL; x <> y",
    "",
    "a,(b,[c,*rest]) = values",
    "x = 1; y = x + 1;",
    "(x): int",
    "obj[start:end:step] = value",
    "del a,(b,[c,d])",
];
for (const source of selectedModules) {
    const fixture = moduleFixtures.cases.find((item) => item.source === source);
    assert.ok(fixture, `Missing CPython module fixture: ${source}`);
    const warnings = [];
    const tree = module.namespace.parseModule(source, {
        onWarning: ({ name, message, lineno }) => warnings.push({ name, message, lineno }),
    });
    assert.deepEqual(JSON.parse(JSON.stringify(tree)), fixture.tree);
    assert.deepEqual(warnings, fixture.warnings);
}
const diagnostics = JSON.parse(readFileSync("tests/fixtures/python314-diagnostics.json", "utf8"));
for (const source of [
    "if x:\npass",
    "def f(a=1,b): pass",
    "lambda *:1",
    "a,(b,1) = values",
    "del résumé,(𝒙,f())",
    "f(**kw,*xs)",
    "print x",
    'f"{x!1}"',
    "type A[] = int",
    "résumé = (\n x y\n",
    "x y\n]",
    'f"{x y"',
]) {
    const fixture = diagnostics.cases.find((item) => item.source === source);
    assert.ok(fixture, `Missing CPython diagnostic fixture: ${source}`);
    let failure;
    try {
        module.namespace[fixture.mode === "exec" ? "parseModule" : "parseExpression"](source);
    } catch (error) {
        failure = error;
    }
    assert.ok(failure, `Expected rejection: ${source}`);
    const actual = { name: failure.name, message: failure.message };
    for (const key of ["lineno", "offset", "end_lineno", "end_offset", "text"]) actual[key] = failure[key] ?? null;
    assert.deepEqual(actual, fixture.error);
}
console.log(
    JSON.stringify(
        {
            expressionPackageSmoke: "passed",
            cases: selected.length,
            moduleCases: selectedModules.length,
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
