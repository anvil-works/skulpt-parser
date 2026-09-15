// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT
import * as core from "./frontend_core.ts";
import { unicodeName } from "./string_names.ts";
import type { LexerOptions } from "./lexer/tokenizer.ts";

/** Full CPython-compatible named escapes; lean consumers use frontend_core. */
export function parseExpression(source: string, options: Omit<LexerOptions, "extraTokens"> = {}) {
    return core.parseExpression(source, { ...options, unicodeName });
}

export function parseModule(source: string, options: Omit<LexerOptions, "extraTokens"> = {}) {
    return core.parseModule(source, { ...options, unicodeName });
}
