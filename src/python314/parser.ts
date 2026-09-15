// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: Python-2.0 AND MIT
// Diagnostic pass and error ranges follow pinned Parser/pegen{,_errors}.c.
import * as ast from "./ast.ts";
import type { Token, LexerOptions } from "./lexer/tokenizer.ts";
import { Scanner } from "./lexer/tokenizer.ts";
import { parseNumber } from "./parse_number.ts";

// All hard keywords; contextual soft keywords remain grammar decisions.
const keywords = new Set(
    "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(
        " "
    )
);

type KeywordOrStarred = { isKeyword: true; element: ast.keyword } | { isKeyword: false; element: ast.Starred };
type CallArguments = { args: ast.expr[]; keywords: ast.keyword[] };

type Located = { lineno: number; col_offset: number; end_lineno: number | null; end_col_offset: number | null };

type Memo = { value: any; end: number };
type Rule = (this: Parser) => any;

export function memoize(_target: Parser, name: string, descriptor: PropertyDescriptor): void {
    const rule: Rule = descriptor.value;
    descriptor.value = function (this: Parser): any {
        const start = this.mark;
        const cache = this.cacheAt(start);
        const hit = cache.get(name);
        if (hit) {
            this.mark = hit.end;
            return hit.value;
        }
        const value = rule.call(this);
        cache.set(name, { value, end: this.mark });
        return value;
    };
}

export function memoizeLeftRec(_target: Parser, name: string, descriptor: PropertyDescriptor): void {
    const rule: Rule = descriptor.value;
    descriptor.value = function (this: Parser): any {
        const start = this.mark;
        const cache = this.cacheAt(start);
        const hit = cache.get(name);
        if (hit) {
            this.mark = hit.end;
            return hit.value;
        }
        const seed: Memo = { value: null, end: start };
        cache.set(name, seed);
        for (;;) {
            this.mark = start;
            const value = rule.call(this);
            if (value === null || this.mark <= seed.end) break;
            seed.value = value;
            seed.end = this.mark;
        }
        this.mark = seed.end;
        return seed.value;
    };
}

