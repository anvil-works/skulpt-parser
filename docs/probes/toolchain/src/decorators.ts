// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT
// Extracted from src/parser/parser.ts at ae256889f0956d6dc102edd39f1a9555e97e850b.
// Only result/state types narrowed for this isolated probe; algorithm unchanged.
export interface Parser {
    _mark: number;
    _cache: Map<string, [number | null, number]>[];
}
type ParserMethod = (this: Parser) => number | null;
export function memoize(_target: Parser, propertyKey: string, descriptor: PropertyDescriptor) {
    const method: ParserMethod = descriptor.value;
    function memoizeWrapper(this: Parser): number | null {
        const mark = this._mark;
        const actionCache = this._cache[mark];
        const cached = actionCache.get(propertyKey);
        // fastpath cache hit
        if (cached !== undefined) {
            this._mark = cached[1];
            return cached[0];
        }
        // Slow path: no cache hit
        const tree = method.call(this);
        actionCache.set(propertyKey, [tree, this._mark]);
        return tree;
    }
    descriptor.value = memoizeWrapper;
}

export function memoizeLeftRec(_target: Parser, propertyKey: string, descriptor: PropertyDescriptor) {
    const method: ParserMethod = descriptor.value;
    function memoizeLeftRecWrapper(this: Parser): number | null {
        const mark = this._mark;
        const actionCache = this._cache[mark];
        let cached = actionCache.get(propertyKey);
        // fastpath cache hit
        if (cached !== undefined) {
            this._mark = cached[1];
            return cached[0];
        }
        // Slow path: no cache hit
        let lastresult: number | null = null;
        let lastmark = mark;
        cached = [lastresult, lastmark];
        actionCache.set(propertyKey, cached);
        while (true) {
            this._mark = mark;
            const tree = method.call(this);
            if (tree === null) {
                this._mark = lastmark;
                // failed
                break;
            }
            if (this._mark <= lastmark) {
                this._mark = lastmark;
                // bailing
                break;
            }
            cached[0] = lastresult = tree;
            cached[1] = lastmark = this._mark;
        }
        return lastresult;
    }
    descriptor.value = memoizeLeftRecWrapper;
}
