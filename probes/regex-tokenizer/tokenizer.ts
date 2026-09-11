// Isolated expression-tokenizer probe: not a complete Python lexer.
export type Token = { type: string; string: string; start: [number, number]; end: [number, number] };
const opening = /^(?:[rubft]|br|rb|fr|rf|tr|rt)?(?:"""|'''|"|')/i;
const name = /^[_\p{XID_Start}][_\p{XID_Continue}]*/u;
const number =
    /^(?:0[xX](?:_?[0-9a-fA-F])+|0[bB](?:_?[01])+|0[oO](?:_?[0-7])+|(?:[0-9](?:_?[0-9])*\.(?:[0-9](?:_?[0-9])*)?|\.[0-9](?:_?[0-9])*)(?:[eE][-+]?[0-9](?:_?[0-9])*)?|[0-9](?:_?[0-9])*[eE][-+]?[0-9](?:_?[0-9])*|[0-9](?:_?[0-9])*)[jJ]?/;
const operator =
    /^(?:\*\*=|\/\/=|<<=|>>=|:=|==|!=|<=|>=|\*\*|\/\/|<<|>>|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|@=|\.\.\.|[+\-*/%&|^~<>=:.,;@()\[\]{}!])/;

export function tokenize(source: string): Token[] {
    const result: Token[] = [];
    let i = 0;
    // Deliberately simple position conversion for the probe; quadratic for many tokens.
    function pos(offset: number): [number, number] {
        const prefix = source.slice(0, offset);
        const last = prefix.lastIndexOf("\n");
        return [prefix.split("\n").length, [...prefix.slice(last + 1)].length];
    }
    function emit(type: string, start: number, end = i, text = source.slice(start, end)) {
        result.push({ type, string: text, start: pos(start), end: pos(end) });
    }
    function fail(message: string): never {
        throw new SyntaxError(`${message} at ${pos(i)}`);
    }
    function op() {
        const start = i++;
        emit("OP", start);
    }
    function stringToken(header: string) {
        const start = i;
        i += header.length;
        const quote = header.match(/(?:"""|'''|"|')$/)![0];
        const prefix = header.slice(0, -quote.length).toLowerCase();
        const kind = prefix.includes("f") ? "FSTRING" : prefix.includes("t") ? "TSTRING" : "";
        if (kind) {
            emit(`${kind}_START`, start);
            textMode(quote, kind, prefix.includes("r"), false);
            return;
        }
        // Regex consumes escaped characters and runs of ordinary characters.
        const q = quote[0];
        const chunk = new RegExp(`^(?:[^${q}\\\\\\r\\n]+|\\\\[\\s\\S])`);
        while (i < source.length) {
            if (source.startsWith(quote, i)) {
                i += quote.length;
                emit("STRING", start);
                return;
            }
            const match = source.slice(i).match(chunk);
            if (match) {
                i += match[0].length;
                continue;
            }
            if (quote.length === 1 && /[\r\n]/.test(source[i])) fail("unterminated string");
            i++;
        }
        fail("unterminated string");
    }
    function textMode(quote: string, kind: string, raw: boolean, format: boolean) {
        let start = i;
        const flush = () => {
            if (i > start) emit(`${kind}_MIDDLE`, start);
            start = i;
        };
        const chunk = new RegExp(`^[^${quote[0]}{}\\\\\\r\\n]+`);
        while (i < source.length) {
            if (source.startsWith(quote, i)) {
                if (format) fail("unterminated replacement field");
                flush();
                const endStart = i;
                i += quote.length;
                emit(`${kind}_END`, endStart);
                return;
            }
            const match = source.slice(i).match(chunk);
            if (match) {
                i += match[0].length;
                continue;
            }
            const c = source[i];
            if (c === "{" || c === "}") {
                if (!format && source[i + 1] === c) {
                    // CPython emits through the first brace and skips its duplicate.
                    i++;
                    flush();
                    i++;
                    start = i;
                    continue;
                }
                if (c === "}") {
                    flush();
                    if (!format) fail("single closing brace");
                    op();
                    return;
                }
                flush();
                op();
                expression(true, quote, kind, raw);
                start = i;
                continue;
            }
            if (c === "\\") {
                if (!raw && source.startsWith("\\N{", i)) {
                    const end = source.indexOf("}", i + 3);
                    if (end < 0) fail("unterminated named escape");
                    i = end + 1;
                    flush();
                    continue;
                }
                // A backslash does not escape a replacement brace.
                i++;
                if (i < source.length && source[i] !== "{" && source[i] !== "}") i++;
                continue;
            }
            if (quote.length === 1 && /[\r\n]/.test(c)) fail("unterminated string");
            i++;
        }
        fail("unterminated interpolated string");
    }
    function expression(field = false, quote = "", kind = "", raw = false) {
        const brackets: string[] = [];
        while (i < source.length) {
            const skip = source.slice(i).match(/^(?:\s+|#[^\r\n]*|\\\r?\n)/);
            if (skip) {
                i += skip[0].length;
                continue;
            }
            if (field && brackets.length === 0) {
                if (source[i] === "}") {
                    op();
                    return;
                }
                if (source[i] === ":") {
                    op();
                    textMode(quote, kind, raw, true);
                    return;
                }
            }
            const header = source.slice(i).match(opening);
            if (header) {
                stringToken(header[0]);
                continue;
            }
            const start = i;
            const num = source.slice(i).match(number);
            if (num) {
                i += num[0].length;
                emit("NUMBER", start);
                continue;
            }
            const ident = source.slice(i).match(name);
            if (ident) {
                i += ident[0].length;
                emit("NAME", start);
                continue;
            }
            const symbol = source.slice(i).match(operator);
            if (symbol) {
                const value = symbol[0];
                if ("([{".includes(value)) brackets.push(value);
                else if (")]}".includes(value)) {
                    if (brackets.pop() !== ({ ")": "(", "]": "[", "}": "{" } as Record<string, string>)[value])
                        fail("mismatched delimiter");
                }
                i += value.length;
                emit("OP", start);
                continue;
            }
            fail("unsupported character");
        }
        if (field || brackets.length) fail("unclosed delimiter");
    }
    expression();
    return result;
}
