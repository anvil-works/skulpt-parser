import { expect, test } from "@rstest/core";
import { parseExpression, parseModule } from "../src/frontend_core.ts";
import { tokenize } from "../src/lexer/tokenizer.ts";
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
    const description = source.length > 80 ? `${source.length} characters ending in ${source.slice(-10)}` : source;
    test(`Skulpt Python 2 numeric/comparison syntax: ${description}`, () => {
        if (error) {
            rejectsSyntax(() => parseExpression(source, { pythonVersion: 2 }));
            return;
        }
        const node = parseExpression(source, { pythonVersion: 2 }).body;
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
        expect(() => parseModule(source, { pythonVersion: 2 })).not.toThrow();
        rejectsSyntax(() => parseModule(source));
        rejectsSyntax(() => parseModule(source, { pythonVersion: 3 }));
    }
    expect(parseExpression("42").body).not.toHaveProperty("value.legacyLong");
});

test("legacy long literals retain the complete source span", () => {
    const source = "value = 0755L";
    const statement = parseModule(source, { pythonVersion: 2 }).body[0];
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
        // Verified against the reference Skulpt bundle: NAME(prefix), STRING, NEWLINE, ENDMARKER.
        expect(
            tokenize(source, { extraTokens: true, pythonVersion: 2 }).map(({ type, string }) => [type, string])
        ).toEqual([
            ["NAME", prefix],
            ["STRING", '"hello"'],
            ["NEWLINE", "\n"],
            ["ENDMARKER", ""],
        ]);
        rejectsSyntax(() => parseModule(source, { pythonVersion: 2 }));
        rejectsSyntax(() => parseModule(source));
        expect(() => tokenize(source, { extraTokens: true })).toThrow();
    }
);

for (const source of [
    "if True:\n        pass\n\tpass\n",
    "if True:\n    if True:\n\tpass\n",
    "if True:\n        if True:\n            pass\n\tpass\n",
]) {
    test(`legacy indentation accepts equivalent tab stops: ${JSON.stringify(source)}`, () => {
        expect(() => parseModule(source, { pythonVersion: 2 })).not.toThrow();
        expect(() => parseModule(source)).toThrow("inconsistent use of tabs and spaces in indentation");
    });
}

test("legacy indentation still rejects dedents between established levels", () => {
    expect(() => parseModule("if True:\n\tpass\n   pass\n", { pythonVersion: 2 })).toThrow(
        "unindent does not match any outer indentation level"
    );
});
