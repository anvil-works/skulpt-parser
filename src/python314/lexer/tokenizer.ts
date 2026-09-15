// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: Python-2.0 AND MIT

/* CPython 3.14.3 source-string lexer port.
 * Correspondence: Parser/lexer/{lexer.c,state.h}, tokenizer/readline_tokenizer.c,
 * tokenizer/helpers.c, and Python/Python-tokenize.c. CPython PSF license applies
 * to translated control flow. See accompanying report for TS adaptations.
 */
import operators from "./operators.json";
import unicode from "./unicode.json";

export type Token = {
    type: string;
    string: string;
    start: [number, number];
    end: [number, number];
    line: string;
    /** String-mode metadata used by parser actions, not the tokenize API. */
    raw?: boolean;
    startByte: number;
    endByte: number;
};
export type LexerWarning = { name: "SyntaxWarning"; message: string; filename: string; lineno: number };
export type LexerOptions = { extraTokens?: boolean; filename?: string; onWarning?: (warning: LexerWarning) => void };
type Mode = {
    kind: "regular" | "literal";
    curly: number;
    expr: number;
    quote: number;
    size: number;
    raw: boolean;
    start: number;
    lineStart: number;
    firstLine: number;
    format: boolean;
    debug: boolean;
    stringKind: "FSTRING" | "TSTRING";
};
const encoder = new TextEncoder(),
    decoder = new TextDecoder("utf-8", { ignoreBOM: true });
const strictDecoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
const operatorTypes = new Set(Object.values(operators));
const EOF = -1;
const digit = (c: number) => c >= 48 && c <= 57;
const hex = (c: number) => digit(c) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102);
const potentialStart = (c: number) => c === 95 || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c >= 128;
const potentialChar = (c: number) => potentialStart(c) || digit(c);
function inRanges(cp: number, ranges: number[]): boolean {
    let lo = 0,
        hi = ranges.length / 2 - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >>> 1,
            a = ranges[mid * 2],
            b = ranges[mid * 2 + 1];
        if (cp < a) hi = mid - 1;
        else if (cp > b) lo = mid + 1;
        else return true;
    }
    return false;
}
const blankMode = (): Mode => ({
    kind: "regular",
    curly: 0,
    expr: 0,
    quote: 0,
    size: 0,
    raw: false,
    start: 0,
    lineStart: 0,
    firstLine: 0,
    format: false,
    debug: false,
    stringKind: "FSTRING",
});
class Scanner {
    bytes: Uint8Array;
    originalLength: number;
    extra: boolean;
    filename: string;
    encodingError: { lineByte: number; message: string } | null = null;
    cur = 0;
    inp = 0;
    buf = 0;
    start: number | null = null;
    lineStart = 0;
    multiStart = 0;
    lineno = 0;
    firstLine = 0;
    col = -1;
    startCol = -1;
    done = false;
    implicit = false;
    atbol = true;
    pendin = 0;
    indstack = [0];
    altstack = [0];
    contLine = false;
    commentNewline = false;
    parens: { c: number; line: number; col: number }[] = [];
    modes: Mode[] = [blankMode()];
    lastLine = "";
    lastLineno = 0;
    byteDiff = 0;
    positionBase = -1;
    positionByte = 0;
    positionCol = 0;
    constructor(source: string, private options: LexerOptions) {
        const malformed = /[\uD800-\uDFFF]+/u.exec(source);
        if (malformed) {
            const lineStart = source.lastIndexOf("\n", malformed.index) + 1;
            const offset = Array.from(source.slice(lineStart, malformed.index)).length;
            const span =
                malformed[0].length === 1
                    ? `character '\\u${malformed[0]
                          .charCodeAt(0)
                          .toString(16)
                          .padStart(4, "0")}' in position ${offset}`
                    : `characters in position ${offset}-${offset + malformed[0].length - 1}`;
            this.encodingError = {
                lineByte: encoder.encode(source.slice(0, lineStart)).length,
                message: `'utf-8' codec can't encode ${span}: surrogates not allowed`,
            };
        }
        const implicit = !!source && !source.endsWith("\n");
        this.bytes = encoder.encode(implicit ? source + "\n" : source);
        this.originalLength = this.bytes.length - (implicit ? 1 : 0);
        this.extra = options.extraTokens ?? true;
        this.filename = options.filename ?? "<string>";
    }
    get mode() {
        return this.modes[this.modes.length - 1];
    }
    get inside() {
        return this.modes.length > 1;
    }
    text(a: number, b: number) {
        return decoder.decode(this.bytes.subarray(Math.max(a, 0), Math.max(b, 0)));
    }
    strictText(a: number, b: number) {
        const view = this.bytes.subarray(a, b);
        try {
            return strictDecoder.decode(view);
        } catch {
            let i = 0,
                end = 0,
                reason = "invalid start byte";
            for (; i < view.length; i++) {
                const c = view[i];
                if (c < 128) continue;
                const n = c >= 194 && c <= 223 ? 2 : c >= 224 && c <= 239 ? 3 : c >= 240 && c <= 244 ? 4 : 0;
                if (!n) {
                    end = i + 1;
                    break;
                }
                let j = 1;
                for (; j < n && i + j < view.length; j++) {
                    const v = view[i + j];
                    if (
                        v < 128 ||
                        v > 191 ||
                        (j === 1 &&
                            ((c === 224 && v < 160) ||
                                (c === 237 && v >= 160) ||
                                (c === 240 && v < 144) ||
                                (c === 244 && v >= 144)))
                    )
                        break;
                }
                if (j < n) {
                    end = i + j;
                    reason = i + j === view.length ? "unexpected end of data" : "invalid continuation byte";
                    break;
                }
                i += n - 1;
            }
            const span =
                end - i > 1
                    ? `bytes in position ${i}-${end - 1}`
                    : `byte 0x${view[i].toString(16).padStart(2, "0")} in position ${i}`;
            const message = `'utf-8' codec can't decode ${span}: ${reason}`;
            const e: any = new Error(message);
            Object.assign(e, {
                name: "UnicodeDecodeError",
                msg: message,
                lineno: null,
                offset: null,
                end_lineno: null,
                end_offset: null,
                text: null,
            });
            throw e;
        }
    }
    count(a: number, b: number) {
        let n = 0;
        for (let j = Math.max(0, a); j < b; j++) if ((this.bytes[j] & 192) !== 128) n++;
        return n;
    }
    column(base: number, end: number) {
        if (this.positionBase !== base || end < this.positionByte) {
            this.positionBase = base;
            this.positionByte = base;
            this.positionCol = 0;
        }
        this.positionCol += this.count(this.positionByte, end);
        this.positionByte = end;
        return this.positionCol;
    }
    next(): number {
        if (this.cur !== this.inp) {
            this.col++;
            return this.bytes[this.cur++];
        }
        if (this.done) return EOF;
        if (this.start === null && !this.inside) this.buf = this.cur;
        this.lineStart = this.cur;
        if (this.encodingError?.lineByte === this.cur) {
            const e: any = new Error(this.encodingError.message);
            Object.assign(e, {
                name: "UnicodeEncodeError",
                msg: this.encodingError.message,
                lineno: null,
                offset: null,
                end_lineno: null,
                end_offset: null,
                text: null,
            });
            throw e;
        }
        if (this.cur >= this.bytes.length) {
            this.done = true;
            return EOF;
        }
        let end = this.cur;
        while (end < this.bytes.length && this.bytes[end] !== 10) end++;
        this.inp = end < this.bytes.length ? end + 1 : end;
        this.implicit = this.inp > this.originalLength;
        this.lineno++;
        this.col = 0;
        for (let j = this.cur; j < this.inp; j++)
            if (this.bytes[j] === 0) this.syntax("source code cannot contain null bytes");
        this.col++;
        return this.bytes[this.cur++];
    }
    back(c: number) {
        if (c !== EOF) {
            this.cur--;
            this.col--;
        }
    }
    syntax(msg: string, offset?: number, endOffset?: number): never {
        const off = offset ?? this.count(this.lineStart, this.cur);
        let eol = this.lineStart;
        while (eol < this.bytes.length && this.bytes[eol] !== 10 && this.bytes[eol] !== 0) eol++;
        const e: any = new Error(msg);
        Object.assign(e, {
            name: "SyntaxError",
            msg,
            filename: this.filename,
            lineno: this.lineno,
            offset: off,
            end_lineno: this.lineno,
            end_offset: endOffset ?? off,
            text: this.text(this.lineStart, eol),
        });
        throw e;
    }
    error(code: "EOF" | "DEDENT" | "TABSPACE" | "TOODEEP" | "LINECONT"): never {
        const msgs = {
            EOF: "unexpected EOF in multi-line statement",
            DEDENT: "unindent does not match any outer indentation level",
            TABSPACE: "inconsistent use of tabs and spaces in indentation",
            TOODEEP: "too many levels of indentation",
            LINECONT: "unexpected character after line continuation character",
        };
        const e: any = new Error(msgs[code]);
        Object.assign(e, {
            name:
                code === "TABSPACE"
                    ? "TabError"
                    : ["DEDENT", "TOODEEP"].includes(code)
                    ? "IndentationError"
                    : "SyntaxError",
            msg: msgs[code],
            filename: this.filename,
            lineno: this.lineno,
            offset: code === "EOF" ? this.inp - this.buf : this.count(this.buf, this.inp),
            end_lineno: code === "EOF" ? this.lineno : null,
            end_offset: null,
            text: code === "EOF" ? null : this.text(this.buf, this.inp - 1),
        });
        throw e;
    }
    make(type: string, a: number | null = null, b: number | null = null): Token {
        const stringlit = ["STRING", "FSTRING_MIDDLE", "TSTRING_MIDDLE"].includes(type);
        const ls = stringlit ? this.multiStart : this.lineStart;
        let line = this.lastLine;
        const trailing = type === "ENDMARKER" || (type === "DEDENT" && this.done);
        if (this.extra && trailing) line = "";
        else if (this.lineno !== this.lastLineno) {
            line = this.text(ls, this.inp - (this.implicit ? 1 : 0));
            this.lastLine = line;
            this.byteDiff = 0;
        }
        let lineno = stringlit ? this.firstLine : this.lineno,
            endLine = this.lineno;
        let col = -1,
            endCol = -1;
        if (a !== null && a >= ls) col = this.column(ls, a);
        if (b !== null && b >= this.lineStart) endCol = this.column(this.lineStart, b);
        this.lastLineno = lineno;
        let string = a === null || b === null ? "" : this.strictText(a, b);
        if (this.extra) {
            if (trailing) {
                lineno = endLine = lineno + 1;
                col = endCol = 0;
            }
            if (operatorTypes.has(type)) type = "OP";
            else if (type === "NEWLINE") {
                string = this.implicit ? string : this.bytes[this.start!] === 13 ? "\r\n" : "\n";
                endCol++;
            } else if (type === "NL" && this.implicit) string = "";
        }
        return {
            type,
            string,
            start: [lineno, col],
            end: [endLine, endCol],
            line,
            ...(type === "FSTRING_MIDDLE" || type === "TSTRING_MIDDLE" ? { raw: this.mode.raw } : {}),
            startByte: a === null ? -1 : a - ls,
            // CPython parser spans include both doubled braces; tokenize spans
            // and token spelling expose only the first one.
            endByte:
                b === null
                    ? -1
                    : b -
                      this.lineStart +
                      ((type === "FSTRING_MIDDLE" || type === "TSTRING_MIDDLE") && b === this.cur - 1 ? 1 : 0),
        };
    }
    continuation() {
        let c = this.next();
        if (c === 13) c = this.next();
        if (c !== 10) this.error("LINECONT");
        c = this.next();
        if (c === EOF) this.error("EOF");
        this.back(c);
        return c;
    }
    warn(message: string): void {
        this.options.onWarning?.({ name: "SyntaxWarning", message, filename: this.filename, lineno: this.lineno });
    }
    verifyEnd(c: number, kind: string) {
        if (this.extra) return;
        const suffix =
            c === 97 ? "nd" : c === 101 ? "lse" : c === 102 ? "or" : c === 111 ? "r" : c === 110 ? "ot" : null;
        if (c === 105 && [102, 110, 115].includes(this.bytes[this.cur])) {
            this.warn(`invalid ${kind} literal`);
            return;
        }
        if (suffix) {
            let j = 0;
            while (j < suffix.length && this.bytes[this.cur + j] === suffix.charCodeAt(j)) j++;
            if (j === suffix.length && !potentialChar(this.bytes[this.cur + j] ?? EOF)) {
                this.warn(`invalid ${kind} literal`);
                return;
            }
        }
        if (c < 128 && potentialChar(c)) {
            this.back(c);
            this.syntax(`invalid ${kind} literal`);
        }
    }
    decimalTail() {
        let c: number;
        do {
            do {
                c = this.next();
            } while (digit(c));
            if (c !== 95) break;
            c = this.next();
            if (!digit(c)) {
                this.back(c);
                this.syntax("invalid decimal literal");
            }
        } while (true);
        return c;
    }
    verifyIdentifier() {
        if (this.extra) return;
        const s = this.strictText(this.start!, this.cur);
        let offset = this.start!;
        let first = true;
        for (const ch of s) {
            const cp = ch.codePointAt(0)!;
            offset += cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
            const ok =
                cp < 128
                    ? first
                        ? potentialStart(cp)
                        : potentialChar(cp)
                    : inRanges(cp, first ? unicode.start : unicode.continue);
            first = false;
            if (!ok) {
                this.cur = offset;
                const h = cp.toString(16).toUpperCase().padStart(4, "0");
                this.syntax(
                    !inRanges(cp, unicode.printable)
                        ? `invalid non-printable character U+${h}`
                        : `invalid character '${ch}' (U+${h})`
                );
            }
        }
    }
    number(c: number, dot = false): Token {
        let kind = "decimal",
            fraction = dot,
            exponent = false,
            imaginary = false;
        if (dot) {
        } else if (c === 48) {
            c = this.next();
            const base =
                c === 120 || c === 88
                    ? "hexadecimal"
                    : c === 111 || c === 79
                    ? "octal"
                    : c === 98 || c === 66
                    ? "binary"
                    : null;
            if (base) {
                kind = base;
                c = this.next();
                const valid =
                    base === "hexadecimal"
                        ? hex
                        : base === "octal"
                        ? (x: number) => x >= 48 && x < 56
                        : (x: number) => x === 48 || x === 49;
                do {
                    if (c === 95) c = this.next();
                    if (!valid(c)) {
                        if (base !== "hexadecimal" && digit(c))
                            this.syntax(`invalid digit '${String.fromCharCode(c)}' in ${base} literal`);
                        this.back(c);
                        this.syntax(`invalid ${base} literal`);
                    }
                    do {
                        c = this.next();
                    } while (valid(c));
                } while (c === 95);
                if (base !== "hexadecimal" && digit(c))
                    this.syntax(`invalid digit '${String.fromCharCode(c)}' in ${base} literal`);
                this.verifyEnd(c, kind);
                this.back(c);
                return this.make("NUMBER", this.start, this.cur);
            }
            let nonzero = false;
            while (true) {
                if (c === 95) {
                    c = this.next();
                    if (!digit(c)) {
                        this.back(c);
                        this.syntax("invalid decimal literal");
                    }
                }
                if (c !== 48) break;
                c = this.next();
            }
            const zerosEnd = this.cur;
            if (digit(c)) {
                nonzero = true;
                c = this.decimalTail();
            }
            if (c === 46) {
                c = this.next();
                fraction = true;
            } else if (c === 101 || c === 69) exponent = true;
            else if (c === 106 || c === 74) imaginary = true;
            else if (nonzero && !this.extra) {
                this.back(c);
                this.syntax(
                    "leading zeros in decimal integer literals are not permitted; use an 0o prefix for octal integers",
                    this.start! + 1 - this.lineStart,
                    zerosEnd - this.lineStart
                );
            } else {
                this.verifyEnd(c, "decimal");
                this.back(c);
                return this.make("NUMBER", this.start, this.cur);
            }
        } else {
            c = this.decimalTail();
            if (c === 46) {
                c = this.next();
                fraction = true;
            }
        }
        if (fraction && digit(c)) c = this.decimalTail();
        if (exponent || c === 101 || c === 69) {
            const e = c;
            c = this.next();
            if (c === 43 || c === 45) {
                c = this.next();
                if (!digit(c)) {
                    this.back(c);
                    this.syntax("invalid decimal literal");
                }
            } else if (!digit(c)) {
                this.back(c);
                this.verifyEnd(e, "decimal");
                this.back(e);
                return this.make("NUMBER", this.start, this.cur);
            }
            c = this.decimalTail();
        }
        if (imaginary || c === 106 || c === 74) {
            c = this.next();
            kind = "imaginary";
        }
        this.verifyEnd(c, kind);
        this.back(c);
        return this.make("NUMBER", this.start, this.cur);
    }
    normal(): Token {
        const mode = this.mode;
        nextline: while (true) {
            this.start = null;
            this.startCol = -1;
            let blankline = false,
                c: number;
            if (this.atbol) {
                let col = 0,
                    alt = 0,
                    cont = 0;
                this.atbol = false;
                while (true) {
                    c = this.next();
                    if (c === 32) {
                        col++;
                        alt++;
                    } else if (c === 9) {
                        col = (Math.floor(col / 8) + 1) * 8;
                        alt++;
                    } else if (c === 12) {
                        col = alt = 0;
                    } else if (c === 92) {
                        cont = cont || col;
                        this.continuation();
                    } else break;
                }
                this.back(c);
                if (c === 35 || c === 10 || c === 13) blankline = true;
                if (!blankline && !this.parens.length) {
                    col = cont || col;
                    alt = cont || alt;
                    const top = this.indstack.length - 1;
                    if (col === this.indstack[top]) {
                        if (alt !== this.altstack[top]) this.error("TABSPACE");
                    } else if (col > this.indstack[top]) {
                        if (top + 1 >= 100) this.error("TOODEEP");
                        if (alt <= this.altstack[top]) this.error("TABSPACE");
                        this.pendin++;
                        this.indstack.push(col);
                        this.altstack.push(alt);
                    } else {
                        while (this.indstack.length > 1 && col < this.indstack.at(-1)!) {
                            this.pendin--;
                            this.indstack.pop();
                            this.altstack.pop();
                        }
                        if (col !== this.indstack.at(-1)) this.error("DEDENT");
                        if (alt !== this.altstack.at(-1)) this.error("TABSPACE");
                    }
                }
            }
            this.start = this.cur;
            this.startCol = this.col;
            if (this.pendin) {
                if (this.pendin < 0) {
                    this.pendin++;
                    return this.make("DEDENT", this.extra ? this.cur : null, this.extra ? this.cur : null);
                }
                this.pendin--;
                return this.make("INDENT", this.extra ? this.buf : null, this.extra ? this.cur : null);
            }
            c = this.next();
            this.back(c);
            while (true) {
                this.start = null;
                do {
                    c = this.next();
                } while (c === 32 || c === 9 || c === 12);
                this.start = this.cur - 1;
                this.startCol = this.col - 1;
                if (c === 35) {
                    while (c !== EOF && c !== 10 && c !== 13) c = this.next();
                    if (this.extra) {
                        this.back(c);
                        this.commentNewline = blankline;
                        return this.make("COMMENT", this.start, this.cur);
                    }
                }
                if (c === EOF) {
                    if (this.parens.length) this.error("EOF");
                    return this.make("ENDMARKER");
                }
                if (potentialStart(c)) {
                    const saw = new Set<string>();
                    let nonascii = false;
                    while (true) {
                        const lower = String.fromCharCode(c).toLowerCase();
                        if ("brutf".includes(lower) && !saw.has(lower)) saw.add(lower);
                        else break;
                        c = this.next();
                        if (c === 34 || c === 39) {
                            for (const [a, b] of [
                                ["u", "b"],
                                ["u", "r"],
                                ["u", "f"],
                                ["u", "t"],
                                ["b", "f"],
                                ["b", "t"],
                                ["f", "t"],
                            ])
                                if (saw.has(a) && saw.has(b))
                                    this.syntax(
                                        `'${a}' and '${b}' prefixes are incompatible`,
                                        this.start + 1 - this.lineStart,
                                        this.cur - this.lineStart
                                    );
                            return saw.has("f") || saw.has("t") ? this.startInterpolated(c, saw) : this.string(c);
                        }
                    }
                    while (potentialChar(c)) {
                        if (c >= 128) nonascii = true;
                        c = this.next();
                    }
                    this.back(c);
                    if (nonascii) this.verifyIdentifier();
                    return this.make("NAME", this.start, this.cur);
                }
                if (c === 13) c = this.next();
                if (c === 10) {
                    this.atbol = true;
                    if (blankline || this.parens.length) {
                        if (this.extra) {
                            this.commentNewline = false;
                            return this.make("NL", this.start, this.cur);
                        }
                        continue nextline;
                    }
                    if (this.commentNewline && this.extra) {
                        this.commentNewline = false;
                        return this.make("NL", this.start, this.cur);
                    }
                    this.contLine = false;
                    return this.make("NEWLINE", this.start, this.cur - 1);
                }
                if (c === 46) {
                    c = this.next();
                    if (digit(c)) return this.number(c, true);
                    if (c === 46) {
                        c = this.next();
                        if (c === 46) return this.make("ELLIPSIS", this.start, this.cur);
                        this.back(c);
                        this.back(46);
                    } else this.back(c);
                    return this.make("DOT", this.start, this.cur);
                }
                if (digit(c)) return this.number(c);
                if (c === 34 || c === 39) return this.string(c);
                if (c === 92) {
                    this.continuation();
                    this.contLine = true;
                    continue;
                }
                if ([58, 125, 33, 123].includes(c) && this.inside && mode.expr >= 0) {
                    const cursor = mode.curly - (c !== 123 ? 1 : 0);
                    if (c === 58 && cursor === mode.expr) {
                        mode.kind = "literal";
                        mode.format = true;
                        return this.make("COLON", this.start, this.cur);
                    }
                }
                const c2 = this.next();
                const pair = String.fromCharCode(c, c2);
                let op = (operators as Record<string, string>)[pair];
                if (op) {
                    const c3 = this.next();
                    const triple = (operators as Record<string, string>)[pair + String.fromCharCode(c3)];
                    if (triple) op = triple;
                    else this.back(c3);
                    return this.make(op, this.start, this.cur);
                }
                this.back(c2);
                if (c === 40 || c === 91 || c === 123) {
                    if (this.parens.length >= 200) this.syntax("too many nested parentheses");
                    this.parens.push({ c, line: this.lineno, col: this.start - this.lineStart });
                    if (this.inside) mode.curly++;
                } else if (c === 41 || c === 93 || c === 125) {
                    const prefix = mode.stringKind === "TSTRING" ? "t" : "f";
                    if (this.inside && !mode.curly && c === 125)
                        this.syntax(`${prefix}-string: single '}' is not allowed`);
                    if (!this.extra && !this.parens.length) this.syntax(`unmatched '${String.fromCharCode(c)}'`);
                    if (this.parens.length) {
                        const opening = this.parens.pop()!;
                        if (
                            !this.extra &&
                            !(
                                (opening.c === 40 && c === 41) ||
                                (opening.c === 91 && c === 93) ||
                                (opening.c === 123 && c === 125)
                            )
                        ) {
                            if (this.inside && opening.c === 123 && mode.curly - 1 === mode.expr)
                                this.syntax(`${prefix}-string: unmatched '${String.fromCharCode(c)}'`);
                            this.syntax(
                                `closing parenthesis '${String.fromCharCode(
                                    c
                                )}' does not match opening parenthesis '${String.fromCharCode(opening.c)}'${
                                    opening.line !== this.lineno ? " on line " + opening.line : ""
                                }`
                            );
                        }
                    }
                    if (this.inside) {
                        mode.curly--;
                        if (mode.curly < 0) this.syntax(`${prefix}-string: unmatched '${String.fromCharCode(c)}'`);
                        if (c === 125 && mode.curly === mode.expr) {
                            mode.expr--;
                            mode.kind = "literal";
                            mode.format = false;
                            mode.debug = false;
                        }
                    }
                }
                if (c < 32 || c === 127)
                    this.syntax(`invalid non-printable character U+${c.toString(16).toUpperCase().padStart(4, "0")}`);
                if (c === 61 && mode.curly - mode.expr === 1) mode.debug = true;
                return this.make(
                    (operators as Record<string, string>)[String.fromCharCode(c)] ?? "OP",
                    this.start,
                    this.cur
                );
            }
        }
    }
    startInterpolated(quote: number, saw: Set<string>): Token {
        let size = 1;
        this.firstLine = this.lineno;
        this.multiStart = this.lineStart;
        const after = this.next();
        if (after === quote) {
            const after2 = this.next();
            if (after2 === quote) size = 3;
            else {
                this.back(after2);
                this.back(after);
            }
        }
        if (after !== quote) this.back(after);
        if (this.modes.length >= 150) this.syntax("too many nested f-strings or t-strings");
        const mode = blankMode();
        Object.assign(mode, {
            kind: "literal",
            quote,
            size,
            start: this.start!,
            lineStart: this.lineStart,
            firstLine: this.lineno,
            raw: saw.has("r"),
            stringKind: saw.has("t") ? "TSTRING" : "FSTRING",
            expr: -1,
        });
        this.modes.push(mode);
        return this.make(mode.stringKind + "_START", this.start, this.cur);
    }
    string(quote: number): Token {
        let size = 1,
            endSize = 0,
            escaped = false,
            c: number;
        this.firstLine = this.lineno;
        this.multiStart = this.lineStart;
        c = this.next();
        if (c === quote) {
            c = this.next();
            if (c === quote) size = 3;
            else endSize = 1;
        }
        if (c !== quote) this.back(c);
        while (endSize !== size) {
            c = this.next();
            if (c === EOF || (size === 1 && c === 10)) {
                const detected = this.lineno;
                this.cur = this.start! + 1;
                this.lineStart = this.multiStart;
                this.lineno = this.firstLine;
                if (this.inside && this.mode.quote === quote && this.mode.size === size)
                    this.syntax(`${this.mode.stringKind === "TSTRING" ? "t" : "f"}-string: expecting '}'`);
                this.syntax(
                    `unterminated ${size === 3 ? "triple-quoted " : ""}string literal (detected at line ${detected})${
                        size === 1 && escaped ? "; perhaps you escaped the end quote?" : ""
                    }`
                );
            }
            if (c === quote) endSize++;
            else {
                endSize = 0;
                if (c === 92) {
                    c = this.next();
                    if (c === quote) escaped = true;
                    if (c === 13) c = this.next();
                }
            }
        }
        return this.make("STRING", this.start, this.cur);
    }
    literal(): Token {
        const mode = this.mode;
        let endSize = 0,
            unicodeEscape = false;
        this.start = this.cur;
        this.firstLine = this.lineno;
        this.startCol = this.col;
        const startChar = this.next();
        if (startChar === 123) {
            const p = this.next();
            this.back(p);
            this.back(startChar);
            if (p !== 123) {
                mode.expr++;
                if (mode.expr >= 3)
                    this.syntax(`${mode.stringKind === "TSTRING" ? "t" : "f"}-string: expressions nested too deeply`);
                mode.kind = "regular";
                return this.normal();
            }
        } else this.back(startChar);
        let finished = true;
        for (let j = 0; j < mode.size; j++) {
            const q = this.next();
            if (q !== mode.quote) {
                this.back(q);
                finished = false;
                break;
            }
        }
        if (finished) {
            this.modes.pop();
            return this.make(mode.stringKind + "_END", this.start, this.cur);
        }
        this.multiStart = this.lineStart;
        while (endSize !== mode.size) {
            const c = this.next();
            const format = mode.format && mode.expr >= 0;
            const prefix = mode.stringKind === "TSTRING" ? "t" : "f";
            if (c === EOF || (mode.size === 1 && c === 10)) {
                if (format && c === 10) {
                    if (mode.size === 1)
                        this.syntax(
                            `${prefix}-string: newlines are not allowed in format specifiers for single quoted ${prefix}-strings`
                        );
                    this.back(c);
                    mode.kind = "regular";
                    mode.format = false;
                    return this.make(mode.stringKind + "_MIDDLE", this.start, this.cur);
                }
                const detected = this.lineno;
                this.cur = mode.start + 1;
                this.lineStart = mode.lineStart;
                this.lineno = mode.firstLine;
                this.syntax(
                    `unterminated ${
                        mode.size === 3 ? "triple-quoted " : ""
                    }${prefix}-string literal (detected at line ${detected})`
                );
            }
            if (c === mode.quote) {
                endSize++;
                continue;
            } else endSize = 0;
            if (c === 123) {
                const p = this.next();
                if (p !== 123 || format) {
                    this.back(p);
                    this.back(c);
                    mode.expr++;
                    if (mode.expr >= 3) this.syntax(`${prefix}-string: expressions nested too deeply`);
                    mode.kind = "regular";
                    mode.format = false;
                    return this.make(mode.stringKind + "_MIDDLE", this.start, this.cur);
                }
                return this.make(mode.stringKind + "_MIDDLE", this.start, this.cur - 1);
            }
            if (c === 125) {
                if (unicodeEscape) return this.make(mode.stringKind + "_MIDDLE", this.start, this.cur);
                const p = this.next();
                if (p === 125 && !format && mode.curly === 0)
                    return this.make(mode.stringKind + "_MIDDLE", this.start, this.cur - 1);
                this.back(p);
                this.back(c);
                mode.kind = "regular";
                mode.format = false;
                return this.make(mode.stringKind + "_MIDDLE", this.start, this.cur);
            }
            if (c === 92) {
                let p = this.next();
                if (p === 13) p = this.next();
                if (p === 123 || p === 125) {
                    if (!mode.raw) {
                        const escape = "\\" + String.fromCharCode(p);
                        this.warn(
                            `"${escape}" is an invalid escape sequence. Such sequences will not work in the future. Did you mean "\\${escape}"? A raw string is also an option.`
                        );
                    }
                    this.back(p);
                    continue;
                }
                if (!mode.raw && p === 78) {
                    p = this.next();
                    if (p === 123) unicodeEscape = true;
                    else this.back(p);
                }
            }
        }
        for (let j = 0; j < mode.size; j++) this.back(mode.quote);
        return this.make(mode.stringKind + "_MIDDLE", this.start, this.cur);
    }
    *scan(): Generator<Token> {
        while (true) {
            const t = this.mode.kind === "regular" ? this.normal() : this.literal();
            if (t.type === "ENDMARKER" && !this.extra && !this.lineno) break;
            yield t;
            if (t.type === "ENDMARKER") break;
        }
    }
}
export function tokenize(source: string, options: LexerOptions = {}): Token[] {
    return Array.from(scan(source, options));
}

export function scan(source: string, options: LexerOptions = {}): Generator<Token> {
    return new Scanner(source, options).scan();
}
