// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: Python-2.0 AND MIT
// CPython 3.14.3 Parser/action_helpers.c: _PyPegen_make_arguments and its
// sequence helpers. See tools/upstream/cpython.json and licenses/CPython.txt.
import * as ast from "./ast.ts";

type NameDefaultPair = { arg: ast.arg; value: ast.expr };
type SlashWithDefault = { plainNames: ast.arg[]; namesWithDefaults: NameDefaultPair[] };
type StarEtc = {
    vararg: ast.arg | null;
    kwonlyargs: { arg: ast.arg; value: ast.expr | null }[] | null;
    kwarg: ast.arg | null;
};

/** Assemble the grammar's parameter groups in CPython ASDL field order. */
export function makeArguments(
    slashWithoutDefault: ast.arg[] | null,
    slashWithDefault: SlashWithDefault | null,
    plainNames: ast.arg[] | null,
    namesWithDefaults: NameDefaultPair[] | null,
    star: StarEtc | null
): ast.arguments {
    const slashDefaults = slashWithDefault?.namesWithDefaults ?? [];
    const positionalDefaults = namesWithDefaults ?? [];
    const keywordOnly = star?.kwonlyargs ?? [];
    return ast.arguments(
        slashWithoutDefault ?? [...(slashWithDefault?.plainNames ?? []), ...slashDefaults.map((pair) => pair.arg)],
        [...(plainNames ?? []), ...positionalDefaults.map((pair) => pair.arg)],
        star?.vararg ?? null,
        keywordOnly.map((pair) => pair.arg),
        // Null marks a required keyword-only parameter; preserve its slot.
        keywordOnly.map((pair) => pair.value),
        star?.kwarg ?? null,
        [...slashDefaults.map((pair) => pair.value), ...positionalDefaults.map((pair) => pair.value)]
    );
}
