// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: Python-2.0 AND MIT
// CPython 3.14.3 Parser/action_helpers.c and Python/future.c.
// See tools/upstream/cpython.json and licenses/CPython.txt.
import * as ast from "./ast.ts";
import type { Parser } from "./parser.ts";

type Span = [number, number, number, number];
const futureFeatures = new Set(
    "nested_scopes generators division absolute_import with_statement print_function unicode_literals barry_as_FLUFL generator_stop annotations".split(
        " "
    )
);

export function checkedImport(
    p: Parser,
    module: string,
    names: ast.alias[],
    level: number,
    ...span: Span
): ast.ImportFrom {
    if (level === 0 && module === "__future__" && names.some((alias) => alias.name === "barry_as_FLUFL")) {
        p.barryAsFlufl = true;
    }
    return ast.ImportFrom(module, names, level, ...span);
}

/** Match the future-feature validation ast.parse runs before returning an AST. */
export function finishModule(p: Parser, body: ast.stmt[]): ast.Module {
    const first = body[0];
    const docstring = first?._type === "Expr" && first.value._type === "Constant" && first.value.value.type === "str";
    for (let i = docstring ? 1 : 0; i < body.length; i++) {
        const statement = body[i];
        if (statement._type !== "ImportFrom" || statement.level !== 0 || statement.module !== "__future__") break;
        for (const alias of statement.names) {
            if (futureFeatures.has(alias.name)) continue;
            // Python's %.100s precision counts UTF-8 bytes and drops an
            // incomplete final code point.
            const feature = new TextDecoder("utf-8", { ignoreBOM: true }).decode(
                new TextEncoder().encode(alias.name).subarray(0, 100),
                { stream: true }
            );
            throw Object.assign(
                new SyntaxError(alias.name === "braces" ? "not a chance" : `future feature ${feature} is not defined`),
                {
                    filename: p.filename,
                    lineno: alias.lineno,
                    offset: alias.col_offset + 1,
                    end_lineno: alias.end_lineno,
                    end_offset: alias.end_col_offset! + 1,
                    text: null,
                }
            );
        }
    }
    return ast.Module(body, []);
}
