import { parseModule } from "../src/python314/frontend.ts";
import { test, expect } from "@rstest/core";
import { readFileSync } from "node:fs";

// Read directly because legal Python string values can contain lone surrogates.
const reference = JSON.parse(readFileSync(new URL("./fixtures/python314-modules.json", import.meta.url), "utf8"));
function materialize(value: any): any {
    if (Array.isArray(value)) return value.map(materialize);
    if (value === null || typeof value !== "object") return value;
    if ("$bytes" in value) return new Uint8Array(value.$bytes);
    if ("$float" in value) return Number(value.$float);
    if ("$bigint" in value) return BigInt(value.$bigint);
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, materialize(child)]));
}
for (const { source, tree, warnings } of reference.cases) {
    test(`CPython source → Module: ${JSON.stringify(source)}`, () => {
        const actualWarnings: any[] = [];
        const actual = parseModule(source, {
            onWarning: ({ name, message, lineno }) => actualWarnings.push({ name, message, lineno }),
        });
        expect(actual).toEqual(materialize(tree));
        expect(actualWarnings).toEqual(warnings);
    });
}
for (const { source, errorName } of reference.rejections) {
    test(`CPython rejects module: ${JSON.stringify(source)}`, () => {
        let failure: any;
        try {
            parseModule(source);
        } catch (error) {
            failure = error;
        }
        expect(failure).toBeDefined();
        expect(failure.name).toBe(errorName);
    });
}

for (const { source, error: expected } of reference.errors) {
    test(`CPython module error: ${JSON.stringify(source)}`, () => {
        let failure: any;
        try {
            parseModule(source);
        } catch (error) {
            failure = error;
        }
        expect(failure).toBeDefined();
        const actual: any = { name: failure.name, message: failure.message };
        for (const key of ["lineno", "offset", "end_lineno", "end_offset", "text"]) actual[key] = failure[key] ?? null;
        expect(actual).toEqual(expected);
    });
}
