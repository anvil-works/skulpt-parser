"""Emit selected Python rules from the pinned CPython grammar.

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
invalid_arguments invalid_kwarg invalid_legacy_expression invalid_type_param
invalid_expression invalid_named_expression invalid_assignment invalid_ann_assign_target
invalid_del_stmt invalid_block invalid_comprehension invalid_dict_comprehension
invalid_parameters invalid_default invalid_star_etc invalid_kwds
invalid_parameters_helper invalid_lambda_parameters invalid_lambda_parameters_helper invalid_lambda_star_etc
invalid_lambda_kwds invalid_double_type_comments invalid_with_item invalid_for_if_clause
invalid_for_target invalid_group invalid_import invalid_dotted_as_name
invalid_import_from_as_name invalid_import_from_targets invalid_with_stmt invalid_with_stmt_indent
invalid_try_stmt invalid_except_stmt invalid_except_star_stmt invalid_finally_stmt
invalid_except_stmt_indent invalid_except_star_stmt_indent invalid_match_stmt invalid_case_block
invalid_as_pattern invalid_class_pattern invalid_class_argument_pattern invalid_if_stmt
invalid_elif_stmt invalid_else_stmt invalid_while_stmt invalid_for_stmt
invalid_def_raw invalid_class_def_raw invalid_double_starred_kvpairs invalid_kvpair
invalid_starred_expression_unpacking invalid_starred_expression invalid_fstring_replacement_field invalid_fstring_conversion_character
invalid_tstring_replacement_field invalid_tstring_conversion_character invalid_string_tstring_concat invalid_arithmetic
invalid_factor invalid_type_params
expression_without_invalid
file statements statement simple_stmts simple_stmt assignment augassign
compound_stmt block if_stmt elif_stmt else_block while_stmt for_stmt
with_stmt with_item try_stmt except_block except_star_block finally_block
match_stmt subject_expr case_block guard patterns pattern as_pattern or_pattern
closed_pattern literal_pattern literal_expr complex_number signed_number
signed_real_number real_number imaginary_number capture_pattern pattern_capture_target
wildcard_pattern value_pattern attr name_or_attr group_pattern sequence_pattern
open_sequence_pattern maybe_sequence_pattern maybe_star_pattern star_pattern
mapping_pattern items_pattern key_value_pattern double_star_pattern class_pattern
positional_patterns keyword_patterns keyword_pattern
decorators class_def class_def_raw function_def function_def_raw func_type_comment
params parameters slash_no_default slash_with_default star_etc kwds
param_no_default param_no_default_star_annotation param_with_default param_maybe_default
param param_star_annotation annotation star_annotation
single_target single_subscript_attribute_target del_targets del_target del_t_atom
return_stmt raise_stmt pass_stmt break_stmt continue_stmt global_stmt nonlocal_stmt
del_stmt yield_stmt assert_stmt
import_stmt import_name import_from import_from_targets import_from_as_names
import_from_as_name dotted_as_names dotted_as_name dotted_name
type_alias type_params type_param_seq type_param type_param_bound
type_param_default type_param_starred_default
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
annotated_rhs strings string fstring fstring_middle fstring_replacement_field
fstring_conversion fstring_full_format_spec fstring_format_spec
tstring tstring_middle tstring_replacement_field tstring_full_format_spec
tstring_format_spec tstring_format_spec_replacement_field
yield_expr lambdef lambda_params lambda_parameters lambda_slash_no_default
lambda_slash_with_default lambda_star_etc lambda_kwds lambda_param_no_default
lambda_param_with_default lambda_param_maybe_default lambda_param default
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


def conditional(text):
    """Split only a top-level C conditional, preserving quoted punctuation."""
    depth, quote, escape, question, nested = 0, None, False, None, 0
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
        elif depth == 0:
            if char == "?":
                if question is None:
                    question = i
                else:
                    nested += 1
            elif char == ":" and question is not None:
                if nested:
                    nested -= 1
                else:
                    return text[:question].strip(), text[question + 1 : i].strip(), text[i + 1 :].strip()
    return None


def action(text):
    text = re.sub(r"\(\s*(?:asdl_\w+\s*\*|expr_ty)\s*\)", "", text).strip()
    if text == "_PyPegen_check_barry_as_flufl ( p , tok ) ? NULL : tok":
        return "this.checkNotEqual(tok)"
    empty_lambda = re.fullmatch(
        r"\(\s*(\w+)\s*\)\s*\?\s*\1\s*:\s*CHECK\s*\(\s*arguments_ty\s*,\s*_PyPegen_empty_arguments\s*\(\s*p\s*\)\s*\)",
        text,
    )
    if empty_lambda:
        return f"({empty_lambda[1]} ?? ast.arguments([], [], null, [], [], null, []))"
    call_fields = re.fullmatch(
        r"\(\s*(\w+)\s*\)\s*\?\s*\(\s*\1\s*\)\s*->\s*v\s*\.\s*Call\s*\.\s*(args|keywords)\s*:\s*NULL",
        text,
    )
    if call_fields:
        variable, field = call_fields.groups()
        return f"({variable}?.{field} ?? [])"
    alias_name = re.fullmatch(r"\(\s*(\w+)\s*\)\s*\?\s*\(\s*\1\s*\)\s*->\s*v\s*\.\s*Name\s*\.\s*id\s*:\s*NULL", text)
    if alias_name:
        return f"({alias_name[1]}?.id ?? null)"
    if text == "asdl_seq_LEN ( patterns ) == 1 ? asdl_seq_GET ( patterns , 0 ) : _PyAST_MatchOr ( patterns , EXTRA )":
        return "patterns.length === 1 ? patterns[0] : ast.MatchOr(patterns, ...this.span(mark))"
    choice = conditional(text)
    if choice:
        test, yes, no = choice
        tests = {
            # JavaScript errors throw instead of leaving a pending error flag.
            "PyErr_Occurred()": "false",
            "p->tokens[p->mark-1]->level==0": "this.tokenLevel() === 0",
            "e->kind==Tuple_kind": 'e._type === "Tuple"',
        }
        key = re.sub(r"\s+", "", test)
        condition = tests[key] if key in tests else action(test)
        return f"({condition} ? {action(yes)} : {action(no)})"
    call = re.fullmatch(r"(\w+)\s*\((.*)\)", text, re.S)
    if call:
        name, raw = call.groups()
        args = arguments(raw)
        if name in {"CHECK", "CHECK_NULL_ALLOWED"}:
            return action(args[1])
        if name == "CHECK_VERSION":
            assert int(args[1]) <= 14
            return action(args[3])
        if name == "RAISE_SYNTAX_ERROR_STARTING_FROM":
            return f"this.raiseStartingFrom({', '.join(action(arg) for arg in args)})"
        if name == "RAISE_SYNTAX_ERROR_ON_NEXT_TOKEN":
            return f"this.raiseOnNext({', '.join(action(arg) for arg in args)})"
        if name == "RAISE_ERROR_KNOWN_LOCATION":
            if args[:2] != ["p", "PyExc_SyntaxError"]:
                raise ValueError(f"Unsupported diagnostic kind: {args[:2]}")
            return f"this.raiseLocation({', '.join(action(arg) for arg in args[2:])})"
        if name == "PyBytes_AS_STRING":
            return re.sub(r"\s*->\s*bytes", ".string", args[0])
        if name == "RAISE_SYNTAX_ERROR_INVALID_TARGET":
            return f"diagnostics.invalidTarget(this, {json.dumps(args[0])}, {action(args[1])})"
        if name in {"RAISE_SYNTAX_ERROR", "RAISE_INDENTATION_ERROR"}:
            return f"this.raiseDiagnostic({str(name == 'RAISE_INDENTATION_ERROR').lower()}, {', '.join(action(arg) for arg in args)})"
        if name in {"RAISE_SYNTAX_ERROR_KNOWN_LOCATION", "RAISE_SYNTAX_ERROR_KNOWN_RANGE"}:
            bounds = args[:1] * 2 if name.endswith("LOCATION") else args[:2]
            message_args = args[1:] if name.endswith("LOCATION") else args[2:]
            return f"this.raiseKnown({', '.join(action(arg) for arg in bounds + message_args)})"
        if name.startswith("_PyAST_"):
            name = name.removeprefix("_PyAST_")
            if name == "Call" and re.fullmatch(r"_PyPegen_dummy_name\s*\(\s*p\s*\)", args[0]):
                # CPython uses a dummy Call as an argument carrier. Keep only its
                # consumed fields; no fabricated node or locations reach the AST.
                return f"{{args: {action(args[1])}, keywords: {action(args[2])}}}"
            args = [action(arg) for arg in args if arg != "p -> arena"]
            if name in {"If", "While"} and not args[2].startswith("["):
                args[2] = f"({args[2]} ?? [])"
            if name in {"For", "AsyncFor"}:
                args[3] = f"({args[3]} ?? [])"
            if name in {"FunctionDef", "AsyncFunctionDef"}:
                args[3] = "[]"
                args[6] = f"({args[6]} ?? [])"
            if name == "ClassDef":
                args[4] = "[]"
                args[5] = f"({args[5]} ?? [])"
            if name in {"Try", "TryStar"}:
                for index in (1, 2, 3):
                    args[index] = "[]" if args[index] == "null" else f"({args[index]} ?? [])"
            if name == "MatchSequence":
                args[0] = f"({args[0]} ?? [])"
            if name == "MatchMapping":
                args[:2] = ["[]" if arg == "null" else arg for arg in args[:2]]
            if name == "MatchClass":
                args[1:4] = ["[]" if arg == "null" else arg for arg in args[1:4]]
            if name == "TypeAlias":
                args[1] = f"({args[1]} ?? [])"
            if name == "Call":
                args[1:3] = ["[]" if arg == "null" else arg for arg in args[1:3]]
            return f"ast.{name}({', '.join(args)})"
        string_helpers = {
            "constant_from_string": "literal",
            "constant_from_token": "constant",
            "decoded_constant_from_token": "decodedConstant",
            "joined_str": "joined",
            "template_str": "template",
            "formatted_value": "formatted",
            "interpolation": "interpolation",
            "check_fstring_conversion": "conversion",
            "setup_full_format_spec": "formatSpec",
            "concatenate_strings": "concatenate",
            "concatenate_tstrings": "concatenateTemplates",
        }
        if name.startswith("_PyPegen_") and name.removeprefix("_PyPegen_") in string_helpers:
            method = string_helpers[name.removeprefix("_PyPegen_")]
            translated = [action(arg) for arg in args[1:] if arg != "p -> arena"]
            return f"strings.{method}(this, {', '.join(translated)})"
        if name == "_PyPegen_name_default_pair":
            pair = f"{{arg: {action(args[1])}, value: {action(args[2])}}}"
            return pair if args[3] == "NULL" else f"(this.typeComment({action(args[3])}), {pair})"
        helper = {
            "_PyPegen_add_type_comment_to_arg": lambda a: f"(this.typeComment({a[2]}), {a[1]})",
            "_PyPegen_function_def_decorators": lambda a: f"{{...{a[2]}, decorator_list: {a[1]}}}",
            "_PyPegen_class_def_decorators": lambda a: f"{{...{a[2]}, decorator_list: {a[1]}}}",
            "_PyPegen_key_pattern_pair": lambda a: f"{{key: {a[1]}, pattern: {a[2]}}}",
            "_PyPegen_get_pattern_keys": lambda a: f"{a[1]}.map((pair: any) => pair.key)",
            "_PyPegen_get_patterns": lambda a: f"{a[1]}.map((pair: any) => pair.pattern)",
            "_PyPegen_ensure_real": lambda a: f"this.ensurePatternNumber({a[1]}, false)",
            "_PyPegen_ensure_imaginary": lambda a: f"this.ensurePatternNumber({a[1]}, true)",
            "_PyPegen_get_expr_name": lambda a: f"diagnostics.expressionName({a[0]})",
            "PyPegen_first_item": lambda a: f"{a[0]}[0]",
            "PyPegen_last_item": lambda a: f"{a[0]}[{a[0]}.length - 1]",
            "_PyPegen_get_last_comprehension_item": lambda a: f"diagnostics.lastComprehensionItem({a[0]})",
            "_PyPegen_nonparen_genexp_in_call": lambda a: f"diagnostics.nonparenGenexp(this, {a[1]}, {a[2]})",
            "_PyPegen_arguments_parsing_error": lambda a: f"diagnostics.argumentsError(this, {a[1]})",
            "_PyPegen_check_legacy_stmt": lambda a: f"diagnostics.isLegacy({a[1]})",
            "_PyPegen_make_module": lambda a: f"finishModule(this, {a[1]} ?? [])",
            "_PyPegen_checked_future_import": lambda a: f"checkedImport(this, {', '.join(a[1:])})",
            "_PyPegen_seq_count_dots": lambda a: f"{a[0]}.reduce((sum: number, token: Token) => sum + token.string.length, 0)",
            "_PyPegen_alias_for_star": lambda a: 'ast.alias("*", null, ' + ", ".join(a[1:]) + ")",
            "_PyPegen_join_names_with_dot": lambda a: f"ast.Name({a[1]}.id + '.' + {a[2]}.id, ast.Load(), {a[1]}.lineno, {a[1]}.col_offset, {a[2]}.end_lineno, {a[2]}.end_col_offset)",
            # CPython's internal last-statement error metadata is not exposed here.
            "_PyPegen_register_stmts": lambda a: a[1],
            "_PyPegen_seq_flatten": lambda a: f"{a[1]}.flat()",
            "_PyPegen_augoperator": lambda a: f"{{kind: {a[1]}}}",
            "_PyPegen_map_names_to_ids": lambda a: f"{a[1]}.map((name: ast.Name) => name.id)",
            "NEW_TYPE_COMMENT": lambda a: f"this.typeComment({a[1]})",
            "_PyPegen_make_arguments": lambda a: f"makeArguments({', '.join(a[1:])})",
            "_PyPegen_slash_with_default": lambda a: f"{{plainNames: {a[1]}, namesWithDefaults: {a[2]}}}",
            "_PyPegen_star_etc": lambda a: f"{{vararg: {a[1]}, kwonlyargs: {a[2]}, kwarg: {a[3]}}}",
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
    if text.startswith('"'):
        return json.dumps(ast.literal_eval(text))
    if re.fullmatch(r"-?\s*\d+", text):
        return re.sub(r"\s+", "", text)
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
    text = re.sub(r"\(\s*(\w+)\s*\)(?=\s*->)", r"\1", text)
    text = re.sub(r"\s*->\s*v\s*\.\s*Name\s*\.\s*id", ".id", text)
    line_number = re.fullmatch(r"(\w+)\s*->\s*lineno", text)
    if line_number:
        return f"this.diagnosticLine({line_number[1]})"
    text = re.sub(r"\s*->\s*(lineno|col_offset|end_lineno|end_col_offset)\b", r".\1", text)
    text = re.sub(r"\s*->\s*(key|value|kind)\b", r".\1", text)
    if not re.fullmatch(r"-?\w+(?:\.\w+)?(?: \- \d+)?", text):
        raise ValueError(f"Unsupported action expression: {text}")
    return text


class Calls(GrammarVisitor):
    def __init__(self, gen):
        self.gen = gen
        self.cache = {}

    def visit_NameLeaf(self, node):
        name = node.value
        if name == "SOFT_KEYWORD":
            return "soft_keyword", "this.softKeyword()"
        if name in {"NAME", "NUMBER"}:
            return name.lower(), f"this.{name.lower()}()"
        if name.isupper():
            return name.lower(), f"this.expect({json.dumps(name)})"
        if name.startswith("invalid_"):
            return name, f"(this.callInvalidRules ? this.{name}() : null)"
        return name, f"this.{name}()"

    def visit_StringLeaf(self, node):
        value = ast.literal_eval(node.value)
        if value == "!=":
            return "literal", 'this.expect("NOTEQUAL")'
        return "literal", f"this.literal({json.dumps(value)})"

    def visit_NamedItem(self, node):
        return self.visit(node.item)

    def visit_Rhs(self, node):
        if node not in self.cache:
            self.cache[node] = self.gen.artificial_rule_from_rhs(node)
        name = self.cache[node]
        if self.gen.diagnostic_context:
            self.gen.diagnostic_groups.add(name)
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
        if self.gen.diagnostic_context:
            self.gen.diagnostic_groups.add(name)
        return name, f"this.{name}()"

    def visit_Gather(self, node):
        if node not in self.cache:
            self.cache[node] = self.gen.artificial_rule_from_gather(node)
        name = self.cache[node]
        if self.gen.diagnostic_context:
            self.gen.diagnostic_groups.add(name)
        return name, f"this.{name}()"

    def lookahead(self, node, positive):
        name, call = self.visit(node.node)
        if node.node.__class__.__name__ == "Group":
            self.gen.lookahead_groups.add(name)
        return None, f"this.lookahead(() => {call}, {str(positive).lower()})"

    def visit_PositiveLookahead(self, node):
        return self.lookahead(node, True)

    def visit_NegativeLookahead(self, node):
        return self.lookahead(node, False)

    def visit_Forced(self, node):
        if node.node.__class__.__name__ != "StringLeaf":
            raise ValueError(f"Unsupported forced grammar expression: {node}")
        value = ast.literal_eval(node.node.value)
        return "literal", f"this.forcedLiteral({json.dumps(value)})"

    def visit_Cut(self, node):
        return "cut", "true"


class Generator(ParserGenerator):
    def __init__(self, grammar, tokens, file):
        super().__init__(grammar, tokens, file)
        self.callmakervisitor = Calls(self)
        self.lookahead_groups = set()
        self.diagnostic_groups = set()
        self.diagnostic_context = False

    def generate(self, filename):
        self.collect_rules()
        self.print("// Copyright (c) 2021 the Skulpt Project")
        self.print("// SPDX-License-Identifier: Python-2.0 AND MIT")
        self.print("// Generated from CPython 3.14.3, commit 323c59a5e348347be2ce2b7ea55fcb30bf68b2d3.")
        self.print("// Upstream grammar/actions retain their PSF license; see licenses/CPython.txt.")
        self.print("// Grammar subset selected by tools/generate314/parser.py. Do not edit.")
        self.print('import * as ast from "./ast.ts";')
        self.print('import type { Token } from "./lexer/tokenizer.ts";')
        self.print('import { checkedImport, finishModule } from "./imports.ts";')
        self.print('import * as strings from "./strings.ts";')
        self.print('import * as python2 from "./python2_statements.ts";')
        self.print('import * as diagnostics from "./diagnostics.ts";')
        self.print('import { makeArguments } from "./parameters.ts";')
        self.print('import { Parser, memoize, memoizeLeftRec } from "./parser.ts";')
        self.print("export class GeneratedParser extends Parser {")
        for rule in self.all_rules.values():
            self.rule(rule)
        self.print("}")

    def rule(self, rule):
        self.diagnostic_context = rule.name.startswith("invalid_") or rule.name in self.diagnostic_groups
        if rule.left_recursive:
            if rule.leader:
                self.print("@memoizeLeftRec")
        elif rule.memo:
            self.print("@memoize")
        self.print(f"{rule.name}(): any {{")
        if rule.name.endswith("without_invalid"):
            self.print("const previous = this.callInvalidRules; this.callInvalidRules = false; try {")
        compatibility_rule = {
            "simple_stmt": "printStatement",
            "raise_stmt": "raiseStatement",
            "except_block": "exceptBlock",
        }.get(rule.name)
        if compatibility_rule:
            self.print(
                f"if (this.python2Compat) {{ const legacy = python2.{compatibility_rule}(this); if (legacy !== null) return legacy; }}"
            )
        self.print(f"// {rule.name}: {rule.rhs}")
        loop = rule.is_loop()
        self.print(f"{'let' if loop else 'const'} mark = this.mark;")
        if loop:
            self.print("const children: any[] = [];")
        for alt in rule.rhs.alts:
            refs = References()
            refs.visit(alt)
            diagnostic_alt = any(name.startswith("invalid_") for name in refs.names)
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
            elif rule.name in self.lookahead_groups or self.diagnostic_context or diagnostic_alt:
                # Like CPython dummy actions, these diagnostic groups and
                # lookaheads need success/failure rather than an AST value.
                result = "true"
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
            else "return children.length ? children : null;"
            if loop
            else "return null;"
        )
        if rule.name.endswith("without_invalid"):
            self.print("} finally { this.callInvalidRules = previous; }")
        self.print("}")


class References(GrammarVisitor):
    def __init__(self):
        self.names = set()

    def visit_NameLeaf(self, node):
        self.names.add(node.value)

    def generic_visit(self, node):
        for child in node:
            self.visit(child)


def check_complete_rules(grammar):
    """Do not silently prune rules reachable from either entry point, including diagnostics."""
    pending, visited = ["eval", "file"], set()
    while pending:
        name = pending.pop()
        if name in visited or name not in grammar.rules:
            continue
        visited.add(name)
        refs = References()
        refs.visit(grammar.rules[name].rhs)
        pending.extend(refs.names)
    missing = visited - RULES
    if missing:
        raise ValueError(f"Unselected eval/file rules: {sorted(missing)}")


def generate(grammar, tokens):
    check_complete_rules(grammar)
    grammar.rules = {name: rule for name, rule in grammar.rules.items() if name in RULES}
    selector = Select()
    for rule in grammar.rules.values():
        if not selector.visit(rule.rhs):
            raise ValueError(f"Empty selected rule: {rule.name}")
    output = StringIO()
    Generator(grammar, tokens, output).generate("Grammar/python.gram")
    return output.getvalue()
