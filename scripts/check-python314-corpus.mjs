import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { parseModule } from "../dist-expression/index.js";

// Expectations come from the pinned interpreter at runtime, not checked-in TS output.
const records = JSON.parse(
    execFileSync("python3.14", ["tests/fixtures/generate_python314_corpus.py"], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
    })
);
function materialize(value) {
    if (Array.isArray(value)) return value.map(materialize);
    if (value === null || typeof value !== "object") return value;
    if ("$float" in value) return Number(value.$float);
    if ("$bigint" in value) return BigInt(value.$bigint);
    if ("$bytes" in value) return new Uint8Array(value.$bytes);
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, materialize(child)]));
}
for (const { name, source, tree, warnings } of records) {
    const actualWarnings = [];
    const actual = parseModule(source, {
        onWarning: ({ name, message, lineno }) => actualWarnings.push({ name, message, lineno }),
    });
    assert.deepEqual(actual, materialize(tree), `${name}: AST differs from CPython`);
    assert.deepEqual(actualWarnings, warnings, `${name}: warnings differ from CPython`);
    if (name.startsWith("stdlib/")) console.log(`CPython corpus passed: ${name}`);
}
const retained = records.filter(({ name }) => name.startsWith("corpus/")).length;
console.log(
    `Compared ${retained} retained source fixtures and ${
        records.length - retained
    } standard-library ASTs and warnings.`
);
