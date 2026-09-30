// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: MIT

import type * as ast from "./ast.ts";
import type { ScalarConstant } from "./constants.ts";

const maxIntBits = 128;
const maxSequenceSize = 4096;
const maxTupleItems = 256;
const surrogatePair = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;

type Node = ast.AST;
type Parent = Record<string, unknown> | unknown[];
type Frame = { node: Node; parent: Parent; key: string | number; visited: boolean };

/** Fold Python 3 literal expressions in place. Parsing itself never invokes this pass.
 * Module/expression roots retain their identity and type. Replacements retain the
 * complete expression span; statement suites, scopes and control flow stay intact.
 */
export function optimizeAST<T extends ast.mod>(tree: T): T {
    const root = { tree };
    const pending: Frame[] = [{ node: tree, parent: root, key: "tree", visited: false }];
    const docstringPositions = new WeakSet<Node>();
    while (pending.length) {
        const frame = pending.pop()!;
        const { node } = frame;
        if (frame.visited) {
            const replacement = fold(node);
            // A computed string at the start of a suite is not a docstring.
            if (replacement._type === "Constant" && replacement.value.type === "str" && docstringPositions.has(node)) {
                continue;
            }
            (frame.parent as Record<string | number, unknown>)[frame.key] = replacement;
            continue;
        }
        if (["Module", "ClassDef", "FunctionDef", "AsyncFunctionDef"].includes(node._type)) {
            const first = (node as ast.Module).body[0];
            if (first?._type === "Expr" && first.value._type !== "Constant") docstringPositions.add(first.value);
        }
        pending.push({ ...frame, visited: true });
        for (const [key, value] of Object.entries(node)) {
            // Deferred annotations can expose their original expression text.
            if (
                key === "annotation" ||
                key === "returns" ||
                key === "bound" ||
                key === "default_value" ||
                (node._type === "TypeAlias" && key === "value")
            )
                continue;
            if (Array.isArray(value)) {
                for (let i = value.length - 1; i >= 0; i--) {
                    if (isNode(value[i])) pending.push({ node: value[i], parent: value, key: i, visited: false });
                }
            } else if (isNode(value)) {
                pending.push({ node: value, parent: node as unknown as Parent, key, visited: false });
            }
        }
    }
    return tree;
}

function isNode(value: unknown): value is Node {
    return value !== null && typeof value === "object" && "_type" in value;
}

function constant(node: ast.expr, value: ScalarConstant): ast.Constant {
    return { _type: "Constant", value, kind: null, ...location(node) };
}

function tuple(node: ast.expr, elts: ast.expr[]): ast.Tuple {
    return { _type: "Tuple", elts, ctx: { _type: "Load" }, ...location(node) };
}

function location(node: ast.expr) {
    return {
        lineno: node.lineno,
        col_offset: node.col_offset,
        end_lineno: node.end_lineno,
        end_col_offset: node.end_col_offset,
    };
}

function fold(node: Node): Node {
    if (node._type === "UnaryOp" && node.operand._type === "Constant") {
        const value = unary(node.op._type, node.operand.value);
        return value === null ? node : constant(node, value);
    }
    if (node._type === "BinOp") {
        if (node.left._type === "Constant" && node.right._type === "Constant") {
            const value = binary(node.op._type, node.left.value, node.right.value);
            if (value !== null) return constant(node, value);
        }
        const left = literalTuple(node.left);
        const right = literalTuple(node.right);
        if (node.op._type === "Add" && left && right && left.size + right.size <= maxTupleItems) {
            return tuple(node, [...left.items, ...right.items]);
        }
        if (node.op._type === "Mult") {
            const items = left ?? right;
            const countNode = left ? node.right : node.left;
            if (items && countNode._type === "Constant") {
                const count = repeatCount(countNode.value, items.size, maxTupleItems);
                if (count !== null) return tuple(node, Array.from({ length: count }, () => items.items).flat());
            }
        }
    }
    if (node._type === "Subscript" && node.ctx._type === "Load" && node.slice._type === "Constant") {
        const index = integer(node.slice.value);
        if (index === null) return node;
        const items = literalTuple(node.value);
        if (items) {
            const at = index < BigInt(0) ? index + BigInt(items.items.length) : index;
            if (at < BigInt(0) || at >= BigInt(items.items.length)) return node;
            const selected = items.items[Number(at)];
            return selected._type === "Constant"
                ? constant(node, selected.value)
                : tuple(node, (selected as ast.Tuple).elts);
        }
        if (node.value._type === "Constant") {
            const value = node.value.value;
            if ((value.type === "str" || value.type === "bytes") && value.value.length <= maxSequenceSize) {
                // UTF-16 cannot distinguish an astral character from two escaped
                // surrogates. Leave ambiguous character boundaries for the runtime.
                if (value.type === "str" && surrogatePair.test(value.value)) return node;
                const sequence = value.value;
                const at = index < BigInt(0) ? index + BigInt(sequence.length) : index;
                if (at < BigInt(0) || at >= BigInt(sequence.length)) return node;
                return constant(
                    node,
                    value.type === "str"
                        ? { type: "str", value: sequence[Number(at)] as string }
                        : { type: "int", value: sequence[Number(at)] as number }
                );
            }
        }
    }
    return node;
}

