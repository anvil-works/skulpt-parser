"""Emit the first supported expression rules from the pinned CPython grammar.

Selection is explicit. Generation rejects unknown semantic calls rather than emitting
fallback helpers. CHECK allocation guards disappear because JavaScript allocations
throw; CHECK_VERSION guards disappear because this backend targets exactly 3.14.
"""

import ast
from io import StringIO
import json
import re

from pegen.grammar import GrammarVisitor
from pegen.parser_generator import ParserGenerator

RULES = set(
    """
eval expressions expression disjunction conjunction inversion comparison
compare_op_bitwise_or_pair eq_bitwise_or noteq_bitwise_or lte_bitwise_or lt_bitwise_or
gte_bitwise_or gt_bitwise_or notin_bitwise_or in_bitwise_or isnot_bitwise_or is_bitwise_or
bitwise_or bitwise_xor bitwise_and shift_expr sum term factor power await_primary
primary atom group tuple list set dict double_starred_kvpairs double_starred_kvpair
kvpair star_named_expressions star_named_expression star_expressions star_expression
named_expression assignment_expression slices slice starred_expression
arguments args kwargs kwarg_or_starred kwarg_or_double_starred
for_if_clauses for_if_clause listcomp setcomp dictcomp genexp
star_targets star_target star_targets_list_seq star_targets_tuple_seq
target_with_star_atom star_atom t_primary t_lookahead
""".split()
)


class Select(GrammarVisitor):
    def visit_NameLeaf(self, node):
        return node.value.isupper() or node.value in RULES

    def visit_Rhs(self, node):
        node.alts = [alt for alt in node.alts if self.visit(alt)]
        return bool(node.alts)

    def generic_visit(self, node):
        return all(self.visit(child) for child in node)


def arguments(text):
    """Split balanced C call arguments; quoted text may contain commas."""
    result, start, depth, quote, escape = [], 0, 0, None, False
    for i, char in enumerate(text):
        if quote:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                quote = None
        elif char in "\"'":
            quote = char
        elif char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
        elif char == "," and depth == 0:
            result.append(text[start:i].strip())
            start = i + 1
    return result + [text[start:].strip()]


