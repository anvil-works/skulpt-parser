// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT
import * as ast from "./ast.ts";
import type { Parser } from "./parser.ts";
import type { CompatibilityStatement, LegacyExceptHandler, LegacyRaise, Print } from "./python2_ast.ts";

type Grammar = Parser & {
    expression(): ast.expr | null;
    block(): CompatibilityStatement[] | null;
};
function location(p: Parser, start: number) {
    const [lineno, col_offset, end_lineno, end_col_offset] = p.span(start);
    return { lineno, col_offset, end_lineno, end_col_offset };
}
function expression(p: Grammar): ast.expr {
    const result = p.expression();
    if (result === null) throw p.error("expected expression", p.peek());
    return result;
}
function endStatement(p: Parser): boolean {
    return ["NEWLINE", "ENDMARKER"].includes(p.peek().type) || p.peek().string === ";";
}
export function printStatement(p: Grammar): Print | null {
    if (p.printFunction || p.peek().string !== "print") return null;
    const start = p.mark;
    p.literal("print");
    let dest: ast.expr | null = null;
    const values: ast.expr[] = [];
    let nl = true;
    if (p.literal(">>")) {
        dest = expression(p);
        if (!p.literal(",")) {
            if (!endStatement(p)) throw p.error("expected ',' after print destination", p.peek());
            return { _type: "Print", dest, values, nl, ...location(p, start) };
        }
        values.push(expression(p));
    } else if (!endStatement(p)) {
        values.push(expression(p));
    }
    while (p.literal(",")) {
        if (endStatement(p)) {
            nl = false;
            break;
        }
        values.push(expression(p));
    }
    if (!endStatement(p)) throw p.error("expected ',' between print values", p.peek());
    return { _type: "Print", dest, values, nl, ...location(p, start) };
}
export function raiseStatement(p: Grammar): LegacyRaise | null {
    const start = p.mark;
    if (!p.literal("raise")) return null;
    const exc = p.expression();
    if (exc === null || !p.literal(",")) {
        p.mark = start;
        return null;
    }
    const inst = expression(p);
    const tback = p.literal(",") ? expression(p) : null;
    if (!endStatement(p)) throw p.error("expected end of raise statement", p.peek());
    return { _type: "LegacyRaise", exc, inst, tback, ...location(p, start) };
}
function assignmentTarget(node: ast.expr): boolean {
    if (["Name", "Attribute", "Subscript"].includes(node._type)) return true;
    return (node._type === "Tuple" || node._type === "List") && node.elts.every(assignmentTarget);
}
export function exceptBlock(p: Grammar): LegacyExceptHandler | ast.ExceptHandler | null {
    const start = p.mark;
    if (!p.literal("except")) return null;
    const type = p.expression();
    if (type === null) {
        p.mark = start;
        return null;
    }
    const comma = p.literal(",");
    if (!comma && !p.literal("as")) {
        p.mark = start;
        return null;
    }
    const target = expression(p);
    if (!assignmentTarget(target)) throw p.error("invalid exception assignment target", p.peek());
    p.forcedLiteral(":");
    const body = p.block();
    if (body === null) throw p.error("expected exception handler body", p.peek());
    // Ordinary 'as name' retains the CPython node and identifier representation.
    if (!comma && target._type === "Name")
        return ast.ExceptHandler(type, target.id, body as ast.stmt[], ...p.span(start));
    return {
        _type: "LegacyExceptHandler",
        type,
        target: p.setContext(target, ast.Store()),
        body,
        ...location(p, start),
    };
}
