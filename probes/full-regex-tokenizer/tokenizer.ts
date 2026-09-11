import { identifierStart, identifierExtra, nonprintable } from "./unicode.ts";
// Experimental whole-source Python 3.14 lexer. Regex tokens plus explicit lexical state.
export type Token = { type: string; string: string; start: [number, number]; end: [number, number]; line: string };
type Mark = { i: number; row: number; col: number };
type Frame = { quote: string; kind: string; raw: boolean; start: Mark; fields: number; closed?: boolean };
const opener = /(?:[rubft]{0,5})(?:"""|'''|"|')/iy;
const identifier = /(?:[_a-zA-Z]|[^\x00-\x7f])(?:[_a-zA-Z0-9]|[^\x00-\x7f])*/y;
const validIdentifier = new RegExp(
    "^(?:" + identifierStart.source + ")(?:" + identifierStart.source + "|" + identifierExtra.source + ")*$",
    "u"
);
const number =
    /(?:0[xX](?:_?[0-9a-fA-F])+|0[bB](?:_?[01])+|0[oO](?:_?[0-7])+|(?:(?:[0-9](?:_?[0-9])*\.(?:[0-9](?:_?[0-9])*)?|\.[0-9](?:_?[0-9])*)(?:[eE][-+]?[0-9](?:_?[0-9])*)?|[0-9](?:_?[0-9])*[eE][-+]?[0-9](?:_?[0-9])*|[0-9](?:_?[0-9])*)[jJ]?)/y;
const operator =
    /(?:\*\*=|\/\/=|<<=|>>=|->|:=|==|!=|<=|>=|\*\*|\/\/|<<|>>|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|@=|\.\.\.|[^\s])/uy;
const exact: Record<string, string> = {
    "(": "LPAR",
    ")": "RPAR",
    "[": "LSQB",
    "]": "RSQB",
    ":": "COLON",
    ",": "COMMA",
    ";": "SEMI",
    "+": "PLUS",
    "-": "MINUS",
    "*": "STAR",
    "/": "SLASH",
    "|": "VBAR",
    "&": "AMPER",
    "<": "LESS",
    ">": "GREATER",
    "=": "EQUAL",
    ".": "DOT",
    "%": "PERCENT",
    "{": "LBRACE",
    "}": "RBRACE",
    "==": "EQEQUAL",
    "!=": "NOTEQUAL",
    "<=": "LESSEQUAL",
    ">=": "GREATEREQUAL",
    "~": "TILDE",
    "^": "CIRCUMFLEX",
    "<<": "LEFTSHIFT",
    ">>": "RIGHTSHIFT",
    "**": "DOUBLESTAR",
    "+=": "PLUSEQUAL",
    "-=": "MINEQUAL",
    "*=": "STAREQUAL",
    "/=": "SLASHEQUAL",
    "%=": "PERCENTEQUAL",
    "&=": "AMPEREQUAL",
    "|=": "VBAREQUAL",
    "^=": "CIRCUMFLEXEQUAL",
    "<<=": "LEFTSHIFTEQUAL",
    ">>=": "RIGHTSHIFTEQUAL",
    "**=": "DOUBLESTAREQUAL",
    "//": "DOUBLESLASH",
    "//=": "DOUBLESLASHEQUAL",
    "@": "AT",
    "@=": "ATEQUAL",
    "->": "RARROW",
    "...": "ELLIPSIS",
    ":=": "COLONEQUAL",
    "!": "EXCLAMATION",
};
const tails: Record<string, RegExp> = {};
function regex(re: RegExp, s: string, i: number) {
    re.lastIndex = i;
    return re.exec(s)?.[0];
}
export function tokenize(source: string, options: { extraTokens?: boolean; filename?: string } = {}): Token[] {
    const extra = options.extraTokens !== false;
    const output: Token[] = [];
    const lines = source.match(/[^\n]*\n|[^\n]+$/g) || [];
    const starts: number[] = [0];
    for (const line of lines) starts.push(starts[starts.length - 1] + line.length);
    let i = 0,
        row = 1,
        col = 0,
        bol = true,
        statement = false,
        blank = false,
        lastLogicalLine = "";
    let bufferStartRow = 1;
    let eofNewline = false;
    const indents = [0],
        alts = [0];
    const brackets: Array<{ char: string; mark: Mark; field: boolean }> = [];
    const frames: Frame[] = [];
    let commentStart: Mark | undefined;
    let commentNewline = false;
    const mark = (): Mark => ({ i, row, col });
    let checkedRow = 0;
    function checkLine() {
        if (row !== checkedRow) {
            checkedRow = row;
            const line = lines[row - 1] || "";
            const bad = line.match(/[\ud800-\udfff]+/u);
            if (bad) {
                const cpIndex = [...line.slice(0, bad.index)].length;
                const end = cpIndex + bad[0].length - 1;
                const cp = bad[0].charCodeAt(0);
                const msg =
                    end === cpIndex
                        ? `'utf-8' codec can't encode character '\\u${cp.toString(
                              16
                          )}' in position ${cpIndex}: surrogates not allowed`
                        : `'utf-8' codec can't encode characters in position ${cpIndex}-${end}: surrogates not allowed`;
                const e: any = new Error(msg);
                e.name = "UnicodeEncodeError";
                for (const k of ["lineno", "offset", "end_lineno", "end_offset", "text"]) e[k] = null;
                throw e;
            }
            if (line.includes("\x00"))
                error(
                    "source code cannot contain null bytes",
                    { i, row, col: 0 },
                    "SyntaxError",
                    0,
                    line.split("\x00")[0]
                );
        }
    }
    function advance(n: number) {
        const end = i + n;
        while (i < end) {
            checkLine();
            const cp = source.codePointAt(i)!;
            i += cp > 0xffff ? 2 : 1;
            if (cp === 10) {
                row++;
                col = 0;
            } else col++;
        }
    }
    function token(type: string, start: Mark, end: Mark = mark(), str = source.slice(start.i, end.i), line?: string) {
        if (!extra && (type === "NL" || type === "COMMENT")) return;
        if (type === "OP" && !extra) type = exact[str] || "OP";
        output.push({
            type,
            string: str,
            start: [start.row, start.col],
            end: [end.row, end.col],
            line: line ?? source.slice(starts[start.row - 1], starts[end.row] ?? source.length),
        });
    }
    function error(
        msg: string,
        at: Mark = mark(),
        name = "SyntaxError",
        endOffset: number | null = at.col,
        text?: string,
        endLine: number | null = at.row
    ): never {
        const e: any = new Error(msg);
        e.name = name;
        e.msg = msg;
        e.filename = options.filename || "<string>";
        e.lineno = at.row;
        e.offset = at.col;
        e.end_lineno = endLine;
        e.end_offset = endOffset;
        e.text = text !== undefined ? text : (lines[at.row - 1] || "").replace(/\n$/, "");
        throw e;
    }
    function syntax(msg: string, at: Mark = mark()): never {
        return error(msg, { ...at, col: at.col + 1 });
    }
    function byteLength(text: string) {
        let n = 0;
        for (const c of text) {
            const cp = c.codePointAt(0)!;
            n += cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
        }
        return n;
    }
    function lineError(msg: string, name: string) {
        const line = lines.slice(bufferStartRow - 1, row).join("");
        error(
            msg,
            { i, row, col: [...line].length + (line.endsWith("\n") ? 0 : 1) },
            name,
            null,
            line.replace(/\n$/, ""),
            null
        );
    }
    function endString(frame: Frame, escaped = false): never {
        const isTriple = frame.quote.length === 3;
        let msg = frame.kind
            ? `unterminated ${isTriple ? "triple-quoted " : ""}${
                  frame.kind === "FSTRING" ? "f" : "t"
              }-string literal (detected at line ${Math.min(row, lines.length)})`
            : `unterminated ${isTriple ? "triple-quoted " : ""}string literal (detected at line ${Math.min(
                  row,
                  lines.length
              )})`;
        const outer = frames[frames.length - 1];
        if (!frame.kind && outer && outer.quote === frame.quote)
            msg = `${outer.kind === "FSTRING" ? "f" : "t"}-string: expecting '}'`;
        else if (escaped && !frame.kind && !isTriple) msg += "; perhaps you escaped the end quote?";
        error(msg, { ...frame.start, col: frame.start.col + 1 }, "SyntaxError", frame.start.col + 1);
    }
    function newline() {
        const physicalStart = mark();
        const start = !extra && commentStart ? commentStart : physicalStart;
        commentStart = undefined;
        const isNl = blank || commentNewline || brackets.length > 0;
        commentNewline = false;
        const n = source.startsWith("\r\n", i) ? 2 : 1;
        advance(n);
        const end = { ...physicalStart, i: physicalStart.i + n, col: physicalStart.col + n };
        token(
            isNl ? "NL" : "NEWLINE",
            start,
            extra ? end : { ...end, i: end.i - 1, col: end.col - 1 },
            extra ? source.slice(start.i, physicalStart.i + n) : source.slice(start.i, physicalStart.i + n - 1),
            lines[start.row - 1]
        );
        bol = true;
        if (!frames.length) bufferStartRow = row;
        if (isNl) lastLogicalLine = "";
        if (!isNl) {
            statement = false;
            lastLogicalLine = lines[start.row - 1] || "";
        }
    }
    function indentation() {
        let start = mark();
        let width = 0,
            alt = 0,
            continuedWidth = 0;
        while (i < source.length) {
            if (/[ \t\f]/.test(source[i])) {
                if (source[i] === " ") {
                    width++;
                    alt++;
                } else if (source[i] === "\t") {
                    width = (Math.floor(width / 8) + 1) * 8;
                    alt++;
                } else width = alt = 0;
                advance(1);
                continue;
            }
            if (source[i] === "\\") {
                continuedWidth = continuedWidth || width;
                advance(1);
                if (source[i] === "\r") advance(1);
                if (source[i] !== "\n") {
                    if (i >= source.length)
                        error(
                            "unexpected EOF in multi-line statement",
                            { ...mark(), col: 0 },
                            "SyntaxError",
                            null,
                            null as any
                        );
                    lineError("unexpected character after line continuation character", "SyntaxError");
                }
                advance(1);
                if (i >= source.length)
                    error(
                        "unexpected EOF in multi-line statement",
                        { i, row: row - 1, col: 0 },
                        "SyntaxError",
                        null,
                        null as any
                    );
                start = mark();
                continue;
            }
            break;
        }
        if (continuedWidth) width = alt = continuedWidth;
        blank = i >= source.length || source[i] === "#" || source[i] === "\n" || source[i] === "\r";
        bol = false;
        if (blank || brackets.length) return;
        if (width === indents.at(-1)) {
            if (alt !== alts.at(-1)) lineError("inconsistent use of tabs and spaces in indentation", "TabError");
        } else if (width > indents.at(-1)!) {
            if (indents.length >= 100) lineError("too many levels of indentation", "IndentationError");
            if (alt <= alts.at(-1)!) lineError("inconsistent use of tabs and spaces in indentation", "TabError");
            indents.push(width);
            alts.push(alt);
            token(
                "INDENT",
                extra ? start : { ...mark(), col: -1 },
                extra ? mark() : { ...mark(), col: -1 },
                extra ? source.slice(start.i, i) : ""
            );
        } else {
            while (width < indents.at(-1)!) {
                indents.pop();
                alts.pop();
                token("DEDENT", extra ? mark() : { ...mark(), col: -1 }, extra ? mark() : { ...mark(), col: -1 }, "");
            }
            if (width !== indents.at(-1))
                lineError("unindent does not match any outer indentation level", "IndentationError");
            if (alt !== alts.at(-1)) lineError("inconsistent use of tabs and spaces in indentation", "TabError");
        }
    }
    function stringToken(header: string, start = mark()) {
        const quote = header.match(/(?:"""|'''|"|')$/)![0];
        const prefix = header.slice(0, -quote.length).toLowerCase();
        if (new Set(prefix).size !== prefix.length) {
            return false;
        }
        const kinds = [...prefix].filter((x) => x !== "r");
        for (const pair of ["ub", "ur", "uf", "ut", "bf", "bt", "ft"])
            if ([...pair].every((c) => prefix.includes(c))) {
                error(
                    `'${pair[0]}' and '${pair[1]}' prefixes are incompatible`,
                    { ...start, col: start.col + 1 },
                    "SyntaxError",
                    start.col + prefix.length + 1
                );
            }
        const frame: Frame = {
            quote,
            kind: prefix.includes("f") ? "FSTRING" : prefix.includes("t") ? "TSTRING" : "",
            raw: prefix.includes("r"),
            start,
            fields: 0,
        };
        advance(header.length);
        if (frame.kind) {
            if (frames.length >= 150) syntax("too many nested f-strings", start);
            token(frame.kind + "_START", start);
            frames.push(frame);
            textMode(frame, false);
            frames.pop();
            return true;
        }
        const key = quote[0];
        const chunk = (tails[key] ??= new RegExp(`(?:[^${key}\\\\\\n]+|\\\\[\\s\\S])`, "y"));
        let escaped = false;
        while (i < source.length) {
            if (source.startsWith(quote, i)) {
                advance(quote.length);
                token("STRING", start);
                return true;
            }
            const part = regex(chunk, source, i);
            if (part) {
                if (quote.length === 1 && part.includes("\\" + quote)) escaped = true;
                advance(part.length);
                continue;
            }
            if (source[i] === "\n" && quote.length === 1) endString(frame, escaped);
            advance(1);
        }
        endString(frame, escaped);
    }
    function textMode(frame: Frame, format: boolean) {
        let start = mark();
        const flush = (empty = false) => {
            if (i > start.i || empty) token(frame.kind + "_MIDDLE", start);
            start = mark();
        };
        const key = "text" + frame.quote[0];
        const chunk = (tails[key] ??= new RegExp(`[^${frame.quote[0]}{}\\\\\\n]+`, "y"));
        while (i < source.length) {
            if (source.startsWith(frame.quote, i)) {
                if (format) {
                    flush();
                    const end = mark();
                    advance(frame.quote.length);
                    token(frame.kind + "_END", end);
                    frame.closed = true;
                    return;
                }
                flush();
                const end = mark();
                advance(frame.quote.length);
                token(frame.kind + "_END", end);
                frame.closed = true;
                return;
            }
            const part = regex(chunk, source, i);
            if (part) {
                advance(part.length);
                continue;
            }
            const c = source[i];
            if (c === "{" || c === "}") {
                if (!format && source[i + 1] === c) {
                    advance(1);
                    flush();
                    advance(1);
                    start = mark();
                    continue;
                }
                if (c === "}") {
                    if (!format) syntax(`${frame.kind === "FSTRING" ? "f" : "t"}-string: single '}' is not allowed`);
                    flush(true);
                    punctuation("}");
                    return;
                }
                flush(format && source[i + 1] === "{");
                if (++frame.fields >= 4)
                    syntax(`${frame.kind === "FSTRING" ? "f" : "t"}-string: expressions nested too deeply`);
                punctuation("{", true);
                expression(frame);
                frame.fields--;
                if (frame.closed) return;
                start = mark();
                continue;
            }
            if (c === "\\") {
                if (!frame.raw && source.startsWith("\\N{", i)) {
                    const end = source.indexOf("}", i + 3);
                    if (end < 0) {
                        advance(source.length - i);
                        endString(frame);
                    }
                    advance(end + 1 - i);
                    flush();
                    continue;
                }
                advance(1);
                if (i < source.length && source[i] !== "{" && source[i] !== "}")
                    advance(source.codePointAt(i)! > 0xffff ? 2 : 1);
                continue;
            }
            if (c === "\n" && frame.quote.length === 1) {
                if (format)
                    syntax(
                        `${
                            frame.kind === "FSTRING" ? "f" : "t"
                        }-string: newlines are not allowed in format specifiers for single quoted ${
                            frame.kind === "FSTRING" ? "f" : "t"
                        }-strings`
                    );
                endString(frame);
            }
            advance(1);
        }
        if (format && frame.quote.length === 1)
            syntax(
                `${
                    frame.kind === "FSTRING" ? "f" : "t"
                }-string: newlines are not allowed in format specifiers for single quoted ${
                    frame.kind === "FSTRING" ? "f" : "t"
                }-strings`
            );
        endString(frame);
    }
    function punctuation(value: string, field = false, start = mark()) {
        advance(value.length);
        if ("([{".includes(value)) {
            if (brackets.length >= 200) syntax("too many nested parentheses", start);
            brackets.push({ char: value, mark: start, field });
        } else if (")]}".includes(value)) {
            const opening = brackets.pop();
            if (!extra) {
                if (!opening) syntax(`unmatched '${value}'`, start);
                if (frames.length && opening.field && value !== "}")
                    syntax(`${frames.at(-1)!.kind === "FSTRING" ? "f" : "t"}-string: unmatched '${value}'`, start);
                if (opening.char !== ({ ")": "(", "]": "[", "}": "{" } as Record<string, string>)[value])
                    syntax(
                        `closing parenthesis '${value}' does not match opening parenthesis '${opening.char}'${
                            opening.mark.row !== row ? " on line " + opening.mark.row : ""
                        }`,
                        start
                    );
            }
        }
        token(extra ? "OP" : exact[value] || "OP", start);
    }
    function numberToken(start = mark()) {
        const text = regex(number, source, i);
        if (!text) return false;
        advance(text.length);
        let kind = "decimal";
        if (/^0[xX]/.test(text)) kind = "hexadecimal";
        else if (/^0[oO]/.test(text)) kind = "octal";
        else if (/^0[bB]/.test(text)) kind = "binary";
        if (text === "0" && /[xob]/i.test(source[i] || " ")) {
            const base = source[i].toLowerCase();
            kind = base === "x" ? "hexadecimal" : base === "o" ? "octal" : "binary";
            advance(1);
            if (source[i] === "_") advance(1);
            if (/[0-9]/.test(source[i] || " ")) {
                const c = source[i];
                advance(1);
                error(`invalid digit '${c}' in ${kind} literal`, mark());
            }
            error(`invalid ${kind} literal`, mark());
        }
        if (source[i] === "_" && !/[.jJ]$/.test(text)) {
            advance(1);
            error(`invalid ${kind} literal`, mark());
        }
        if ((kind === "octal" || kind === "binary") && /[0-9]/.test(source[i] || " ")) {
            const c = source[i];
            advance(1);
            error(`invalid digit '${c}' in ${kind} literal`, mark());
        }
        if (
            kind === "decimal" &&
            !/[eEjJ]/.test(text) &&
            /[eE]/.test(source[i] || " ") &&
            /[+-]/.test(source[i + 1] || " ")
        ) {
            advance(2);
            error("invalid decimal literal", mark());
        }
        if (/[jJ]$/.test(text) && kind === "decimal") kind = "imaginary";
        if (!extra) {
            if (!/[eE]/.test(source[i] || " ") && /^0[0-9_]*[1-9][0-9_]*$/.test(text)) {
                const zeros = text.match(/^0[0_]*/)?.[0].length || 1;
                error(
                    "leading zeros in decimal integer literals are not permitted; use an 0o prefix for octal integers",
                    { ...start, col: start.col + 1 },
                    "SyntaxError",
                    start.col + zeros + 1
                );
            }
            if (/[_a-zA-Z0-9]/.test(source[i] || "") && !/^(?:and|or|not|if|else|for|in|is)\b/.test(source.slice(i)))
                error(`invalid ${kind} literal`, mark());
        }
        token("NUMBER", start);
        return true;
    }
    function expression(frame?: Frame) {
        const depth = brackets.length;
        while (i < source.length) {
            if (bol) indentation();
            if (i >= source.length) break;
            if (/[ \t\f]/.test(source[i])) {
                const p = regex(/[ \t\f]+/y, source, i)!;
                advance(p.length);
                continue;
            }
            if (source[i] === "#") {
                const start = mark();
                const p = regex(/#[^\r\n]*/y, source, i)!;
                advance(p.length);
                token("COMMENT", start);
                if (extra) commentNewline = blank;
                if (!extra) commentStart = start;
                continue;
            }
            if (source[i] === "\n" || source.startsWith("\r\n", i)) {
                newline();
                continue;
            }
            if (source[i] === "\\") {
                const start = mark();
                advance(1);
                if (source[i] === "\r") advance(1);
                if (i >= source.length)
                    error(
                        "unexpected EOF in multi-line statement",
                        { ...mark(), col: byteLength(source.slice(starts[bufferStartRow - 1])) + 1 },
                        "SyntaxError",
                        null,
                        null as any
                    );
                if (source[i] !== "\n")
                    lineError("unexpected character after line continuation character", "SyntaxError");
                advance(1);
                bol = false;
                if (i >= source.length)
                    error(
                        "unexpected EOF in multi-line statement",
                        { i, row: row - 1, col: start.col === 0 ? 0 : start.col + 2 },
                        "SyntaxError",
                        null,
                        null as any
                    );
                continue;
            }
            if (frame && brackets.length < depth && source[i] === "}")
                syntax(`${frame.kind === "FSTRING" ? "f" : "t"}-string: single '}' is not allowed`);
            if (frame && brackets.length === depth) {
                if (source[i] === "}") {
                    punctuation("}");
                    return;
                }
                if (source[i] === ":") {
                    punctuation(":");
                    textMode(frame, true);
                    return;
                }
            }
            const header = regex(opener, source, i);
            if (header && stringToken(header)) {
                statement = true;
                continue;
            }
            if (numberToken()) {
                statement = true;
                continue;
            }
            const id = regex(identifier, source, i);
            if (id) {
                const start = mark();
                advance(id.length);
                if (!extra && !validIdentifier.test(id)) {
                    let k = 0;
                    for (const c of id) {
                        if (!(identifierStart.test(c) || (k > 0 && identifierExtra.test(c)))) {
                            const code = c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0");
                            syntax(
                                nonprintable.test(c)
                                    ? `invalid non-printable character U+${code}`
                                    : `invalid character '${c}' (U+${code})`,
                                { ...start, col: start.col + k }
                            );
                        }
                        k++;
                    }
                }
                token("NAME", start);
                statement = true;
                continue;
            }
            if (source[i] === "\x00")
                error(
                    "source code cannot contain null bytes",
                    { ...mark(), col: 0 },
                    "SyntaxError",
                    0,
                    (lines[row - 1] || "").split("\x00")[0]
                );
            if (source[i] === "\r") {
                const start = !extra && commentStart ? commentStart : mark();
                commentStart = undefined;
                advance(1);
                if (i < source.length) {
                    const q = regex(/(?:"""|'''|"|')/y, source, i);
                    if (q && stringToken(q, start)) {
                        statement = true;
                        blank = false;
                        continue;
                    }
                    if (numberToken(start)) {
                        statement = true;
                        blank = false;
                        continue;
                    }
                    const c = source[i];
                    if (nonprintable.test(c))
                        syntax(
                            `invalid non-printable character U+${c
                                .codePointAt(0)!
                                .toString(16)
                                .toUpperCase()
                                .padStart(4, "0")}`
                        );
                    const op = regex(operator, source, i) || c;
                    punctuation(op, false, start);
                    statement = true;
                    blank = false;
                } else {
                    token(
                        statement ? "NEWLINE" : "NL",
                        start,
                        { ...mark(), col: col + (extra ? 1 : 0) },
                        statement ? source.slice(start.i) : "",
                        lines[row - 1]
                    );
                    lastLogicalLine = statement ? lines[row - 1] : "";
                    statement = false;
                    eofNewline = true;
                }
                continue;
            }
            const value = regex(operator, source, i);
            if (!value) {
                const c = source.codePointAt(i)!;
                syntax(`invalid non-printable character U+${c.toString(16).toUpperCase().padStart(4, "0")}`);
            }
            punctuation(value!);
            statement = true;
        }
        if (frame)
            error(
                "unexpected EOF in multi-line statement",
                {
                    i,
                    row: lines.length,
                    col: byteLength(source.slice(starts[frames[0].start.row - 1])) + (source.endsWith("\n") ? 0 : 1),
                },
                "SyntaxError",
                null,
                null as any
            );
    }
    checkLine();
    expression();
    if (brackets.length) {
        error(
            "unexpected EOF in multi-line statement",
            { i, row: lines.length, col: 0 },
            "SyntaxError",
            null,
            null as any
        );
    }
    if (lines.length && !eofNewline && !source.endsWith("\n")) {
        const start = !extra && commentStart ? commentStart : mark();
        token(
            statement ? "NEWLINE" : "NL",
            start,
            { ...mark(), col: col + (extra ? 1 : 0) },
            !extra && commentStart ? source.slice(start.i) : "",
            lines[row - 1]
        );
        lastLogicalLine = statement ? lines[row - 1] : "";
    }
    const eof = extra
        ? { i: source.length, row: lines.length + 1, col: 0 }
        : { i: source.length, row: lines.length, col: -1 };
    if (extra || lines.length) {
        while (indents.length > 1) {
            indents.pop();
            token("DEDENT", eof, eof, "", extra ? "" : lastLogicalLine);
        }
        token("ENDMARKER", eof, eof, "", extra ? "" : lastLogicalLine);
    }
    return output;
}
