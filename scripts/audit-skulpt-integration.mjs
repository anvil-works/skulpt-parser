// Read-only integration reconnaissance, not a compiler compatibility test.
// Usage: node scripts/audit-skulpt-integration.mjs <skulpt-bundle> <core-bundle>
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

const [skulptPath, corePath] = process.argv.slice(2);
if (!skulptPath || !corePath) throw new Error("Expected Skulpt and parser core bundle paths");
const bundle = readFileSync(skulptPath, "utf8");
const context = vm.createContext({ console, setTimeout, clearTimeout });
vm.runInContext(bundle, context);
const { Sk } = context;
const { parseModule } = await import(pathToFileURL(resolve(corePath)).href);
const cases = [
    ["assignment", "x = 1"],
    ["literals", "x = (1, 9007199254740993, 1.5, 2j, 'text', b'bytes', True, None, ...)"],
    ["slices", "x = a[1, 2:3]"],
    ["function", "def f(a, *, b=2):\n    'doc'\n    return a + b"],
    ["handler", "try:\n    pass\nexcept ValueError as error:\n    pass"],
    ["fstring", "x = f'{value!r:>10}'"],
    ["posonly", "def f(a, /):\n    return a"],
    ["walrus", "x = (y := 1)"],
    ["match", "match x:\n    case 1: pass"],
    ["except-star", "try:\n    pass\nexcept* ValueError:\n    pass"],
    ["type-params", "def f[T](x: T):\n    return x"],
    ["type-alias", "type X = int"],
    ["template", "x = t'{value}'"],
    ["async-function", "async def f():\n    await g()"],
    ["async-comprehension", "x = [y async for y in z]"],
    ["legacy-async", "async = await(1)"],
    ["nonlocal", "def f():\n    x = 1\n    def g():\n        nonlocal x\n        x = 2"],
    ["debugger", "debugger"],
    ["unicode-name", "x = '\\N{SNOWMAN}'"],
    ["unicode-identifier", "K = 1"],
    ["scope-error", "return 1"],
    ["syntax-error", "x = ("],
    ["print", "print 1,", true],
    ["long", "x = 0755L", true],
    ["legacy-raise", "raise ValueError, 'bad'", true],
    ["legacy-handler", "try:\n    pass\nexcept ValueError, obj.error:\n    pass", true],
    ["future-print", "from __future__ import print_function\nprint(1, 2)", true],
    ["configured-print", "print(1, 2)", true, { print_function: true }],
    ["bytes-py2", "x = b'\\u1234'", true],
];
function attempt(fn) {
    try {
        return { ok: true, ...fn() };
    } catch (e) {
        return { ok: false, error: e.tp$name || e.name, message: e.toString() };
    }
}
function skulptTree(node) {
    if (node == null || !["object", "function"].includes(typeof node)) return node;
    if (Array.isArray(node)) return node.map(skulptTree);
    if (typeof node === "function") return { _type: node.prototype._astname };
    if (node.ob$type) return { pythonType: node.tp$name, repr: node.$r().v };
    const result = { _type: node._astname };
    for (let i = 0; i < (node._fields?.length ?? 0); i += 2) {
        const key = node._fields[i];
        result[key] = skulptTree(node[key]);
    }
    return result;
}
const results = cases.map(([name, source, python2 = false, flags = {}]) => {
    const configure = () => Sk.configure({ __future__: { ...(python2 ? Sk.python2 : Sk.python3), ...flags } });
    configure();
    const frontend = attempt(() => {
        const parsed = Sk.parse("audit.py", source + "\n");
        const ast = Sk.astFromParse(parsed.cst, "audit.py", parsed.flags);
        const first = ast.body[0];
        return {
            first: first._astname,
            expression: first.value?._astname,
            flags: parsed.flags,
            ast: JSON.stringify(skulptTree(ast)),
        };
    });
    configure();
    const compile = attempt(() => {
        Sk.compile(source + "\n", "audit.py", "exec", true);
        return {};
    });
    const options = { filename: "audit.py", python2Compat: python2, legacyAsyncNames: true };
    const parser = attempt(() => {
        const ast = parseModule(source + "\n", options);
        const first = ast.body[0];
        return {
            first: first._type,
            expression: first.value?._type,
            ast: JSON.stringify(ast, (key, value) => {
                if (["lineno", "col_offset", "end_lineno", "end_col_offset"].includes(key)) return undefined;
                if (typeof value === "bigint") return { bigint: String(value) };
                if (value instanceof Uint8Array) return Array.from(value);
                return value;
            }),
        };
    });
    return { name, source, python2, flags, frontend, compile, parser };
});
Sk.configure({ __future__: { ...Sk.python3 } });
const directSymboltable = attempt(() => {
    return { dump: Sk.dumpSymtab(Sk.symboltable(parseModule("x = 1\n"), "audit.py")) };
});
const oldParsed = Sk.parse("audit.py", "x = 1\n");
const oldSymboltable = Sk.dumpSymtab(
    Sk.symboltable(Sk.astFromParse(oldParsed.cst, "audit.py", oldParsed.flags), "audit.py")
);
console.log(
    JSON.stringify(
        {
            node: process.version,
            skulptSha256: createHash("sha256").update(bundle).digest("hex"),
            coreSha256: createHash("sha256").update(readFileSync(corePath)).digest("hex"),
            directSymboltable,
            oldSymboltable,
            cases: results,
        },
        null,
        2
    )
);
