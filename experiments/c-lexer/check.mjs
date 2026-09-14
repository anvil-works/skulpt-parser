import fs from "node:fs";
import assert from "node:assert/strict";
import { createLexer } from "./loader.mjs";
const [wasm, corpusPath, output, wire] = process.argv.slice(2);
const lexer = await createLexer(fs.readFileSync(wasm), { binary: wire === "binary" });
const raw = fs.readFileSync(corpusPath, "utf8");
const corpus = corpusPath.endsWith(".jsonl") ? raw.trim().split("\n").map(JSON.parse) : JSON.parse(raw);
const fields = ["name", "message", "lineno", "offset", "end_lineno", "end_offset", "text"];
let exact = 0;
const failures = [];
for (const item of corpus) {
    for (const mode of ["extra", "strict"]) {
        const expected = item[mode];
        let actual;
        try {
            actual = lexer.run(item.source, mode === "extra");
        } catch (e) {
            actual = { hostError: String(e) };
        }
        const normalize = (x) =>
            x.error
                ? { error: Object.fromEntries(fields.map((k) => [k, x.error[k] ?? null])) }
                : x.tokens
                ? { tokens: x.tokens }
                : x;
        try {
            assert.deepEqual(normalize(actual), normalize(expected));
            exact++;
        } catch {
            failures.push({ name: item.name, mode, source: item.source, expected, actual });
        }
    }
}
const result = {
    scope: "tokens-and-errors; warnings not compared",
    warningCases: corpus.filter((c) => c.extra?.warnings?.length || c.strict?.warnings?.length).length,
    cases: corpus.length,
    modes: corpus.length * 2,
    exact,
    failureCount: failures.length,
    imports: lexer.imports,
    failures: failures.slice(0, 15),
};
fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ cases: result.cases, modes: result.modes, exact, failureCount: failures.length }));
if (failures.length) process.exitCode = 1;