/** Runtime for the internal generated Python 3.14 grammar. */
export class Parser {
    mark = 0;
    barryAsFlufl = false;
    callInvalidRules = false;
    private tokens: Token[] = [];
    private cache: Map<string, Memo>[] = [];
    private iterator: Generator<Token>;
    private scanner: Scanner;
    readonly filename: string;
    readonly source: string;
    readonly onWarning: LexerOptions["onWarning"];
    readonly stringWarnings = new Set<string>();
    constructor(source: string, options: Omit<LexerOptions, "extraTokens">, readonly mode: "eval" | "exec") {
        this.source = source.replace(/\r\n?/g, "\n");
        this.onWarning = options.onWarning;
        this.filename = options.filename ?? "<string>";
        // CPython parsing uses universal newlines; the standalone tokenizer does not.
        this.scanner = new Scanner(this.source, { ...options, extraTokens: false });
        this.iterator = this.scanner.scan();
    }
    parse<T>(rule: () => T | null): T {
        const result = rule();
        if (result !== null) return result;
        // Match pegen.c: retain tokens/flags, discard first-pass memo results.
        const firstFailure = this.tokens[this.tokens.length - 1];
        this.mark = 0;
        this.cache = [];
        this.callInvalidRules = true;
        rule();
        throw this.error("invalid syntax", firstFailure);
    }
    cacheAt(mark: number): Map<string, Memo> {
        return this.cache[mark] ?? (this.cache[mark] = new Map());
    }
    peek(): Token {
        if (this.mark === this.tokens.length) {
            let next: IteratorResult<Token>;
            try {
                next = this.iterator.next();
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.name === "IndentationError" &&
                    error.message === "unindent does not match any outer indentation level"
                ) {
                    const line = this.scanner.lineno;
                    const lines = this.source.split("\n");
                    Object.assign(error, {
                        end_lineno: line,
                        end_offset: -1,
                        text: (lines[line - 1] ?? "") + (this.mode === "exec" || line < lines.length ? "\n" : ""),
                    });
                }
                throw error;
            }
            if (next.done) return this.tokens[this.tokens.length - 1];
            const token = next.value;
            // tokenize synthesizes positioned NEWLINEs. CPython's eval parser
            // leaves the implicit final newline unpositioned instead.
            if (this.mode === "eval" && token.type === "NEWLINE" && this.scanner.implicit) {
                token.start[1] = token.end[1] = token.startByte = token.endByte = -1;
            }
            this.tokens.push(token);
        }
        return this.tokens[this.mark];
    }
    expect(type: string): Token | null {
        const token = this.peek();
        if (token?.type !== type) return null;
        this.mark++;
        return token;
    }
    literal(text: string): Token | null {
        const token = this.peek();
        if (token?.string !== text || token.type.endsWith("_MIDDLE")) return null;
        this.mark++;
        return token;
    }
    forcedLiteral(text: string): Token {
        const token = this.literal(text);
        if (token === null) throw this.error(`expected '${text}'`, this.peek());
        return token;
    }
    softKeyword(): Token | null {
        const token = this.peek();
        if (token.type !== "NAME" || !["match", "case", "type", "_"].includes(token.string)) return null;
        this.mark++;
        return token;
    }
    tokenLevel(): number {
        // Reconstruct only for failed-input suggestions; do not add per-token storage.
        let level = 0;
        for (let i = 0; i < this.mark; i++) {
            const type = this.tokens[i].type;
            if (["LPAR", "LSQB", "LBRACE"].includes(type)) level++;
            else if (["RPAR", "RSQB", "RBRACE"].includes(type)) level--;
        }
        return level;
    }
    name(): ast.Name | null {
        const token = this.peek();
        if (token?.type !== "NAME" || keywords.has(token.string)) return null;
        this.mark++;
        return ast.Name(
            token.string.normalize("NFKC"),
            ast.Load(),
            token.start[0],
            token.startByte,
            token.end[0],
            token.endByte
        );
    }
    checkNotEqual(token: Token): Token | null {
        if (this.barryAsFlufl && token.string !== "<>") {
            throw this.error("with Barry as BDFL, use '<>' instead of '!='", token);
        }
        return this.barryAsFlufl || token.string === "!=" ? token : null;
    }
    interpolationPrefix(): "f" | "t" {
        return this.scanner.mode.stringKind === "TSTRING" ? "t" : "f";
    }
    ensurePatternNumber(node: ast.Constant, imaginary: boolean): ast.Constant {
        if ((node.value.type === "complex") !== imaginary) {
            throw this.error(
                `${imaginary ? "imaginary" : "real"} number required in complex literal`,
                this.tokens[this.mark - 1]
            );
        }
        return node;
    }
    typeComment(token: Token | null): null {
        // The internal API currently matches ast.parse(type_comments=False).
        if (token !== null) throw this.error("type comment parsing is not enabled", token);
        return null;
    }
    number(): ast.Constant | null {
        const token = this.expect("NUMBER");
        if (!token) return null;
        try {
            return ast.Constant(
                parseNumber(token.string),
                null,
                token.start[0],
                token.startByte,
                token.end[0],
                token.endByte
            );
        } catch (error) {
            if (!(error instanceof SyntaxError)) throw error;
            // CPython reports conversion failures without a column range.
            throw Object.assign(this.error(error.message, token), { offset: 0, end_offset: 0 });
        }
    }
    span(start: number): [number, number, number, number] {
        let end = this.mark - 1;
        while (["NEWLINE", "INDENT", "DEDENT", "ENDMARKER"].includes(this.tokens[end].type)) end--;
        return [
            this.tokens[start].start[0],
            this.tokens[start].startByte,
            this.tokens[end].end[0],
            this.tokens[end].endByte,
        ];
    }
    lookahead(rule: () => any, positive: boolean): boolean {
        const start = this.mark;
        const result = rule();
        this.mark = start;
        return (result !== null) === positive;
    }
    setContext(node: ast.expr, context: ast.expr_context): ast.expr {
        // Copy instead of mutating nodes that may be reused after PEG backtracking.
        switch (node._type) {
            case "Name":
            case "Attribute":
            case "Subscript":
                return { ...node, ctx: context };
            case "Tuple":
            case "List":
                return { ...node, elts: node.elts.map((element) => this.setContext(element, context)), ctx: context };
            case "Starred":
                return { ...node, value: this.setContext(node.value, context), ctx: context };
            default:
                return node;
        }
    }
    collectCallArgs(positional: ast.expr[], rest: KeywordOrStarred[] | null): CallArguments {
        if (rest === null) return { args: positional, keywords: [] };
        const args = positional.slice();
        const keywords: ast.keyword[] = [];
        for (const item of rest) {
            if (item.isKeyword === true) keywords.push(item.element);
            else args.push(item.element);
        }
        return { args, keywords };
    }
    diagnosticLine(node: Token | Located): number {
        return "start" in node ? node.start[0] : node.lineno!;
    }
    raiseDiagnostic(indentation: boolean, message: string, ...values: (string | number)[]): never {
        return this.raiseToken(this.tokens[this.tokens.length - 1], indentation, message, ...values);
    }
    raiseOnNext(message: string, ...values: (string | number)[]): never {
        return this.raiseToken(this.peek(), false, message, ...values);
    }
    private raiseToken(token: Token, indentation: boolean, message: string, ...values: (string | number)[]): never {
        let i = 0;
        message = message.replace(/%[dsU]/g, () => String(values[i++]));
        const error = this.error(message, token);
        if (token?.start[1] === -1)
            Object.assign(error, {
                offset: this.scanner.diagnosticColumn() - (this.mode === "eval" && this.scanner.implicit ? 1 : 0),
                end_offset: -1,
                text:
                    (this.source.split("\n")[token.start[0] - 1] ?? "") +
                    (this.mode === "exec" || !this.scanner.implicit ? "\n" : ""),
            });
        if (indentation) error.name = "IndentationError";
        throw error;
    }
    raiseLocation(
        lineno: number,
        col_offset: number,
        end_lineno: number,
        end_col_offset: number,
        message: string,
        ...values: (string | number)[]
    ): never {
        const span = { lineno, col_offset, end_lineno, end_col_offset };
        return this.raiseKnown(span, span, message, ...values);
    }
    raiseStartingFrom(start: Located | Token, message: string, ...values: (string | number)[]): never {
        const [endLine, endByte] = this.scanner.diagnosticPosition();
        const [line, byte] = "start" in start ? [start.start[0], start.startByte] : [start.lineno, start.col_offset];
        return this.raiseLocation(line, byte, endLine, endByte - 1, message, ...values);
    }
    raiseKnown(start: Located | Token, end: Located | Token, message: string, ...values: (string | number)[]): never {
        let i = 0;
        message = message.replace(/%[dsU]/g, () => String(values[i++]));
        const a = "start" in start ? [start.start[0], start.startByte] : [start.lineno!, start.col_offset!];
        const b = "end" in end ? [end.end[0], end.endByte] : [end.end_lineno!, end.end_col_offset!];
        const lines = this.source.split("\n");
        const line = lines[a[0] - 1] ?? "";
        // CPython converts both columns against the starting line, even for
        // multiline ranges. Preserve that behavior rather than using the end line.
        const column = (byte: number) =>
            [...new TextDecoder().decode(new TextEncoder().encode(line).subarray(0, byte))].length + 1;
        throw Object.assign(new SyntaxError(message), {
            filename: this.filename,
            lineno: a[0],
            offset: column(a[1]),
            end_lineno: b[0],
            end_offset: column(b[1]),
            text: line + (this.scanner.lineno <= a[0] && (this.mode === "exec" || a[0] < lines.length) ? "\n" : ""),
        });
    }
    error(message: string, token = this.tokens[this.tokens.length - 1]): SyntaxError {
        // pegen_errors.c classifies an unexpected INDENT before its generic
        // syntax-error fallback. Non-extra tokenize positions omit that span.
        if (message === "invalid syntax" && token?.type === "INDENT") {
            const line = this.source.split("\n")[token.start[0] - 1];
            return Object.assign(this.error("unexpected indent", token), {
                name: "IndentationError",
                offset: /^[ \t\f]*/.exec(line)![0].length,
                end_offset: -1,
                text: line + "\n",
            });
        }
        return Object.assign(new SyntaxError(message), {
            filename: this.filename,
            lineno: token?.start[0] ?? 1,
            offset: (token?.start[1] ?? 0) + 1,
            end_lineno: token?.end[0] ?? 1,
            end_offset:
                token?.type === "NEWLINE" && token.start[1] >= 0 ? token.start[1] + 2 : (token?.end[1] ?? 0) + 1,
            // File-input parser errors include the implicit final newline;
            // direct tokenizer errors preserve their separate source contract.
            text:
                this.mode === "exec" && token?.line && !token.line.endsWith("\n")
                    ? token.line + "\n"
                    : token?.line ?? "",
        });
    }
}
