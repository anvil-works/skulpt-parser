// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT
import * as core from "./frontend_core.ts";
import { unicodeName } from "./string_names.ts";
import type { Module } from "./ast.ts";
import type { CompatibilityModule } from "./python2_ast.ts";
import type { LexerOptions } from "./lexer/tokenizer.ts";

/** Full CPython-compatible named escapes; lean consumers use frontend_core. */
export function parseExpression(source: string, options: Omit<LexerOptions, "extraTokens"> = {}) {
    return core.parseExpression(source, { ...options, unicodeName });
}

type Options = Omit<LexerOptions, "extraTokens">;
export function parseModule(source: string, options?: Options & { python2Compat?: false }): Module;
export function parseModule(source: string, options: Options & { python2Compat: true }): CompatibilityModule;
export function parseModule(source: string, options: Options): Module | CompatibilityModule;
export function parseModule(source: string, options: Options = {}): Module | CompatibilityModule {
    return core.parseModule(source, { ...options, unicodeName });
}
