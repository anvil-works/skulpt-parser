import { memoize, memoizeLeftRec } from "./decorators.ts";

// Small left-recursive grammar: sum := sum '+' digit | digit.
export class ProbeParser {
    _mark = 0;
    _cache: Map<string, [number | null, number]>[];
    digitCalls = 0;
    constructor(readonly source: string) {
        this._cache = Array.from({ length: source.length + 1 }, () => new Map());
    }
    @memoize
    digit(): number | null {
        this.digitCalls++;
        const character = this.source[this._mark];
        if (character === undefined || character < "0" || character > "9") return null;
        this._mark++;
        return Number(character);
    }
    @memoizeLeftRec
    sum(): number | null {
        const start = this._mark;
        const left = this.sum();
        if (left !== null && this.source[this._mark] === "+") {
            this._mark++;
            const right = this.digit();
            if (right !== null) return left + right;
        }
        this._mark = start;
        return this.digit();
    }
}
