// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT

import { readFileSync } from "node:fs";
import { parserFromString } from "./parser/mod.ts";
import type { ModeStr } from "./parser/mod.ts";
import { tokenizerFromString } from "./tokenize/mod.ts";
import { symtableFromString } from "./symtable/mod.ts";
export * from "./mod.ts";
export function tokenizerFromFile(filename: string) {
    return tokenizerFromString(readFileSync(filename, "utf8"), filename);
}
export function parserFromFile(filename: string, mode: ModeStr = "exec") {
    return parserFromString(readFileSync(filename, "utf8"), mode, filename);
}
export function runParserFromFile(filename: string, mode: ModeStr = "exec") {
    return parserFromFile(filename, mode).parse();
}
export const astFromFile = runParserFromFile;
export function symtableFromFile(filename: string, mode: ModeStr = "exec") {
    return symtableFromString(readFileSync(filename, "utf8"), mode, filename);
}