function literalTuple(node: ast.expr): { items: ast.expr[]; size: number } | null {
    if (node._type !== "Tuple" || node.ctx._type !== "Load" || node.elts.length > maxTupleItems) return null;
    const pending = [...node.elts];
    let items = 0;
    while (pending.length) {
        if (++items > maxTupleItems) return null;
        const item = pending.pop()!;
        if (item._type === "Tuple" && item.ctx._type === "Load") {
            if (items + pending.length + item.elts.length > maxTupleItems) return null;
            pending.push(...item.elts);
        } else if (item._type !== "Constant") return null;
    }
    return { items: node.elts, size: items };
}

function integer(value: ScalarConstant): bigint | null {
    if (value.type === "int") return BigInt(value.value);
    return value.type === "bool" ? BigInt(value.value ? 1 : 0) : null;
}

function intValue(value: bigint): ScalarConstant {
    return {
        type: "int",
        value:
            value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)
                ? Number(value)
                : value,
    };
}

function boundedInt(value: bigint): boolean {
    return value > -(BigInt(1) << BigInt(maxIntBits)) && value < BigInt(1) << BigInt(maxIntBits);
}

function numeric(value: ScalarConstant): number | null {
    if (value.type === "float") return Number.isFinite(value.value) ? value.value : null;
    const number = integer(value);
    return number !== null && number >= BigInt(Number.MIN_SAFE_INTEGER) && number <= BigInt(Number.MAX_SAFE_INTEGER)
        ? Number(number)
        : null;
}

function unary(op: ast.unaryop["_type"], value: ScalarConstant): ScalarConstant | null {
    if (op === "Not") {
        // Truth-testing Ellipsis and inverting bool emit Python deprecation warnings.
        if (value.type === "ellipsis") return null;
        const truth =
            value.type === "none"
                ? false
                : value.type === "complex"
                  ? value.real !== 0 || value.imag !== 0
                  : value.type === "str" || value.type === "bytes"
                    ? value.value.length !== 0
                    : value.value !== 0 && value.value !== BigInt(0) && value.value !== false;
        return { type: "bool", value: !truth };
    }
    const number = integer(value);
    if (number !== null) {
        if (!boundedInt(number) || (op === "Invert" && value.type === "bool")) return null;
        const result = op === "UAdd" ? number : op === "USub" ? -number : ~number;
        return boundedInt(result) ? intValue(result) : null;
    }
    if (op !== "UAdd" && op !== "USub") return null;
    if (value.type === "float") return { type: "float", value: op === "USub" ? -value.value : value.value };
    if (value.type === "complex")
        return {
            type: "complex",
            real: op === "USub" ? -value.real : value.real,
            imag: op === "USub" ? -value.imag : value.imag,
        };
    return null;
}

function repeatCount(value: ScalarConstant, size: number, limit: number): number | null {
    const count = integer(value);
    if (count === null) return null;
    // Even an empty sequence cannot accept a count outside Py_ssize_t.
    if (count > BigInt(Number.MAX_SAFE_INTEGER) || count < BigInt(Number.MIN_SAFE_INTEGER)) return null;
    if (count <= BigInt(0)) return 0;
    if (size === 0) return 0;
    return count <= BigInt(Math.floor(limit / size)) ? Number(count) : null;
}

