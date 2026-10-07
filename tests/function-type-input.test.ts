import { parseFunctionType } from "../src/frontend.ts";
import { test, expect } from "@rstest/core";
import { readFileSync } from "node:fs";

const reference = JSON.parse(readFileSync(new URL("./fixtures/function-type-input.json", import.meta.url), "utf8"));
for (const { source, tree, invalid } of reference.cases) {
    test(`CPython function-type input: ${JSON.stringify(source)}`, () => {
        if (invalid) expect(() => parseFunctionType(source)).toThrow(SyntaxError);
        else expect(parseFunctionType(source)).toEqual(tree);
    });
}
