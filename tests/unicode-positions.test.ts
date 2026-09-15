import { test, expect } from "@rstest/core";
import { dump } from "../support/ast_dump.ts";
import { getPyAstDump } from "../support/py_ast_dump.ts";
import { runParserFromString } from "../src/parser/mod.ts";
import { tokenizerFromString } from "../src/tokenize/mod.ts";
import type { Module, Assign, JoinedStr, FormattedValue } from "../src/ast/astnodes.ts";
import { pySyntaxError } from "../src/mock_types/errors.ts";

const options = { indent: 2, include_attributes: true };

for (const source of [
    'résumé = "中文😀"; result = résumé + "é"\n',
    'x = """中文\n😀é"""; y = 123\n',
    'x = "é" "😀"; y = b"abc"\n',
    'x = f"é😀{value + 12}"\n',
    'x = f"é{value:{width}}"\n',
]) {
    test(`UTF-8 AST positions: ${JSON.stringify(source)}`, async () => {
        expect(dump(runParserFromString(source), options)).toBe(await getPyAstDump(source, options));
    });
}

test("AST conversion leaves tokenizer UTF-16 positions unchanged", () => {
    const tokenizer = tokenizerFromString('"é😀" + value');
    const string = tokenizer.getnext();
    const plus = tokenizer.getnext();
    expect(string.start).toEqual([1, 0]);
    expect(string.end).toEqual([1, 5]);
    expect(plus.start).toEqual([1, 6]);
});

test("AST-based errors report character positions after Unicode", () => {
    const source = '"é😀"; f(a + b = 1)';
    try {
        runParserFromString(source);
        throw new Error("Expected invalid keyword argument to fail");
    } catch (error) {
        expect(error).toBeInstanceOf(pySyntaxError);
        expect((error as pySyntaxError).traceback.slice(0, 3)).toEqual(["<string>", 1, 9]);
    }
});

test("multiline f-string expressions use their actual source line", () => {
    // CPython 3.9 has incorrect locations here (bpo-35212). These coordinates
    // match the source and CPython 3.14.3, rather than the legacy oracle.
    const tree = runParserFromString('x = f"""é\n😀{value}"""\n') as Module;
    const value = (tree.body[0] as Assign).value as JoinedStr;
    const expression = (value.values[1] as FormattedValue).value;
    expect([expression.lineno, expression.col_offset, expression.end_lineno, expression.end_col_offset]).toEqual([
        2, 5, 2, 10,
    ]);
});
