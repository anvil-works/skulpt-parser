import { parseModule, parseExpression } from "../src/frontend.ts";
import { test, expect } from "@rstest/core";
import { readFileSync } from "node:fs";

const reference = JSON.parse(readFileSync(new URL("./fixtures/python314-diagnostics.json", import.meta.url), "utf8"));
for (const { source, mode, error, warnings } of reference.cases) {
    test(`CPython ${mode} diagnostic: ${JSON.stringify(source)}`, () => {
        const actualWarnings: any[] = [];
        let failure: any;
        try {
            (mode === "exec" ? parseModule : parseExpression)(source, {
                onWarning: ({ name, message, lineno }) => actualWarnings.push({ name, message, lineno }),
            });
        } catch (error) {
            failure = error;
        }
        expect(failure).toBeDefined();
        const actual: any = { name: failure.name, message: failure.message };
        for (const key of ["lineno", "offset", "end_lineno", "end_offset", "text"]) actual[key] = failure[key] ?? null;
        expect(actual).toEqual(error);
        expect(actualWarnings).toEqual(warnings);
    });
}
