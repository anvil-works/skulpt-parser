// Independent frontend oracle. Only synthetic source is recorded in the fixture.
import fs from "node:fs";
import vm from "node:vm";
import { createHash } from "node:crypto";
const bundle = fs.readFileSync(process.argv[2], "utf8");
const context = vm.createContext({ console, setTimeout, clearTimeout });
vm.runInContext(bundle, context);
const { Sk } = context;
function tree(node) {
    if (node == null || (typeof node !== "object" && typeof node !== "function")) return node;
    if (Array.isArray(node)) return node.map(tree);
    if (typeof node === "function") return { _type: node.prototype._astname };
    if (node.ob$type) return node.v;
    const kind = node._astname;
    if (kind === "Str") return { _type: "Constant", value: { type: "str", value: node.s.v } };
    if (kind === "Num")
        return {
            _type: "Constant",
            value: {
                type: "int",
                value: String(node.n.v),
                ...(node.n.tp$name === "long" ? { legacyLong: true } : {}),
            },
        };
    if (kind === "NameConstant")
        return {
            _type: "Constant",
            value: node.value === Sk.builtin.none.none$ ? { type: "none" } : { type: "bool", value: !!node.value.v },
        };
    if (kind === "Index") return tree(node.value);
    if (kind === "Raise")
        return node.inst == null
            ? { _type: "Raise", exc: tree(node.exc), cause: tree(node.cause) }
            : { _type: "LegacyRaise", exc: tree(node.exc), inst: tree(node.inst), tback: tree(node.tback) };
    if (kind === "ExceptHandler" && node.name != null)
        return { _type: "LegacyExceptHandler", type: tree(node.type), target: tree(node.name), body: tree(node.body) };
    const result = { _type: kind };
    const fields = node._fields ?? [];
    for (let i = 0; i < fields.length; i += 2) {
        const key = fields[i];
        if (key === "docstring") continue;
        let value = node[key];
        if (kind === "Try" && key === "finalbody") value ??= [];
        if (kind === "Call" && ["args", "keywords"].includes(key)) value ??= [];
        result[key] = tree(value);
    }
    return result;
}
const sources = [
    "print",
    "print 1",
    "print 1, 'two'",
    "print 1,",
    "print >>out",
    "print >>out, 1, 'two',",
    "print(1)",
    "print(1, 2)",
    "print()",
    "print 0755L; print 2",
    "if True: print 'yes'",
    "def f():\n    print 'yes'\n    raise ValueError, 'no'",
    "raise",
    "raise ValueError",
    "raise ValueError, 'bad'",
    "raise ValueError, ('bad', 2), traceback",
    "try:\n    print 'try'\nexcept ValueError, error:\n    print error",
    "try:\n    pass\nexcept (ValueError, TypeError), error:\n    raise ValueError, error",
    ...["obj.error", "errors[0]", "(first, second)", "[first, second]"].map(
        (target) => `try:\n    pass\nexcept ValueError, ${target}:\n    pass`
    ),
    "try:\n    pass\nexcept ValueError as obj.error:\n    pass",
    "try:\n    pass\nexcept ValueError as error:\n    print error",
    "from __future__ import print_function\nprint(1, 2)",
    "print >>out,",
    "print ,",
    "print 1 2",
    "raise ValueError,",
    "raise ValueError, 1, 2, 3",
    ...["1", "first + second", "f()"].map((target) => `try:\n    pass\nexcept ValueError, ${target}:\n    pass`),
    "from __future__ import print_function\nprint 1",
];
const cases = sources.map((source) => {
    Sk.configure({ __future__: { ...Sk.python2, print_function: false } });
    try {
        const parsed = Sk.parse("input.py", source + "\n");
        return { source, expected: tree(Sk.astFromParse(parsed.cst, "input.py", parsed.flags)) };
    } catch (e) {
        if (!e.tp$name) throw e;
        return { source, error: e.tp$name };
    }
});
fs.writeFileSync(
    new URL("../tests/fixtures/python2-statements-skulpt.json", import.meta.url),
    JSON.stringify(
        {
            oracle: "Skulpt Python 2 parse + AST construction",
            bundleSha256: createHash("sha256").update(bundle).digest("hex"),
            cases,
        },
        null,
        4
    ) + "\n"
);
