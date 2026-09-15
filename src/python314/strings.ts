// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: Python-2.0 AND MIT
// Port of CPython 3.14.3 Parser/string_parser.c and string actions in
// Parser/action_helpers.c. See licenses/CPython.txt and tools/upstream/cpython.json.
import * as ast from "./ast.ts";
import type { Token } from "./lexer/tokenizer.ts";
import type { Parser } from "./parser.ts";
import { unicodeName } from "./string_names.ts";

type Span = [number, number, number, number];
type Metadata<T> = { result: T; token: Token };
const simple: Record<string, string> = {
    "\\": "\\",
    "'": "'",
    '"': '"',
    a: "\x07",
    b: "\b",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "\t",
    v: "\v",
};
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { ignoreBOM: true });
// Allocate this index only for debug fields or t-strings, once per parse.
const sourceIndexes = new WeakMap<Parser, { bytes: Uint8Array; lines: number[] }>();
const location = (node: ast.expr): Span => [node.lineno, node.col_offset, node.end_lineno!, node.end_col_offset!];
const tokenLocation = (token: Token): Span => [token.start[0], token.startByte, token.end[0], token.endByte];
const textValue = (node: ast.expr): string =>
    (node as ast.Constant).value.type === "str"
        ? ((node as ast.Constant).value as { type: "str"; value: string }).value
        : "";

function decode(
    p: Parser,
    body: string,
    raw: boolean,
    bytes: boolean,
    token: Token,
    identity = `${token.start[0]}:${token.startByte}`
): string {
    if (bytes && /[^\x00-\x7f]/.test(body)) throw p.error("bytes can only contain ASCII literal characters", token);
    if (raw || !body.includes("\\")) return body;
    function decodeError(reason: string, start: number, end: number): never {
        // CPython first expands literal non-ASCII text into \U escapes before
        // passing it to the unicodeescape codec. Error byte positions refer to
        // that intermediate buffer, not to UTF-8 or JavaScript indices.
        const expandedLength = (text: string): number => {
            let length = 0;
            for (let i = 0; i < text.length; i++) {
                if (text[i] === "\\" && i + 1 < text.length && text.charCodeAt(i + 1) >= 128) length += 6;
                else if (text.codePointAt(i)! >= 128) {
                    length += 10;
                    if (text.codePointAt(i)! > 0xffff) i++;
                } else length++;
            }
            return length;
        };
        const first = expandedLength(body.slice(0, start));
        const last = expandedLength(body.slice(0, end)) - 1;
        const position = first === last ? `position ${first}` : `position ${first}-${last}`;
        throw p.error(`(unicode error) 'unicodeescape' codec can't decode bytes in ${position}: ${reason}`, token);
    }
    let result = "",
        invalid: { escape: string; at: number; octal: boolean } | undefined;
    for (let i = 0; i < body.length; i++) {
        if (body[i] !== "\\") {
            result += body[i];
            continue;
        }
        const start = i;
        const ch = body[++i];
        // CPython preserves a trailing slash in an interpolation middle, where
        // the next token may be an opening brace; the lexer already warned.
        if (ch === undefined) {
            result += "\\";
            break;
        }
        if (ch === "\n") continue;

        if (Object.prototype.hasOwnProperty.call(simple, ch)) {
            result += simple[ch];
            continue;
        }
        if (/[0-7]/.test(ch)) {
            let oct = ch;
            while (oct.length < 3 && /[0-7]/.test(body[i + 1] ?? "")) oct += body[++i];
            const value = parseInt(oct, 8);
            if (value > 255 && !invalid) invalid = { escape: oct, at: start, octal: true };
            result += String.fromCodePoint(bytes ? value & 255 : value);
            continue;
        }
        if (ch === "x" || (!bytes && (ch === "u" || ch === "U"))) {
            const count = ch === "x" ? 2 : ch === "u" ? 4 : 8;
            const digits = body.slice(i + 1, i + count + 1);
            if (digits.length !== count || !/^[0-9a-fA-F]+$/.test(digits)) {
                if (bytes) throw p.error(`(value error) invalid \\x escape at position ${start}`, token);
                let end = i + 1;
                while (end < body.length && /[0-9a-fA-F]/.test(body[end]) && end < i + count + 1) end++;
                decodeError(`truncated \\${ch}${"X".repeat(count)} escape`, start, end);
            }
            const cp = parseInt(digits, 16);
            if (cp > 0x10ffff) decodeError("illegal Unicode character", start, i + count + 1);
            result += String.fromCodePoint(cp);
            i += count;
            continue;
        }
        if (!bytes && ch === "N") {
            const end = body.indexOf("}", i + 2);
            if (body[i + 1] !== "{" || end < 0 || end === i + 2)
                decodeError(
                    "malformed \\N character escape",
                    start,
                    body[i + 1] !== "{" ? i + 1 : end < 0 ? body.length : i + 2
                );
            const cp = unicodeName(body.slice(i + 2, end));
            if (cp === undefined) decodeError("unknown Unicode character name", start, end + 1);
            result += String.fromCodePoint(cp);
            i = end;
            continue;
        }
        // A backslash before a non-ASCII character is preserved without warning.
        if (ch.charCodeAt(0) < 128 && !invalid) invalid = { escape: ch, at: start, octal: false };
        result += "\\" + ch;
    }
    if (invalid && !(token.type !== "STRING" && ["{", "}"].includes(invalid.escape))) {
        const key = `${identity}:${token.type}`;
        if (!p.stringWarnings.has(key)) {
            p.stringWarnings.add(key);
            const escape = "\\" + invalid.escape;
            p.onWarning?.({
                name: "SyntaxWarning",
                filename: p.filename,
                lineno: token.start[0] + body.slice(0, invalid.at).split("\n").length - 1,
                message: `"${escape}" is an invalid ${
                    invalid.octal ? "octal escape" : "escape"
                } sequence. Such sequences will not work in the future. Did you mean "\\${escape}"? A raw string is also an option.`,
            });
        }
    }
    return result;
}

