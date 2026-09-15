// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT

import type { ScalarConstant } from "./constants.ts";

export type NumericConstant = Extract<ScalarConstant, { type: "int" | "float" | "complex" }>;

/** Decode a syntactically valid, unsigned Python 3.14 NUMBER token.
 * Signs belong to unary grammar actions; spelling errors belong to the lexer.
 * Decimal integers follow CPython's default conversion limit of 4300 digits.
 */
export function parseNumber(token: string, python2Compat = false): NumericConstant {
    if (python2Compat) {
        const legacyLong = token.endsWith("L");
        const digits = (legacyLong ? token.slice(0, -1) : token).replace(/_/g, "");
        const spelling = /^0[0-7]+$/.test(digits) ? "0o" + digits : digits;
        const value = parseNumber(spelling);
        if (legacyLong && value.type === "int") value.legacyLong = true;
        return value;
    }
    const text = token.replace(/_/g, "");
    const last = text[text.length - 1];
    if (last === "j" || last === "J") {
        return { type: "complex", real: 0, imag: Number(text.slice(0, -1)) };
    }
    // Hexadecimal digits include e/E, so identify base-prefixed integers first.
    const prefixed = /^0[xob]/i.test(text);
    if (!prefixed && /[.eE]/.test(text)) return { type: "float", value: Number(text) };

    // CPython skips leading zeroes before checking the decimal conversion limit.
    // In a valid decimal integer token, a leading zero means all digits are zero.
    if (!prefixed && text[0] !== "0" && text.length > 4300) {
        throw new SyntaxError(
            `Exceeds the limit (4300 digits) for integer string conversion: value has ${text.length} digits; ` +
                "use sys.set_int_max_str_digits() to increase the limit - " +
                "Consider hexadecimal for huge integer literals to avoid decimal conversion limits."
        );
    }
    const approximate = Number(text);
    return { type: "int", value: Number.isSafeInteger(approximate) ? approximate : BigInt(text) };
}
