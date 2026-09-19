import { expect, test } from "@rstest/core";
import { parseExpression, parseModule } from "../src/python314/frontend_core.ts";
import { tokenize } from "../src/python314/lexer/tokenizer.ts";
import reference from "./fixtures/python2-numeric-skulpt.json";

function rejectsSyntax(parse: () => unknown) {
    let failure: unknown;
    try {
        parse();
    } catch (error) {
        failure = error;
    }
    expect(failure).toMatchObject({ name: "SyntaxError" });
}

for (const { source, expected, error } of reference.cases) {
    test(`Skulpt Python 2 numeric/comparison syntax: ${source}`, () => {
        if (error) {
            rejectsSyntax(() => parseExpression(source, { python2Compat: true }));
            return;
        }
        const node = parseExpression(source, { python2Compat: true }).body;
        if (expected!.comparison) {
            expect(node._type).toBe("Compare");
            if (node._type === "Compare") expect(node.ops[0]._type).toBe(expected!.comparison);
        } else {
            expect(node._type).toBe("Constant");
            if (node._type !== "Constant") return;
            if (node.value.type === "int") {
                expect(String(node.value.value)).toBe(expected!.value);
                expect(node.value.legacyLong ?? false).toBe(expected!.legacyLong);
            } else {
                expect(node.value).toEqual(expected);
            }
        }
    });
}

test("legacy syntax requires explicit mode and does not leak between parser instances", () => {
    for (const source of ["a <> b", "0755", "42L"]) {
        expect(() => parseModule(source, { python2Compat: true })).not.toThrow();
        rejectsSyntax(() => parseModule(source));
        rejectsSyntax(() => parseModule(source, { python2Compat: false }));
    }
    expect(parseExpression("42").body).not.toHaveProperty("value.legacyLong");
});

test("legacy long literals retain the complete source span", () => {
    const source = "value = 0755L";
    const statement = parseModule(source, { python2Compat: true }).body[0];
    expect(statement._type).toBe("Assign");
    if (statement._type !== "Assign") return;
    const value = statement.value;
    expect(source.slice(value.col_offset, value.end_col_offset!)).toBe("0755L");
    expect(value).toMatchObject({ _type: "Constant", value: { type: "int", value: 493, legacyLong: true } });
});

test.each(["ur", "uR", "Ur", "UR", "ru", "rU", "Ru", "RU"])(
    "Skulpt editing tokens preserve %s prefixes without accepting new syntax",
    (prefix) => {
        const source = `${prefix}"hello"\n`;
        // Verified against Anvil's deployed Skulpt: NAME(prefix), STRING, NEWLINE, ENDMARKER.
        expect(
            tokenize(source, { extraTokens: true, python2Compat: true }).map(({ type, string }) => [type, string])
        ).toEqual([
            ["NAME", prefix],
            ["STRING", '"hello"'],
            ["NEWLINE", "\n"],
            ["ENDMARKER", ""],
        ]);
        rejectsSyntax(() => parseModule(source, { python2Compat: true }));
        rejectsSyntax(() => parseModule(source));
        expect(() => tokenize(source, { extraTokens: true })).toThrow();
    }
);
