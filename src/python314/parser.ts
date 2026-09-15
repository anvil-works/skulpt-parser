// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT
import * as ast from "./ast.ts";
import type { Token, LexerOptions } from "./lexer/tokenizer.ts";
import { scan } from "./lexer/tokenizer.ts";
import { parseNumber } from "./parse_number.ts";

// All hard keywords, including statements outside the current expression subset.
const keywords = new Set(
    "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(
        " "
    )
);

type KeywordOrStarred = { isKeyword: true; element: ast.keyword } | { isKeyword: false; element: ast.Starred };
type CallArguments = { args: ast.expr[]; keywords: ast.keyword[] };

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

/** Runtime for the generated grammar subset, not the public frontend API. */
export class Parser {
    mark = 0;
    barryAsFlufl = false;
    private tokens: Token[] = [];
    private cache: Map<string, Memo>[] = [];
    private iterator: Generator<Token>;
    readonly filename: string;
    readonly source: string;
    readonly onWarning: LexerOptions["onWarning"];
    readonly stringWarnings = new Set<string>();
    constructor(source: string, options: Omit<LexerOptions, "extraTokens">, readonly mode: "eval" | "exec") {
        this.source = source.replace(/\r\n?/g, "\n");
        this.onWarning = options.onWarning;
        this.filename = options.filename ?? "<string>";
        // CPython parsing uses universal newlines; the standalone tokenizer does not.
        this.iterator = scan(this.source, { ...options, extraTokens: false });
    }
    cacheAt(mark: number): Map<string, Memo> {
        return this.cache[mark] ?? (this.cache[mark] = new Map());
    }
    peek(): Token {
        if (this.mark === this.tokens.length) {
            const next = this.iterator.next();
            if (next.done) return this.tokens[this.tokens.length - 1];
            this.tokens.push(next.value);
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
            end_offset: (token?.end[1] ?? 0) + 1,
            // File-input parser errors include the implicit final newline;
            // direct tokenizer errors preserve their separate source contract.
            text:
                this.mode === "exec" && token?.line && !token.line.endsWith("\n")
                    ? token.line + "\n"
                    : token?.line ?? "",
        });
    }
}
