// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT

import { SourcePositions } from "./source_positions.ts";
import { readString } from "./readline.ts";
import { tokenize } from "./tokenize.ts";
import { Tokenizer } from "./Tokenizer.ts";

export function tokenizerFromString(text: string, filename = "<string>") {
    return new Tokenizer(tokenize(readString(text), filename), new SourcePositions(text));
}
