import {memoize as legacyMemoize, memoizeLeftRec as legacyLeftRec, type Parser} from './decorators.ts';
// Transitional adapter: preserve the real wrapper algorithms, change decorator ABI.
function adapt(decorator: typeof legacyMemoize) {
    return function <T extends Parser>(method: (this: T) => number | null, context: ClassMethodDecoratorContext<T, (this: T) => number | null>) {
        const descriptor = {value: method};
        decorator(undefined as unknown as Parser, String(context.name), descriptor);
        return descriptor.value;
    };
}
const memoize = adapt(legacyMemoize);
const memoizeLeftRec = adapt(legacyLeftRec);

// Small left-recursive grammar: sum := sum '+' digit | digit.
export class ProbeParser {
    _mark = 0;
    _cache: Map<string, [number | null, number]>[];
    digitCalls = 0;
    constructor(readonly source: string) {
        this._cache = Array.from({length: source.length + 1}, () => new Map());
    }
    @memoize
    digit(): number | null {
        this.digitCalls++;
        const character = this.source[this._mark];
        if (character === undefined || character < '0' || character > '9') return null;
        this._mark++;
        return Number(character);
    }
    @memoizeLeftRec
    sum(): number | null {
        const start = this._mark;
        const left = this.sum();
        if (left !== null && this.source[this._mark] === '+') {
            this._mark++;
            const right = this.digit();
            if (right !== null) return left + right;
        }
        this._mark = start;
        return this.digit();
    }
}

// Real parser enum from src/parser/pegen_types.ts.
export const enum StartRule {
    SINGLE_INPUT = 256,
    FILE_INPUT,
    EVAL_INPUT,
    FUNC_TYPE_INPUT = 345,
    /* This doesn't need to match anything */
    FSTRING_INPUT = 800,
}
export const defaultStartRule = StartRule.FILE_INPUT;
