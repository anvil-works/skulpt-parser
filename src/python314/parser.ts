// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: Python-2.0 AND MIT
// Diagnostic pass and error ranges follow pinned Parser/pegen{,_errors}.c.
import * as ast from "./ast.ts";
import type { Token, LexerOptions } from "./lexer/tokenizer.ts";
import { Scanner } from "./lexer/tokenizer.ts";
import { parseNumber } from "./parse_number.ts";
import type { ParseOptions } from "./parse_options.ts";

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
// Decorators allocate stable slots once when the generated class is initialized.
// Each parser still owns its cache rows; left-recursion seeds and pass reset are unchanged.
let nextMemoId = 0;

export function memoize(_target: Parser, _name: string, descriptor: PropertyDescriptor): void {
    const rule: Rule = descriptor.value;
    const memoId = nextMemoId++;
    descriptor.value = function (this: Parser): any {
        const start = this.mark;
        const cache = this.cacheAt(start);
        const hit = cache[memoId];
        if (hit) {
            this.mark = hit.end;
            return hit.value;
        }
        const value = rule.call(this);
        cache[memoId] = { value, end: this.mark };
        return value;
    };
}

export function memoizeLeftRec(_target: Parser, _name: string, descriptor: PropertyDescriptor): void {
    const rule: Rule = descriptor.value;
    const memoId = nextMemoId++;
    descriptor.value = function (this: Parser): any {
        const start = this.mark;
        const cache = this.cacheAt(start);
        const hit = cache[memoId];
        if (hit) {
            this.mark = hit.end;
            return hit.value;
        }
        const seed: Memo = { value: null, end: start };
        cache[memoId] = seed;
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
    readonly python2Compat: boolean;
    readonly printFunction: boolean;
    readonly legacyAsyncNames: boolean;
    callInvalidRules = false;
    private tokens: Token[] = [];
    private cache: (Memo | undefined)[][] = [];
    private iterator: Generator<Token>;
    private scanner: Scanner;
    private lexicalFailure = false;
    readonly filename: string;
    readonly source: string;
    readonly unicodeName: ParseOptions["unicodeName"];
    readonly onWarning: LexerOptions["onWarning"];
    readonly stringWarnings = new Set<string>();
    constructor(source: string, options: ParseOptions, readonly mode: "eval" | "exec") {
        this.python2Compat = options.python2Compat ?? false;
        this.printFunction = options.printFunction ?? false;
        this.legacyAsyncNames = options.legacyAsyncNames ?? this.python2Compat;
        this.source = source.replace(/\r\n?/g, "\n");
        this.onWarning = options.onWarning;
        this.unicodeName = options.unicodeName;
        this.filename = options.filename ?? "<string>";
        // CPython parsing uses universal newlines; the standalone tokenizer does not.
        this.scanner = new Scanner(this.source, { ...options, extraTokens: false });
        this.iterator = this.scanner.scan();
    }
    parse<T>(rule: () => T | null): T {
        let result: T | null;
        try {
            result = rule();
        } catch (error) {
            return this.fail(error);
        }
        if (result !== null) return result;
        // Match pegen.c: retain tokens/flags, discard first-pass memo results.
        const firstFailure = this.tokens[this.tokens.length - 1];
        this.mark = 0;
        this.cache = [];
        this.callInvalidRules = true;
        try {
            rule();
        } catch (error) {
            return this.fail(error);
        }
        return this.fail(this.error("invalid syntax", firstFailure));
    }
    private fail(error: unknown): never {
        if (
            !this.lexicalFailure &&
            !this.scanner.done &&
            error instanceof Error &&
            ["SyntaxError", "IndentationError", "TabError"].includes(error.name)
        ) {
            const errorLine = this.tokens[this.tokens.length - 1]?.start[0] ?? 0;
            try {
                // CPython scans the remainder directly, without filling parser tokens.
                while (!this.iterator.next().done) {}
            } catch (lexicalError) {
                const kind = this.scanner.failureKind;
                const opening = this.scanner.parens[this.scanner.parens.length - 1];
                // Status-only tokenizer failures do not replace a parser error,
                // except an unclosed delimiter from an earlier line. Raised lexer
                // exceptions do, unless still inside an interpolated string.
                if (this.scanner.modes.length === 1) {
                    if (kind === null) this.raiseLexerError(lexicalError);
                    if (opening && opening.line < errorLine)
                        this.raiseLocation(
                            opening.line,
                            opening.col,
                            opening.line,
                            -1,
                            `'${String.fromCharCode(opening.c)}' was never closed`
                        );
                }
            }
        }
        throw error;
    }
    private raiseLexerError(error: unknown): never {
        if (this.scanner.failureKind === "EOF") {
            const opening = this.scanner.parens[this.scanner.parens.length - 1];
            if (opening)
                this.raiseLocation(
                    opening.line,
                    opening.col,
                    opening.line,
                    -1,
                    `'${String.fromCharCode(opening.c)}' was never closed`
                );
        }
        if (this.scanner.failureKind === "DEDENT" && error instanceof Error) {
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
    cacheAt(mark: number): (Memo | undefined)[] {
        return this.cache[mark] ?? (this.cache[mark] = []);
    }
    peek(): Token {
        if (this.mark === this.tokens.length) {
            let next: IteratorResult<Token>;
            try {
                next = this.iterator.next();
            } catch (error) {
                this.lexicalFailure = true;
                this.raiseLexerError(error);
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
        if (this.legacyAsyncNames && (text === "async" || text === "await")) return null;
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
        if (token?.type !== "NAME") return null;
        if (
            keywords.has(token.string) &&
            !(this.legacyAsyncNames && (token.string === "async" || token.string === "await"))
        )
            return null;
        if (this.python2Compat && !this.printFunction && token.string === "print") return null;
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
        if (this.python2Compat) return token;
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
                parseNumber(token.string, this.python2Compat),
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
            byte < 0
                ? byte + 1
                : [...new TextDecoder().decode(new TextEncoder().encode(line).subarray(0, byte))].length + 1;
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
