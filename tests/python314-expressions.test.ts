import { parseExpression } from "../src/python314/frontend.ts";
import { test, expect } from "@rstest/core";
import { readFileSync } from "node:fs";

// Preserve legal Python string values containing lone surrogate code points.
const reference = JSON.parse(readFileSync(new URL("./fixtures/python314-expressions.json", import.meta.url), "utf8"));

function materialize(value: any): any {
    if (Array.isArray(value)) return value.map(materialize);
    if (value === null || typeof value !== "object") return value;
    if ("$bytes" in value) return new Uint8Array(value.$bytes);
    if ("$float" in value) return Number(value.$float);
    if ("$bigint" in value) return BigInt(value.$bigint);
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, materialize(child)]));
}

for (const { source, tree, warnings } of reference.cases) {
    test(`CPython source → AST: ${JSON.stringify(source)}`, () => {
        const actualWarnings: any[] = [];
        expect(
            parseExpression(source, {
                onWarning: ({ name, message, lineno }) => actualWarnings.push({ name, message, lineno }),
            })
        ).toEqual(materialize(tree));
        expect(actualWarnings).toEqual(warnings);
    });
}

for (const { source, error: expected } of reference.errors) {
    test(`CPython parser error: ${JSON.stringify(source).slice(0, 80)}`, () => {
        let failure: any;
        try {
            parseExpression(source);
        } catch (error) {
            failure = error;
        }
        expect(failure).toBeDefined();
        const actual: any = { name: failure.name, message: failure.message };
        for (const key of ["lineno", "offset", "end_lineno", "end_offset", "text"]) actual[key] = failure[key] ?? null;
        expect(actual).toEqual(expected);
    });
}

// Rejection parity only: second-pass diagnostic wording is not implemented yet.
for (const { source, errorName } of reference.rejections) {
    test(`CPython rejects expression: ${source}`, () => {
        let failure: unknown;
        try {
            parseExpression(source);
        } catch (error) {
            failure = error;
        }
        expect(failure).toBeInstanceOf(SyntaxError);
        expect((failure as Error).name).toBe(errorName);
    });
}

// Deliberate frontend normalization of CPython's leaked codec exception.
for (const { source, upstreamName, message } of reference.normalizedErrors) {
    test(`Normalize ${upstreamName} from format specification: ${source}`, () => {
        let failure: unknown;
        try {
            parseExpression(source);
        } catch (error) {
            failure = error;
        }
        expect(failure).toBeInstanceOf(SyntaxError);
        expect((failure as Error).message).toBe(`(unicode error) ${message}`);
    });
}
