import { test, expect } from "@rstest/core";
import { parseNumber } from "../src/python314/parse_number.ts";
import reference from "./fixtures/python314-numbers.json";

function bits(value: number): string {
    const buffer = new ArrayBuffer(8);
    new DataView(buffer).setFloat64(0, value);
    return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

for (const [index, { source, expected }] of reference.cases.entries()) {
    test(`CPython NUMBER conversion ${index + 1}: ${source.slice(0, 60)}`, () => {
        if (expected.error !== undefined) {
            expect(() => parseNumber(source)).toThrow(new SyntaxError(expected.error));
            return;
        }
        const actual = parseNumber(source);
        if (actual.type === "int") {
            expect({ type: actual.type, decimal: String(actual.value) }).toEqual(expected);
            // The numeric representation is our contract; the value comes from CPython.
            expect(typeof actual.value).toBe(
                BigInt(expected.decimal!) <= BigInt(Number.MAX_SAFE_INTEGER) ? "number" : "bigint"
            );
        } else if (actual.type === "float") {
            expect({ type: actual.type, bits: bits(actual.value) }).toEqual(expected);
        } else {
            expect({ type: actual.type, real: bits(actual.real), imag: bits(actual.imag) }).toEqual(expected);
        }
    });
}
