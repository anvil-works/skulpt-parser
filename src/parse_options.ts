// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT
import type { LexerOptions } from "./lexer/tokenizer.ts";

export type ParseOptions = Omit<LexerOptions, "extraTokens"> & {
    /** CPython's best-effort Python 3 minor grammar version. Defaults to 14; negative values select the current grammar. */
    featureVersion?: number;
    /** Treat print as a name in Python 2 mode. */
    printFunction?: boolean;
    /** Treat async/await as ordinary identifiers. Defaults to true in Python 2 mode. */
    asyncAwaitAsIdentifiers?: boolean;
    /** Return a Unicode code point, or undefined for an unknown name. */
    resolveUnicodeName?: (name: string) => number | undefined;
};

/** A missing capability, not a syntax error. Load the name database and retry. */
export class UnicodeNameDatabaseRequired extends Error {
    constructor(
        readonly unicodeName: string,
        readonly filename: string,
        readonly lineno: number,
        readonly offset: number
    ) {
        super("Unicode name escapes require the optional Unicode name database");
        this.name = "UnicodeNameDatabaseRequired";
    }
}
