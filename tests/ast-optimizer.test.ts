import { test, expect } from "@rstest/core";
import { readFileSync } from "node:fs";
import { parseExpression, parseModule } from "../src/index.ts";
import type { expr, ScalarConstant } from "../src/index.ts";
import { optimizeAST } from "../src/optimize_ast.ts";
// The fixture contains a lone surrogate, which some bundler JSON loaders reject.
const reference: { cases: { source: string; expected: unknown }[] } = JSON.parse(
    readFileSync("tests/fixtures/ast-optimizer.json", "utf8")
);

function bits(value: number): string {
    const buffer = new ArrayBuffer(8);
    new DataView(buffer).setFloat64(0, value);
    return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function scalar(value: ScalarConstant): unknown {
    switch (value.type) {
        case "int":
            return {
                type: "int",
                value: typeof value.value === "bigint" ? { $bigint: String(value.value) } : value.value,
            };
        case "float":
            return { type: "float", bits: bits(value.value) };
        case "complex":
            return { type: "complex", real: bits(value.real), imag: bits(value.imag) };
        case "bytes":
            return { type: "bytes", value: { $bytes: [...value.value] } };
        default:
            return value;
    }
}

function literal(node: expr): unknown {
    if (node._type === "Tuple") return { type: "tuple", items: node.elts.map(literal) };
    if (node._type === "Constant") return scalar(node.value);
    throw new Error(`Expected folded literal, received ${node._type}`);
}

for (const { source, expected } of reference.cases) {
    test(`literal folding matches CPython: ${source}`, () => {
        const tree = parseExpression(source);
        const { lineno, col_offset, end_lineno, end_col_offset } = tree.body;
        expect(optimizeAST(tree)).toBe(tree);
        expect(literal(tree.body)).toEqual(expected);
        expect(tree.body).toMatchObject({ lineno, col_offset, end_lineno, end_col_offset });
        expect(optimizeAST(tree)).toBe(tree);
        expect(literal(tree.body)).toEqual(expected);
    });
}

test("parsing preserves the default AST; optimization is explicit", () => {
    expect(parseExpression("1 + 2").body._type).toBe("BinOp");
    const tree = parseModule("answer = 1 + 2\n");
    const assignment = tree.body[0];
    expect(optimizeAST(tree)).toBe(tree);
    expect(tree.body[0]).toBe(assignment);
    expect(assignment).toMatchObject({ value: { _type: "Constant", value: { type: "int", value: 3 } } });
});

for (const source of [
    "1 / 0",
    "1 // 0",
    "1 % 0",
    "1 << -1",
    "1 >> -1",
    "0 ** -1",
    "2 ** 128",
    "1 << 128",
    "'x' * 4097",
    "b'x' * 4097",
    "(1,) * 257",
    "'x' * (1 << 100)",
    "'x' * -(1 << 100)",
    "'' * (1 << 100)",
    "() * -(1 << 100)",
    "'x'[2]",
    "b'x'[-2]",
    "(1,)[2]",
    "'x'[0.0]",
    "(f(), 2)[1]",
    "(1, []) * 2",
    "[] + []",
    "not ...",
    "~True",
    "~0xffffffffffffffffffffffffffffffff",
    "2.0 ** 3",
    "1e999 + 1",
    "'😀é'[0]",
    "'\\ud800\\udc00'[0]",
    "'\\ud800' + '\\udc00'",
    "'\\udc00\\ud800' * 2",
]) {
    test(`leaves errors, warnings, dynamic values and unsupported folds for runtime: ${source}`, () => {
        const tree = parseExpression(source);
        const originalType = tree.body._type;
        optimizeAST(tree);
        expect(tree.body._type).toBe(originalType);
    });
}

test("folding computed strings cannot introduce module, class or function docstrings", () => {
    const tree = parseModule(
        "'module' + 'doc'\nclass C:\n    'class' * 2\n    def f(self):\n        ('function',)[0]\n        return 'a' + 'b'\n"
    );
    optimizeAST(tree);
    expect(tree.body[0]).toMatchObject({ _type: "Expr", value: { _type: "BinOp" } });
    const cls = tree.body[1];
    if (cls._type !== "ClassDef") throw new Error("Expected class");
    expect(cls.body[0]).toMatchObject({ _type: "Expr", value: { _type: "BinOp" } });
    const fn = cls.body[1];
    if (fn._type !== "FunctionDef") throw new Error("Expected function");
    expect(fn.body[0]).toMatchObject({ _type: "Expr", value: { _type: "Subscript" } });
    expect(fn.body[1]).toMatchObject({
        _type: "Return",
        value: { _type: "Constant", value: { type: "str", value: "ab" } },
    });
    const existing = parseModule("'literal doc'\n");
    const docstring = existing.body[0];
    optimizeAST(existing);
    expect(existing.body[0]).toBe(docstring);
});

test("preserves control flow, bindings, mutable containers and assignment contexts", () => {
    const tree = parseModule("False and (bound := 1 + 2)\na[1 + 2] = [1 + 2]\n");
    optimizeAST(tree);
    expect(tree.body[0]).toMatchObject({
        value: {
            _type: "BoolOp",
            values: [
                { _type: "Constant" },
                { _type: "NamedExpr", target: { id: "bound" }, value: { value: { value: 3 } } },
            ],
        },
    });
    expect(tree.body[1]).toMatchObject({
        targets: [{ _type: "Subscript", ctx: { _type: "Store" }, slice: { value: { value: 3 } } }],
        value: { _type: "List", elts: [{ value: { value: 3 } }] },
    });
});

test("nested tuple limits account for contained literals", () => {
    expect(optimizeAST(parseExpression("((1, 2),) * 86")).body._type).toBe("BinOp");
    expect(optimizeAST(parseExpression("((1, 2),) * 85")).body._type).toBe("Tuple");
    const large = Array(300).fill("1").join(",");
    expect(optimizeAST(parseExpression(`((${large}),)[0]`)).body._type).toBe("Subscript");
});

test("preserves expression text in deferred annotations and lazy type definitions", () => {
    const tree = parseModule(
        "from __future__ import annotations\nx: 1 + 2 = 1 + 2\ndef f[T: 1 + 2 = 3 + 4](arg: 1 + 2) -> 'a' + 'b':\n    return 1 + 2\ntype Alias[T = 1 + 2] = tuple[1 + 2]\n"
    );
    const annotation = tree.body[1];
    const fn = tree.body[2];
    const alias = tree.body[3];
    if (annotation._type !== "AnnAssign" || fn._type !== "FunctionDef" || alias._type !== "TypeAlias")
        throw new Error("Unexpected fixture");
    const original = {
        annotation: JSON.stringify(annotation.annotation),
        argument: JSON.stringify(fn.args.args[0].annotation),
        returns: JSON.stringify(fn.returns),
        typeParams: JSON.stringify(fn.type_params),
        alias: JSON.stringify(alias),
    };
    optimizeAST(tree);
    expect(JSON.stringify(annotation.annotation)).toBe(original.annotation);
    expect(JSON.stringify(fn.args.args[0].annotation)).toBe(original.argument);
    expect(JSON.stringify(fn.returns)).toBe(original.returns);
    expect(JSON.stringify(fn.type_params)).toBe(original.typeParams);
    expect(JSON.stringify(alias)).toBe(original.alias);
    expect(annotation.value).toMatchObject({ _type: "Constant", value: { value: 3 } });
    expect(fn.body[0]).toMatchObject({ _type: "Return", value: { _type: "Constant", value: { value: 3 } } });
});

test("long expression chains do not add recursive traversal limits", () => {
    const tree = parseExpression(Array(5000).fill("1").join(" + "));
    optimizeAST(tree);
    expect(tree.body).toMatchObject({ _type: "Constant", value: { type: "int", value: 5000 } });
});
