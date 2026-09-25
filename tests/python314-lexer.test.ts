import { test, expect } from "@rstest/core";
import { tokenize } from "../src/lexer/tokenizer.ts";
import { readFileSync } from "node:fs";

// The bundler JSON loader rejects lone surrogates; JSON.parse preserves these test inputs.
const reference = JSON.parse(readFileSync("tests/fixtures/python314-lexer.json", "utf8"));

for (const [index, { source, extra, expected }] of reference.cases.entries()) {
    test(`CPython lexer ${index + 1}, extra=${extra}: ${JSON.stringify(source).slice(0, 80)}`, () => {
        const warnings: { name: string; message: string; lineno: number }[] = [];
        const actual: any = {};
        try {
            actual.tokens = tokenize(source, {
                extraTokens: extra,
                onWarning: ({ name, message, lineno }) => warnings.push({ name, message, lineno }),
            }).map(({ type, string, start, end, line }) => ({ type, string, start, end, line }));
        } catch (error: any) {
            actual.error = { name: error.name, message: error.message };
            for (const key of ["lineno", "offset", "end_lineno", "end_offset", "text"])
                actual.error[key] = error[key] ?? null;
        }
        actual.warnings = warnings;
        expect(actual).toEqual(expected);
    });
}
