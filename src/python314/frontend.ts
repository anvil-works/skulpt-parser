// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT
import type { Expression, Module } from "./ast.ts";
import { GeneratedParser } from "./generated_parser.ts";
import type { LexerOptions } from "./lexer/tokenizer.ts";

/** Internal migration entry point. See tools/generate314/README.md for supported grammar. */
export function parseExpression(source: string, options: Omit<LexerOptions, "extraTokens"> = {}): Expression {
    const parser = new GeneratedParser(source, options, "eval");
    const result = parser.eval();
    if (result === null) throw parser.error("invalid syntax");
    return result;
}

/** Internal module entry point. Statement coverage is still being migrated. */
export function parseModule(source: string, options: Omit<LexerOptions, "extraTokens"> = {}): Module {
    const parser = new GeneratedParser(source, options, "exec");
    const result = parser.file();
    if (result === null) throw parser.error("invalid syntax");
    return result;
}
