// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: Python-2.0 AND MIT
// Pinned Parser/action_helpers.c: expression names and invalid-target traversal.
import type * as ast from "./ast.ts";
import type { Parser } from "./parser.ts";

export function expressionName(node: ast.expr): string {
    switch (node._type) {
        case "Attribute":
            return "attribute";
        case "Subscript":
            return "subscript";
        case "Starred":
            return "starred";
        case "Name":
            return "name";
        case "List":
            return "list";
        case "Tuple":
            return "tuple";
        case "Lambda":
            return "lambda";
        case "Call":
            return "function call";
        case "BoolOp":
        case "BinOp":
        case "UnaryOp":
            return "expression";
        case "GeneratorExp":
            return "generator expression";
        case "Yield":
        case "YieldFrom":
            return "yield expression";
        case "Await":
            return "await expression";
        case "ListComp":
            return "list comprehension";
        case "SetComp":
            return "set comprehension";
        case "DictComp":
            return "dict comprehension";
        case "Dict":
            return "dict literal";
        case "Set":
            return "set display";
        case "JoinedStr":
        case "FormattedValue":
            return "f-string expression";
        case "TemplateStr":
        case "Interpolation":
            return "t-string expression";
        case "Constant":
            switch (node.value.type) {
                case "none":
                    return "None";
                case "bool":
                    return node.value.value ? "True" : "False";
                case "ellipsis":
                    return "ellipsis";
                default:
                    return "literal";
            }
        case "Compare":
            return "comparison";
        case "IfExp":
            return "conditional expression";
        case "NamedExpr":
            return "named expression";
        default:
            throw new Error(`unexpected expression in assignment: ${node._type}`);
    }
}

type Target = "STAR_TARGETS" | "DEL_TARGETS" | "FOR_TARGETS";
function findInvalidTarget(node: ast.expr, kind: Target): ast.expr | null {
    switch (node._type) {
        case "List":
        case "Tuple":
            for (const child of node.elts) {
                const invalid = findInvalidTarget(child, kind);
                if (invalid !== null) return invalid;
            }
            return null;
        case "Starred":
            return kind === "DEL_TARGETS" ? node : findInvalidTarget(node.value, kind);
        case "Compare":
            // In an invalid for header, expression parsing can consume `a in b`.
            if (kind === "FOR_TARGETS") return node.ops[0]._type === "In" ? findInvalidTarget(node.left, kind) : null;
            return node;
        case "Name":
        case "Attribute":
        case "Subscript":
            return null;
        default:
            return node;
    }
}
export function invalidTarget(parser: Parser, kind: Target, node: ast.expr): null {
    const invalid = findInvalidTarget(node, kind);
    if (invalid !== null) {
        parser.raiseKnown(
            invalid,
            invalid,
            kind === "DEL_TARGETS" ? "cannot delete %s" : "cannot assign to %s",
            expressionName(invalid)
        );
    }
    return null;
}
