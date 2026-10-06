import { parseExpression } from "../src/frontend.ts";
import { test, expect } from "@rstest/core";
import { readFileSync } from "node:fs";

// Sources and ASTs copied from CPython's test_tstring.py using its interpreter.
const reference = JSON.parse(
    readFileSync(new URL("./fixtures/template-expression-metadata.json", import.meta.url), "utf8")
);
for (const { source, tree } of reference.cases) {
    test(`CPython template expression metadata: ${JSON.stringify(source)}`, () => {
        expect(parseExpression(source)).toEqual(tree);
    });
}