export function literal(p: Parser, token: Token): ast.Constant {
    const start = token.string.search(/['"]/);
    const prefix = token.string.slice(0, start);
    const quote = token.string[start];
    const size = token.string.slice(start, start + 3) === quote.repeat(3) ? 3 : 1;
    const bytes = /b/i.test(prefix);
    const value = decode(p, token.string.slice(start + size, -size), /r/i.test(prefix), bytes, token);
    return ast.Constant(
        bytes ? { type: "bytes", value: Uint8Array.from(value, (ch) => ch.charCodeAt(0)) } : { type: "str", value },
        prefix.startsWith("u") ? "u" : null,
        ...tokenLocation(token)
    );
}
export function constant(_p: Parser, token: Token): ast.Constant {
    return ast.Constant({ type: "str", value: token.string }, null, ...tokenLocation(token));
}
export function decodedConstant(p: Parser, token: Token): ast.Constant {
    return ast.Constant(
        { type: "str", value: decode(p, token.string, !!token.raw, false, token) },
        null,
        ...tokenLocation(token)
    );
}
function parts(p: Parser, start: Token, values: ast.expr[], end: Token): ast.expr[] {
    const result: ast.expr[] = [];
    for (const value of values) {
        if (value._type === "JoinedStr") result.push(...value.values);
        else if (value._type === "Constant") {
            const raw = textValue(value);
            const text = decode(
                p,
                raw === "{{" || raw === "}}" ? raw[0] : raw,
                /r/i.test(start.string),
                false,
                end,
                location(value).join(":")
            );
            if (text) result.push(ast.Constant({ type: "str", value: text }, null, ...location(value)));
        } else result.push(value);
    }
    return result;
}
export function joined(p: Parser, start: Token, values: ast.expr[], end: Token): ast.JoinedStr {
    return ast.JoinedStr(parts(p, start, values, end), start.start[0], start.startByte, end.end[0], end.endByte);
}
export function template(p: Parser, start: Token, values: ast.expr[], end: Token): ast.TemplateStr {
    return ast.TemplateStr(parts(p, start, values, end), start.start[0], start.startByte, end.end[0], end.endByte);
}
export function conversion(p: Parser, token: Token, name: ast.Name): Metadata<ast.Name> {
    if (token.end[0] !== name.lineno || token.endByte !== name.col_offset)
        throw p.error("conversion type must come right after the exclamation mark", token);
    if (!["s", "r", "a"].includes(name.id))
        throw p.error("invalid conversion character: expected 's', 'r', or 'a'", token);
    return { result: name, token };
}
export function formatSpec(p: Parser, token: Token, values: ast.expr[], ...span: Span): Metadata<ast.expr> {
    values = values.filter((value) => value._type !== "Constant" || textValue(value) !== "");
    const result =
        values.length <= 1 && (values.length === 0 || values[0]._type === "Constant")
            ? ast.JoinedStr(values, ...span)
            : concatenate(p, values, ...span);
    return { result, token };
}

/** Match lexer.c's expression metadata, including its removal of comments. */
function expressionText(p: Parser, startLine: number, startByte: number, end: Token): string {
    let source = sourceIndexes.get(p);
    if (!source) {
        const bytes = encoder.encode(p.source),
            lines = [0];
        for (let i = 0; i < bytes.length; i++) if (bytes[i] === 10) lines.push(i + 1);
        source = { bytes, lines };
        sourceIndexes.set(p, source);
    }
    const text = decoder.decode(
        source.bytes.subarray(source.lines[startLine - 1] + startByte, source.lines[end.start[0] - 1] + end.startByte)
    );
    let quote = "",
        hasComment = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === "\\") {
            i++;
            continue;
        }
        if (ch === "'" || ch === '"') {
            if (!quote) quote = ch;
            else if (quote === ch) quote = "";
        }
        if (ch === "#" && !quote) {
            hasComment = true;
            break;
        }
    }
    if (!hasComment) return text;
    quote = "";
    let result = "";
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === "'" || ch === '"') {
            if (!quote) quote = ch;
            else if (quote === ch) quote = "";
        } else if (ch === "#" && !quote) {
            while (i < text.length && text[i] !== "\n") i++;
            if (i < text.length) result += "\n";
            continue;
        }
        result += ch;
    }
    return result;
}
function replacement(
    p: Parser,
    isTemplate: boolean,
    expression: ast.expr,
    debug: Token | null,
    conv: Metadata<ast.Name> | null,
    format: Metadata<ast.expr> | null,
    close: Token,
    span: Span
): ast.expr {
    const conversionValue = conv ? conv.result.id.charCodeAt(0) : debug && !format ? 114 : -1;
    const stop = conv?.token ?? format?.token ?? close;
    const text = isTemplate || debug ? expressionText(p, span[0], span[1] + 1, stop) : "";
    // Python whitespace includes U+001C..001F and excludes JavaScript's BOM.
    const stripped = text.replace(
        /[=\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/,
        ""
    );
    const value = isTemplate
        ? ast.Interpolation(
              expression,
              { type: "str", value: stripped },
              conversionValue,
              format?.result ?? null,
              ...span
          )
        : ast.FormattedValue(expression, conversionValue, format?.result ?? null, ...span);
    if (!debug) return value;
    const endLine = conv ? conv.result.lineno : format ? format.result.lineno : span[2];
    const endByte = conv ? conv.result.col_offset : format ? format.result.col_offset + 1 : span[3];
    const constant = ast.Constant({ type: "str", value: text }, null, span[0], span[1] + 1, endLine, endByte - 1);
    return ast.JoinedStr([constant, value], span[0], span[1], endLine, endByte);
}
export function formatted(
    p: Parser,
    expression: ast.expr,
    debug: Token | null,
    conv: Metadata<ast.Name> | null,
    format: Metadata<ast.expr> | null,
    close: Token,
    ...span: Span
): ast.expr {
    return replacement(p, false, expression, debug, conv, format, close, span);
}
export function interpolation(
    p: Parser,
    expression: ast.expr,
    debug: Token | null,
    conv: Metadata<ast.Name> | null,
    format: Metadata<ast.expr> | null,
    close: Token,
    ...span: Span
): ast.expr {
    return replacement(p, true, expression, debug, conv, format, close, span);
}
function fold(values: ast.expr[]): ast.expr[] {
    const flat = values.flatMap((value) =>
        value._type === "JoinedStr" || value._type === "TemplateStr" ? value.values : [value]
    );
    const result: ast.expr[] = [];
    for (let i = 0; i < flat.length; i++) {
        let value = flat[i];
        if (value._type === "Constant") {
            let text = textValue(value),
                last = value;
            while (i + 1 < flat.length && flat[i + 1]._type === "Constant") {
                last = flat[++i] as ast.Constant;
                text += textValue(last);
            }
            if (!text) continue;
            value = ast.Constant(
                { type: "str", value: text },
                value.kind,
                value.lineno,
                value.col_offset,
                last.end_lineno,
                last.end_col_offset
            );
        }
        result.push(value);
    }
    return result;
}
export function concatenate(p: Parser, values: ast.expr[], ...span: Span): ast.expr {
    const hasBytes = values.some((value) => value._type === "Constant" && value.value.type === "bytes");
    if (hasBytes) {
        if (values.some((value) => value._type !== "Constant" || value.value.type !== "bytes"))
            throw p.error("cannot mix bytes and nonbytes literals");
        if (values.length === 1) return values[0];
        const arrays = values.map(
            (value) => ((value as ast.Constant).value as { type: "bytes"; value: Uint8Array }).value
        );
        const bytes = new Uint8Array(arrays.reduce((sum, array) => sum + array.length, 0));
        let at = 0;
        for (const array of arrays) {
            bytes.set(array, at);
            at += array.length;
        }
        return ast.Constant({ type: "bytes", value: bytes }, null, ...span);
    }
    if (values.every((value) => value._type === "Constant")) {
        if (values.length === 1) return values[0];
        return ast.Constant(
            { type: "str", value: values.map(textValue).join("") },
            (values[0] as ast.Constant).kind,
            ...span
        );
    }
    return ast.JoinedStr(fold(values), ...span);
}
export function concatenateTemplates(_p: Parser, values: ast.expr[], ...span: Span): ast.TemplateStr {
    return ast.TemplateStr(fold(values), ...span);
}
