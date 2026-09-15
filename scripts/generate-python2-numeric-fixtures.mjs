// Regenerate from a real Skulpt runtime bundle; no private application source is used.
import fs from "node:fs";
import vm from "node:vm";
import { createHash } from "node:crypto";
const bundle = fs.readFileSync(process.argv[2], "utf8");
const context = vm.createContext({ console, setTimeout, clearTimeout });
vm.runInContext(bundle, context);
const { Sk } = context;
Sk.configure({ __future__: Sk.python2 });
const sources = [
    "0755",
    "00",
    "08",
    "09",
    "0_7",
    "077.5",
    "077e1",
    "077j",
    "1L",
    "0L",
    "0755L",
    "0xffL",
    "0o755L",
    "0b101L",
    "123456789012345678901234567890L",
    "1l",
    "1.0L",
    "1e2L",
    "1jL",
    "1Lname",
    "a <> b",
    "a != b",
];
const cases = sources.map((source) => {
    try {
        const parsed = Sk.parse("input.py", source + "\n");
        const node = Sk.astFromParse(parsed.cst, "input.py", parsed.flags).body[0].value;
        if (node._astname === "Compare") return { source, expected: { comparison: node.ops[0].prototype._astname } };
        const n = node.n;
        let expected;
        if (n.tp$name === "complex") expected = { type: "complex", real: n.real, imag: n.imag };
        else if (n.tp$name === "float") expected = { type: "float", value: n.v };
        else expected = { type: "int", value: String(n.v), legacyLong: source.endsWith("L"), runtimeType: n.tp$name };
        return { source, expected };
    } catch (e) {
        if (!e.tp$name) throw e;
        return { source, error: e.tp$name };
    }
});
const result = {
    oracle: "Skulpt Python 2 parse + AST construction",
    bundleSha256: createHash("sha256").update(bundle).digest("hex"),
    cases,
};
fs.writeFileSync(
    new URL("../tests/fixtures/python2-numeric-skulpt.json", import.meta.url),
    JSON.stringify(result, null, 4) + "\n"
);
