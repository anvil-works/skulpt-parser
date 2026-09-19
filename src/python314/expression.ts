// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT

import type { LexerOptions } from "./lexer/tokenizer.ts";
import type { Expression } from "./ast.ts";
import { ExpressionParser } from "./generated_parser.ts";

/** Internal migration entry point. See tools/generate314/README.md for supported grammar. */
export function parseExpression(source: string, options: Omit<LexerOptions, "extraTokens"> = {}): Expression {
    const parser = new ExpressionParser(source, options);
    const result = parser.eval();
    if (result === null) throw parser.error("invalid syntax");
    return result;
}
