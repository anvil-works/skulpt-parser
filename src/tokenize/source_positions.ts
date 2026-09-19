// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT

import { readString } from "./readline.ts";

// End positions of non-ASCII characters, in UTF-16 units, UTF-8 bytes and code points.
type Boundary = [number, number, number];

/** Coordinate conversion for ASTs and diagnostics. ASCII lines need no stored mapping. */
export class SourcePositions {
    private lines = new Map<number, Boundary[]>();

    constructor(source: string) {
        if (!/[^\x00-\x7f]/.test(source)) return;
        let lineno = 0;
        for (const line of readString(source)) {
            lineno++;
            let units = 0;
            let bytes = 0;
            let characters = 0;
            const boundaries: Boundary[] = [];
            for (const char of line) {
                const point = char.codePointAt(0)!;
                units += char.length;
                bytes += point < 0x80 ? 1 : point < 0x800 ? 2 : point < 0x10000 ? 3 : 4;
                characters++;
                if (point >= 0x80) boundaries.push([units, bytes, characters]);
            }
            if (boundaries.length) this.lines.set(lineno, boundaries);
        }
    }

    private convert(line: number, column: number, from: 0 | 1, to: 1 | 2): number {
        const boundaries = this.lines.get(line);
        if (!boundaries) return column;
        let low = 0;
        let high = boundaries.length;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (boundaries[mid][from] <= column) low = mid + 1;
            else high = mid;
        }
        const previous = boundaries[low - 1];
        return previous ? column + previous[to] - previous[from] : column;
    }

    utf8Column(line: number, utf16Column: number): number {
        return this.convert(line, utf16Column, 0, 1);
    }

    characterColumn(line: number, utf8Column: number): number {
        return this.convert(line, utf8Column, 1, 2);
    }
}
