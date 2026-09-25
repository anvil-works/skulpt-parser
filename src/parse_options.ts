// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT
import type { LexerOptions } from "./lexer/tokenizer.ts";

export type ParseOptions = Omit<LexerOptions, "extraTokens"> & {
    /** Treat print as a name in Python 2 compatibility mode, as configured by Skulpt. */
    printFunction?: boolean;
    /** Treat async/await as ordinary Skulpt names. Defaults to python2Compat. */
    legacyAsyncNames?: boolean;
    /** Return a Unicode code point, or undefined for an unknown name. */
    unicodeName?: (name: string) => number | undefined;
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