def action(text):
    text = re.sub(r"\(\s*(?:asdl_\w+\s*\*|expr_ty)\s*\)", "", text).strip()
    if text == "_PyPegen_check_barry_as_flufl ( p , tok ) ? NULL : tok":
        # This internal expression entry point does not enable future flags.
        return "tok"
    call_fields = re.fullmatch(
        r"\(\s*(\w+)\s*\)\s*\?\s*\(\s*\1\s*\)\s*->\s*v\s*\.\s*Call\s*\.\s*(args|keywords)\s*:\s*NULL",
        text,
    )
    if call_fields:
        variable, field = call_fields.groups()
        return f"({variable}?.{field} ?? [])"
    call = re.fullmatch(r"(\w+)\s*\((.*)\)", text, re.S)
    if call:
        name, raw = call.groups()
        args = arguments(raw)
        if name in {"CHECK", "CHECK_NULL_ALLOWED"}:
            return action(args[1])
        if name == "CHECK_VERSION":
            assert int(args[1]) <= 14
            return action(args[3])
        if name.startswith("_PyAST_"):
            name = name.removeprefix("_PyAST_")
            if name == "Call" and re.fullmatch(r"_PyPegen_dummy_name\s*\(\s*p\s*\)", args[0]):
                # CPython uses a dummy Call as an argument carrier. Keep only its
                # consumed fields; no fabricated node or locations reach the AST.
                return f"{{args: {action(args[1])}, keywords: {action(args[2])}}}"
            args = [action(arg) for arg in args if arg != "p -> arena"]
            if name == "Call":
                args[1:3] = ["[]" if arg == "null" else arg for arg in args[1:3]]
            return f"ast.{name}({', '.join(args)})"
        helper = {
            "_PyPegen_collect_call_seqs": lambda a: f"this.collectCallArgs({a[1]}, {a[2]})",
            "_PyPegen_join_sequences": lambda a: f"[...{a[1]}, ...{a[2]}]",
            "_PyPegen_keyword_or_starred": lambda a: f"{{element: {a[1]}, isKeyword: {json.dumps(bool(int(a[2])))}}}",
            "_PyPegen_seq_extract_starred_exprs": lambda a: f"{a[1]}.filter((item: any) => !item.isKeyword).map((item: any) => item.element)",
            "_PyPegen_seq_delete_starred_exprs": lambda a: f"{a[1]}.filter((item: any) => item.isKeyword).map((item: any) => item.element)",
            "_PyPegen_seq_insert_in_front": lambda a: f"[{a[1]}, ...({a[2]} ?? [])]",
            "_PyPegen_singleton_seq": lambda a: f"[{a[1]}]",
            "_PyPegen_cmpop_expr_pair": lambda a: f"{{op: {a[1]}, expr: {a[2]}}}",
            "_PyPegen_get_cmpops": lambda a: f"{a[1]}.map((pair: any) => pair.op)",
            "_PyPegen_get_exprs": lambda a: f"{a[1]}.map((pair: any) => pair.expr)",
            "_PyPegen_set_expr_context": lambda a: f"this.setContext({a[1]}, {a[2]})",
            "_PyPegen_key_value_pair": lambda a: f"{{key: {a[1]}, value: {a[2]}}}",
            "_PyPegen_get_keys": lambda a: f"({a[1]} ?? []).map((pair: any) => pair.key)",
            "_PyPegen_get_values": lambda a: f"({a[1]} ?? []).map((pair: any) => pair.value)",
        }.get(name)
        if helper:
            return helper([action(arg) for arg in args])
        raise ValueError(f"Unsupported action call: {name}")
    if text == "EXTRA":
        return "...this.span(mark)"
    if text == "NULL":
        return "null"
    constants = {
        "Py_True": '{type: "bool", value: true}',
        "Py_False": '{type: "bool", value: false}',
        "Py_None": '{type: "none"}',
        "Py_Ellipsis": '{type: "ellipsis"}',
    }
    if text in constants:
        return constants[text]
    if (
        text
        in "Load Store Del And Or Not UAdd USub Invert Add Sub Mult MatMult Div Mod Pow FloorDiv LShift RShift BitOr BitXor BitAnd Eq NotEq Lt LtE Gt GtE Is IsNot In NotIn".split()
    ):
        return f"ast.{text}()"
    text = re.sub(r"\s*->\s*v\s*\.\s*Name\s*\.\s*id", ".id", text)
    text = re.sub(r"\s*->\s*(key|value)\b", r".\1", text)
    if not re.fullmatch(r"\w+(?:\.\w+)?", text):
        raise ValueError(f"Unsupported action expression: {text}")
    return text


class Calls(GrammarVisitor):
    def __init__(self, gen):
        self.gen = gen
        self.cache = {}

    def visit_NameLeaf(self, node):
        name = node.value
        if name in {"NAME", "NUMBER"}:
            return name.lower(), f"this.{name.lower()}()"
        if name.isupper():
            return name.lower(), f"this.expect({json.dumps(name)})"
        return name, f"this.{name}()"

    def visit_StringLeaf(self, node):
        value = ast.literal_eval(node.value)
        return "literal", f"this.literal({json.dumps(value)})"

    def visit_NamedItem(self, node):
        return self.visit(node.item)

    def visit_Rhs(self, node):
        if node not in self.cache:
            self.cache[node] = self.gen.artificial_rule_from_rhs(node)
        name = self.cache[node]
        return name, f"this.{name}()"

    def visit_Group(self, node):
        return self.visit(node.rhs)

    def visit_Opt(self, node):
        name, call = self.visit(node.node)
        return name, call

    def visit_Repeat0(self, node):
        return self.repeat(node, False)

    def visit_Repeat1(self, node):
        return self.repeat(node, True)

    def repeat(self, node, one):
        if node not in self.cache:
            self.cache[node] = self.gen.artificial_rule_from_repeat(node.node, one)
        name = self.cache[node]
        return name, f"this.{name}()"

    def visit_Gather(self, node):
        if node not in self.cache:
            self.cache[node] = self.gen.artificial_rule_from_gather(node)
        name = self.cache[node]
        return name, f"this.{name}()"

    def visit_PositiveLookahead(self, node):
        _, call = self.visit(node.node)
        return None, f"this.lookahead(() => {call}, true)"

    def visit_NegativeLookahead(self, node):
        _, call = self.visit(node.node)
        return None, f"this.lookahead(() => {call}, false)"

    def visit_Cut(self, node):
        return "cut", "true"


