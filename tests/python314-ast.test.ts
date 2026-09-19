import { test, expect } from "@rstest/core";
import * as ast from "../src/python314/ast.ts";
import fixtures from "./fixtures/python314-ast.json";

function materialize(value: any, useFactories: boolean): any {
    if (Array.isArray(value)) return value.map((item) => materialize(item, useFactories));
    if (value === null || typeof value !== "object") return value;
    if ("$bigint" in value) return BigInt(value.$bigint);
    if ("$bytes" in value) return new Uint8Array(value.$bytes);
    if (useFactories && "_type" in value) {
        // Fixture property order comes from CPython's _fields followed by _attributes.
        const factory = (ast as Record<string, Function>)[value._type];
        if (!factory) throw new Error(`Missing AST factory: ${value._type}`);
        return factory(
            ...Object.entries(value)
                .filter(([key]) => key !== "_type")
                .map(([, item]) => materialize(item, true))
        );
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, materialize(item, useFactories)]));
}

for (const [index, fixture] of fixtures.cases.entries()) {
    test(`3.14 AST factories preserve CPython fields and positions: case ${index + 1}`, () => {
        expect(materialize(fixture.tree, true)).toEqual(materialize(fixture.tree, false));
    });
}
