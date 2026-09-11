/** Bounded state-machine experiment, informed by CPython v3.14.3 lexer.c.
 * Not a full port: no indentation/encoding tokens, parser checks, or exact diagnostics.
 */
export type Token = { type: string; string: string; start: [number, number]; end: [number, number] };
export function tokenize(source: string): Token[] {
    const chars = Array.from(source.replace(/\r\n?/g, "\n"));
    const positions: [number, number][] = [];
    let line = 1,
        col = 0;
    for (const c of chars) {
        positions.push([line, col]);
        if (c === "\n") {
            line++;
            col = 0;
        } else col++;
    }
    positions.push([line, col]);
    let i = 0;
    const tokens: Token[] = [];
    const peek = (n = 0) => chars[i + n] ?? "";
    const at = (s: string) => Array.from(s).every((c, j) => chars[i + j] === c);
    const emit = (type: string, start: number, end = i) =>
        tokens.push({ type, string: chars.slice(start, end).join(""), start: positions[start], end: positions[end] });
    const fail = (message: string): never => {
        throw new SyntaxError(`${message} at ${positions[i]}`);
    };
    const idStart = (c: string) => c !== "" && /[_\p{XID_Start}]/u.test(c);
    const idContinue = (c: string) => c !== "" && /[_\p{XID_Continue}]/u.test(c);
    const digit = (c: string) => c >= "0" && c <= "9";
    const prefixes = new Set(["r", "u", "b", "f", "t", "br", "rb", "fr", "rf", "tr", "rt"]);
    function stringStart(): { prefix: string; quote: string } | undefined {
        let j = i;
        while (j < i + 2 && /[rRuUbBfFtT]/.test(chars[j] ?? "") && chars[j]) j++;
        let prefix = chars.slice(i, j).join("");
        if (peek() === '"' || peek() === "'") {
            prefix = "";
            j = i;
        }
        if (chars[j] !== '"' && chars[j] !== "'") return;
        if (prefix && !prefixes.has(prefix.toLowerCase())) return;
        const q = chars[j];
        return { prefix, quote: chars[j + 1] === q && chars[j + 2] === q ? q.repeat(3) : q };
    }
    function scanString(prefix: string, quote: string) {
        const start = i;
        i += prefix.length + quote.length;
        const lower = prefix.toLowerCase();
        const kind = lower.includes("f") ? "FSTRING" : lower.includes("t") ? "TSTRING" : undefined;
        if (!kind) {
            while (i < chars.length) {
                if (at(quote)) {
                    i += quote.length;
                    emit("STRING", start);
                    return;
                }
                if (peek() === "\n" && quote.length === 1) fail("unterminated string");
                if (peek() === "\\") {
                    i++;
                    if (i < chars.length) i++;
                } else i++;
            }
            fail("unterminated string");
        }
        emit(kind + "_START", start);
        literal(kind, quote, lower.includes("r"), false);
        if (!at(quote)) fail("unterminated interpolated string");
        const end = i;
        i += quote.length;
        emit(kind + "_END", end);
    }
    // Corresponds to tok_get_fstring_mode; recursion is the tokenizer mode stack.
    function literal(kind: string, quote: string, raw: boolean, format: boolean) {
        let start = i;
        const middle = () => {
            if (i > start) emit(kind + "_MIDDLE", start);
            start = i;
        };
        while (i < chars.length) {
            if (at(quote)) {
                if (format) fail("unclosed replacement field");
                middle();
                return;
            }
            const c = peek();
            if (c === "\n" && quote.length === 1) fail("newline in interpolated string");
            if (c === "{") {
                if (peek(1) === "{" && !format) {
                    i++;
                    middle();
                    i++;
                    start = i;
                    continue;
                }
                middle();
                const open = i++;
                emit("OP", open);
                normal(true, kind, quote, raw);
                start = i;
                continue;
            }
            if (c === "}") {
                if (peek(1) === "}" && !format) {
                    i++;
                    middle();
                    i++;
                    start = i;
                    continue;
                }
                if (format) {
                    middle();
                    return;
                }
                fail("single closing brace");
            }
            if (c === "\\") {
                i++;
                if (!raw && peek() === "N" && peek(1) === "{") {
                    i += 2;
                    while (i < chars.length && peek() !== "}") i++;
                    if (peek() !== "}") fail("unterminated named escape");
                    i++;
                    middle();
                    continue;
                }
                // A brace after a backslash still opens/closes a replacement field.
                if (peek() !== "{" && peek() !== "}" && i < chars.length) i++;
            } else i++;
        }
        fail("unterminated interpolated string");
    }
    // Corresponds to tok_get_normal_mode, including field depth/format switching.
    function normal(field = false, kind = "", quote = "", raw = false) {
        const brackets: string[] = [];
        while (i < chars.length) {
            const c = peek();
            if (" \t\n\f".includes(c)) {
                i++;
                continue;
            }
            if (c === "#") {
                while (i < chars.length && peek() !== "\n") i++;
                continue;
            }
            if (c === "\\" && peek(1) === "\n") {
                i += 2;
                continue;
            }
            if (field && brackets.length === 0 && c === "}") {
                const s = i++;
                emit("OP", s);
                return;
            }
            if (field && brackets.length === 0 && c === ":") {
                const s = i++;
                emit("OP", s);
                literal(kind, quote, raw, true);
                if (peek() !== "}") fail("unclosed format field");
                const end = i++;
                emit("OP", end);
                return;
            }
            const str = stringStart();
            if (str) {
                scanString(str.prefix, str.quote);
                continue;
            }
            const start = i;
            if (idStart(c)) {
                i++;
                while (idContinue(peek())) i++;
                emit("NAME", start);
                continue;
            }
            if (digit(c) || (c === "." && digit(peek(1)))) {
                if (c === "0" && /[xXoObB]/.test(peek(1)) && peek(1)) {
                    const base = peek(1).toLowerCase();
                    i += 2;
                    const allowed = base === "x" ? /[0-9a-fA-F_]/ : base === "o" ? /[0-7_]/ : /[01_]/;
                    const digits = i;
                    while (peek() && allowed.test(peek())) i++;
                    if (i === digits) fail("invalid base literal");
                } else {
                    while (digit(peek()) || peek() === "_") i++;
                    if (peek() === ".") {
                        i++;
                        while (digit(peek()) || peek() === "_") i++;
                    }
                    if (peek() === "e" || peek() === "E") {
                        i++;
                        if (peek() === "+" || peek() === "-") i++;
                        while (digit(peek()) || peek() === "_") i++;
                    }
                    if (peek() === "j" || peek() === "J") i++;
                }
                emit("NUMBER", start);
                continue;
            }
            if ("([{".includes(c)) brackets.push(c);
            else if (")]}".includes(c)) {
                const expect: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
                if (brackets.pop() !== expect[c]) fail("unmatched bracket");
            }
            const op = [
                "**=",
                "//=",
                "<<=",
                ">>=",
                "...",
                "==",
                "!=",
                "<=",
                ">=",
                ":=",
                "+=",
                "-=",
                "*=",
                "/=",
                "%=",
                "&=",
                "|=",
                "^=",
                "->",
                "**",
                "//",
                "<<",
                ">>",
            ].find(at);
            if (op) i += op.length;
            else if ("+-*/%&|^~<>=:;,.()[]{}!@".includes(c)) i++;
            else fail("invalid character");
            emit("OP", start);
        }
        if (field || brackets.length) fail("unclosed expression");
    }
    normal();
    return tokens;
}
