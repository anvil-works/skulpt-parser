import { test, expect } from "@rstest/core";
import { parseExpression } from "../src/python314/expression.ts";
import reference from "./fixtures/python314-expressions.json";

function materialize(value: any): any {
    if (Array.isArray(value)) return value.map(materialize);
    if (value === null || typeof value !== "object") return value;
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
