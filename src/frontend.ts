// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT
import * as core from "./frontend_core.ts";
import { unicodeName } from "./string_names.ts";
import type { Module } from "./ast.ts";
import type { CompatibilityModule } from "./python2_ast.ts";
import type { ParseOptions } from "./parse_options.ts";

/** Full CPython-compatible named escapes; lean consumers use frontend_core. */
export function parseExpression(source: string, options: Omit<ParseOptions, "resolveUnicodeName"> = {}) {
    return core.parseExpression(source, { ...options, resolveUnicodeName: unicodeName });
}

type Options = Omit<ParseOptions, "resolveUnicodeName">;
export function parseModule(source: string, options?: Options & { pythonVersion?: 3 }): Module;
export function parseModule(source: string, options: Options & { pythonVersion: 2 }): CompatibilityModule;
export function parseModule(source: string, options: Options): Module | CompatibilityModule;
export function parseModule(source: string, options: Options = {}): Module | CompatibilityModule {
    return core.parseModule(source, { ...options, resolveUnicodeName: unicodeName });
}

export function parseFunctionType(source: string, options: Options = {}) {
    return core.parseFunctionType(source, { ...options, resolveUnicodeName: unicodeName });
}
