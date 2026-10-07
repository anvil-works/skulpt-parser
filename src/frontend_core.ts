// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT
import type { CompatibilityModule } from "./python2_ast.ts";
import type { Expression, FunctionType, Module } from "./ast.ts";
import { GeneratedParser } from "./generated_parser.ts";
import type { ParseOptions } from "./parse_options.ts";
export type { ParseOptions } from "./parse_options.ts";
export { UnicodeNameDatabaseRequired } from "./parse_options.ts";

/** Parse an expression into CPython-shaped structural AST nodes. */
export function parseExpression(source: string, options: ParseOptions = {}): Expression {
    const parser = new GeneratedParser(source, options, "eval");
    return parser.parse(() => parser.eval());
}

/** Parse a module; Python 2 mode widens nested suites to include compatibility nodes. */
export function parseModule(source: string, options?: ParseOptions & { pythonVersion?: 3 }): Module;
export function parseModule(source: string, options: ParseOptions & { pythonVersion: 2 }): CompatibilityModule;
export function parseModule(source: string, options: ParseOptions): Module | CompatibilityModule;
export function parseModule(source: string, options: ParseOptions = {}): Module | CompatibilityModule {
    const parser = new GeneratedParser(source, options, "exec");
    return parser.parse(() => parser.file());
}

/** Parse the CPython func_type_input grammar used by function type comments. */
export function parseFunctionType(source: string, options: ParseOptions = {}): FunctionType {
    const parser = new GeneratedParser(source, options, "func_type");
    return parser.parse(() => parser.func_type());
}
