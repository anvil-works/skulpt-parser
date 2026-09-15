// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT
import type * as ast from "./ast.ts";

type Located = Pick<ast.Raise, "lineno" | "col_offset" | "end_lineno" | "end_col_offset">;
export interface Print extends Located {
    _type: "Print";
    dest: ast.expr | null;
    values: ast.expr[];
    nl: boolean;
}
export interface LegacyRaise extends Located {
    _type: "LegacyRaise";
    exc: ast.expr;
    inst: ast.expr;
    tback: ast.expr | null;
}
export interface LegacyExceptHandler extends Located {
    _type: "LegacyExceptHandler";
    type: ast.expr;
    target: ast.expr;
    body: CompatibilityStatement[];
}
// Widen nested statement suites without changing the generated CPython ASDL types.
type Fields<T> = { [K in keyof T]: Compatible<T[K]> };
type Compatible<T> = T extends ast.stmt
    ? Fields<T> | Print | LegacyRaise
    : T extends ast.ExceptHandler
    ? Fields<T> | LegacyExceptHandler
    : T extends (infer E)[]
    ? Compatible<E>[]
    : T extends { _type: string }
    ? Fields<T>
    : T;
export type CompatibilityStatement = Compatible<ast.stmt>;
export type CompatibilityModule = Compatible<ast.Module>;