function binary(op: ast.operator["_type"], left: ScalarConstant, right: ScalarConstant): ScalarConstant | null {
    if (op === "Add" && left.type === "str" && right.type === "str") {
        if (joinsSurrogates(left.value, right.value)) return null;
        return left.value.length + right.value.length <= maxSequenceSize
            ? { type: "str", value: left.value + right.value }
            : null;
    }
    if (op === "Add" && left.type === "bytes" && right.type === "bytes") {
        if (left.value.length + right.value.length > maxSequenceSize) return null;
        const bytes = new Uint8Array(left.value.length + right.value.length);
        bytes.set(left.value);
        bytes.set(right.value, left.value.length);
        return { type: "bytes", value: bytes };
    }
    if (op === "Mult") {
        const sequence = left.type === "str" || left.type === "bytes" ? left : right;
        const countValue = sequence === left ? right : left;
        if (sequence.type === "str" || sequence.type === "bytes") {
            const count = repeatCount(countValue, sequence.value.length, maxSequenceSize);
            if (count === null) return null;
            if (sequence.type === "str") {
                if (count > 1 && joinsSurrogates(sequence.value, sequence.value)) return null;
                return { type: "str", value: sequence.value.repeat(count) };
            }
            const bytes = new Uint8Array(sequence.value.length * count);
            for (let i = 0; i < count; i++) bytes.set(sequence.value, i * sequence.value.length);
            return { type: "bytes", value: bytes };
        }
    }
    const a = integer(left),
        b = integer(right);
    if (a !== null && b !== null && op !== "Div") {
        if (!boundedInt(a) || !boundedInt(b)) return null;
        let result: bigint;
        switch (op) {
            case "Add":
                result = a + b;
                break;
            case "Sub":
                result = a - b;
                break;
            case "Mult":
                result = a * b;
                break;
            case "FloorDiv":
            case "Mod": {
                if (b === BigInt(0)) return null;
                const remainder = a % b;
                const adjust = remainder !== BigInt(0) && a < BigInt(0) !== b < BigInt(0);
                result = op === "Mod" ? remainder + (adjust ? b : BigInt(0)) : a / b - BigInt(adjust ? 1 : 0);
                break;
            }
            case "Pow":
                if (b < BigInt(0) || b > BigInt(maxIntBits)) return null;
                if ((a < BigInt(0) ? -a : a).toString(2).length * Number(b) > maxIntBits) return null;
                result = a ** b;
                break;
            case "LShift":
            case "RShift":
                if (b < BigInt(0) || b > BigInt(maxIntBits)) return null;
                result = op === "LShift" ? a << b : a >> b;
                break;
            case "BitAnd":
                result = a & b;
                break;
            case "BitOr":
                result = a | b;
                break;
            case "BitXor":
                result = a ^ b;
                break;
            default:
                return null;
        }
        if (!boundedInt(result)) return null;
        if (left.type === "bool" && right.type === "bool" && ["BitAnd", "BitOr", "BitXor"].includes(op)) {
            return { type: "bool", value: result !== BigInt(0) };
        }
        return intValue(result);
    }
    if ((op === "Add" || op === "Sub") && (left.type === "complex" || right.type === "complex")) {
        const x = left.type === "complex" ? left : { real: numeric(left), imag: 0 };
        const y = right.type === "complex" ? right : { real: numeric(right), imag: 0 };
        if (x.real === null || y.real === null) return null;
        const real = op === "Add" ? x.real + y.real : x.real - y.real;
        // A real operand does not add a positive zero to the imaginary part.
        const imag =
            left.type !== "complex"
                ? op === "Add"
                    ? y.imag
                    : -y.imag
                : right.type !== "complex"
                  ? x.imag
                  : op === "Add"
                    ? x.imag + y.imag
                    : x.imag - y.imag;
        return Number.isFinite(real) && Number.isFinite(imag) ? { type: "complex", real, imag } : null;
    }
    const x = numeric(left),
        y = numeric(right);
    if (x === null || y === null) return null;
    let result: number;
    switch (op) {
        case "Add":
            result = x + y;
            break;
        case "Sub":
            result = x - y;
            break;
        case "Mult":
            result = x * y;
            break;
        case "Div":
            if (y === 0) return null;
            result = x / y;
            break;
        case "FloorDiv":
        case "Mod": {
            if (y === 0) return null;
            // CPython float_divmod: floor(x/y) alone gets cases such as 1.0//0.1 wrong.
            let remainder = x % y;
            let quotient = (x - remainder) / y;
            if (remainder !== 0 && remainder < 0 !== y < 0) {
                remainder += y;
                quotient--;
            }
            if (remainder === 0) remainder = y < 0 ? -0 : 0;
            let floor = quotient === 0 ? (x / y < 0 || Object.is(x / y, -0) ? -0 : 0) : Math.floor(quotient);
            if (quotient !== 0 && quotient - floor > 0.5) floor++;
            result = op === "Mod" ? remainder : floor;
            break;
        }
        default:
            return null;
    }
    return Number.isFinite(result) ? { type: "float", value: result } : null;
}

function joinsSurrogates(left: string, right: string): boolean {
    const last = left.charCodeAt(left.length - 1),
        first = right.charCodeAt(0);
    return last >= 0xd800 && last <= 0xdbff && first >= 0xdc00 && first <= 0xdfff;
}
