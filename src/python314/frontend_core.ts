// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT
import type { CompatibilityModule } from "./python2_ast.ts";
import type { Expression, Module } from "./ast.ts";
import { GeneratedParser } from "./generated_parser.ts";
import type { ParseOptions } from "./parse_options.ts";
export type { ParseOptions } from "./parse_options.ts";
export { UnicodeNameDatabaseRequired } from "./parse_options.ts";

/** Internal migration entry point. See tools/generate314/README.md for supported grammar. */
export function parseExpression(source: string, options: ParseOptions = {}): Expression {
    const parser = new GeneratedParser(source, options, "eval");
    return parser.parse(() => parser.eval());
}

/** Internal module entry point. See docs/python314-modules.md for the compatibility boundary. */
export function parseModule(source: string, options?: ParseOptions & { python2Compat?: false }): Module;
export function parseModule(source: string, options: ParseOptions & { python2Compat: true }): CompatibilityModule;
export function parseModule(source: string, options: ParseOptions): Module | CompatibilityModule;
export function parseModule(source: string, options: ParseOptions = {}): Module | CompatibilityModule {
    const parser = new GeneratedParser(source, options, "exec");
    return parser.parse(() => parser.file());
}