class Generator(ParserGenerator):
    def __init__(self, grammar, tokens, file):
        super().__init__(grammar, tokens, file)
        self.callmakervisitor = Calls(self)

    def generate(self, filename):
        self.collect_rules()
        self.print("// Copyright (c) 2021 the Skulpt Project")
        self.print("// SPDX-License-Identifier: Python-2.0 AND MIT")
        self.print("// Generated from CPython 3.14.3, commit 323c59a5e348347be2ce2b7ea55fcb30bf68b2d3.")
        self.print("// Upstream grammar/actions retain their PSF license; see licenses/CPython.txt.")
        self.print("// Expression subset selected by tools/generate314/parser.py. Do not edit.")
        self.print('import * as ast from "./ast.ts";')
        self.print('import { Parser, memoize, memoizeLeftRec } from "./parser.ts";')
        self.print("export class ExpressionParser extends Parser {")
        for rule in self.all_rules.values():
            self.rule(rule)
        self.print("}")

    def rule(self, rule):
        if rule.left_recursive:
            if rule.leader:
                self.print("@memoizeLeftRec")
        elif rule.memo:
            self.print("@memoize")
        self.print(f"{rule.name}(): any {{")
        self.print(f"// {rule.name}: {rule.rhs}")
        loop = rule.is_loop()
        self.print(f"{'let' if loop else 'const'} mark = this.mark;")
        if loop:
            self.print("const children: any[] = [];")
        for alt in rule.rhs.alts:
            self.print("{")
            names, conditions, cut = [], [], False
            for item in alt.items:
                suggested, call = self.callmakervisitor.visit(item.item)
                name = item.name or suggested
                if name in {"arguments", "eval"}:
                    name += "_"
                if name:
                    original, index = name, 1
                    while name in names:
                        name, index = f"{original}_{index}", index + 1
                    names.append(name)
                    self.print(f"let {name}: any;")
                    call = f"({name} = {call})"
                if item.item.__class__.__name__ == "Opt":
                    call = f"({call}, true)"
                elif item.item.__class__.__name__ == "Cut":
                    cut = True
                elif name:
                    call += " !== null"
                conditions.append(call)
            self.print(f"{'while' if loop else 'if'} ({' && '.join(conditions)}) {{")
            if alt.action:
                result = action(alt.action)
            elif rule.is_gather():
                result = f"[{names[0]}, ...{names[1]}]"
            elif len(names) == 1:
                result = names[0]
            else:
                raise ValueError(f"Ambiguous default action: {rule.name}: {names}")
            # CPython represents empty ASDL sequences as NULL; structural ASTs use arrays.
            if result.startswith(("ast.List(", "ast.Tuple(", "ast.Set(")):
                result = re.sub(r"^(ast\.\w+\()(\w+)(,)", r"\1(\2 ?? [])\3", result)
            if loop:
                self.print(f"children.push({result}); mark = this.mark;")
            else:
                self.print(f"return {result};")
            self.print("}")
            self.print("this.mark = mark;")
            if cut:
                self.print("if (cut) return null;")
            self.print("}")
        self.print(
            "return children;"
            if rule.name.startswith("_loop0")
            else "return children.length ? children : null;" if loop else "return null;"
        )
        self.print("}")


def generate(grammar, tokens):
    grammar.rules = {name: rule for name, rule in grammar.rules.items() if name in RULES}
    selector = Select()
    for rule in grammar.rules.values():
        if not selector.visit(rule.rhs):
            raise ValueError(f"Empty selected rule: {rule.name}")
    output = StringIO()
    Generator(grammar, tokens, output).generate("Grammar/python.gram")
    return output.getvalue()
