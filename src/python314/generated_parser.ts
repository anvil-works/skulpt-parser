// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: Python-2.0 AND MIT
// Generated from CPython 3.14.3, commit 323c59a5e348347be2ce2b7ea55fcb30bf68b2d3.
// Upstream grammar/actions retain their PSF license; see licenses/CPython.txt.
// Grammar subset selected by tools/generate314/parser.py. Do not edit.
import * as ast from "./ast.ts";
import type { Token } from "./lexer/tokenizer.ts";
import { checkedImport, finishModule } from "./imports.ts";
import * as strings from "./strings.ts";
import { makeArguments } from "./parameters.ts";
import { Parser, memoize, memoizeLeftRec } from "./parser.ts";
export class GeneratedParser extends Parser {
file(): any {
// file: statements? $
const mark = this.mark;
{
let a: any;
let endmarker: any;
if (((a = this._tmp_1()), true) && (endmarker = this.expect("ENDMARKER")) !== null) {
return finishModule(this, a ?? []);
}
this.mark = mark;
}
return null;
}
eval(): any {
// eval: expressions NEWLINE* $
const mark = this.mark;
{
let a: any;
let _loop0_2: any;
let endmarker: any;
if ((a = this.expressions()) !== null && (_loop0_2 = this._loop0_2()) !== null && (endmarker = this.expect("ENDMARKER")) !== null) {
return ast.Expression(a);
}
this.mark = mark;
}
return null;
}
statements(): any {
// statements: statement+
const mark = this.mark;
{
let a: any;
if ((a = this._loop1_3()) !== null) {
return a.flat();
}
this.mark = mark;
}
return null;
}
statement(): any {
// statement: compound_stmt | simple_stmts
const mark = this.mark;
{
let a: any;
if ((a = this.compound_stmt()) !== null) {
return [a];
}
this.mark = mark;
}
{
let a: any;
if ((a = this.simple_stmts()) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
simple_stmts(): any {
// simple_stmts: simple_stmt !';' NEWLINE | ';'.simple_stmt+ ';'? NEWLINE
const mark = this.mark;
{
let a: any;
let newline: any;
if ((a = this.simple_stmt()) !== null && this.lookahead(() => this.literal(";"), false) && (newline = this.expect("NEWLINE")) !== null) {
return [a];
}
this.mark = mark;
}
{
let a: any;
let _tmp_6: any;
let newline: any;
if ((a = this._gather_5()) !== null && ((_tmp_6 = this._tmp_6()), true) && (newline = this.expect("NEWLINE")) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
@memoize
simple_stmt(): any {
// simple_stmt: assignment | &"type" type_alias | star_expressions | &'return' return_stmt | &('import' | 'from') import_stmt | &'raise' raise_stmt | &'pass' pass_stmt | &'del' del_stmt | &'yield' yield_stmt | &'assert' assert_stmt | &'break' break_stmt | &'continue' continue_stmt | &'global' global_stmt | &'nonlocal' nonlocal_stmt
const mark = this.mark;
{
let assignment: any;
if ((assignment = this.assignment()) !== null) {
return assignment;
}
this.mark = mark;
}
{
let type_alias: any;
if (this.lookahead(() => this.literal("type"), true) && (type_alias = this.type_alias()) !== null) {
return type_alias;
}
this.mark = mark;
}
{
let e: any;
if ((e = this.star_expressions()) !== null) {
return ast.Expr(e, ...this.span(mark));
}
this.mark = mark;
}
{
let return_stmt: any;
if (this.lookahead(() => this.literal("return"), true) && (return_stmt = this.return_stmt()) !== null) {
return return_stmt;
}
this.mark = mark;
}
{
let import_stmt: any;
if (this.lookahead(() => this._tmp_7(), true) && (import_stmt = this.import_stmt()) !== null) {
return import_stmt;
}
this.mark = mark;
}
{
let raise_stmt: any;
if (this.lookahead(() => this.literal("raise"), true) && (raise_stmt = this.raise_stmt()) !== null) {
return raise_stmt;
}
this.mark = mark;
}
{
let pass_stmt: any;
if (this.lookahead(() => this.literal("pass"), true) && (pass_stmt = this.pass_stmt()) !== null) {
return pass_stmt;
}
this.mark = mark;
}
{
let del_stmt: any;
if (this.lookahead(() => this.literal("del"), true) && (del_stmt = this.del_stmt()) !== null) {
return del_stmt;
}
this.mark = mark;
}
{
let yield_stmt: any;
if (this.lookahead(() => this.literal("yield"), true) && (yield_stmt = this.yield_stmt()) !== null) {
return yield_stmt;
}
this.mark = mark;
}
{
let assert_stmt: any;
if (this.lookahead(() => this.literal("assert"), true) && (assert_stmt = this.assert_stmt()) !== null) {
return assert_stmt;
}
this.mark = mark;
}
{
let break_stmt: any;
if (this.lookahead(() => this.literal("break"), true) && (break_stmt = this.break_stmt()) !== null) {
return break_stmt;
}
this.mark = mark;
}
{
let continue_stmt: any;
if (this.lookahead(() => this.literal("continue"), true) && (continue_stmt = this.continue_stmt()) !== null) {
return continue_stmt;
}
this.mark = mark;
}
{
let global_stmt: any;
if (this.lookahead(() => this.literal("global"), true) && (global_stmt = this.global_stmt()) !== null) {
return global_stmt;
}
this.mark = mark;
}
{
let nonlocal_stmt: any;
if (this.lookahead(() => this.literal("nonlocal"), true) && (nonlocal_stmt = this.nonlocal_stmt()) !== null) {
return nonlocal_stmt;
}
this.mark = mark;
}
return null;
}
compound_stmt(): any {
// compound_stmt: &('def' | '@' | 'async') function_def | &'if' if_stmt | &('class' | '@') class_def | &('with' | 'async') with_stmt | &('for' | 'async') for_stmt | &'try' try_stmt | &'while' while_stmt | match_stmt
const mark = this.mark;
{
let function_def: any;
if (this.lookahead(() => this._tmp_8(), true) && (function_def = this.function_def()) !== null) {
return function_def;
}
this.mark = mark;
}
{
let if_stmt: any;
if (this.lookahead(() => this.literal("if"), true) && (if_stmt = this.if_stmt()) !== null) {
return if_stmt;
}
this.mark = mark;
}
{
let class_def: any;
if (this.lookahead(() => this._tmp_9(), true) && (class_def = this.class_def()) !== null) {
return class_def;
}
this.mark = mark;
}
{
let with_stmt: any;
if (this.lookahead(() => this._tmp_10(), true) && (with_stmt = this.with_stmt()) !== null) {
return with_stmt;
}
this.mark = mark;
}
{
let for_stmt: any;
if (this.lookahead(() => this._tmp_11(), true) && (for_stmt = this.for_stmt()) !== null) {
return for_stmt;
}
this.mark = mark;
}
{
let try_stmt: any;
if (this.lookahead(() => this.literal("try"), true) && (try_stmt = this.try_stmt()) !== null) {
return try_stmt;
}
this.mark = mark;
}
{
let while_stmt: any;
if (this.lookahead(() => this.literal("while"), true) && (while_stmt = this.while_stmt()) !== null) {
return while_stmt;
}
this.mark = mark;
}
{
let match_stmt: any;
if ((match_stmt = this.match_stmt()) !== null) {
return match_stmt;
}
this.mark = mark;
}
return null;
}
assignment(): any {
// assignment: NAME ':' expression ['=' annotated_rhs] | ('(' single_target ')' | single_subscript_attribute_target) ':' expression ['=' annotated_rhs] | ((star_targets '='))+ annotated_rhs !'=' TYPE_COMMENT? | single_target augassign ~ annotated_rhs
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
let c: any;
if ((a = this.name()) !== null && (literal = this.literal(":")) !== null && (b = this.expression()) !== null && ((c = this._tmp_12()), true)) {
return ast.AnnAssign(this.setContext(a, ast.Store()), b, c, 1, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
let c: any;
if ((a = this._tmp_13()) !== null && (literal = this.literal(":")) !== null && (b = this.expression()) !== null && ((c = this._tmp_14()), true)) {
return ast.AnnAssign(a, b, c, 0, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let b: any;
let tc: any;
if ((a = this._loop1_15()) !== null && (b = this.annotated_rhs()) !== null && this.lookahead(() => this.literal("="), false) && ((tc = this._tmp_16()), true)) {
return ast.Assign(a, b, this.typeComment(tc), ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let b: any;
let cut: any;
let c: any;
if ((a = this.single_target()) !== null && (b = this.augassign()) !== null && (cut = true) && (c = this.annotated_rhs()) !== null) {
return ast.AugAssign(a, b.kind, c, ...this.span(mark));
}
this.mark = mark;
if (cut) return null;
}
return null;
}
annotated_rhs(): any {
// annotated_rhs: yield_expr | star_expressions
const mark = this.mark;
{
let yield_expr: any;
if ((yield_expr = this.yield_expr()) !== null) {
return yield_expr;
}
this.mark = mark;
}
{
let star_expressions: any;
if ((star_expressions = this.star_expressions()) !== null) {
return star_expressions;
}
this.mark = mark;
}
return null;
}
augassign(): any {
// augassign: '+=' | '-=' | '*=' | '@=' | '/=' | '%=' | '&=' | '|=' | '^=' | '<<=' | '>>=' | '**=' | '//='
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("+=")) !== null) {
return {kind: ast.Add()};
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("-=")) !== null) {
return {kind: ast.Sub()};
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("*=")) !== null) {
return {kind: ast.Mult()};
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("@=")) !== null) {
return {kind: ast.MatMult()};
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("/=")) !== null) {
return {kind: ast.Div()};
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("%=")) !== null) {
return {kind: ast.Mod()};
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("&=")) !== null) {
return {kind: ast.BitAnd()};
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("|=")) !== null) {
return {kind: ast.BitOr()};
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("^=")) !== null) {
return {kind: ast.BitXor()};
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("<<=")) !== null) {
return {kind: ast.LShift()};
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal(">>=")) !== null) {
return {kind: ast.RShift()};
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("**=")) !== null) {
return {kind: ast.Pow()};
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("//=")) !== null) {
return {kind: ast.FloorDiv()};
}
this.mark = mark;
}
return null;
}
return_stmt(): any {
// return_stmt: 'return' star_expressions?
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("return")) !== null && ((a = this._tmp_17()), true)) {
return ast.Return(a, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
raise_stmt(): any {
// raise_stmt: 'raise' expression ['from' expression] | 'raise'
const mark = this.mark;
{
let literal: any;
let a: any;
let b: any;
if ((literal = this.literal("raise")) !== null && (a = this.expression()) !== null && ((b = this._tmp_18()), true)) {
return ast.Raise(a, b, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("raise")) !== null) {
return ast.Raise(null, null, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
pass_stmt(): any {
// pass_stmt: 'pass'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("pass")) !== null) {
return ast.Pass(...this.span(mark));
}
this.mark = mark;
}
return null;
}
break_stmt(): any {
// break_stmt: 'break'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("break")) !== null) {
return ast.Break(...this.span(mark));
}
this.mark = mark;
}
return null;
}
continue_stmt(): any {
// continue_stmt: 'continue'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("continue")) !== null) {
return ast.Continue(...this.span(mark));
}
this.mark = mark;
}
return null;
}
global_stmt(): any {
// global_stmt: 'global' ','.NAME+
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("global")) !== null && (a = this._gather_20()) !== null) {
return ast.Global(a.map((name: ast.Name) => name.id), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
nonlocal_stmt(): any {
// nonlocal_stmt: 'nonlocal' ','.NAME+
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("nonlocal")) !== null && (a = this._gather_22()) !== null) {
return ast.Nonlocal(a.map((name: ast.Name) => name.id), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
del_stmt(): any {
// del_stmt: 'del' del_targets &(';' | NEWLINE)
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("del")) !== null && (a = this.del_targets()) !== null && this.lookahead(() => this._tmp_23(), true)) {
return ast.Delete(a, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
yield_stmt(): any {
// yield_stmt: yield_expr
const mark = this.mark;
{
let y: any;
if ((y = this.yield_expr()) !== null) {
return ast.Expr(y, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
assert_stmt(): any {
// assert_stmt: 'assert' expression [',' expression]
const mark = this.mark;
{
let literal: any;
let a: any;
let b: any;
if ((literal = this.literal("assert")) !== null && (a = this.expression()) !== null && ((b = this._tmp_24()), true)) {
return ast.Assert(a, b, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
import_stmt(): any {
// import_stmt: import_name | import_from
const mark = this.mark;
{
let import_name: any;
if ((import_name = this.import_name()) !== null) {
return import_name;
}
this.mark = mark;
}
{
let import_from: any;
if ((import_from = this.import_from()) !== null) {
return import_from;
}
this.mark = mark;
}
return null;
}
import_name(): any {
// import_name: 'import' dotted_as_names
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("import")) !== null && (a = this.dotted_as_names()) !== null) {
return ast.Import(a, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
import_from(): any {
// import_from: 'from' (('.' | '...'))* dotted_name 'import' import_from_targets | 'from' (('.' | '...'))+ 'import' import_from_targets
const mark = this.mark;
{
let literal: any;
let a: any;
let b: any;
let literal_1: any;
let c: any;
if ((literal = this.literal("from")) !== null && (a = this._loop0_25()) !== null && (b = this.dotted_name()) !== null && (literal_1 = this.literal("import")) !== null && (c = this.import_from_targets()) !== null) {
return checkedImport(this, b.id, c, a.reduce((sum: number, token: Token) => sum + token.string.length, 0), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
let b: any;
if ((literal = this.literal("from")) !== null && (a = this._loop1_26()) !== null && (literal_1 = this.literal("import")) !== null && (b = this.import_from_targets()) !== null) {
return ast.ImportFrom(null, b, a.reduce((sum: number, token: Token) => sum + token.string.length, 0), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
import_from_targets(): any {
// import_from_targets: '(' import_from_as_names ','? ')' | import_from_as_names !',' | '*'
const mark = this.mark;
{
let literal: any;
let a: any;
let _tmp_27: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && (a = this.import_from_as_names()) !== null && ((_tmp_27 = this._tmp_27()), true) && (literal_1 = this.literal(")")) !== null) {
return a;
}
this.mark = mark;
}
{
let import_from_as_names: any;
if ((import_from_as_names = this.import_from_as_names()) !== null && this.lookahead(() => this.literal(","), false)) {
return import_from_as_names;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("*")) !== null) {
return [ast.alias("*", null, ...this.span(mark))];
}
this.mark = mark;
}
return null;
}
import_from_as_names(): any {
// import_from_as_names: ','.import_from_as_name+
const mark = this.mark;
{
let a: any;
if ((a = this._gather_29()) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
import_from_as_name(): any {
// import_from_as_name: NAME ['as' NAME]
const mark = this.mark;
{
let a: any;
let b: any;
if ((a = this.name()) !== null && ((b = this._tmp_30()), true)) {
return ast.alias(a.id, (b?.id ?? null), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
dotted_as_names(): any {
// dotted_as_names: ','.dotted_as_name+
const mark = this.mark;
{
let a: any;
if ((a = this._gather_32()) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
dotted_as_name(): any {
// dotted_as_name: dotted_name ['as' NAME]
const mark = this.mark;
{
let a: any;
let b: any;
if ((a = this.dotted_name()) !== null && ((b = this._tmp_33()), true)) {
return ast.alias(a.id, (b?.id ?? null), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
@memoizeLeftRec
dotted_name(): any {
// dotted_name: dotted_name '.' NAME | NAME
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.dotted_name()) !== null && (literal = this.literal(".")) !== null && (b = this.name()) !== null) {
return ast.Name(a.id + '.' + b.id, ast.Load(), a.lineno, a.col_offset, b.end_lineno, b.end_col_offset);
}
this.mark = mark;
}
{
let name: any;
if ((name = this.name()) !== null) {
return name;
}
this.mark = mark;
}
return null;
}
@memoize
block(): any {
// block: NEWLINE INDENT statements DEDENT | simple_stmts | invalid_block
const mark = this.mark;
{
let newline: any;
let indent: any;
let a: any;
let dedent: any;
if ((newline = this.expect("NEWLINE")) !== null && (indent = this.expect("INDENT")) !== null && (a = this.statements()) !== null && (dedent = this.expect("DEDENT")) !== null) {
return a;
}
this.mark = mark;
}
{
let simple_stmts: any;
if ((simple_stmts = this.simple_stmts()) !== null) {
return simple_stmts;
}
this.mark = mark;
}
{
let invalid_block: any;
if ((invalid_block = (this.callInvalidRules ? this.invalid_block() : null)) !== null) {
return invalid_block;
}
this.mark = mark;
}
return null;
}
decorators(): any {
// decorators: (('@' named_expression NEWLINE))+
const mark = this.mark;
{
let a: any;
if ((a = this._loop1_34()) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
class_def(): any {
// class_def: decorators class_def_raw | class_def_raw
const mark = this.mark;
{
let a: any;
let b: any;
if ((a = this.decorators()) !== null && (b = this.class_def_raw()) !== null) {
return {...b, decorator_list: a};
}
this.mark = mark;
}
{
let class_def_raw: any;
if ((class_def_raw = this.class_def_raw()) !== null) {
return class_def_raw;
}
this.mark = mark;
}
return null;
}
class_def_raw(): any {
// class_def_raw: invalid_class_def_raw | 'class' NAME type_params? ['(' arguments? ')'] ':' block
const mark = this.mark;
{
let invalid_class_def_raw: any;
if ((invalid_class_def_raw = (this.callInvalidRules ? this.invalid_class_def_raw() : null)) !== null) {
return invalid_class_def_raw;
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let t: any;
let b: any;
let literal_1: any;
let c: any;
if ((literal = this.literal("class")) !== null && (a = this.name()) !== null && ((t = this._tmp_35()), true) && ((b = this._tmp_36()), true) && (literal_1 = this.literal(":")) !== null && (c = this.block()) !== null) {
return ast.ClassDef(a.id, (b?.args ?? []), (b?.keywords ?? []), c, [], (t ?? []), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
function_def(): any {
// function_def: decorators function_def_raw | function_def_raw
const mark = this.mark;
{
let d: any;
let f: any;
if ((d = this.decorators()) !== null && (f = this.function_def_raw()) !== null) {
return {...f, decorator_list: d};
}
this.mark = mark;
}
{
let function_def_raw: any;
if ((function_def_raw = this.function_def_raw()) !== null) {
return function_def_raw;
}
this.mark = mark;
}
return null;
}
function_def_raw(): any {
// function_def_raw: invalid_def_raw | 'def' NAME type_params? '(' params? ')' ['->' expression] ':' func_type_comment? block | 'async' 'def' NAME type_params? '(' params? ')' ['->' expression] ':' func_type_comment? block
const mark = this.mark;
{
let invalid_def_raw: any;
if ((invalid_def_raw = (this.callInvalidRules ? this.invalid_def_raw() : null)) !== null) {
return invalid_def_raw;
}
this.mark = mark;
}
{
let literal: any;
let n: any;
let t: any;
let literal_1: any;
let params: any;
let literal_2: any;
let a: any;
let literal_3: any;
let tc: any;
let b: any;
if ((literal = this.literal("def")) !== null && (n = this.name()) !== null && ((t = this._tmp_37()), true) && (literal_1 = this.literal("(")) !== null && ((params = this._tmp_38()), true) && (literal_2 = this.literal(")")) !== null && ((a = this._tmp_39()), true) && (literal_3 = this.literal(":")) !== null && ((tc = this._tmp_40()), true) && (b = this.block()) !== null) {
return ast.FunctionDef(n.id, (params ?? ast.arguments([], [], null, [], [], null, [])), b, [], a, this.typeComment(tc), (t ?? []), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let n: any;
let t: any;
let literal_2: any;
let params: any;
let literal_3: any;
let a: any;
let literal_4: any;
let tc: any;
let b: any;
if ((literal = this.literal("async")) !== null && (literal_1 = this.literal("def")) !== null && (n = this.name()) !== null && ((t = this._tmp_41()), true) && (literal_2 = this.literal("(")) !== null && ((params = this._tmp_42()), true) && (literal_3 = this.literal(")")) !== null && ((a = this._tmp_43()), true) && (literal_4 = this.literal(":")) !== null && ((tc = this._tmp_44()), true) && (b = this.block()) !== null) {
return ast.AsyncFunctionDef(n.id, (params ?? ast.arguments([], [], null, [], [], null, [])), b, [], a, this.typeComment(tc), (t ?? []), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
params(): any {
// params: invalid_parameters | parameters
const mark = this.mark;
{
let invalid_parameters: any;
if ((invalid_parameters = (this.callInvalidRules ? this.invalid_parameters() : null)) !== null) {
return invalid_parameters;
}
this.mark = mark;
}
{
let parameters: any;
if ((parameters = this.parameters()) !== null) {
return parameters;
}
this.mark = mark;
}
return null;
}
parameters(): any {
// parameters: slash_no_default param_no_default* param_with_default* star_etc? | slash_with_default param_with_default* star_etc? | param_no_default+ param_with_default* star_etc? | param_with_default+ star_etc? | star_etc
const mark = this.mark;
{
let a: any;
let b: any;
let c: any;
let d: any;
if ((a = this.slash_no_default()) !== null && (b = this._loop0_45()) !== null && (c = this._loop0_46()) !== null && ((d = this._tmp_47()), true)) {
return makeArguments(a, null, b, c, d);
}
this.mark = mark;
}
{
let a: any;
let b: any;
let c: any;
if ((a = this.slash_with_default()) !== null && (b = this._loop0_48()) !== null && ((c = this._tmp_49()), true)) {
return makeArguments(null, a, null, b, c);
}
this.mark = mark;
}
{
let a: any;
let b: any;
let c: any;
if ((a = this._loop1_50()) !== null && (b = this._loop0_51()) !== null && ((c = this._tmp_52()), true)) {
return makeArguments(null, null, a, b, c);
}
this.mark = mark;
}
{
let a: any;
let b: any;
if ((a = this._loop1_53()) !== null && ((b = this._tmp_54()), true)) {
return makeArguments(null, null, null, a, b);
}
this.mark = mark;
}
{
let a: any;
if ((a = this.star_etc()) !== null) {
return makeArguments(null, null, null, null, a);
}
this.mark = mark;
}
return null;
}
slash_no_default(): any {
// slash_no_default: param_no_default+ '/' ',' | param_no_default+ '/' &')'
const mark = this.mark;
{
let a: any;
let literal: any;
let literal_1: any;
if ((a = this._loop1_55()) !== null && (literal = this.literal("/")) !== null && (literal_1 = this.literal(",")) !== null) {
return a;
}
this.mark = mark;
}
{
let a: any;
let literal: any;
if ((a = this._loop1_56()) !== null && (literal = this.literal("/")) !== null && this.lookahead(() => this.literal(")"), true)) {
return a;
}
this.mark = mark;
}
return null;
}
slash_with_default(): any {
// slash_with_default: param_no_default* param_with_default+ '/' ',' | param_no_default* param_with_default+ '/' &')'
const mark = this.mark;
{
let a: any;
let b: any;
let literal: any;
let literal_1: any;
if ((a = this._loop0_57()) !== null && (b = this._loop1_58()) !== null && (literal = this.literal("/")) !== null && (literal_1 = this.literal(",")) !== null) {
return {plainNames: a, namesWithDefaults: b};
}
this.mark = mark;
}
{
let a: any;
let b: any;
let literal: any;
if ((a = this._loop0_59()) !== null && (b = this._loop1_60()) !== null && (literal = this.literal("/")) !== null && this.lookahead(() => this.literal(")"), true)) {
return {plainNames: a, namesWithDefaults: b};
}
this.mark = mark;
}
return null;
}
star_etc(): any {
// star_etc: invalid_star_etc | '*' param_no_default param_maybe_default* kwds? | '*' param_no_default_star_annotation param_maybe_default* kwds? | '*' ',' param_maybe_default+ kwds? | kwds
const mark = this.mark;
{
let invalid_star_etc: any;
if ((invalid_star_etc = (this.callInvalidRules ? this.invalid_star_etc() : null)) !== null) {
return invalid_star_etc;
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let b: any;
let c: any;
if ((literal = this.literal("*")) !== null && (a = this.param_no_default()) !== null && (b = this._loop0_61()) !== null && ((c = this._tmp_62()), true)) {
return {vararg: a, kwonlyargs: b, kwarg: c};
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let b: any;
let c: any;
if ((literal = this.literal("*")) !== null && (a = this.param_no_default_star_annotation()) !== null && (b = this._loop0_63()) !== null && ((c = this._tmp_64()), true)) {
return {vararg: a, kwonlyargs: b, kwarg: c};
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let b: any;
let c: any;
if ((literal = this.literal("*")) !== null && (literal_1 = this.literal(",")) !== null && (b = this._loop1_65()) !== null && ((c = this._tmp_66()), true)) {
return {vararg: null, kwonlyargs: b, kwarg: c};
}
this.mark = mark;
}
{
let a: any;
if ((a = this.kwds()) !== null) {
return {vararg: null, kwonlyargs: null, kwarg: a};
}
this.mark = mark;
}
return null;
}
kwds(): any {
// kwds: invalid_kwds | '**' param_no_default
const mark = this.mark;
{
let invalid_kwds: any;
if ((invalid_kwds = (this.callInvalidRules ? this.invalid_kwds() : null)) !== null) {
return invalid_kwds;
}
this.mark = mark;
}
{
let literal: any;
let a: any;
if ((literal = this.literal("**")) !== null && (a = this.param_no_default()) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
param_no_default(): any {
// param_no_default: param ',' TYPE_COMMENT? | param TYPE_COMMENT? &')'
const mark = this.mark;
{
let a: any;
let literal: any;
let tc: any;
if ((a = this.param()) !== null && (literal = this.literal(",")) !== null && ((tc = this.expect("TYPE_COMMENT")), true)) {
return (this.typeComment(tc), a);
}
this.mark = mark;
}
{
let a: any;
let tc: any;
if ((a = this.param()) !== null && ((tc = this.expect("TYPE_COMMENT")), true) && this.lookahead(() => this.literal(")"), true)) {
return (this.typeComment(tc), a);
}
this.mark = mark;
}
return null;
}
param_no_default_star_annotation(): any {
// param_no_default_star_annotation: param_star_annotation ',' TYPE_COMMENT? | param_star_annotation TYPE_COMMENT? &')'
const mark = this.mark;
{
let a: any;
let literal: any;
let tc: any;
if ((a = this.param_star_annotation()) !== null && (literal = this.literal(",")) !== null && ((tc = this.expect("TYPE_COMMENT")), true)) {
return (this.typeComment(tc), a);
}
this.mark = mark;
}
{
let a: any;
let tc: any;
if ((a = this.param_star_annotation()) !== null && ((tc = this.expect("TYPE_COMMENT")), true) && this.lookahead(() => this.literal(")"), true)) {
return (this.typeComment(tc), a);
}
this.mark = mark;
}
return null;
}
param_with_default(): any {
// param_with_default: param default ',' TYPE_COMMENT? | param default TYPE_COMMENT? &')'
const mark = this.mark;
{
let a: any;
let c: any;
let literal: any;
let tc: any;
if ((a = this.param()) !== null && (c = this.default()) !== null && (literal = this.literal(",")) !== null && ((tc = this.expect("TYPE_COMMENT")), true)) {
return (this.typeComment(tc), {arg: a, value: c});
}
this.mark = mark;
}
{
let a: any;
let c: any;
let tc: any;
if ((a = this.param()) !== null && (c = this.default()) !== null && ((tc = this.expect("TYPE_COMMENT")), true) && this.lookahead(() => this.literal(")"), true)) {
return (this.typeComment(tc), {arg: a, value: c});
}
this.mark = mark;
}
return null;
}
param_maybe_default(): any {
// param_maybe_default: param default? ',' TYPE_COMMENT? | param default? TYPE_COMMENT? &')'
const mark = this.mark;
{
let a: any;
let c: any;
let literal: any;
let tc: any;
if ((a = this.param()) !== null && ((c = this.default()), true) && (literal = this.literal(",")) !== null && ((tc = this.expect("TYPE_COMMENT")), true)) {
return (this.typeComment(tc), {arg: a, value: c});
}
this.mark = mark;
}
{
let a: any;
let c: any;
let tc: any;
if ((a = this.param()) !== null && ((c = this.default()), true) && ((tc = this.expect("TYPE_COMMENT")), true) && this.lookahead(() => this.literal(")"), true)) {
return (this.typeComment(tc), {arg: a, value: c});
}
this.mark = mark;
}
return null;
}
param(): any {
// param: NAME annotation?
const mark = this.mark;
{
let a: any;
let b: any;
if ((a = this.name()) !== null && ((b = this.annotation()), true)) {
return ast.arg(a.id, b, null, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
param_star_annotation(): any {
// param_star_annotation: NAME star_annotation
const mark = this.mark;
{
let a: any;
let b: any;
if ((a = this.name()) !== null && (b = this.star_annotation()) !== null) {
return ast.arg(a.id, b, null, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
annotation(): any {
// annotation: ':' expression
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal(":")) !== null && (a = this.expression()) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
star_annotation(): any {
// star_annotation: ':' star_expression
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal(":")) !== null && (a = this.star_expression()) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
default(): any {
// default: '=' expression | invalid_default
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("=")) !== null && (a = this.expression()) !== null) {
return a;
}
this.mark = mark;
}
{
let invalid_default: any;
if ((invalid_default = (this.callInvalidRules ? this.invalid_default() : null)) !== null) {
return invalid_default;
}
this.mark = mark;
}
return null;
}
if_stmt(): any {
// if_stmt: invalid_if_stmt | 'if' named_expression ':' block elif_stmt | 'if' named_expression ':' block else_block?
const mark = this.mark;
{
let invalid_if_stmt: any;
if ((invalid_if_stmt = (this.callInvalidRules ? this.invalid_if_stmt() : null)) !== null) {
return invalid_if_stmt;
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
let b: any;
let c: any;
if ((literal = this.literal("if")) !== null && (a = this.named_expression()) !== null && (literal_1 = this.literal(":")) !== null && (b = this.block()) !== null && (c = this.elif_stmt()) !== null) {
return ast.If(a, b, [c], ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
let b: any;
let c: any;
if ((literal = this.literal("if")) !== null && (a = this.named_expression()) !== null && (literal_1 = this.literal(":")) !== null && (b = this.block()) !== null && ((c = this._tmp_67()), true)) {
return ast.If(a, b, (c ?? []), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
elif_stmt(): any {
// elif_stmt: invalid_elif_stmt | 'elif' named_expression ':' block elif_stmt | 'elif' named_expression ':' block else_block?
const mark = this.mark;
{
let invalid_elif_stmt: any;
if ((invalid_elif_stmt = (this.callInvalidRules ? this.invalid_elif_stmt() : null)) !== null) {
return invalid_elif_stmt;
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
let b: any;
let c: any;
if ((literal = this.literal("elif")) !== null && (a = this.named_expression()) !== null && (literal_1 = this.literal(":")) !== null && (b = this.block()) !== null && (c = this.elif_stmt()) !== null) {
return ast.If(a, b, [c], ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
let b: any;
let c: any;
if ((literal = this.literal("elif")) !== null && (a = this.named_expression()) !== null && (literal_1 = this.literal(":")) !== null && (b = this.block()) !== null && ((c = this._tmp_68()), true)) {
return ast.If(a, b, (c ?? []), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
else_block(): any {
// else_block: invalid_else_stmt | 'else' &&':' block
const mark = this.mark;
{
let invalid_else_stmt: any;
if ((invalid_else_stmt = (this.callInvalidRules ? this.invalid_else_stmt() : null)) !== null) {
return invalid_else_stmt;
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let b: any;
if ((literal = this.literal("else")) !== null && (literal_1 = this.forcedLiteral(":")) !== null && (b = this.block()) !== null) {
return b;
}
this.mark = mark;
}
return null;
}
while_stmt(): any {
// while_stmt: invalid_while_stmt | 'while' named_expression ':' block else_block?
const mark = this.mark;
{
let invalid_while_stmt: any;
if ((invalid_while_stmt = (this.callInvalidRules ? this.invalid_while_stmt() : null)) !== null) {
return invalid_while_stmt;
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
let b: any;
let c: any;
if ((literal = this.literal("while")) !== null && (a = this.named_expression()) !== null && (literal_1 = this.literal(":")) !== null && (b = this.block()) !== null && ((c = this._tmp_69()), true)) {
return ast.While(a, b, (c ?? []), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
for_stmt(): any {
// for_stmt: invalid_for_stmt | 'for' star_targets 'in' ~ star_expressions ':' TYPE_COMMENT? block else_block? | 'async' 'for' star_targets 'in' ~ star_expressions ':' TYPE_COMMENT? block else_block?
const mark = this.mark;
{
let invalid_for_stmt: any;
if ((invalid_for_stmt = (this.callInvalidRules ? this.invalid_for_stmt() : null)) !== null) {
return invalid_for_stmt;
}
this.mark = mark;
}
{
let literal: any;
let t: any;
let literal_1: any;
let cut: any;
let ex: any;
let literal_2: any;
let tc: any;
let b: any;
let el: any;
if ((literal = this.literal("for")) !== null && (t = this.star_targets()) !== null && (literal_1 = this.literal("in")) !== null && (cut = true) && (ex = this.star_expressions()) !== null && (literal_2 = this.literal(":")) !== null && ((tc = this._tmp_70()), true) && (b = this.block()) !== null && ((el = this._tmp_71()), true)) {
return ast.For(t, ex, b, (el ?? []), this.typeComment(tc), ...this.span(mark));
}
this.mark = mark;
if (cut) return null;
}
{
let literal: any;
let literal_1: any;
let t: any;
let literal_2: any;
let cut: any;
let ex: any;
let literal_3: any;
let tc: any;
let b: any;
let el: any;
if ((literal = this.literal("async")) !== null && (literal_1 = this.literal("for")) !== null && (t = this.star_targets()) !== null && (literal_2 = this.literal("in")) !== null && (cut = true) && (ex = this.star_expressions()) !== null && (literal_3 = this.literal(":")) !== null && ((tc = this._tmp_72()), true) && (b = this.block()) !== null && ((el = this._tmp_73()), true)) {
return ast.AsyncFor(t, ex, b, (el ?? []), this.typeComment(tc), ...this.span(mark));
}
this.mark = mark;
if (cut) return null;
}
return null;
}
with_stmt(): any {
// with_stmt: invalid_with_stmt_indent | 'with' '(' ','.with_item+ ','? ')' ':' TYPE_COMMENT? block | 'with' ','.with_item+ ':' TYPE_COMMENT? block | 'async' 'with' '(' ','.with_item+ ','? ')' ':' block | 'async' 'with' ','.with_item+ ':' TYPE_COMMENT? block | invalid_with_stmt
const mark = this.mark;
{
let invalid_with_stmt_indent: any;
if ((invalid_with_stmt_indent = (this.callInvalidRules ? this.invalid_with_stmt_indent() : null)) !== null) {
return invalid_with_stmt_indent;
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let a: any;
let literal_2: any;
let literal_3: any;
let literal_4: any;
let tc: any;
let b: any;
if ((literal = this.literal("with")) !== null && (literal_1 = this.literal("(")) !== null && (a = this._gather_75()) !== null && ((literal_2 = this.literal(",")), true) && (literal_3 = this.literal(")")) !== null && (literal_4 = this.literal(":")) !== null && ((tc = this._tmp_76()), true) && (b = this.block()) !== null) {
return ast.With(a, b, this.typeComment(tc), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
let tc: any;
let b: any;
if ((literal = this.literal("with")) !== null && (a = this._gather_78()) !== null && (literal_1 = this.literal(":")) !== null && ((tc = this._tmp_79()), true) && (b = this.block()) !== null) {
return ast.With(a, b, this.typeComment(tc), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let literal_2: any;
let a: any;
let literal_3: any;
let literal_4: any;
let literal_5: any;
let b: any;
if ((literal = this.literal("async")) !== null && (literal_1 = this.literal("with")) !== null && (literal_2 = this.literal("(")) !== null && (a = this._gather_81()) !== null && ((literal_3 = this.literal(",")), true) && (literal_4 = this.literal(")")) !== null && (literal_5 = this.literal(":")) !== null && (b = this.block()) !== null) {
return ast.AsyncWith(a, b, null, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let a: any;
let literal_2: any;
let tc: any;
let b: any;
if ((literal = this.literal("async")) !== null && (literal_1 = this.literal("with")) !== null && (a = this._gather_83()) !== null && (literal_2 = this.literal(":")) !== null && ((tc = this._tmp_84()), true) && (b = this.block()) !== null) {
return ast.AsyncWith(a, b, this.typeComment(tc), ...this.span(mark));
}
this.mark = mark;
}
{
let invalid_with_stmt: any;
if ((invalid_with_stmt = (this.callInvalidRules ? this.invalid_with_stmt() : null)) !== null) {
return invalid_with_stmt;
}
this.mark = mark;
}
return null;
}
with_item(): any {
// with_item: expression 'as' star_target &(',' | ')' | ':') | expression
const mark = this.mark;
{
let e: any;
let literal: any;
let t: any;
if ((e = this.expression()) !== null && (literal = this.literal("as")) !== null && (t = this.star_target()) !== null && this.lookahead(() => this._tmp_85(), true)) {
return ast.withitem(e, t);
}
this.mark = mark;
}
{
let e: any;
if ((e = this.expression()) !== null) {
return ast.withitem(e, null);
}
this.mark = mark;
}
return null;
}
try_stmt(): any {
// try_stmt: 'try' &&':' block finally_block | 'try' &&':' block except_block+ else_block? finally_block? | 'try' &&':' block except_star_block+ else_block? finally_block?
const mark = this.mark;
{
let literal: any;
let literal_1: any;
let b: any;
let f: any;
if ((literal = this.literal("try")) !== null && (literal_1 = this.forcedLiteral(":")) !== null && (b = this.block()) !== null && (f = this.finally_block()) !== null) {
return ast.Try(b, [], [], (f ?? []), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let b: any;
let ex: any;
let el: any;
let f: any;
if ((literal = this.literal("try")) !== null && (literal_1 = this.forcedLiteral(":")) !== null && (b = this.block()) !== null && (ex = this._loop1_86()) !== null && ((el = this._tmp_87()), true) && ((f = this._tmp_88()), true)) {
return ast.Try(b, (ex ?? []), (el ?? []), (f ?? []), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let b: any;
let ex: any;
let el: any;
let f: any;
if ((literal = this.literal("try")) !== null && (literal_1 = this.forcedLiteral(":")) !== null && (b = this.block()) !== null && (ex = this._loop1_89()) !== null && ((el = this._tmp_90()), true) && ((f = this._tmp_91()), true)) {
return ast.TryStar(b, (ex ?? []), (el ?? []), (f ?? []), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
except_block(): any {
// except_block: invalid_except_stmt_indent | 'except' expression ':' block | 'except' expression 'as' NAME ':' block | 'except' expressions ':' block | 'except' ':' block
const mark = this.mark;
{
let invalid_except_stmt_indent: any;
if ((invalid_except_stmt_indent = (this.callInvalidRules ? this.invalid_except_stmt_indent() : null)) !== null) {
return invalid_except_stmt_indent;
}
this.mark = mark;
}
{
let literal: any;
let e: any;
let literal_1: any;
let b: any;
if ((literal = this.literal("except")) !== null && (e = this.expression()) !== null && (literal_1 = this.literal(":")) !== null && (b = this.block()) !== null) {
return ast.ExceptHandler(e, null, b, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let e: any;
let literal_1: any;
let t: any;
let literal_2: any;
let b: any;
if ((literal = this.literal("except")) !== null && (e = this.expression()) !== null && (literal_1 = this.literal("as")) !== null && (t = this.name()) !== null && (literal_2 = this.literal(":")) !== null && (b = this.block()) !== null) {
return ast.ExceptHandler(e, t.id, b, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let e: any;
let literal_1: any;
let b: any;
if ((literal = this.literal("except")) !== null && (e = this.expressions()) !== null && (literal_1 = this.literal(":")) !== null && (b = this.block()) !== null) {
return ast.ExceptHandler(e, null, b, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let b: any;
if ((literal = this.literal("except")) !== null && (literal_1 = this.literal(":")) !== null && (b = this.block()) !== null) {
return ast.ExceptHandler(null, null, b, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
except_star_block(): any {
// except_star_block: invalid_except_star_stmt_indent | 'except' '*' expression ':' block | 'except' '*' expression 'as' NAME ':' block | 'except' '*' expressions ':' block
const mark = this.mark;
{
let invalid_except_star_stmt_indent: any;
if ((invalid_except_star_stmt_indent = (this.callInvalidRules ? this.invalid_except_star_stmt_indent() : null)) !== null) {
return invalid_except_star_stmt_indent;
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let e: any;
let literal_2: any;
let b: any;
if ((literal = this.literal("except")) !== null && (literal_1 = this.literal("*")) !== null && (e = this.expression()) !== null && (literal_2 = this.literal(":")) !== null && (b = this.block()) !== null) {
return ast.ExceptHandler(e, null, b, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let e: any;
let literal_2: any;
let t: any;
let literal_3: any;
let b: any;
if ((literal = this.literal("except")) !== null && (literal_1 = this.literal("*")) !== null && (e = this.expression()) !== null && (literal_2 = this.literal("as")) !== null && (t = this.name()) !== null && (literal_3 = this.literal(":")) !== null && (b = this.block()) !== null) {
return ast.ExceptHandler(e, t.id, b, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let e: any;
let literal_2: any;
let b: any;
if ((literal = this.literal("except")) !== null && (literal_1 = this.literal("*")) !== null && (e = this.expressions()) !== null && (literal_2 = this.literal(":")) !== null && (b = this.block()) !== null) {
return ast.ExceptHandler(e, null, b, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
finally_block(): any {
// finally_block: invalid_finally_stmt | 'finally' &&':' block
const mark = this.mark;
{
let invalid_finally_stmt: any;
if ((invalid_finally_stmt = (this.callInvalidRules ? this.invalid_finally_stmt() : null)) !== null) {
return invalid_finally_stmt;
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let a: any;
if ((literal = this.literal("finally")) !== null && (literal_1 = this.forcedLiteral(":")) !== null && (a = this.block()) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
match_stmt(): any {
// match_stmt: "match" subject_expr ':' NEWLINE INDENT case_block+ DEDENT | invalid_match_stmt
const mark = this.mark;
{
let literal: any;
let subject: any;
let literal_1: any;
let newline: any;
let indent: any;
let cases: any;
let dedent: any;
if ((literal = this.literal("match")) !== null && (subject = this.subject_expr()) !== null && (literal_1 = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && (indent = this.expect("INDENT")) !== null && (cases = this._loop1_92()) !== null && (dedent = this.expect("DEDENT")) !== null) {
return ast.Match(subject, cases, ...this.span(mark));
}
this.mark = mark;
}
{
let invalid_match_stmt: any;
if ((invalid_match_stmt = (this.callInvalidRules ? this.invalid_match_stmt() : null)) !== null) {
return invalid_match_stmt;
}
this.mark = mark;
}
return null;
}
subject_expr(): any {
// subject_expr: star_named_expression ',' star_named_expressions? | named_expression
const mark = this.mark;
{
let value: any;
let literal: any;
let values: any;
if ((value = this.star_named_expression()) !== null && (literal = this.literal(",")) !== null && ((values = this.star_named_expressions()), true)) {
return ast.Tuple([value, ...(values ?? [])], ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
{
let named_expression: any;
if ((named_expression = this.named_expression()) !== null) {
return named_expression;
}
this.mark = mark;
}
return null;
}
case_block(): any {
// case_block: invalid_case_block | "case" patterns guard? ':' block
const mark = this.mark;
{
let invalid_case_block: any;
if ((invalid_case_block = (this.callInvalidRules ? this.invalid_case_block() : null)) !== null) {
return invalid_case_block;
}
this.mark = mark;
}
{
let literal: any;
let pattern: any;
let guard: any;
let literal_1: any;
let body: any;
if ((literal = this.literal("case")) !== null && (pattern = this.patterns()) !== null && ((guard = this.guard()), true) && (literal_1 = this.literal(":")) !== null && (body = this.block()) !== null) {
return ast.match_case(pattern, guard, body);
}
this.mark = mark;
}
return null;
}
guard(): any {
// guard: 'if' named_expression
const mark = this.mark;
{
let literal: any;
let guard: any;
if ((literal = this.literal("if")) !== null && (guard = this.named_expression()) !== null) {
return guard;
}
this.mark = mark;
}
return null;
}
patterns(): any {
// patterns: open_sequence_pattern | pattern
const mark = this.mark;
{
let patterns: any;
if ((patterns = this.open_sequence_pattern()) !== null) {
return ast.MatchSequence((patterns ?? []), ...this.span(mark));
}
this.mark = mark;
}
{
let pattern: any;
if ((pattern = this.pattern()) !== null) {
return pattern;
}
this.mark = mark;
}
return null;
}
pattern(): any {
// pattern: as_pattern | or_pattern
const mark = this.mark;
{
let as_pattern: any;
if ((as_pattern = this.as_pattern()) !== null) {
return as_pattern;
}
this.mark = mark;
}
{
let or_pattern: any;
if ((or_pattern = this.or_pattern()) !== null) {
return or_pattern;
}
this.mark = mark;
}
return null;
}
as_pattern(): any {
// as_pattern: or_pattern 'as' pattern_capture_target
const mark = this.mark;
{
let pattern: any;
let literal: any;
let target: any;
if ((pattern = this.or_pattern()) !== null && (literal = this.literal("as")) !== null && (target = this.pattern_capture_target()) !== null) {
return ast.MatchAs(pattern, target.id, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
or_pattern(): any {
// or_pattern: '|'.closed_pattern+
const mark = this.mark;
{
let patterns: any;
if ((patterns = this._gather_94()) !== null) {
return patterns.length === 1 ? patterns[0] : ast.MatchOr(patterns, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
@memoize
closed_pattern(): any {
// closed_pattern: literal_pattern | capture_pattern | wildcard_pattern | value_pattern | group_pattern | sequence_pattern | mapping_pattern | class_pattern
const mark = this.mark;
{
let literal_pattern: any;
if ((literal_pattern = this.literal_pattern()) !== null) {
return literal_pattern;
}
this.mark = mark;
}
{
let capture_pattern: any;
if ((capture_pattern = this.capture_pattern()) !== null) {
return capture_pattern;
}
this.mark = mark;
}
{
let wildcard_pattern: any;
if ((wildcard_pattern = this.wildcard_pattern()) !== null) {
return wildcard_pattern;
}
this.mark = mark;
}
{
let value_pattern: any;
if ((value_pattern = this.value_pattern()) !== null) {
return value_pattern;
}
this.mark = mark;
}
{
let group_pattern: any;
if ((group_pattern = this.group_pattern()) !== null) {
return group_pattern;
}
this.mark = mark;
}
{
let sequence_pattern: any;
if ((sequence_pattern = this.sequence_pattern()) !== null) {
return sequence_pattern;
}
this.mark = mark;
}
{
let mapping_pattern: any;
if ((mapping_pattern = this.mapping_pattern()) !== null) {
return mapping_pattern;
}
this.mark = mark;
}
{
let class_pattern: any;
if ((class_pattern = this.class_pattern()) !== null) {
return class_pattern;
}
this.mark = mark;
}
return null;
}
literal_pattern(): any {
// literal_pattern: signed_number !('+' | '-') | complex_number | strings | 'None' | 'True' | 'False'
const mark = this.mark;
{
let value: any;
if ((value = this.signed_number()) !== null && this.lookahead(() => this._tmp_95(), false)) {
return ast.MatchValue(value, ...this.span(mark));
}
this.mark = mark;
}
{
let value: any;
if ((value = this.complex_number()) !== null) {
return ast.MatchValue(value, ...this.span(mark));
}
this.mark = mark;
}
{
let value: any;
if ((value = this.strings()) !== null) {
return ast.MatchValue(value, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("None")) !== null) {
return ast.MatchSingleton({type: "none"}, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("True")) !== null) {
return ast.MatchSingleton({type: "bool", value: true}, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("False")) !== null) {
return ast.MatchSingleton({type: "bool", value: false}, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
literal_expr(): any {
// literal_expr: signed_number !('+' | '-') | complex_number | &(STRING | FSTRING_START | TSTRING_START) strings | 'None' | 'True' | 'False'
const mark = this.mark;
{
let signed_number: any;
if ((signed_number = this.signed_number()) !== null && this.lookahead(() => this._tmp_96(), false)) {
return signed_number;
}
this.mark = mark;
}
{
let complex_number: any;
if ((complex_number = this.complex_number()) !== null) {
return complex_number;
}
this.mark = mark;
}
{
let strings: any;
if (this.lookahead(() => this._tmp_97(), true) && (strings = this.strings()) !== null) {
return strings;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("None")) !== null) {
return ast.Constant({type: "none"}, null, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("True")) !== null) {
return ast.Constant({type: "bool", value: true}, null, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("False")) !== null) {
return ast.Constant({type: "bool", value: false}, null, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
complex_number(): any {
// complex_number: signed_real_number '+' imaginary_number | signed_real_number '-' imaginary_number
const mark = this.mark;
{
let real: any;
let literal: any;
let imag: any;
if ((real = this.signed_real_number()) !== null && (literal = this.literal("+")) !== null && (imag = this.imaginary_number()) !== null) {
return ast.BinOp(real, ast.Add(), imag, ...this.span(mark));
}
this.mark = mark;
}
{
let real: any;
let literal: any;
let imag: any;
if ((real = this.signed_real_number()) !== null && (literal = this.literal("-")) !== null && (imag = this.imaginary_number()) !== null) {
return ast.BinOp(real, ast.Sub(), imag, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
signed_number(): any {
// signed_number: NUMBER | '-' NUMBER
const mark = this.mark;
{
let number: any;
if ((number = this.number()) !== null) {
return number;
}
this.mark = mark;
}
{
let literal: any;
let number: any;
if ((literal = this.literal("-")) !== null && (number = this.number()) !== null) {
return ast.UnaryOp(ast.USub(), number, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
signed_real_number(): any {
// signed_real_number: real_number | '-' real_number
const mark = this.mark;
{
let real_number: any;
if ((real_number = this.real_number()) !== null) {
return real_number;
}
this.mark = mark;
}
{
let literal: any;
let real: any;
if ((literal = this.literal("-")) !== null && (real = this.real_number()) !== null) {
return ast.UnaryOp(ast.USub(), real, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
real_number(): any {
// real_number: NUMBER
const mark = this.mark;
{
let real: any;
if ((real = this.number()) !== null) {
return this.ensurePatternNumber(real, false);
}
this.mark = mark;
}
return null;
}
imaginary_number(): any {
// imaginary_number: NUMBER
const mark = this.mark;
{
let imag: any;
if ((imag = this.number()) !== null) {
return this.ensurePatternNumber(imag, true);
}
this.mark = mark;
}
return null;
}
capture_pattern(): any {
// capture_pattern: pattern_capture_target
const mark = this.mark;
{
let target: any;
if ((target = this.pattern_capture_target()) !== null) {
return ast.MatchAs(null, target.id, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
pattern_capture_target(): any {
// pattern_capture_target: !"_" NAME !('.' | '(' | '=')
const mark = this.mark;
{
let name: any;
if (this.lookahead(() => this.literal("_"), false) && (name = this.name()) !== null && this.lookahead(() => this._tmp_98(), false)) {
return this.setContext(name, ast.Store());
}
this.mark = mark;
}
return null;
}
wildcard_pattern(): any {
// wildcard_pattern: "_"
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("_")) !== null) {
return ast.MatchAs(null, null, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
value_pattern(): any {
// value_pattern: attr !('.' | '(' | '=')
const mark = this.mark;
{
let attr: any;
if ((attr = this.attr()) !== null && this.lookahead(() => this._tmp_99(), false)) {
return ast.MatchValue(attr, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
@memoizeLeftRec
attr(): any {
// attr: name_or_attr '.' NAME
const mark = this.mark;
{
let value: any;
let literal: any;
let attr: any;
if ((value = this.name_or_attr()) !== null && (literal = this.literal(".")) !== null && (attr = this.name()) !== null) {
return ast.Attribute(value, attr.id, ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
name_or_attr(): any {
// name_or_attr: attr | NAME
const mark = this.mark;
{
let attr: any;
if ((attr = this.attr()) !== null) {
return attr;
}
this.mark = mark;
}
{
let name: any;
if ((name = this.name()) !== null) {
return name;
}
this.mark = mark;
}
return null;
}
group_pattern(): any {
// group_pattern: '(' pattern ')'
const mark = this.mark;
{
let literal: any;
let pattern: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && (pattern = this.pattern()) !== null && (literal_1 = this.literal(")")) !== null) {
return pattern;
}
this.mark = mark;
}
return null;
}
sequence_pattern(): any {
// sequence_pattern: '[' maybe_sequence_pattern? ']' | '(' open_sequence_pattern? ')'
const mark = this.mark;
{
let literal: any;
let patterns: any;
let literal_1: any;
if ((literal = this.literal("[")) !== null && ((patterns = this.maybe_sequence_pattern()), true) && (literal_1 = this.literal("]")) !== null) {
return ast.MatchSequence((patterns ?? []), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let patterns: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && ((patterns = this.open_sequence_pattern()), true) && (literal_1 = this.literal(")")) !== null) {
return ast.MatchSequence((patterns ?? []), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
open_sequence_pattern(): any {
// open_sequence_pattern: maybe_star_pattern ',' maybe_sequence_pattern?
const mark = this.mark;
{
let pattern: any;
let literal: any;
let patterns: any;
if ((pattern = this.maybe_star_pattern()) !== null && (literal = this.literal(",")) !== null && ((patterns = this.maybe_sequence_pattern()), true)) {
return [pattern, ...(patterns ?? [])];
}
this.mark = mark;
}
return null;
}
maybe_sequence_pattern(): any {
// maybe_sequence_pattern: ','.maybe_star_pattern+ ','?
const mark = this.mark;
{
let patterns: any;
let literal: any;
if ((patterns = this._gather_101()) !== null && ((literal = this.literal(",")), true)) {
return patterns;
}
this.mark = mark;
}
return null;
}
maybe_star_pattern(): any {
// maybe_star_pattern: star_pattern | pattern
const mark = this.mark;
{
let star_pattern: any;
if ((star_pattern = this.star_pattern()) !== null) {
return star_pattern;
}
this.mark = mark;
}
{
let pattern: any;
if ((pattern = this.pattern()) !== null) {
return pattern;
}
this.mark = mark;
}
return null;
}
@memoize
star_pattern(): any {
// star_pattern: '*' pattern_capture_target | '*' wildcard_pattern
const mark = this.mark;
{
let literal: any;
let target: any;
if ((literal = this.literal("*")) !== null && (target = this.pattern_capture_target()) !== null) {
return ast.MatchStar(target.id, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let wildcard_pattern: any;
if ((literal = this.literal("*")) !== null && (wildcard_pattern = this.wildcard_pattern()) !== null) {
return ast.MatchStar(null, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
mapping_pattern(): any {
// mapping_pattern: '{' '}' | '{' double_star_pattern ','? '}' | '{' items_pattern ',' double_star_pattern ','? '}' | '{' items_pattern ','? '}'
const mark = this.mark;
{
let literal: any;
let literal_1: any;
if ((literal = this.literal("{")) !== null && (literal_1 = this.literal("}")) !== null) {
return ast.MatchMapping([], [], null, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let rest: any;
let literal_1: any;
let literal_2: any;
if ((literal = this.literal("{")) !== null && (rest = this.double_star_pattern()) !== null && ((literal_1 = this.literal(",")), true) && (literal_2 = this.literal("}")) !== null) {
return ast.MatchMapping([], [], rest.id, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let items: any;
let literal_1: any;
let rest: any;
let literal_2: any;
let literal_3: any;
if ((literal = this.literal("{")) !== null && (items = this.items_pattern()) !== null && (literal_1 = this.literal(",")) !== null && (rest = this.double_star_pattern()) !== null && ((literal_2 = this.literal(",")), true) && (literal_3 = this.literal("}")) !== null) {
return ast.MatchMapping(items.map((pair: any) => pair.key), items.map((pair: any) => pair.pattern), rest.id, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let items: any;
let literal_1: any;
let literal_2: any;
if ((literal = this.literal("{")) !== null && (items = this.items_pattern()) !== null && ((literal_1 = this.literal(",")), true) && (literal_2 = this.literal("}")) !== null) {
return ast.MatchMapping(items.map((pair: any) => pair.key), items.map((pair: any) => pair.pattern), null, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
items_pattern(): any {
// items_pattern: ','.key_value_pattern+
const mark = this.mark;
{
let _gather_103: any;
if ((_gather_103 = this._gather_103()) !== null) {
return _gather_103;
}
this.mark = mark;
}
return null;
}
key_value_pattern(): any {
// key_value_pattern: (literal_expr | attr) ':' pattern
const mark = this.mark;
{
let key: any;
let literal: any;
let pattern: any;
if ((key = this._tmp_104()) !== null && (literal = this.literal(":")) !== null && (pattern = this.pattern()) !== null) {
return {key: key, pattern: pattern};
}
this.mark = mark;
}
return null;
}
double_star_pattern(): any {
// double_star_pattern: '**' pattern_capture_target
const mark = this.mark;
{
let literal: any;
let target: any;
if ((literal = this.literal("**")) !== null && (target = this.pattern_capture_target()) !== null) {
return target;
}
this.mark = mark;
}
return null;
}
class_pattern(): any {
// class_pattern: name_or_attr '(' ')' | name_or_attr '(' positional_patterns ','? ')' | name_or_attr '(' keyword_patterns ','? ')' | name_or_attr '(' positional_patterns ',' keyword_patterns ','? ')'
const mark = this.mark;
{
let cls: any;
let literal: any;
let literal_1: any;
if ((cls = this.name_or_attr()) !== null && (literal = this.literal("(")) !== null && (literal_1 = this.literal(")")) !== null) {
return ast.MatchClass(cls, [], [], [], ...this.span(mark));
}
this.mark = mark;
}
{
let cls: any;
let literal: any;
let patterns: any;
let literal_1: any;
let literal_2: any;
if ((cls = this.name_or_attr()) !== null && (literal = this.literal("(")) !== null && (patterns = this.positional_patterns()) !== null && ((literal_1 = this.literal(",")), true) && (literal_2 = this.literal(")")) !== null) {
return ast.MatchClass(cls, patterns, [], [], ...this.span(mark));
}
this.mark = mark;
}
{
let cls: any;
let literal: any;
let keywords: any;
let literal_1: any;
let literal_2: any;
if ((cls = this.name_or_attr()) !== null && (literal = this.literal("(")) !== null && (keywords = this.keyword_patterns()) !== null && ((literal_1 = this.literal(",")), true) && (literal_2 = this.literal(")")) !== null) {
return ast.MatchClass(cls, [], keywords.map((pair: any) => pair.key).map((name: ast.Name) => name.id), keywords.map((pair: any) => pair.pattern), ...this.span(mark));
}
this.mark = mark;
}
{
let cls: any;
let literal: any;
let patterns: any;
let literal_1: any;
let keywords: any;
let literal_2: any;
let literal_3: any;
if ((cls = this.name_or_attr()) !== null && (literal = this.literal("(")) !== null && (patterns = this.positional_patterns()) !== null && (literal_1 = this.literal(",")) !== null && (keywords = this.keyword_patterns()) !== null && ((literal_2 = this.literal(",")), true) && (literal_3 = this.literal(")")) !== null) {
return ast.MatchClass(cls, patterns, keywords.map((pair: any) => pair.key).map((name: ast.Name) => name.id), keywords.map((pair: any) => pair.pattern), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
positional_patterns(): any {
// positional_patterns: ','.pattern+
const mark = this.mark;
{
let args: any;
if ((args = this._gather_106()) !== null) {
return args;
}
this.mark = mark;
}
return null;
}
keyword_patterns(): any {
// keyword_patterns: ','.keyword_pattern+
const mark = this.mark;
{
let _gather_108: any;
if ((_gather_108 = this._gather_108()) !== null) {
return _gather_108;
}
this.mark = mark;
}
return null;
}
keyword_pattern(): any {
// keyword_pattern: NAME '=' pattern
const mark = this.mark;
{
let arg: any;
let literal: any;
let value: any;
if ((arg = this.name()) !== null && (literal = this.literal("=")) !== null && (value = this.pattern()) !== null) {
return {key: arg, pattern: value};
}
this.mark = mark;
}
return null;
}
type_alias(): any {
// type_alias: "type" NAME type_params? '=' expression
const mark = this.mark;
{
let literal: any;
let n: any;
let t: any;
let literal_1: any;
let b: any;
if ((literal = this.literal("type")) !== null && (n = this.name()) !== null && ((t = this._tmp_109()), true) && (literal_1 = this.literal("=")) !== null && (b = this.expression()) !== null) {
return ast.TypeAlias(this.setContext(n, ast.Store()), (t ?? []), b, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
type_params(): any {
// type_params: '[' type_param_seq ']'
const mark = this.mark;
{
let literal: any;
let t: any;
let literal_1: any;
if ((literal = this.literal("[")) !== null && (t = this.type_param_seq()) !== null && (literal_1 = this.literal("]")) !== null) {
return t;
}
this.mark = mark;
}
return null;
}
type_param_seq(): any {
// type_param_seq: ','.type_param+ ','?
const mark = this.mark;
{
let a: any;
let _tmp_112: any;
if ((a = this._gather_111()) !== null && ((_tmp_112 = this._tmp_112()), true)) {
return a;
}
this.mark = mark;
}
return null;
}
@memoize
type_param(): any {
// type_param: NAME type_param_bound? type_param_default? | '*' NAME type_param_starred_default? | '**' NAME type_param_default?
const mark = this.mark;
{
let a: any;
let b: any;
let c: any;
if ((a = this.name()) !== null && ((b = this._tmp_113()), true) && ((c = this._tmp_114()), true)) {
return ast.TypeVar(a.id, b, c, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let b: any;
if ((literal = this.literal("*")) !== null && (a = this.name()) !== null && ((b = this._tmp_115()), true)) {
return ast.TypeVarTuple(a.id, b, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let b: any;
if ((literal = this.literal("**")) !== null && (a = this.name()) !== null && ((b = this._tmp_116()), true)) {
return ast.ParamSpec(a.id, b, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
type_param_bound(): any {
// type_param_bound: ':' expression
const mark = this.mark;
{
let literal: any;
let e: any;
if ((literal = this.literal(":")) !== null && (e = this.expression()) !== null) {
return e;
}
this.mark = mark;
}
return null;
}
type_param_default(): any {
// type_param_default: '=' expression
const mark = this.mark;
{
let literal: any;
let e: any;
if ((literal = this.literal("=")) !== null && (e = this.expression()) !== null) {
return e;
}
this.mark = mark;
}
return null;
}
type_param_starred_default(): any {
// type_param_starred_default: '=' star_expression
const mark = this.mark;
{
let literal: any;
let e: any;
if ((literal = this.literal("=")) !== null && (e = this.star_expression()) !== null) {
return e;
}
this.mark = mark;
}
return null;
}
expressions(): any {
// expressions: expression ((',' expression))+ ','? | expression ',' | expression
const mark = this.mark;
{
let a: any;
let b: any;
let _tmp_118: any;
if ((a = this.expression()) !== null && (b = this._loop1_117()) !== null && ((_tmp_118 = this._tmp_118()), true)) {
return ast.Tuple([a, ...(b ?? [])], ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
if ((a = this.expression()) !== null && (literal = this.literal(",")) !== null) {
return ast.Tuple([a], ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
{
let expression: any;
if ((expression = this.expression()) !== null) {
return expression;
}
this.mark = mark;
}
return null;
}
@memoize
expression(): any {
// expression: disjunction 'if' disjunction 'else' expression | disjunction | lambdef
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
let literal_1: any;
let c: any;
if ((a = this.disjunction()) !== null && (literal = this.literal("if")) !== null && (b = this.disjunction()) !== null && (literal_1 = this.literal("else")) !== null && (c = this.expression()) !== null) {
return ast.IfExp(b, a, c, ...this.span(mark));
}
this.mark = mark;
}
{
let disjunction: any;
if ((disjunction = this.disjunction()) !== null) {
return disjunction;
}
this.mark = mark;
}
{
let lambdef: any;
if ((lambdef = this.lambdef()) !== null) {
return lambdef;
}
this.mark = mark;
}
return null;
}
yield_expr(): any {
// yield_expr: 'yield' 'from' expression | 'yield' star_expressions?
const mark = this.mark;
{
let literal: any;
let literal_1: any;
let a: any;
if ((literal = this.literal("yield")) !== null && (literal_1 = this.literal("from")) !== null && (a = this.expression()) !== null) {
return ast.YieldFrom(a, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
if ((literal = this.literal("yield")) !== null && ((a = this._tmp_119()), true)) {
return ast.Yield(a, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
star_expressions(): any {
// star_expressions: star_expression ((',' star_expression))+ ','? | star_expression ',' | star_expression
const mark = this.mark;
{
let a: any;
let b: any;
let _tmp_121: any;
if ((a = this.star_expression()) !== null && (b = this._loop1_120()) !== null && ((_tmp_121 = this._tmp_121()), true)) {
return ast.Tuple([a, ...(b ?? [])], ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
if ((a = this.star_expression()) !== null && (literal = this.literal(",")) !== null) {
return ast.Tuple([a], ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
{
let star_expression: any;
if ((star_expression = this.star_expression()) !== null) {
return star_expression;
}
this.mark = mark;
}
return null;
}
@memoize
star_expression(): any {
// star_expression: '*' bitwise_or | expression
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("*")) !== null && (a = this.bitwise_or()) !== null) {
return ast.Starred(a, ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
{
let expression: any;
if ((expression = this.expression()) !== null) {
return expression;
}
this.mark = mark;
}
return null;
}
star_named_expressions(): any {
// star_named_expressions: ','.star_named_expression+ ','?
const mark = this.mark;
{
let a: any;
let _tmp_124: any;
if ((a = this._gather_123()) !== null && ((_tmp_124 = this._tmp_124()), true)) {
return a;
}
this.mark = mark;
}
return null;
}
star_named_expression(): any {
// star_named_expression: '*' bitwise_or | named_expression
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("*")) !== null && (a = this.bitwise_or()) !== null) {
return ast.Starred(a, ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
{
let named_expression: any;
if ((named_expression = this.named_expression()) !== null) {
return named_expression;
}
this.mark = mark;
}
return null;
}
assignment_expression(): any {
// assignment_expression: NAME ':=' ~ expression
const mark = this.mark;
{
let a: any;
let literal: any;
let cut: any;
let b: any;
if ((a = this.name()) !== null && (literal = this.literal(":=")) !== null && (cut = true) && (b = this.expression()) !== null) {
return ast.NamedExpr(this.setContext(a, ast.Store()), b, ...this.span(mark));
}
this.mark = mark;
if (cut) return null;
}
return null;
}
named_expression(): any {
// named_expression: assignment_expression | expression !':='
const mark = this.mark;
{
let assignment_expression: any;
if ((assignment_expression = this.assignment_expression()) !== null) {
return assignment_expression;
}
this.mark = mark;
}
{
let expression: any;
if ((expression = this.expression()) !== null && this.lookahead(() => this.literal(":="), false)) {
return expression;
}
this.mark = mark;
}
return null;
}
@memoize
disjunction(): any {
// disjunction: conjunction (('or' conjunction))+ | conjunction
const mark = this.mark;
{
let a: any;
let b: any;
if ((a = this.conjunction()) !== null && (b = this._loop1_125()) !== null) {
return ast.BoolOp(ast.Or(), [a, ...(b ?? [])], ...this.span(mark));
}
this.mark = mark;
}
{
let conjunction: any;
if ((conjunction = this.conjunction()) !== null) {
return conjunction;
}
this.mark = mark;
}
return null;
}
@memoize
conjunction(): any {
// conjunction: inversion (('and' inversion))+ | inversion
const mark = this.mark;
{
let a: any;
let b: any;
if ((a = this.inversion()) !== null && (b = this._loop1_126()) !== null) {
return ast.BoolOp(ast.And(), [a, ...(b ?? [])], ...this.span(mark));
}
this.mark = mark;
}
{
let inversion: any;
if ((inversion = this.inversion()) !== null) {
return inversion;
}
this.mark = mark;
}
return null;
}
@memoize
inversion(): any {
// inversion: 'not' inversion | comparison
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("not")) !== null && (a = this.inversion()) !== null) {
return ast.UnaryOp(ast.Not(), a, ...this.span(mark));
}
this.mark = mark;
}
{
let comparison: any;
if ((comparison = this.comparison()) !== null) {
return comparison;
}
this.mark = mark;
}
return null;
}
comparison(): any {
// comparison: bitwise_or compare_op_bitwise_or_pair+ | bitwise_or
const mark = this.mark;
{
let a: any;
let b: any;
if ((a = this.bitwise_or()) !== null && (b = this._loop1_127()) !== null) {
return ast.Compare(a, b.map((pair: any) => pair.op), b.map((pair: any) => pair.expr), ...this.span(mark));
}
this.mark = mark;
}
{
let bitwise_or: any;
if ((bitwise_or = this.bitwise_or()) !== null) {
return bitwise_or;
}
this.mark = mark;
}
return null;
}
compare_op_bitwise_or_pair(): any {
// compare_op_bitwise_or_pair: eq_bitwise_or | noteq_bitwise_or | lte_bitwise_or | lt_bitwise_or | gte_bitwise_or | gt_bitwise_or | notin_bitwise_or | in_bitwise_or | isnot_bitwise_or | is_bitwise_or
const mark = this.mark;
{
let eq_bitwise_or: any;
if ((eq_bitwise_or = this.eq_bitwise_or()) !== null) {
return eq_bitwise_or;
}
this.mark = mark;
}
{
let noteq_bitwise_or: any;
if ((noteq_bitwise_or = this.noteq_bitwise_or()) !== null) {
return noteq_bitwise_or;
}
this.mark = mark;
}
{
let lte_bitwise_or: any;
if ((lte_bitwise_or = this.lte_bitwise_or()) !== null) {
return lte_bitwise_or;
}
this.mark = mark;
}
{
let lt_bitwise_or: any;
if ((lt_bitwise_or = this.lt_bitwise_or()) !== null) {
return lt_bitwise_or;
}
this.mark = mark;
}
{
let gte_bitwise_or: any;
if ((gte_bitwise_or = this.gte_bitwise_or()) !== null) {
return gte_bitwise_or;
}
this.mark = mark;
}
{
let gt_bitwise_or: any;
if ((gt_bitwise_or = this.gt_bitwise_or()) !== null) {
return gt_bitwise_or;
}
this.mark = mark;
}
{
let notin_bitwise_or: any;
if ((notin_bitwise_or = this.notin_bitwise_or()) !== null) {
return notin_bitwise_or;
}
this.mark = mark;
}
{
let in_bitwise_or: any;
if ((in_bitwise_or = this.in_bitwise_or()) !== null) {
return in_bitwise_or;
}
this.mark = mark;
}
{
let isnot_bitwise_or: any;
if ((isnot_bitwise_or = this.isnot_bitwise_or()) !== null) {
return isnot_bitwise_or;
}
this.mark = mark;
}
{
let is_bitwise_or: any;
if ((is_bitwise_or = this.is_bitwise_or()) !== null) {
return is_bitwise_or;
}
this.mark = mark;
}
return null;
}
eq_bitwise_or(): any {
// eq_bitwise_or: '==' bitwise_or
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("==")) !== null && (a = this.bitwise_or()) !== null) {
return {op: ast.Eq(), expr: a};
}
this.mark = mark;
}
return null;
}
noteq_bitwise_or(): any {
// noteq_bitwise_or: ('!=') bitwise_or
const mark = this.mark;
{
let _tmp_128: any;
let a: any;
if ((_tmp_128 = this._tmp_128()) !== null && (a = this.bitwise_or()) !== null) {
return {op: ast.NotEq(), expr: a};
}
this.mark = mark;
}
return null;
}
lte_bitwise_or(): any {
// lte_bitwise_or: '<=' bitwise_or
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("<=")) !== null && (a = this.bitwise_or()) !== null) {
return {op: ast.LtE(), expr: a};
}
this.mark = mark;
}
return null;
}
lt_bitwise_or(): any {
// lt_bitwise_or: '<' bitwise_or
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("<")) !== null && (a = this.bitwise_or()) !== null) {
return {op: ast.Lt(), expr: a};
}
this.mark = mark;
}
return null;
}
gte_bitwise_or(): any {
// gte_bitwise_or: '>=' bitwise_or
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal(">=")) !== null && (a = this.bitwise_or()) !== null) {
return {op: ast.GtE(), expr: a};
}
this.mark = mark;
}
return null;
}
gt_bitwise_or(): any {
// gt_bitwise_or: '>' bitwise_or
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal(">")) !== null && (a = this.bitwise_or()) !== null) {
return {op: ast.Gt(), expr: a};
}
this.mark = mark;
}
return null;
}
notin_bitwise_or(): any {
// notin_bitwise_or: 'not' 'in' bitwise_or
const mark = this.mark;
{
let literal: any;
let literal_1: any;
let a: any;
if ((literal = this.literal("not")) !== null && (literal_1 = this.literal("in")) !== null && (a = this.bitwise_or()) !== null) {
return {op: ast.NotIn(), expr: a};
}
this.mark = mark;
}
return null;
}
in_bitwise_or(): any {
// in_bitwise_or: 'in' bitwise_or
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("in")) !== null && (a = this.bitwise_or()) !== null) {
return {op: ast.In(), expr: a};
}
this.mark = mark;
}
return null;
}
isnot_bitwise_or(): any {
// isnot_bitwise_or: 'is' 'not' bitwise_or
const mark = this.mark;
{
let literal: any;
let literal_1: any;
let a: any;
if ((literal = this.literal("is")) !== null && (literal_1 = this.literal("not")) !== null && (a = this.bitwise_or()) !== null) {
return {op: ast.IsNot(), expr: a};
}
this.mark = mark;
}
return null;
}
is_bitwise_or(): any {
// is_bitwise_or: 'is' bitwise_or
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("is")) !== null && (a = this.bitwise_or()) !== null) {
return {op: ast.Is(), expr: a};
}
this.mark = mark;
}
return null;
}
@memoizeLeftRec
bitwise_or(): any {
// bitwise_or: bitwise_or '|' bitwise_xor | bitwise_xor
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.bitwise_or()) !== null && (literal = this.literal("|")) !== null && (b = this.bitwise_xor()) !== null) {
return ast.BinOp(a, ast.BitOr(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let bitwise_xor: any;
if ((bitwise_xor = this.bitwise_xor()) !== null) {
return bitwise_xor;
}
this.mark = mark;
}
return null;
}
@memoizeLeftRec
bitwise_xor(): any {
// bitwise_xor: bitwise_xor '^' bitwise_and | bitwise_and
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.bitwise_xor()) !== null && (literal = this.literal("^")) !== null && (b = this.bitwise_and()) !== null) {
return ast.BinOp(a, ast.BitXor(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let bitwise_and: any;
if ((bitwise_and = this.bitwise_and()) !== null) {
return bitwise_and;
}
this.mark = mark;
}
return null;
}
@memoizeLeftRec
bitwise_and(): any {
// bitwise_and: bitwise_and '&' shift_expr | shift_expr
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.bitwise_and()) !== null && (literal = this.literal("&")) !== null && (b = this.shift_expr()) !== null) {
return ast.BinOp(a, ast.BitAnd(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let shift_expr: any;
if ((shift_expr = this.shift_expr()) !== null) {
return shift_expr;
}
this.mark = mark;
}
return null;
}
@memoizeLeftRec
shift_expr(): any {
// shift_expr: shift_expr '<<' sum | shift_expr '>>' sum | sum
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.shift_expr()) !== null && (literal = this.literal("<<")) !== null && (b = this.sum()) !== null) {
return ast.BinOp(a, ast.LShift(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
if ((a = this.shift_expr()) !== null && (literal = this.literal(">>")) !== null && (b = this.sum()) !== null) {
return ast.BinOp(a, ast.RShift(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let sum: any;
if ((sum = this.sum()) !== null) {
return sum;
}
this.mark = mark;
}
return null;
}
@memoizeLeftRec
sum(): any {
// sum: sum '+' term | sum '-' term | term
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.sum()) !== null && (literal = this.literal("+")) !== null && (b = this.term()) !== null) {
return ast.BinOp(a, ast.Add(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
if ((a = this.sum()) !== null && (literal = this.literal("-")) !== null && (b = this.term()) !== null) {
return ast.BinOp(a, ast.Sub(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let term: any;
if ((term = this.term()) !== null) {
return term;
}
this.mark = mark;
}
return null;
}
@memoizeLeftRec
term(): any {
// term: term '*' factor | term '/' factor | term '//' factor | term '%' factor | term '@' factor | factor
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.term()) !== null && (literal = this.literal("*")) !== null && (b = this.factor()) !== null) {
return ast.BinOp(a, ast.Mult(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
if ((a = this.term()) !== null && (literal = this.literal("/")) !== null && (b = this.factor()) !== null) {
return ast.BinOp(a, ast.Div(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
if ((a = this.term()) !== null && (literal = this.literal("//")) !== null && (b = this.factor()) !== null) {
return ast.BinOp(a, ast.FloorDiv(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
if ((a = this.term()) !== null && (literal = this.literal("%")) !== null && (b = this.factor()) !== null) {
return ast.BinOp(a, ast.Mod(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
if ((a = this.term()) !== null && (literal = this.literal("@")) !== null && (b = this.factor()) !== null) {
return ast.BinOp(a, ast.MatMult(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let factor: any;
if ((factor = this.factor()) !== null) {
return factor;
}
this.mark = mark;
}
return null;
}
@memoize
factor(): any {
// factor: '+' factor | '-' factor | '~' factor | power
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("+")) !== null && (a = this.factor()) !== null) {
return ast.UnaryOp(ast.UAdd(), a, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
if ((literal = this.literal("-")) !== null && (a = this.factor()) !== null) {
return ast.UnaryOp(ast.USub(), a, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
if ((literal = this.literal("~")) !== null && (a = this.factor()) !== null) {
return ast.UnaryOp(ast.Invert(), a, ...this.span(mark));
}
this.mark = mark;
}
{
let power: any;
if ((power = this.power()) !== null) {
return power;
}
this.mark = mark;
}
return null;
}
power(): any {
// power: await_primary '**' factor | await_primary
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.await_primary()) !== null && (literal = this.literal("**")) !== null && (b = this.factor()) !== null) {
return ast.BinOp(a, ast.Pow(), b, ...this.span(mark));
}
this.mark = mark;
}
{
let await_primary: any;
if ((await_primary = this.await_primary()) !== null) {
return await_primary;
}
this.mark = mark;
}
return null;
}
@memoize
await_primary(): any {
// await_primary: 'await' primary | primary
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("await")) !== null && (a = this.primary()) !== null) {
return ast.Await(a, ...this.span(mark));
}
this.mark = mark;
}
{
let primary: any;
if ((primary = this.primary()) !== null) {
return primary;
}
this.mark = mark;
}
return null;
}
@memoizeLeftRec
primary(): any {
// primary: primary '.' NAME | primary genexp | primary '(' arguments? ')' | primary '[' slices ']' | atom
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.primary()) !== null && (literal = this.literal(".")) !== null && (b = this.name()) !== null) {
return ast.Attribute(a, b.id, ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let b: any;
if ((a = this.primary()) !== null && (b = this.genexp()) !== null) {
return ast.Call(a, [b], [], ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
let literal_1: any;
if ((a = this.primary()) !== null && (literal = this.literal("(")) !== null && ((b = this._tmp_129()), true) && (literal_1 = this.literal(")")) !== null) {
return ast.Call(a, (b?.args ?? []), (b?.keywords ?? []), ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
let literal_1: any;
if ((a = this.primary()) !== null && (literal = this.literal("[")) !== null && (b = this.slices()) !== null && (literal_1 = this.literal("]")) !== null) {
return ast.Subscript(a, b, ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
{
let atom: any;
if ((atom = this.atom()) !== null) {
return atom;
}
this.mark = mark;
}
return null;
}
slices(): any {
// slices: slice !',' | ','.(slice | starred_expression)+ ','?
const mark = this.mark;
{
let a: any;
if ((a = this.slice()) !== null && this.lookahead(() => this.literal(","), false)) {
return a;
}
this.mark = mark;
}
{
let a: any;
let _tmp_132: any;
if ((a = this._gather_131()) !== null && ((_tmp_132 = this._tmp_132()), true)) {
return ast.Tuple((a ?? []), ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
slice(): any {
// slice: expression? ':' expression? [':' expression?] | named_expression
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
let c: any;
if (((a = this._tmp_133()), true) && (literal = this.literal(":")) !== null && ((b = this._tmp_134()), true) && ((c = this._tmp_135()), true)) {
return ast.Slice(a, b, c, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
if ((a = this.named_expression()) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
atom(): any {
// atom: NAME | 'True' | 'False' | 'None' | &(STRING | FSTRING_START | TSTRING_START) strings | NUMBER | &'(' (tuple | group | genexp) | &'[' (list | listcomp) | &'{' (dict | set | dictcomp | setcomp) | '...'
const mark = this.mark;
{
let name: any;
if ((name = this.name()) !== null) {
return name;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("True")) !== null) {
return ast.Constant({type: "bool", value: true}, null, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("False")) !== null) {
return ast.Constant({type: "bool", value: false}, null, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("None")) !== null) {
return ast.Constant({type: "none"}, null, ...this.span(mark));
}
this.mark = mark;
}
{
let strings: any;
if (this.lookahead(() => this._tmp_136(), true) && (strings = this.strings()) !== null) {
return strings;
}
this.mark = mark;
}
{
let number: any;
if ((number = this.number()) !== null) {
return number;
}
this.mark = mark;
}
{
let _tmp_137: any;
if (this.lookahead(() => this.literal("("), true) && (_tmp_137 = this._tmp_137()) !== null) {
return _tmp_137;
}
this.mark = mark;
}
{
let _tmp_138: any;
if (this.lookahead(() => this.literal("["), true) && (_tmp_138 = this._tmp_138()) !== null) {
return _tmp_138;
}
this.mark = mark;
}
{
let _tmp_139: any;
if (this.lookahead(() => this.literal("{"), true) && (_tmp_139 = this._tmp_139()) !== null) {
return _tmp_139;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("...")) !== null) {
return ast.Constant({type: "ellipsis"}, null, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
group(): any {
// group: '(' (yield_expr | named_expression) ')'
const mark = this.mark;
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && (a = this._tmp_140()) !== null && (literal_1 = this.literal(")")) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
lambdef(): any {
// lambdef: 'lambda' lambda_params? ':' expression
const mark = this.mark;
{
let literal: any;
let a: any;
let literal_1: any;
let b: any;
if ((literal = this.literal("lambda")) !== null && ((a = this._tmp_141()), true) && (literal_1 = this.literal(":")) !== null && (b = this.expression()) !== null) {
return ast.Lambda((a ?? ast.arguments([], [], null, [], [], null, [])), b, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
lambda_params(): any {
// lambda_params: invalid_lambda_parameters | lambda_parameters
const mark = this.mark;
{
let invalid_lambda_parameters: any;
if ((invalid_lambda_parameters = (this.callInvalidRules ? this.invalid_lambda_parameters() : null)) !== null) {
return invalid_lambda_parameters;
}
this.mark = mark;
}
{
let lambda_parameters: any;
if ((lambda_parameters = this.lambda_parameters()) !== null) {
return lambda_parameters;
}
this.mark = mark;
}
return null;
}
lambda_parameters(): any {
// lambda_parameters: lambda_slash_no_default lambda_param_no_default* lambda_param_with_default* lambda_star_etc? | lambda_slash_with_default lambda_param_with_default* lambda_star_etc? | lambda_param_no_default+ lambda_param_with_default* lambda_star_etc? | lambda_param_with_default+ lambda_star_etc? | lambda_star_etc
const mark = this.mark;
{
let a: any;
let b: any;
let c: any;
let d: any;
if ((a = this.lambda_slash_no_default()) !== null && (b = this._loop0_142()) !== null && (c = this._loop0_143()) !== null && ((d = this._tmp_144()), true)) {
return makeArguments(a, null, b, c, d);
}
this.mark = mark;
}
{
let a: any;
let b: any;
let c: any;
if ((a = this.lambda_slash_with_default()) !== null && (b = this._loop0_145()) !== null && ((c = this._tmp_146()), true)) {
return makeArguments(null, a, null, b, c);
}
this.mark = mark;
}
{
let a: any;
let b: any;
let c: any;
if ((a = this._loop1_147()) !== null && (b = this._loop0_148()) !== null && ((c = this._tmp_149()), true)) {
return makeArguments(null, null, a, b, c);
}
this.mark = mark;
}
{
let a: any;
let b: any;
if ((a = this._loop1_150()) !== null && ((b = this._tmp_151()), true)) {
return makeArguments(null, null, null, a, b);
}
this.mark = mark;
}
{
let a: any;
if ((a = this.lambda_star_etc()) !== null) {
return makeArguments(null, null, null, null, a);
}
this.mark = mark;
}
return null;
}
lambda_slash_no_default(): any {
// lambda_slash_no_default: lambda_param_no_default+ '/' ',' | lambda_param_no_default+ '/' &':'
const mark = this.mark;
{
let a: any;
let literal: any;
let literal_1: any;
if ((a = this._loop1_152()) !== null && (literal = this.literal("/")) !== null && (literal_1 = this.literal(",")) !== null) {
return a;
}
this.mark = mark;
}
{
let a: any;
let literal: any;
if ((a = this._loop1_153()) !== null && (literal = this.literal("/")) !== null && this.lookahead(() => this.literal(":"), true)) {
return a;
}
this.mark = mark;
}
return null;
}
lambda_slash_with_default(): any {
// lambda_slash_with_default: lambda_param_no_default* lambda_param_with_default+ '/' ',' | lambda_param_no_default* lambda_param_with_default+ '/' &':'
const mark = this.mark;
{
let a: any;
let b: any;
let literal: any;
let literal_1: any;
if ((a = this._loop0_154()) !== null && (b = this._loop1_155()) !== null && (literal = this.literal("/")) !== null && (literal_1 = this.literal(",")) !== null) {
return {plainNames: a, namesWithDefaults: b};
}
this.mark = mark;
}
{
let a: any;
let b: any;
let literal: any;
if ((a = this._loop0_156()) !== null && (b = this._loop1_157()) !== null && (literal = this.literal("/")) !== null && this.lookahead(() => this.literal(":"), true)) {
return {plainNames: a, namesWithDefaults: b};
}
this.mark = mark;
}
return null;
}
lambda_star_etc(): any {
// lambda_star_etc: invalid_lambda_star_etc | '*' lambda_param_no_default lambda_param_maybe_default* lambda_kwds? | '*' ',' lambda_param_maybe_default+ lambda_kwds? | lambda_kwds
const mark = this.mark;
{
let invalid_lambda_star_etc: any;
if ((invalid_lambda_star_etc = (this.callInvalidRules ? this.invalid_lambda_star_etc() : null)) !== null) {
return invalid_lambda_star_etc;
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let b: any;
let c: any;
if ((literal = this.literal("*")) !== null && (a = this.lambda_param_no_default()) !== null && (b = this._loop0_158()) !== null && ((c = this._tmp_159()), true)) {
return {vararg: a, kwonlyargs: b, kwarg: c};
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let b: any;
let c: any;
if ((literal = this.literal("*")) !== null && (literal_1 = this.literal(",")) !== null && (b = this._loop1_160()) !== null && ((c = this._tmp_161()), true)) {
return {vararg: null, kwonlyargs: b, kwarg: c};
}
this.mark = mark;
}
{
let a: any;
if ((a = this.lambda_kwds()) !== null) {
return {vararg: null, kwonlyargs: null, kwarg: a};
}
this.mark = mark;
}
return null;
}
lambda_kwds(): any {
// lambda_kwds: invalid_lambda_kwds | '**' lambda_param_no_default
const mark = this.mark;
{
let invalid_lambda_kwds: any;
if ((invalid_lambda_kwds = (this.callInvalidRules ? this.invalid_lambda_kwds() : null)) !== null) {
return invalid_lambda_kwds;
}
this.mark = mark;
}
{
let literal: any;
let a: any;
if ((literal = this.literal("**")) !== null && (a = this.lambda_param_no_default()) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
lambda_param_no_default(): any {
// lambda_param_no_default: lambda_param ',' | lambda_param &':'
const mark = this.mark;
{
let a: any;
let literal: any;
if ((a = this.lambda_param()) !== null && (literal = this.literal(",")) !== null) {
return a;
}
this.mark = mark;
}
{
let a: any;
if ((a = this.lambda_param()) !== null && this.lookahead(() => this.literal(":"), true)) {
return a;
}
this.mark = mark;
}
return null;
}
lambda_param_with_default(): any {
// lambda_param_with_default: lambda_param default ',' | lambda_param default &':'
const mark = this.mark;
{
let a: any;
let c: any;
let literal: any;
if ((a = this.lambda_param()) !== null && (c = this.default()) !== null && (literal = this.literal(",")) !== null) {
return {arg: a, value: c};
}
this.mark = mark;
}
{
let a: any;
let c: any;
if ((a = this.lambda_param()) !== null && (c = this.default()) !== null && this.lookahead(() => this.literal(":"), true)) {
return {arg: a, value: c};
}
this.mark = mark;
}
return null;
}
lambda_param_maybe_default(): any {
// lambda_param_maybe_default: lambda_param default? ',' | lambda_param default? &':'
const mark = this.mark;
{
let a: any;
let c: any;
let literal: any;
if ((a = this.lambda_param()) !== null && ((c = this.default()), true) && (literal = this.literal(",")) !== null) {
return {arg: a, value: c};
}
this.mark = mark;
}
{
let a: any;
let c: any;
if ((a = this.lambda_param()) !== null && ((c = this.default()), true) && this.lookahead(() => this.literal(":"), true)) {
return {arg: a, value: c};
}
this.mark = mark;
}
return null;
}
lambda_param(): any {
// lambda_param: NAME
const mark = this.mark;
{
let a: any;
if ((a = this.name()) !== null) {
return ast.arg(a.id, null, null, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
fstring_middle(): any {
// fstring_middle: fstring_replacement_field | FSTRING_MIDDLE
const mark = this.mark;
{
let fstring_replacement_field: any;
if ((fstring_replacement_field = this.fstring_replacement_field()) !== null) {
return fstring_replacement_field;
}
this.mark = mark;
}
{
let t: any;
if ((t = this.expect("FSTRING_MIDDLE")) !== null) {
return strings.constant(this, t);
}
this.mark = mark;
}
return null;
}
fstring_replacement_field(): any {
// fstring_replacement_field: '{' annotated_rhs '='? fstring_conversion? fstring_full_format_spec? '}'
const mark = this.mark;
{
let literal: any;
let a: any;
let debug_expr: any;
let conversion: any;
let format: any;
let rbrace: any;
if ((literal = this.literal("{")) !== null && (a = this.annotated_rhs()) !== null && ((debug_expr = this.literal("=")), true) && ((conversion = this._tmp_162()), true) && ((format = this._tmp_163()), true) && (rbrace = this.literal("}")) !== null) {
return strings.formatted(this, a, debug_expr, conversion, format, rbrace, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
fstring_conversion(): any {
// fstring_conversion: "!" NAME
const mark = this.mark;
{
let conv_token: any;
let conv: any;
if ((conv_token = this.literal("!")) !== null && (conv = this.name()) !== null) {
return strings.conversion(this, conv_token, conv);
}
this.mark = mark;
}
return null;
}
fstring_full_format_spec(): any {
// fstring_full_format_spec: ':' fstring_format_spec*
const mark = this.mark;
{
let colon: any;
let spec: any;
if ((colon = this.literal(":")) !== null && (spec = this._loop0_164()) !== null) {
return strings.formatSpec(this, colon, spec, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
fstring_format_spec(): any {
// fstring_format_spec: FSTRING_MIDDLE | fstring_replacement_field
const mark = this.mark;
{
let t: any;
if ((t = this.expect("FSTRING_MIDDLE")) !== null) {
return strings.decodedConstant(this, t);
}
this.mark = mark;
}
{
let fstring_replacement_field: any;
if ((fstring_replacement_field = this.fstring_replacement_field()) !== null) {
return fstring_replacement_field;
}
this.mark = mark;
}
return null;
}
fstring(): any {
// fstring: FSTRING_START fstring_middle* FSTRING_END
const mark = this.mark;
{
let a: any;
let b: any;
let c: any;
if ((a = this.expect("FSTRING_START")) !== null && (b = this._loop0_165()) !== null && (c = this.expect("FSTRING_END")) !== null) {
return strings.joined(this, a, b, c);
}
this.mark = mark;
}
return null;
}
tstring_format_spec_replacement_field(): any {
// tstring_format_spec_replacement_field: '{' annotated_rhs '='? fstring_conversion? tstring_full_format_spec? '}'
const mark = this.mark;
{
let literal: any;
let a: any;
let debug_expr: any;
let conversion: any;
let format: any;
let rbrace: any;
if ((literal = this.literal("{")) !== null && (a = this.annotated_rhs()) !== null && ((debug_expr = this.literal("=")), true) && ((conversion = this._tmp_166()), true) && ((format = this._tmp_167()), true) && (rbrace = this.literal("}")) !== null) {
return strings.formatted(this, a, debug_expr, conversion, format, rbrace, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
tstring_format_spec(): any {
// tstring_format_spec: TSTRING_MIDDLE | tstring_format_spec_replacement_field
const mark = this.mark;
{
let t: any;
if ((t = this.expect("TSTRING_MIDDLE")) !== null) {
return strings.decodedConstant(this, t);
}
this.mark = mark;
}
{
let tstring_format_spec_replacement_field: any;
if ((tstring_format_spec_replacement_field = this.tstring_format_spec_replacement_field()) !== null) {
return tstring_format_spec_replacement_field;
}
this.mark = mark;
}
return null;
}
tstring_full_format_spec(): any {
// tstring_full_format_spec: ':' tstring_format_spec*
const mark = this.mark;
{
let colon: any;
let spec: any;
if ((colon = this.literal(":")) !== null && (spec = this._loop0_168()) !== null) {
return strings.formatSpec(this, colon, spec, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
tstring_replacement_field(): any {
// tstring_replacement_field: '{' annotated_rhs '='? fstring_conversion? tstring_full_format_spec? '}'
const mark = this.mark;
{
let literal: any;
let a: any;
let debug_expr: any;
let conversion: any;
let format: any;
let rbrace: any;
if ((literal = this.literal("{")) !== null && (a = this.annotated_rhs()) !== null && ((debug_expr = this.literal("=")), true) && ((conversion = this._tmp_169()), true) && ((format = this._tmp_170()), true) && (rbrace = this.literal("}")) !== null) {
return strings.interpolation(this, a, debug_expr, conversion, format, rbrace, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
tstring_middle(): any {
// tstring_middle: tstring_replacement_field | TSTRING_MIDDLE
const mark = this.mark;
{
let tstring_replacement_field: any;
if ((tstring_replacement_field = this.tstring_replacement_field()) !== null) {
return tstring_replacement_field;
}
this.mark = mark;
}
{
let t: any;
if ((t = this.expect("TSTRING_MIDDLE")) !== null) {
return strings.constant(this, t);
}
this.mark = mark;
}
return null;
}
@memoize
tstring(): any {
// tstring: TSTRING_START tstring_middle* TSTRING_END
const mark = this.mark;
{
let a: any;
let b: any;
let c: any;
if ((a = this.expect("TSTRING_START")) !== null && (b = this._loop0_171()) !== null && (c = this.expect("TSTRING_END")) !== null) {
return strings.template(this, a, b, c);
}
this.mark = mark;
}
return null;
}
string(): any {
// string: STRING
const mark = this.mark;
{
let s: any;
if ((s = this.expect("STRING")) !== null) {
return strings.literal(this, s);
}
this.mark = mark;
}
return null;
}
@memoize
strings(): any {
// strings: ((fstring | string))+ | tstring+
const mark = this.mark;
{
let a: any;
if ((a = this._loop1_172()) !== null) {
return strings.concatenate(this, a, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
if ((a = this._loop1_173()) !== null) {
return strings.concatenateTemplates(this, a, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
list(): any {
// list: '[' star_named_expressions? ']'
const mark = this.mark;
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("[")) !== null && ((a = this._tmp_174()), true) && (literal_1 = this.literal("]")) !== null) {
return ast.List((a ?? []), ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
tuple(): any {
// tuple: '(' [star_named_expression ',' star_named_expressions?] ')'
const mark = this.mark;
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && ((a = this._tmp_175()), true) && (literal_1 = this.literal(")")) !== null) {
return ast.Tuple((a ?? []), ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
set(): any {
// set: '{' star_named_expressions '}'
const mark = this.mark;
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("{")) !== null && (a = this.star_named_expressions()) !== null && (literal_1 = this.literal("}")) !== null) {
return ast.Set((a ?? []), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
dict(): any {
// dict: '{' double_starred_kvpairs? '}'
const mark = this.mark;
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("{")) !== null && ((a = this._tmp_176()), true) && (literal_1 = this.literal("}")) !== null) {
return ast.Dict((a ?? []).map((pair: any) => pair.key), (a ?? []).map((pair: any) => pair.value), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
double_starred_kvpairs(): any {
// double_starred_kvpairs: ','.double_starred_kvpair+ ','?
const mark = this.mark;
{
let a: any;
let _tmp_179: any;
if ((a = this._gather_178()) !== null && ((_tmp_179 = this._tmp_179()), true)) {
return a;
}
this.mark = mark;
}
return null;
}
double_starred_kvpair(): any {
// double_starred_kvpair: '**' bitwise_or | kvpair
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("**")) !== null && (a = this.bitwise_or()) !== null) {
return {key: null, value: a};
}
this.mark = mark;
}
{
let kvpair: any;
if ((kvpair = this.kvpair()) !== null) {
return kvpair;
}
this.mark = mark;
}
return null;
}
kvpair(): any {
// kvpair: expression ':' expression
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.expression()) !== null && (literal = this.literal(":")) !== null && (b = this.expression()) !== null) {
return {key: a, value: b};
}
this.mark = mark;
}
return null;
}
for_if_clauses(): any {
// for_if_clauses: for_if_clause+
const mark = this.mark;
{
let a: any;
if ((a = this._loop1_180()) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
for_if_clause(): any {
// for_if_clause: 'async' 'for' star_targets 'in' ~ disjunction (('if' disjunction))* | 'for' star_targets 'in' ~ disjunction (('if' disjunction))*
const mark = this.mark;
{
let literal: any;
let literal_1: any;
let a: any;
let literal_2: any;
let cut: any;
let b: any;
let c: any;
if ((literal = this.literal("async")) !== null && (literal_1 = this.literal("for")) !== null && (a = this.star_targets()) !== null && (literal_2 = this.literal("in")) !== null && (cut = true) && (b = this.disjunction()) !== null && (c = this._loop0_181()) !== null) {
return ast.comprehension(a, b, c, 1);
}
this.mark = mark;
if (cut) return null;
}
{
let literal: any;
let a: any;
let literal_1: any;
let cut: any;
let b: any;
let c: any;
if ((literal = this.literal("for")) !== null && (a = this.star_targets()) !== null && (literal_1 = this.literal("in")) !== null && (cut = true) && (b = this.disjunction()) !== null && (c = this._loop0_182()) !== null) {
return ast.comprehension(a, b, c, 0);
}
this.mark = mark;
if (cut) return null;
}
return null;
}
listcomp(): any {
// listcomp: '[' named_expression for_if_clauses ']'
const mark = this.mark;
{
let literal: any;
let a: any;
let b: any;
let literal_1: any;
if ((literal = this.literal("[")) !== null && (a = this.named_expression()) !== null && (b = this.for_if_clauses()) !== null && (literal_1 = this.literal("]")) !== null) {
return ast.ListComp(a, b, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
setcomp(): any {
// setcomp: '{' named_expression for_if_clauses '}'
const mark = this.mark;
{
let literal: any;
let a: any;
let b: any;
let literal_1: any;
if ((literal = this.literal("{")) !== null && (a = this.named_expression()) !== null && (b = this.for_if_clauses()) !== null && (literal_1 = this.literal("}")) !== null) {
return ast.SetComp(a, b, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
genexp(): any {
// genexp: '(' (assignment_expression | expression !':=') for_if_clauses ')'
const mark = this.mark;
{
let literal: any;
let a: any;
let b: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && (a = this._tmp_183()) !== null && (b = this.for_if_clauses()) !== null && (literal_1 = this.literal(")")) !== null) {
return ast.GeneratorExp(a, b, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
dictcomp(): any {
// dictcomp: '{' kvpair for_if_clauses '}'
const mark = this.mark;
{
let literal: any;
let a: any;
let b: any;
let literal_1: any;
if ((literal = this.literal("{")) !== null && (a = this.kvpair()) !== null && (b = this.for_if_clauses()) !== null && (literal_1 = this.literal("}")) !== null) {
return ast.DictComp(a.key, a.value, b, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
@memoize
arguments(): any {
// arguments: args ','? &')'
const mark = this.mark;
{
let a: any;
let _tmp_184: any;
if ((a = this.args()) !== null && ((_tmp_184 = this._tmp_184()), true) && this.lookahead(() => this.literal(")"), true)) {
return a;
}
this.mark = mark;
}
return null;
}
args(): any {
// args: ','.(starred_expression | (assignment_expression | expression !':=') !'=')+ [',' kwargs] | kwargs
const mark = this.mark;
{
let a: any;
let b: any;
if ((a = this._gather_186()) !== null && ((b = this._tmp_187()), true)) {
return this.collectCallArgs(a, b);
}
this.mark = mark;
}
{
let a: any;
if ((a = this.kwargs()) !== null) {
return {args: a.filter((item: any) => !item.isKeyword).map((item: any) => item.element), keywords: a.filter((item: any) => item.isKeyword).map((item: any) => item.element)};
}
this.mark = mark;
}
return null;
}
kwargs(): any {
// kwargs: ','.kwarg_or_starred+ ',' ','.kwarg_or_double_starred+ | ','.kwarg_or_starred+ | ','.kwarg_or_double_starred+
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this._gather_189()) !== null && (literal = this.literal(",")) !== null && (b = this._gather_191()) !== null) {
return [...a, ...b];
}
this.mark = mark;
}
{
let _gather_193: any;
if ((_gather_193 = this._gather_193()) !== null) {
return _gather_193;
}
this.mark = mark;
}
{
let _gather_195: any;
if ((_gather_195 = this._gather_195()) !== null) {
return _gather_195;
}
this.mark = mark;
}
return null;
}
starred_expression(): any {
// starred_expression: '*' expression
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("*")) !== null && (a = this.expression()) !== null) {
return ast.Starred(a, ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
kwarg_or_starred(): any {
// kwarg_or_starred: NAME '=' expression | starred_expression
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.name()) !== null && (literal = this.literal("=")) !== null && (b = this.expression()) !== null) {
return {element: ast.keyword(a.id, b, ...this.span(mark)), isKeyword: true};
}
this.mark = mark;
}
{
let a: any;
if ((a = this.starred_expression()) !== null) {
return {element: a, isKeyword: false};
}
this.mark = mark;
}
return null;
}
kwarg_or_double_starred(): any {
// kwarg_or_double_starred: NAME '=' expression | '**' expression
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.name()) !== null && (literal = this.literal("=")) !== null && (b = this.expression()) !== null) {
return {element: ast.keyword(a.id, b, ...this.span(mark)), isKeyword: true};
}
this.mark = mark;
}
{
let literal: any;
let a: any;
if ((literal = this.literal("**")) !== null && (a = this.expression()) !== null) {
return {element: ast.keyword(null, a, ...this.span(mark)), isKeyword: true};
}
this.mark = mark;
}
return null;
}
star_targets(): any {
// star_targets: star_target !',' | star_target ((',' star_target))* ','?
const mark = this.mark;
{
let a: any;
if ((a = this.star_target()) !== null && this.lookahead(() => this.literal(","), false)) {
return a;
}
this.mark = mark;
}
{
let a: any;
let b: any;
let _tmp_197: any;
if ((a = this.star_target()) !== null && (b = this._loop0_196()) !== null && ((_tmp_197 = this._tmp_197()), true)) {
return ast.Tuple([a, ...(b ?? [])], ast.Store(), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
star_targets_list_seq(): any {
// star_targets_list_seq: ','.star_target+ ','?
const mark = this.mark;
{
let a: any;
let _tmp_200: any;
if ((a = this._gather_199()) !== null && ((_tmp_200 = this._tmp_200()), true)) {
return a;
}
this.mark = mark;
}
return null;
}
star_targets_tuple_seq(): any {
// star_targets_tuple_seq: star_target ((',' star_target))+ ','? | star_target ','
const mark = this.mark;
{
let a: any;
let b: any;
let _tmp_202: any;
if ((a = this.star_target()) !== null && (b = this._loop1_201()) !== null && ((_tmp_202 = this._tmp_202()), true)) {
return [a, ...(b ?? [])];
}
this.mark = mark;
}
{
let a: any;
let literal: any;
if ((a = this.star_target()) !== null && (literal = this.literal(",")) !== null) {
return [a];
}
this.mark = mark;
}
return null;
}
@memoize
star_target(): any {
// star_target: '*' (!'*' star_target) | target_with_star_atom
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("*")) !== null && (a = this._tmp_203()) !== null) {
return ast.Starred(this.setContext(a, ast.Store()), ast.Store(), ...this.span(mark));
}
this.mark = mark;
}
{
let target_with_star_atom: any;
if ((target_with_star_atom = this.target_with_star_atom()) !== null) {
return target_with_star_atom;
}
this.mark = mark;
}
return null;
}
@memoize
target_with_star_atom(): any {
// target_with_star_atom: t_primary '.' NAME !t_lookahead | t_primary '[' slices ']' !t_lookahead | star_atom
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.t_primary()) !== null && (literal = this.literal(".")) !== null && (b = this.name()) !== null && this.lookahead(() => this.t_lookahead(), false)) {
return ast.Attribute(a, b.id, ast.Store(), ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
let literal_1: any;
if ((a = this.t_primary()) !== null && (literal = this.literal("[")) !== null && (b = this.slices()) !== null && (literal_1 = this.literal("]")) !== null && this.lookahead(() => this.t_lookahead(), false)) {
return ast.Subscript(a, b, ast.Store(), ...this.span(mark));
}
this.mark = mark;
}
{
let star_atom: any;
if ((star_atom = this.star_atom()) !== null) {
return star_atom;
}
this.mark = mark;
}
return null;
}
star_atom(): any {
// star_atom: NAME | '(' target_with_star_atom ')' | '(' star_targets_tuple_seq? ')' | '[' star_targets_list_seq? ']'
const mark = this.mark;
{
let a: any;
if ((a = this.name()) !== null) {
return this.setContext(a, ast.Store());
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && (a = this.target_with_star_atom()) !== null && (literal_1 = this.literal(")")) !== null) {
return this.setContext(a, ast.Store());
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && ((a = this._tmp_204()), true) && (literal_1 = this.literal(")")) !== null) {
return ast.Tuple((a ?? []), ast.Store(), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("[")) !== null && ((a = this._tmp_205()), true) && (literal_1 = this.literal("]")) !== null) {
return ast.List((a ?? []), ast.Store(), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
single_target(): any {
// single_target: single_subscript_attribute_target | NAME | '(' single_target ')'
const mark = this.mark;
{
let single_subscript_attribute_target: any;
if ((single_subscript_attribute_target = this.single_subscript_attribute_target()) !== null) {
return single_subscript_attribute_target;
}
this.mark = mark;
}
{
let a: any;
if ((a = this.name()) !== null) {
return this.setContext(a, ast.Store());
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && (a = this.single_target()) !== null && (literal_1 = this.literal(")")) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
single_subscript_attribute_target(): any {
// single_subscript_attribute_target: t_primary '.' NAME !t_lookahead | t_primary '[' slices ']' !t_lookahead
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.t_primary()) !== null && (literal = this.literal(".")) !== null && (b = this.name()) !== null && this.lookahead(() => this.t_lookahead(), false)) {
return ast.Attribute(a, b.id, ast.Store(), ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
let literal_1: any;
if ((a = this.t_primary()) !== null && (literal = this.literal("[")) !== null && (b = this.slices()) !== null && (literal_1 = this.literal("]")) !== null && this.lookahead(() => this.t_lookahead(), false)) {
return ast.Subscript(a, b, ast.Store(), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
@memoizeLeftRec
t_primary(): any {
// t_primary: t_primary '.' NAME &t_lookahead | t_primary '[' slices ']' &t_lookahead | t_primary genexp &t_lookahead | t_primary '(' arguments? ')' &t_lookahead | atom &t_lookahead
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.t_primary()) !== null && (literal = this.literal(".")) !== null && (b = this.name()) !== null && this.lookahead(() => this.t_lookahead(), true)) {
return ast.Attribute(a, b.id, ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
let literal_1: any;
if ((a = this.t_primary()) !== null && (literal = this.literal("[")) !== null && (b = this.slices()) !== null && (literal_1 = this.literal("]")) !== null && this.lookahead(() => this.t_lookahead(), true)) {
return ast.Subscript(a, b, ast.Load(), ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let b: any;
if ((a = this.t_primary()) !== null && (b = this.genexp()) !== null && this.lookahead(() => this.t_lookahead(), true)) {
return ast.Call(a, [b], [], ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
let literal_1: any;
if ((a = this.t_primary()) !== null && (literal = this.literal("(")) !== null && ((b = this._tmp_206()), true) && (literal_1 = this.literal(")")) !== null && this.lookahead(() => this.t_lookahead(), true)) {
return ast.Call(a, (b?.args ?? []), (b?.keywords ?? []), ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
if ((a = this.atom()) !== null && this.lookahead(() => this.t_lookahead(), true)) {
return a;
}
this.mark = mark;
}
return null;
}
t_lookahead(): any {
// t_lookahead: '(' | '[' | '.'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("(")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("[")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal(".")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
del_targets(): any {
// del_targets: ','.del_target+ ','?
const mark = this.mark;
{
let a: any;
let _tmp_209: any;
if ((a = this._gather_208()) !== null && ((_tmp_209 = this._tmp_209()), true)) {
return a;
}
this.mark = mark;
}
return null;
}
@memoize
del_target(): any {
// del_target: t_primary '.' NAME !t_lookahead | t_primary '[' slices ']' !t_lookahead | del_t_atom
const mark = this.mark;
{
let a: any;
let literal: any;
let b: any;
if ((a = this.t_primary()) !== null && (literal = this.literal(".")) !== null && (b = this.name()) !== null && this.lookahead(() => this.t_lookahead(), false)) {
return ast.Attribute(a, b.id, ast.Del(), ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
let literal_1: any;
if ((a = this.t_primary()) !== null && (literal = this.literal("[")) !== null && (b = this.slices()) !== null && (literal_1 = this.literal("]")) !== null && this.lookahead(() => this.t_lookahead(), false)) {
return ast.Subscript(a, b, ast.Del(), ...this.span(mark));
}
this.mark = mark;
}
{
let del_t_atom: any;
if ((del_t_atom = this.del_t_atom()) !== null) {
return del_t_atom;
}
this.mark = mark;
}
return null;
}
del_t_atom(): any {
// del_t_atom: NAME | '(' del_target ')' | '(' del_targets? ')' | '[' del_targets? ']'
const mark = this.mark;
{
let a: any;
if ((a = this.name()) !== null) {
return this.setContext(a, ast.Del());
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && (a = this.del_target()) !== null && (literal_1 = this.literal(")")) !== null) {
return this.setContext(a, ast.Del());
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && ((a = this._tmp_210()), true) && (literal_1 = this.literal(")")) !== null) {
return ast.Tuple((a ?? []), ast.Del(), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("[")) !== null && ((a = this._tmp_211()), true) && (literal_1 = this.literal("]")) !== null) {
return ast.List((a ?? []), ast.Del(), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
func_type_comment(): any {
// func_type_comment: NEWLINE TYPE_COMMENT &(NEWLINE INDENT) | TYPE_COMMENT
const mark = this.mark;
{
let newline: any;
let t: any;
if ((newline = this.expect("NEWLINE")) !== null && (t = this.expect("TYPE_COMMENT")) !== null && this.lookahead(() => this._tmp_212(), true)) {
return t;
}
this.mark = mark;
}
{
let type_comment: any;
if ((type_comment = this.expect("TYPE_COMMENT")) !== null) {
return type_comment;
}
this.mark = mark;
}
return null;
}
invalid_block(): any {
// invalid_block: NEWLINE !INDENT
const mark = this.mark;
{
let newline: any;
if ((newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block");
}
this.mark = mark;
}
return null;
}
invalid_parameters(): any {
// invalid_parameters: "/" ',' | (slash_no_default | slash_with_default) param_maybe_default* '/' | slash_no_default? param_no_default* invalid_parameters_helper param_no_default | param_no_default* '(' param_no_default+ ','? ')' | [(slash_no_default | slash_with_default)] param_maybe_default* '*' (',' | param_no_default) param_maybe_default* '/' | param_maybe_default+ '/' '*'
const mark = this.mark;
{
let a: any;
let literal: any;
if ((a = this.literal("/")) !== null && (literal = this.literal(",")) !== null) {
return this.raiseKnown(a, a, "at least one argument must precede /");
}
this.mark = mark;
}
{
let _tmp_213: any;
let _loop0_214: any;
let a: any;
if ((_tmp_213 = this._tmp_213()) !== null && (_loop0_214 = this._loop0_214()) !== null && (a = this.literal("/")) !== null) {
return this.raiseKnown(a, a, "/ may appear only once");
}
this.mark = mark;
}
{
let slash_no_default: any;
let _loop0_215: any;
let invalid_parameters_helper: any;
let a: any;
if (((slash_no_default = this.slash_no_default()), true) && (_loop0_215 = this._loop0_215()) !== null && (invalid_parameters_helper = (this.callInvalidRules ? this.invalid_parameters_helper() : null)) !== null && (a = this.param_no_default()) !== null) {
return this.raiseKnown(a, a, "parameter without a default follows parameter with a default");
}
this.mark = mark;
}
{
let _loop0_216: any;
let a: any;
let _loop1_217: any;
let literal: any;
let b: any;
if ((_loop0_216 = this._loop0_216()) !== null && (a = this.literal("(")) !== null && (_loop1_217 = this._loop1_217()) !== null && ((literal = this.literal(",")), true) && (b = this.literal(")")) !== null) {
return this.raiseKnown(a, b, "Function parameters cannot be parenthesized");
}
this.mark = mark;
}
{
let _tmp_218: any;
let _loop0_219: any;
let literal: any;
let _tmp_220: any;
let _loop0_221: any;
let a: any;
if (((_tmp_218 = this._tmp_218()), true) && (_loop0_219 = this._loop0_219()) !== null && (literal = this.literal("*")) !== null && (_tmp_220 = this._tmp_220()) !== null && (_loop0_221 = this._loop0_221()) !== null && (a = this.literal("/")) !== null) {
return this.raiseKnown(a, a, "/ must be ahead of *");
}
this.mark = mark;
}
{
let _loop1_222: any;
let literal: any;
let a: any;
if ((_loop1_222 = this._loop1_222()) !== null && (literal = this.literal("/")) !== null && (a = this.literal("*")) !== null) {
return this.raiseKnown(a, a, "expected comma between / and *");
}
this.mark = mark;
}
return null;
}
invalid_default(): any {
// invalid_default: '=' &(')' | ',')
const mark = this.mark;
{
let a: any;
if ((a = this.literal("=")) !== null && this.lookahead(() => this._tmp_223(), true)) {
return this.raiseKnown(a, a, "expected default value expression");
}
this.mark = mark;
}
return null;
}
invalid_star_etc(): any {
// invalid_star_etc: '*' (')' | ',' (')' | '**')) | '*' ',' TYPE_COMMENT | '*' param '=' | '*' (param_no_default | ',') param_maybe_default* '*' (param_no_default | ',')
const mark = this.mark;
{
let a: any;
let _tmp_224: any;
if ((a = this.literal("*")) !== null && (_tmp_224 = this._tmp_224()) !== null) {
return this.raiseKnown(a, a, "named arguments must follow bare *");
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let type_comment: any;
if ((literal = this.literal("*")) !== null && (literal_1 = this.literal(",")) !== null && (type_comment = this.expect("TYPE_COMMENT")) !== null) {
return this.raiseDiagnostic(false, "bare * has associated type comment");
}
this.mark = mark;
}
{
let literal: any;
let param: any;
let a: any;
if ((literal = this.literal("*")) !== null && (param = this.param()) !== null && (a = this.literal("=")) !== null) {
return this.raiseKnown(a, a, "var-positional argument cannot have default value");
}
this.mark = mark;
}
{
let literal: any;
let _tmp_225: any;
let _loop0_226: any;
let a: any;
let _tmp_227: any;
if ((literal = this.literal("*")) !== null && (_tmp_225 = this._tmp_225()) !== null && (_loop0_226 = this._loop0_226()) !== null && (a = this.literal("*")) !== null && (_tmp_227 = this._tmp_227()) !== null) {
return this.raiseKnown(a, a, "* argument may appear only once");
}
this.mark = mark;
}
return null;
}
invalid_kwds(): any {
// invalid_kwds: '**' param '=' | '**' param ',' param | '**' param ',' ('*' | '**' | '/')
const mark = this.mark;
{
let literal: any;
let param: any;
let a: any;
if ((literal = this.literal("**")) !== null && (param = this.param()) !== null && (a = this.literal("=")) !== null) {
return this.raiseKnown(a, a, "var-keyword argument cannot have default value");
}
this.mark = mark;
}
{
let literal: any;
let param: any;
let literal_1: any;
let a: any;
if ((literal = this.literal("**")) !== null && (param = this.param()) !== null && (literal_1 = this.literal(",")) !== null && (a = this.param()) !== null) {
return this.raiseKnown(a, a, "arguments cannot follow var-keyword argument");
}
this.mark = mark;
}
{
let literal: any;
let param: any;
let literal_1: any;
let a: any;
if ((literal = this.literal("**")) !== null && (param = this.param()) !== null && (literal_1 = this.literal(",")) !== null && (a = this._tmp_228()) !== null) {
return this.raiseKnown(a, a, "arguments cannot follow var-keyword argument");
}
this.mark = mark;
}
return null;
}
invalid_parameters_helper(): any {
// invalid_parameters_helper: slash_with_default | param_with_default+
const mark = this.mark;
{
let a: any;
if ((a = this.slash_with_default()) !== null) {
return [a];
}
this.mark = mark;
}
{
let _loop1_229: any;
if ((_loop1_229 = this._loop1_229()) !== null) {
return _loop1_229;
}
this.mark = mark;
}
return null;
}
invalid_lambda_parameters(): any {
// invalid_lambda_parameters: "/" ',' | (lambda_slash_no_default | lambda_slash_with_default) lambda_param_maybe_default* '/' | lambda_slash_no_default? lambda_param_no_default* invalid_lambda_parameters_helper lambda_param_no_default | lambda_param_no_default* '(' ','.lambda_param+ ','? ')' | [(lambda_slash_no_default | lambda_slash_with_default)] lambda_param_maybe_default* '*' (',' | lambda_param_no_default) lambda_param_maybe_default* '/' | lambda_param_maybe_default+ '/' '*'
const mark = this.mark;
{
let a: any;
let literal: any;
if ((a = this.literal("/")) !== null && (literal = this.literal(",")) !== null) {
return this.raiseKnown(a, a, "at least one argument must precede /");
}
this.mark = mark;
}
{
let _tmp_230: any;
let _loop0_231: any;
let a: any;
if ((_tmp_230 = this._tmp_230()) !== null && (_loop0_231 = this._loop0_231()) !== null && (a = this.literal("/")) !== null) {
return this.raiseKnown(a, a, "/ may appear only once");
}
this.mark = mark;
}
{
let lambda_slash_no_default: any;
let _loop0_232: any;
let invalid_lambda_parameters_helper: any;
let a: any;
if (((lambda_slash_no_default = this.lambda_slash_no_default()), true) && (_loop0_232 = this._loop0_232()) !== null && (invalid_lambda_parameters_helper = (this.callInvalidRules ? this.invalid_lambda_parameters_helper() : null)) !== null && (a = this.lambda_param_no_default()) !== null) {
return this.raiseKnown(a, a, "parameter without a default follows parameter with a default");
}
this.mark = mark;
}
{
let _loop0_233: any;
let a: any;
let _gather_235: any;
let literal: any;
let b: any;
if ((_loop0_233 = this._loop0_233()) !== null && (a = this.literal("(")) !== null && (_gather_235 = this._gather_235()) !== null && ((literal = this.literal(",")), true) && (b = this.literal(")")) !== null) {
return this.raiseKnown(a, b, "Lambda expression parameters cannot be parenthesized");
}
this.mark = mark;
}
{
let _tmp_236: any;
let _loop0_237: any;
let literal: any;
let _tmp_238: any;
let _loop0_239: any;
let a: any;
if (((_tmp_236 = this._tmp_236()), true) && (_loop0_237 = this._loop0_237()) !== null && (literal = this.literal("*")) !== null && (_tmp_238 = this._tmp_238()) !== null && (_loop0_239 = this._loop0_239()) !== null && (a = this.literal("/")) !== null) {
return this.raiseKnown(a, a, "/ must be ahead of *");
}
this.mark = mark;
}
{
let _loop1_240: any;
let literal: any;
let a: any;
if ((_loop1_240 = this._loop1_240()) !== null && (literal = this.literal("/")) !== null && (a = this.literal("*")) !== null) {
return this.raiseKnown(a, a, "expected comma between / and *");
}
this.mark = mark;
}
return null;
}
invalid_lambda_parameters_helper(): any {
// invalid_lambda_parameters_helper: lambda_slash_with_default | lambda_param_with_default+
const mark = this.mark;
{
let a: any;
if ((a = this.lambda_slash_with_default()) !== null) {
return [a];
}
this.mark = mark;
}
{
let _loop1_241: any;
if ((_loop1_241 = this._loop1_241()) !== null) {
return _loop1_241;
}
this.mark = mark;
}
return null;
}
invalid_lambda_star_etc(): any {
// invalid_lambda_star_etc: '*' (':' | ',' (':' | '**')) | '*' lambda_param '=' | '*' (lambda_param_no_default | ',') lambda_param_maybe_default* '*' (lambda_param_no_default | ',')
const mark = this.mark;
{
let literal: any;
let _tmp_242: any;
if ((literal = this.literal("*")) !== null && (_tmp_242 = this._tmp_242()) !== null) {
return this.raiseDiagnostic(false, "named arguments must follow bare *");
}
this.mark = mark;
}
{
let literal: any;
let lambda_param: any;
let a: any;
if ((literal = this.literal("*")) !== null && (lambda_param = this.lambda_param()) !== null && (a = this.literal("=")) !== null) {
return this.raiseKnown(a, a, "var-positional argument cannot have default value");
}
this.mark = mark;
}
{
let literal: any;
let _tmp_243: any;
let _loop0_244: any;
let a: any;
let _tmp_245: any;
if ((literal = this.literal("*")) !== null && (_tmp_243 = this._tmp_243()) !== null && (_loop0_244 = this._loop0_244()) !== null && (a = this.literal("*")) !== null && (_tmp_245 = this._tmp_245()) !== null) {
return this.raiseKnown(a, a, "* argument may appear only once");
}
this.mark = mark;
}
return null;
}
invalid_lambda_kwds(): any {
// invalid_lambda_kwds: '**' lambda_param '=' | '**' lambda_param ',' lambda_param | '**' lambda_param ',' ('*' | '**' | '/')
const mark = this.mark;
{
let literal: any;
let lambda_param: any;
let a: any;
if ((literal = this.literal("**")) !== null && (lambda_param = this.lambda_param()) !== null && (a = this.literal("=")) !== null) {
return this.raiseKnown(a, a, "var-keyword argument cannot have default value");
}
this.mark = mark;
}
{
let literal: any;
let lambda_param: any;
let literal_1: any;
let a: any;
if ((literal = this.literal("**")) !== null && (lambda_param = this.lambda_param()) !== null && (literal_1 = this.literal(",")) !== null && (a = this.lambda_param()) !== null) {
return this.raiseKnown(a, a, "arguments cannot follow var-keyword argument");
}
this.mark = mark;
}
{
let literal: any;
let lambda_param: any;
let literal_1: any;
let a: any;
if ((literal = this.literal("**")) !== null && (lambda_param = this.lambda_param()) !== null && (literal_1 = this.literal(",")) !== null && (a = this._tmp_246()) !== null) {
return this.raiseKnown(a, a, "arguments cannot follow var-keyword argument");
}
this.mark = mark;
}
return null;
}
invalid_with_stmt(): any {
// invalid_with_stmt: 'async'? 'with' ','.(expression ['as' star_target])+ NEWLINE | 'async'? 'with' '(' ','.(expressions ['as' star_target])+ ','? ')' NEWLINE
const mark = this.mark;
{
let _tmp_247: any;
let literal: any;
let _gather_249: any;
let newline: any;
if (((_tmp_247 = this._tmp_247()), true) && (literal = this.literal("with")) !== null && (_gather_249 = this._gather_249()) !== null && (newline = this.expect("NEWLINE")) !== null) {
return this.raiseDiagnostic(false, "expected ':'");
}
this.mark = mark;
}
{
let _tmp_250: any;
let literal: any;
let literal_1: any;
let _gather_252: any;
let literal_2: any;
let literal_3: any;
let newline: any;
if (((_tmp_250 = this._tmp_250()), true) && (literal = this.literal("with")) !== null && (literal_1 = this.literal("(")) !== null && (_gather_252 = this._gather_252()) !== null && ((literal_2 = this.literal(",")), true) && (literal_3 = this.literal(")")) !== null && (newline = this.expect("NEWLINE")) !== null) {
return this.raiseDiagnostic(false, "expected ':'");
}
this.mark = mark;
}
return null;
}
invalid_with_stmt_indent(): any {
// invalid_with_stmt_indent: 'async'? 'with' ','.(expression ['as' star_target])+ ':' NEWLINE !INDENT | 'async'? 'with' '(' ','.(expressions ['as' star_target])+ ','? ')' ':' NEWLINE !INDENT
const mark = this.mark;
{
let _tmp_253: any;
let a: any;
let _gather_255: any;
let literal: any;
let newline: any;
if (((_tmp_253 = this._tmp_253()), true) && (a = this.literal("with")) !== null && (_gather_255 = this._gather_255()) !== null && (literal = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'with' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
{
let _tmp_256: any;
let a: any;
let literal: any;
let _gather_258: any;
let literal_1: any;
let literal_2: any;
let literal_3: any;
let newline: any;
if (((_tmp_256 = this._tmp_256()), true) && (a = this.literal("with")) !== null && (literal = this.literal("(")) !== null && (_gather_258 = this._gather_258()) !== null && ((literal_1 = this.literal(",")), true) && (literal_2 = this.literal(")")) !== null && (literal_3 = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'with' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
return null;
}
invalid_finally_stmt(): any {
// invalid_finally_stmt: 'finally' ':' NEWLINE !INDENT
const mark = this.mark;
{
let a: any;
let literal: any;
let newline: any;
if ((a = this.literal("finally")) !== null && (literal = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'finally' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
return null;
}
invalid_except_stmt_indent(): any {
// invalid_except_stmt_indent: 'except' expression ['as' NAME] ':' NEWLINE !INDENT | 'except' ':' NEWLINE !INDENT
const mark = this.mark;
{
let a: any;
let expression: any;
let _tmp_259: any;
let literal: any;
let newline: any;
if ((a = this.literal("except")) !== null && (expression = this.expression()) !== null && ((_tmp_259 = this._tmp_259()), true) && (literal = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'except' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let newline: any;
if ((a = this.literal("except")) !== null && (literal = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'except' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
return null;
}
invalid_except_star_stmt_indent(): any {
// invalid_except_star_stmt_indent: 'except' '*' expression ['as' NAME] ':' NEWLINE !INDENT
const mark = this.mark;
{
let a: any;
let literal: any;
let expression: any;
let _tmp_260: any;
let literal_1: any;
let newline: any;
if ((a = this.literal("except")) !== null && (literal = this.literal("*")) !== null && (expression = this.expression()) !== null && ((_tmp_260 = this._tmp_260()), true) && (literal_1 = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'except*' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
return null;
}
invalid_match_stmt(): any {
// invalid_match_stmt: "match" subject_expr NEWLINE | "match" subject_expr ':' NEWLINE !INDENT
const mark = this.mark;
{
let literal: any;
let subject_expr: any;
let newline: any;
if ((literal = this.literal("match")) !== null && (subject_expr = this.subject_expr()) !== null && (newline = this.expect("NEWLINE")) !== null) {
return this.raiseDiagnostic(false, "expected ':'");
}
this.mark = mark;
}
{
let a: any;
let subject: any;
let literal: any;
let newline: any;
if ((a = this.literal("match")) !== null && (subject = this.subject_expr()) !== null && (literal = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'match' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
return null;
}
invalid_case_block(): any {
// invalid_case_block: "case" patterns guard? NEWLINE | "case" patterns guard? ':' NEWLINE !INDENT
const mark = this.mark;
{
let literal: any;
let patterns: any;
let guard: any;
let newline: any;
if ((literal = this.literal("case")) !== null && (patterns = this.patterns()) !== null && ((guard = this.guard()), true) && (newline = this.expect("NEWLINE")) !== null) {
return this.raiseDiagnostic(false, "expected ':'");
}
this.mark = mark;
}
{
let a: any;
let patterns: any;
let guard: any;
let literal: any;
let newline: any;
if ((a = this.literal("case")) !== null && (patterns = this.patterns()) !== null && ((guard = this.guard()), true) && (literal = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'case' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
return null;
}
invalid_if_stmt(): any {
// invalid_if_stmt: 'if' named_expression NEWLINE | 'if' named_expression ':' NEWLINE !INDENT
const mark = this.mark;
{
let literal: any;
let named_expression: any;
let newline: any;
if ((literal = this.literal("if")) !== null && (named_expression = this.named_expression()) !== null && (newline = this.expect("NEWLINE")) !== null) {
return this.raiseDiagnostic(false, "expected ':'");
}
this.mark = mark;
}
{
let a: any;
let a_1: any;
let literal: any;
let newline: any;
if ((a = this.literal("if")) !== null && (a_1 = this.named_expression()) !== null && (literal = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'if' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
return null;
}
invalid_elif_stmt(): any {
// invalid_elif_stmt: 'elif' named_expression NEWLINE | 'elif' named_expression ':' NEWLINE !INDENT
const mark = this.mark;
{
let literal: any;
let named_expression: any;
let newline: any;
if ((literal = this.literal("elif")) !== null && (named_expression = this.named_expression()) !== null && (newline = this.expect("NEWLINE")) !== null) {
return this.raiseDiagnostic(false, "expected ':'");
}
this.mark = mark;
}
{
let a: any;
let named_expression: any;
let literal: any;
let newline: any;
if ((a = this.literal("elif")) !== null && (named_expression = this.named_expression()) !== null && (literal = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'elif' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
return null;
}
invalid_else_stmt(): any {
// invalid_else_stmt: 'else' ':' NEWLINE !INDENT | 'else' ':' block 'elif'
const mark = this.mark;
{
let a: any;
let literal: any;
let newline: any;
if ((a = this.literal("else")) !== null && (literal = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'else' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let block: any;
let literal_2: any;
if ((literal = this.literal("else")) !== null && (literal_1 = this.literal(":")) !== null && (block = this.block()) !== null && (literal_2 = this.literal("elif")) !== null) {
return this.raiseDiagnostic(false, "'elif' block follows an 'else' block");
}
this.mark = mark;
}
return null;
}
invalid_while_stmt(): any {
// invalid_while_stmt: 'while' named_expression NEWLINE | 'while' named_expression ':' NEWLINE !INDENT
const mark = this.mark;
{
let literal: any;
let named_expression: any;
let newline: any;
if ((literal = this.literal("while")) !== null && (named_expression = this.named_expression()) !== null && (newline = this.expect("NEWLINE")) !== null) {
return this.raiseDiagnostic(false, "expected ':'");
}
this.mark = mark;
}
{
let a: any;
let named_expression: any;
let literal: any;
let newline: any;
if ((a = this.literal("while")) !== null && (named_expression = this.named_expression()) !== null && (literal = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'while' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
return null;
}
invalid_for_stmt(): any {
// invalid_for_stmt: 'async'? 'for' star_targets 'in' star_expressions NEWLINE | 'async'? 'for' star_targets 'in' star_expressions ':' NEWLINE !INDENT
const mark = this.mark;
{
let _tmp_261: any;
let literal: any;
let star_targets: any;
let literal_1: any;
let star_expressions: any;
let newline: any;
if (((_tmp_261 = this._tmp_261()), true) && (literal = this.literal("for")) !== null && (star_targets = this.star_targets()) !== null && (literal_1 = this.literal("in")) !== null && (star_expressions = this.star_expressions()) !== null && (newline = this.expect("NEWLINE")) !== null) {
return this.raiseDiagnostic(false, "expected ':'");
}
this.mark = mark;
}
{
let _tmp_262: any;
let a: any;
let star_targets: any;
let literal: any;
let star_expressions: any;
let literal_1: any;
let newline: any;
if (((_tmp_262 = this._tmp_262()), true) && (a = this.literal("for")) !== null && (star_targets = this.star_targets()) !== null && (literal = this.literal("in")) !== null && (star_expressions = this.star_expressions()) !== null && (literal_1 = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after 'for' statement on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
return null;
}
invalid_def_raw(): any {
// invalid_def_raw: 'async'? 'def' NAME type_params? '(' params? ')' ['->' expression] ':' NEWLINE !INDENT | 'async'? 'def' NAME type_params? &&'(' params? ')' ['->' expression] &&':' func_type_comment? block
const mark = this.mark;
{
let _tmp_263: any;
let a: any;
let name: any;
let _tmp_264: any;
let literal: any;
let _tmp_265: any;
let literal_1: any;
let _tmp_266: any;
let literal_2: any;
let newline: any;
if (((_tmp_263 = this._tmp_263()), true) && (a = this.literal("def")) !== null && (name = this.name()) !== null && ((_tmp_264 = this._tmp_264()), true) && (literal = this.literal("(")) !== null && ((_tmp_265 = this._tmp_265()), true) && (literal_1 = this.literal(")")) !== null && ((_tmp_266 = this._tmp_266()), true) && (literal_2 = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after function definition on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
{
let _tmp_267: any;
let literal: any;
let name: any;
let _tmp_268: any;
let literal_1: any;
let _tmp_269: any;
let literal_2: any;
let _tmp_270: any;
let literal_3: any;
let _tmp_271: any;
let block: any;
if (((_tmp_267 = this._tmp_267()), true) && (literal = this.literal("def")) !== null && (name = this.name()) !== null && ((_tmp_268 = this._tmp_268()), true) && (literal_1 = this.forcedLiteral("(")) !== null && ((_tmp_269 = this._tmp_269()), true) && (literal_2 = this.literal(")")) !== null && ((_tmp_270 = this._tmp_270()), true) && (literal_3 = this.forcedLiteral(":")) !== null && ((_tmp_271 = this._tmp_271()), true) && (block = this.block()) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
invalid_class_def_raw(): any {
// invalid_class_def_raw: 'class' NAME type_params? ['(' arguments? ')'] NEWLINE | 'class' NAME type_params? ['(' arguments? ')'] ':' NEWLINE !INDENT
const mark = this.mark;
{
let literal: any;
let name: any;
let _tmp_272: any;
let _tmp_273: any;
let newline: any;
if ((literal = this.literal("class")) !== null && (name = this.name()) !== null && ((_tmp_272 = this._tmp_272()), true) && ((_tmp_273 = this._tmp_273()), true) && (newline = this.expect("NEWLINE")) !== null) {
return this.raiseDiagnostic(false, "expected ':'");
}
this.mark = mark;
}
{
let a: any;
let name: any;
let _tmp_274: any;
let _tmp_275: any;
let literal: any;
let newline: any;
if ((a = this.literal("class")) !== null && (name = this.name()) !== null && ((_tmp_274 = this._tmp_274()), true) && ((_tmp_275 = this._tmp_275()), true) && (literal = this.literal(":")) !== null && (newline = this.expect("NEWLINE")) !== null && this.lookahead(() => this.expect("INDENT"), false)) {
return this.raiseDiagnostic(true, "expected an indented block after class definition on line %d", this.diagnosticLine(a));
}
this.mark = mark;
}
return null;
}
_tmp_1(): any {
// _tmp_1: statements
const mark = this.mark;
{
let statements: any;
if ((statements = this.statements()) !== null) {
return statements;
}
this.mark = mark;
}
return null;
}
_loop0_2(): any {
// _loop0_2: NEWLINE
let mark = this.mark;
const children: any[] = [];
{
let newline: any;
while ((newline = this.expect("NEWLINE")) !== null) {
children.push(newline); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop1_3(): any {
// _loop1_3: statement
let mark = this.mark;
const children: any[] = [];
{
let statement: any;
while ((statement = this.statement()) !== null) {
children.push(statement); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop0_4(): any {
// _loop0_4: ';' simple_stmt
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(";")) !== null && (elem = this.simple_stmt()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_5(): any {
// _gather_5: simple_stmt _loop0_4
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.simple_stmt()) !== null && (seq = this._loop0_4()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_6(): any {
// _tmp_6: ';'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(";")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_7(): any {
// _tmp_7: 'import' | 'from'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("import")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("from")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_8(): any {
// _tmp_8: 'def' | '@' | 'async'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("def")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("@")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("async")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_9(): any {
// _tmp_9: 'class' | '@'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("class")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("@")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_10(): any {
// _tmp_10: 'with' | 'async'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("with")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("async")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_11(): any {
// _tmp_11: 'for' | 'async'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("for")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("async")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_12(): any {
// _tmp_12: '=' annotated_rhs
const mark = this.mark;
{
let literal: any;
let d: any;
if ((literal = this.literal("=")) !== null && (d = this.annotated_rhs()) !== null) {
return d;
}
this.mark = mark;
}
return null;
}
_tmp_13(): any {
// _tmp_13: '(' single_target ')' | single_subscript_attribute_target
const mark = this.mark;
{
let literal: any;
let b: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && (b = this.single_target()) !== null && (literal_1 = this.literal(")")) !== null) {
return b;
}
this.mark = mark;
}
{
let single_subscript_attribute_target: any;
if ((single_subscript_attribute_target = this.single_subscript_attribute_target()) !== null) {
return single_subscript_attribute_target;
}
this.mark = mark;
}
return null;
}
_tmp_14(): any {
// _tmp_14: '=' annotated_rhs
const mark = this.mark;
{
let literal: any;
let d: any;
if ((literal = this.literal("=")) !== null && (d = this.annotated_rhs()) !== null) {
return d;
}
this.mark = mark;
}
return null;
}
_loop1_15(): any {
// _loop1_15: (star_targets '=')
let mark = this.mark;
const children: any[] = [];
{
let _tmp_276: any;
while ((_tmp_276 = this._tmp_276()) !== null) {
children.push(_tmp_276); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_16(): any {
// _tmp_16: TYPE_COMMENT
const mark = this.mark;
{
let type_comment: any;
if ((type_comment = this.expect("TYPE_COMMENT")) !== null) {
return type_comment;
}
this.mark = mark;
}
return null;
}
_tmp_17(): any {
// _tmp_17: star_expressions
const mark = this.mark;
{
let star_expressions: any;
if ((star_expressions = this.star_expressions()) !== null) {
return star_expressions;
}
this.mark = mark;
}
return null;
}
_tmp_18(): any {
// _tmp_18: 'from' expression
const mark = this.mark;
{
let literal: any;
let z: any;
if ((literal = this.literal("from")) !== null && (z = this.expression()) !== null) {
return z;
}
this.mark = mark;
}
return null;
}
_loop0_19(): any {
// _loop0_19: ',' NAME
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.name()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_20(): any {
// _gather_20: NAME _loop0_19
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.name()) !== null && (seq = this._loop0_19()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_21(): any {
// _loop0_21: ',' NAME
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.name()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_22(): any {
// _gather_22: NAME _loop0_21
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.name()) !== null && (seq = this._loop0_21()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_23(): any {
// _tmp_23: ';' | NEWLINE
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(";")) !== null) {
return literal;
}
this.mark = mark;
}
{
let newline: any;
if ((newline = this.expect("NEWLINE")) !== null) {
return newline;
}
this.mark = mark;
}
return null;
}
_tmp_24(): any {
// _tmp_24: ',' expression
const mark = this.mark;
{
let literal: any;
let z: any;
if ((literal = this.literal(",")) !== null && (z = this.expression()) !== null) {
return z;
}
this.mark = mark;
}
return null;
}
_loop0_25(): any {
// _loop0_25: ('.' | '...')
let mark = this.mark;
const children: any[] = [];
{
let _tmp_277: any;
while ((_tmp_277 = this._tmp_277()) !== null) {
children.push(_tmp_277); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop1_26(): any {
// _loop1_26: ('.' | '...')
let mark = this.mark;
const children: any[] = [];
{
let _tmp_278: any;
while ((_tmp_278 = this._tmp_278()) !== null) {
children.push(_tmp_278); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_27(): any {
// _tmp_27: ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop0_28(): any {
// _loop0_28: ',' import_from_as_name
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.import_from_as_name()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_29(): any {
// _gather_29: import_from_as_name _loop0_28
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.import_from_as_name()) !== null && (seq = this._loop0_28()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_30(): any {
// _tmp_30: 'as' NAME
const mark = this.mark;
{
let literal: any;
let z: any;
if ((literal = this.literal("as")) !== null && (z = this.name()) !== null) {
return z;
}
this.mark = mark;
}
return null;
}
_loop0_31(): any {
// _loop0_31: ',' dotted_as_name
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.dotted_as_name()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_32(): any {
// _gather_32: dotted_as_name _loop0_31
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.dotted_as_name()) !== null && (seq = this._loop0_31()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_33(): any {
// _tmp_33: 'as' NAME
const mark = this.mark;
{
let literal: any;
let z: any;
if ((literal = this.literal("as")) !== null && (z = this.name()) !== null) {
return z;
}
this.mark = mark;
}
return null;
}
_loop1_34(): any {
// _loop1_34: ('@' named_expression NEWLINE)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_279: any;
while ((_tmp_279 = this._tmp_279()) !== null) {
children.push(_tmp_279); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_35(): any {
// _tmp_35: type_params
const mark = this.mark;
{
let type_params: any;
if ((type_params = this.type_params()) !== null) {
return type_params;
}
this.mark = mark;
}
return null;
}
_tmp_36(): any {
// _tmp_36: '(' arguments? ')'
const mark = this.mark;
{
let literal: any;
let z: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && ((z = this._tmp_280()), true) && (literal_1 = this.literal(")")) !== null) {
return z;
}
this.mark = mark;
}
return null;
}
_tmp_37(): any {
// _tmp_37: type_params
const mark = this.mark;
{
let type_params: any;
if ((type_params = this.type_params()) !== null) {
return type_params;
}
this.mark = mark;
}
return null;
}
_tmp_38(): any {
// _tmp_38: params
const mark = this.mark;
{
let params: any;
if ((params = this.params()) !== null) {
return params;
}
this.mark = mark;
}
return null;
}
_tmp_39(): any {
// _tmp_39: '->' expression
const mark = this.mark;
{
let literal: any;
let z: any;
if ((literal = this.literal("->")) !== null && (z = this.expression()) !== null) {
return z;
}
this.mark = mark;
}
return null;
}
_tmp_40(): any {
// _tmp_40: func_type_comment
const mark = this.mark;
{
let func_type_comment: any;
if ((func_type_comment = this.func_type_comment()) !== null) {
return func_type_comment;
}
this.mark = mark;
}
return null;
}
_tmp_41(): any {
// _tmp_41: type_params
const mark = this.mark;
{
let type_params: any;
if ((type_params = this.type_params()) !== null) {
return type_params;
}
this.mark = mark;
}
return null;
}
_tmp_42(): any {
// _tmp_42: params
const mark = this.mark;
{
let params: any;
if ((params = this.params()) !== null) {
return params;
}
this.mark = mark;
}
return null;
}
_tmp_43(): any {
// _tmp_43: '->' expression
const mark = this.mark;
{
let literal: any;
let z: any;
if ((literal = this.literal("->")) !== null && (z = this.expression()) !== null) {
return z;
}
this.mark = mark;
}
return null;
}
_tmp_44(): any {
// _tmp_44: func_type_comment
const mark = this.mark;
{
let func_type_comment: any;
if ((func_type_comment = this.func_type_comment()) !== null) {
return func_type_comment;
}
this.mark = mark;
}
return null;
}
_loop0_45(): any {
// _loop0_45: param_no_default
let mark = this.mark;
const children: any[] = [];
{
let param_no_default: any;
while ((param_no_default = this.param_no_default()) !== null) {
children.push(param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop0_46(): any {
// _loop0_46: param_with_default
let mark = this.mark;
const children: any[] = [];
{
let param_with_default: any;
while ((param_with_default = this.param_with_default()) !== null) {
children.push(param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_47(): any {
// _tmp_47: star_etc
const mark = this.mark;
{
let star_etc: any;
if ((star_etc = this.star_etc()) !== null) {
return star_etc;
}
this.mark = mark;
}
return null;
}
_loop0_48(): any {
// _loop0_48: param_with_default
let mark = this.mark;
const children: any[] = [];
{
let param_with_default: any;
while ((param_with_default = this.param_with_default()) !== null) {
children.push(param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_49(): any {
// _tmp_49: star_etc
const mark = this.mark;
{
let star_etc: any;
if ((star_etc = this.star_etc()) !== null) {
return star_etc;
}
this.mark = mark;
}
return null;
}
_loop1_50(): any {
// _loop1_50: param_no_default
let mark = this.mark;
const children: any[] = [];
{
let param_no_default: any;
while ((param_no_default = this.param_no_default()) !== null) {
children.push(param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop0_51(): any {
// _loop0_51: param_with_default
let mark = this.mark;
const children: any[] = [];
{
let param_with_default: any;
while ((param_with_default = this.param_with_default()) !== null) {
children.push(param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_52(): any {
// _tmp_52: star_etc
const mark = this.mark;
{
let star_etc: any;
if ((star_etc = this.star_etc()) !== null) {
return star_etc;
}
this.mark = mark;
}
return null;
}
_loop1_53(): any {
// _loop1_53: param_with_default
let mark = this.mark;
const children: any[] = [];
{
let param_with_default: any;
while ((param_with_default = this.param_with_default()) !== null) {
children.push(param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_54(): any {
// _tmp_54: star_etc
const mark = this.mark;
{
let star_etc: any;
if ((star_etc = this.star_etc()) !== null) {
return star_etc;
}
this.mark = mark;
}
return null;
}
_loop1_55(): any {
// _loop1_55: param_no_default
let mark = this.mark;
const children: any[] = [];
{
let param_no_default: any;
while ((param_no_default = this.param_no_default()) !== null) {
children.push(param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop1_56(): any {
// _loop1_56: param_no_default
let mark = this.mark;
const children: any[] = [];
{
let param_no_default: any;
while ((param_no_default = this.param_no_default()) !== null) {
children.push(param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop0_57(): any {
// _loop0_57: param_no_default
let mark = this.mark;
const children: any[] = [];
{
let param_no_default: any;
while ((param_no_default = this.param_no_default()) !== null) {
children.push(param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop1_58(): any {
// _loop1_58: param_with_default
let mark = this.mark;
const children: any[] = [];
{
let param_with_default: any;
while ((param_with_default = this.param_with_default()) !== null) {
children.push(param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop0_59(): any {
// _loop0_59: param_no_default
let mark = this.mark;
const children: any[] = [];
{
let param_no_default: any;
while ((param_no_default = this.param_no_default()) !== null) {
children.push(param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop1_60(): any {
// _loop1_60: param_with_default
let mark = this.mark;
const children: any[] = [];
{
let param_with_default: any;
while ((param_with_default = this.param_with_default()) !== null) {
children.push(param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop0_61(): any {
// _loop0_61: param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let param_maybe_default: any;
while ((param_maybe_default = this.param_maybe_default()) !== null) {
children.push(param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_62(): any {
// _tmp_62: kwds
const mark = this.mark;
{
let kwds: any;
if ((kwds = this.kwds()) !== null) {
return kwds;
}
this.mark = mark;
}
return null;
}
_loop0_63(): any {
// _loop0_63: param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let param_maybe_default: any;
while ((param_maybe_default = this.param_maybe_default()) !== null) {
children.push(param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_64(): any {
// _tmp_64: kwds
const mark = this.mark;
{
let kwds: any;
if ((kwds = this.kwds()) !== null) {
return kwds;
}
this.mark = mark;
}
return null;
}
_loop1_65(): any {
// _loop1_65: param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let param_maybe_default: any;
while ((param_maybe_default = this.param_maybe_default()) !== null) {
children.push(param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_66(): any {
// _tmp_66: kwds
const mark = this.mark;
{
let kwds: any;
if ((kwds = this.kwds()) !== null) {
return kwds;
}
this.mark = mark;
}
return null;
}
_tmp_67(): any {
// _tmp_67: else_block
const mark = this.mark;
{
let else_block: any;
if ((else_block = this.else_block()) !== null) {
return else_block;
}
this.mark = mark;
}
return null;
}
_tmp_68(): any {
// _tmp_68: else_block
const mark = this.mark;
{
let else_block: any;
if ((else_block = this.else_block()) !== null) {
return else_block;
}
this.mark = mark;
}
return null;
}
_tmp_69(): any {
// _tmp_69: else_block
const mark = this.mark;
{
let else_block: any;
if ((else_block = this.else_block()) !== null) {
return else_block;
}
this.mark = mark;
}
return null;
}
_tmp_70(): any {
// _tmp_70: TYPE_COMMENT
const mark = this.mark;
{
let type_comment: any;
if ((type_comment = this.expect("TYPE_COMMENT")) !== null) {
return type_comment;
}
this.mark = mark;
}
return null;
}
_tmp_71(): any {
// _tmp_71: else_block
const mark = this.mark;
{
let else_block: any;
if ((else_block = this.else_block()) !== null) {
return else_block;
}
this.mark = mark;
}
return null;
}
_tmp_72(): any {
// _tmp_72: TYPE_COMMENT
const mark = this.mark;
{
let type_comment: any;
if ((type_comment = this.expect("TYPE_COMMENT")) !== null) {
return type_comment;
}
this.mark = mark;
}
return null;
}
_tmp_73(): any {
// _tmp_73: else_block
const mark = this.mark;
{
let else_block: any;
if ((else_block = this.else_block()) !== null) {
return else_block;
}
this.mark = mark;
}
return null;
}
_loop0_74(): any {
// _loop0_74: ',' with_item
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.with_item()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_75(): any {
// _gather_75: with_item _loop0_74
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.with_item()) !== null && (seq = this._loop0_74()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_76(): any {
// _tmp_76: TYPE_COMMENT
const mark = this.mark;
{
let type_comment: any;
if ((type_comment = this.expect("TYPE_COMMENT")) !== null) {
return type_comment;
}
this.mark = mark;
}
return null;
}
_loop0_77(): any {
// _loop0_77: ',' with_item
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.with_item()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_78(): any {
// _gather_78: with_item _loop0_77
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.with_item()) !== null && (seq = this._loop0_77()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_79(): any {
// _tmp_79: TYPE_COMMENT
const mark = this.mark;
{
let type_comment: any;
if ((type_comment = this.expect("TYPE_COMMENT")) !== null) {
return type_comment;
}
this.mark = mark;
}
return null;
}
_loop0_80(): any {
// _loop0_80: ',' with_item
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.with_item()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_81(): any {
// _gather_81: with_item _loop0_80
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.with_item()) !== null && (seq = this._loop0_80()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_82(): any {
// _loop0_82: ',' with_item
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.with_item()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_83(): any {
// _gather_83: with_item _loop0_82
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.with_item()) !== null && (seq = this._loop0_82()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_84(): any {
// _tmp_84: TYPE_COMMENT
const mark = this.mark;
{
let type_comment: any;
if ((type_comment = this.expect("TYPE_COMMENT")) !== null) {
return type_comment;
}
this.mark = mark;
}
return null;
}
_tmp_85(): any {
// _tmp_85: ',' | ')' | ':'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal(")")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal(":")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop1_86(): any {
// _loop1_86: except_block
let mark = this.mark;
const children: any[] = [];
{
let except_block: any;
while ((except_block = this.except_block()) !== null) {
children.push(except_block); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_87(): any {
// _tmp_87: else_block
const mark = this.mark;
{
let else_block: any;
if ((else_block = this.else_block()) !== null) {
return else_block;
}
this.mark = mark;
}
return null;
}
_tmp_88(): any {
// _tmp_88: finally_block
const mark = this.mark;
{
let finally_block: any;
if ((finally_block = this.finally_block()) !== null) {
return finally_block;
}
this.mark = mark;
}
return null;
}
_loop1_89(): any {
// _loop1_89: except_star_block
let mark = this.mark;
const children: any[] = [];
{
let except_star_block: any;
while ((except_star_block = this.except_star_block()) !== null) {
children.push(except_star_block); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_90(): any {
// _tmp_90: else_block
const mark = this.mark;
{
let else_block: any;
if ((else_block = this.else_block()) !== null) {
return else_block;
}
this.mark = mark;
}
return null;
}
_tmp_91(): any {
// _tmp_91: finally_block
const mark = this.mark;
{
let finally_block: any;
if ((finally_block = this.finally_block()) !== null) {
return finally_block;
}
this.mark = mark;
}
return null;
}
_loop1_92(): any {
// _loop1_92: case_block
let mark = this.mark;
const children: any[] = [];
{
let case_block: any;
while ((case_block = this.case_block()) !== null) {
children.push(case_block); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop0_93(): any {
// _loop0_93: '|' closed_pattern
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal("|")) !== null && (elem = this.closed_pattern()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_94(): any {
// _gather_94: closed_pattern _loop0_93
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.closed_pattern()) !== null && (seq = this._loop0_93()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_95(): any {
// _tmp_95: '+' | '-'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("+")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("-")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_96(): any {
// _tmp_96: '+' | '-'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("+")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("-")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_97(): any {
// _tmp_97: STRING | FSTRING_START | TSTRING_START
const mark = this.mark;
{
let string: any;
if ((string = this.expect("STRING")) !== null) {
return string;
}
this.mark = mark;
}
{
let fstring_start: any;
if ((fstring_start = this.expect("FSTRING_START")) !== null) {
return fstring_start;
}
this.mark = mark;
}
{
let tstring_start: any;
if ((tstring_start = this.expect("TSTRING_START")) !== null) {
return tstring_start;
}
this.mark = mark;
}
return null;
}
_tmp_98(): any {
// _tmp_98: '.' | '(' | '='
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(".")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("(")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("=")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_99(): any {
// _tmp_99: '.' | '(' | '='
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(".")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("(")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("=")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop0_100(): any {
// _loop0_100: ',' maybe_star_pattern
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.maybe_star_pattern()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_101(): any {
// _gather_101: maybe_star_pattern _loop0_100
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.maybe_star_pattern()) !== null && (seq = this._loop0_100()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_102(): any {
// _loop0_102: ',' key_value_pattern
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.key_value_pattern()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_103(): any {
// _gather_103: key_value_pattern _loop0_102
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.key_value_pattern()) !== null && (seq = this._loop0_102()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_104(): any {
// _tmp_104: literal_expr | attr
const mark = this.mark;
{
let literal_expr: any;
if ((literal_expr = this.literal_expr()) !== null) {
return literal_expr;
}
this.mark = mark;
}
{
let attr: any;
if ((attr = this.attr()) !== null) {
return attr;
}
this.mark = mark;
}
return null;
}
_loop0_105(): any {
// _loop0_105: ',' pattern
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.pattern()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_106(): any {
// _gather_106: pattern _loop0_105
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.pattern()) !== null && (seq = this._loop0_105()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_107(): any {
// _loop0_107: ',' keyword_pattern
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.keyword_pattern()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_108(): any {
// _gather_108: keyword_pattern _loop0_107
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.keyword_pattern()) !== null && (seq = this._loop0_107()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_109(): any {
// _tmp_109: type_params
const mark = this.mark;
{
let type_params: any;
if ((type_params = this.type_params()) !== null) {
return type_params;
}
this.mark = mark;
}
return null;
}
_loop0_110(): any {
// _loop0_110: ',' type_param
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.type_param()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_111(): any {
// _gather_111: type_param _loop0_110
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.type_param()) !== null && (seq = this._loop0_110()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_112(): any {
// _tmp_112: ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_113(): any {
// _tmp_113: type_param_bound
const mark = this.mark;
{
let type_param_bound: any;
if ((type_param_bound = this.type_param_bound()) !== null) {
return type_param_bound;
}
this.mark = mark;
}
return null;
}
_tmp_114(): any {
// _tmp_114: type_param_default
const mark = this.mark;
{
let type_param_default: any;
if ((type_param_default = this.type_param_default()) !== null) {
return type_param_default;
}
this.mark = mark;
}
return null;
}
_tmp_115(): any {
// _tmp_115: type_param_starred_default
const mark = this.mark;
{
let type_param_starred_default: any;
if ((type_param_starred_default = this.type_param_starred_default()) !== null) {
return type_param_starred_default;
}
this.mark = mark;
}
return null;
}
_tmp_116(): any {
// _tmp_116: type_param_default
const mark = this.mark;
{
let type_param_default: any;
if ((type_param_default = this.type_param_default()) !== null) {
return type_param_default;
}
this.mark = mark;
}
return null;
}
_loop1_117(): any {
// _loop1_117: (',' expression)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_281: any;
while ((_tmp_281 = this._tmp_281()) !== null) {
children.push(_tmp_281); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_118(): any {
// _tmp_118: ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_119(): any {
// _tmp_119: star_expressions
const mark = this.mark;
{
let star_expressions: any;
if ((star_expressions = this.star_expressions()) !== null) {
return star_expressions;
}
this.mark = mark;
}
return null;
}
_loop1_120(): any {
// _loop1_120: (',' star_expression)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_282: any;
while ((_tmp_282 = this._tmp_282()) !== null) {
children.push(_tmp_282); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_121(): any {
// _tmp_121: ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop0_122(): any {
// _loop0_122: ',' star_named_expression
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.star_named_expression()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_123(): any {
// _gather_123: star_named_expression _loop0_122
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.star_named_expression()) !== null && (seq = this._loop0_122()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_124(): any {
// _tmp_124: ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop1_125(): any {
// _loop1_125: ('or' conjunction)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_283: any;
while ((_tmp_283 = this._tmp_283()) !== null) {
children.push(_tmp_283); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop1_126(): any {
// _loop1_126: ('and' inversion)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_284: any;
while ((_tmp_284 = this._tmp_284()) !== null) {
children.push(_tmp_284); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop1_127(): any {
// _loop1_127: compare_op_bitwise_or_pair
let mark = this.mark;
const children: any[] = [];
{
let compare_op_bitwise_or_pair: any;
while ((compare_op_bitwise_or_pair = this.compare_op_bitwise_or_pair()) !== null) {
children.push(compare_op_bitwise_or_pair); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_128(): any {
// _tmp_128: '!='
const mark = this.mark;
{
let tok: any;
if ((tok = this.expect("NOTEQUAL")) !== null) {
return this.checkNotEqual(tok);
}
this.mark = mark;
}
return null;
}
_tmp_129(): any {
// _tmp_129: arguments
const mark = this.mark;
{
let arguments_: any;
if ((arguments_ = this.arguments()) !== null) {
return arguments_;
}
this.mark = mark;
}
return null;
}
_loop0_130(): any {
// _loop0_130: ',' (slice | starred_expression)
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this._tmp_285()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_131(): any {
// _gather_131: (slice | starred_expression) _loop0_130
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this._tmp_285()) !== null && (seq = this._loop0_130()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_132(): any {
// _tmp_132: ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_133(): any {
// _tmp_133: expression
const mark = this.mark;
{
let expression: any;
if ((expression = this.expression()) !== null) {
return expression;
}
this.mark = mark;
}
return null;
}
_tmp_134(): any {
// _tmp_134: expression
const mark = this.mark;
{
let expression: any;
if ((expression = this.expression()) !== null) {
return expression;
}
this.mark = mark;
}
return null;
}
_tmp_135(): any {
// _tmp_135: ':' expression?
const mark = this.mark;
{
let literal: any;
let d: any;
if ((literal = this.literal(":")) !== null && ((d = this._tmp_286()), true)) {
return d;
}
this.mark = mark;
}
return null;
}
_tmp_136(): any {
// _tmp_136: STRING | FSTRING_START | TSTRING_START
const mark = this.mark;
{
let string: any;
if ((string = this.expect("STRING")) !== null) {
return string;
}
this.mark = mark;
}
{
let fstring_start: any;
if ((fstring_start = this.expect("FSTRING_START")) !== null) {
return fstring_start;
}
this.mark = mark;
}
{
let tstring_start: any;
if ((tstring_start = this.expect("TSTRING_START")) !== null) {
return tstring_start;
}
this.mark = mark;
}
return null;
}
_tmp_137(): any {
// _tmp_137: tuple | group | genexp
const mark = this.mark;
{
let tuple: any;
if ((tuple = this.tuple()) !== null) {
return tuple;
}
this.mark = mark;
}
{
let group: any;
if ((group = this.group()) !== null) {
return group;
}
this.mark = mark;
}
{
let genexp: any;
if ((genexp = this.genexp()) !== null) {
return genexp;
}
this.mark = mark;
}
return null;
}
_tmp_138(): any {
// _tmp_138: list | listcomp
const mark = this.mark;
{
let list: any;
if ((list = this.list()) !== null) {
return list;
}
this.mark = mark;
}
{
let listcomp: any;
if ((listcomp = this.listcomp()) !== null) {
return listcomp;
}
this.mark = mark;
}
return null;
}
_tmp_139(): any {
// _tmp_139: dict | set | dictcomp | setcomp
const mark = this.mark;
{
let dict: any;
if ((dict = this.dict()) !== null) {
return dict;
}
this.mark = mark;
}
{
let set: any;
if ((set = this.set()) !== null) {
return set;
}
this.mark = mark;
}
{
let dictcomp: any;
if ((dictcomp = this.dictcomp()) !== null) {
return dictcomp;
}
this.mark = mark;
}
{
let setcomp: any;
if ((setcomp = this.setcomp()) !== null) {
return setcomp;
}
this.mark = mark;
}
return null;
}
_tmp_140(): any {
// _tmp_140: yield_expr | named_expression
const mark = this.mark;
{
let yield_expr: any;
if ((yield_expr = this.yield_expr()) !== null) {
return yield_expr;
}
this.mark = mark;
}
{
let named_expression: any;
if ((named_expression = this.named_expression()) !== null) {
return named_expression;
}
this.mark = mark;
}
return null;
}
_tmp_141(): any {
// _tmp_141: lambda_params
const mark = this.mark;
{
let lambda_params: any;
if ((lambda_params = this.lambda_params()) !== null) {
return lambda_params;
}
this.mark = mark;
}
return null;
}
_loop0_142(): any {
// _loop0_142: lambda_param_no_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_no_default: any;
while ((lambda_param_no_default = this.lambda_param_no_default()) !== null) {
children.push(lambda_param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop0_143(): any {
// _loop0_143: lambda_param_with_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_with_default: any;
while ((lambda_param_with_default = this.lambda_param_with_default()) !== null) {
children.push(lambda_param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_144(): any {
// _tmp_144: lambda_star_etc
const mark = this.mark;
{
let lambda_star_etc: any;
if ((lambda_star_etc = this.lambda_star_etc()) !== null) {
return lambda_star_etc;
}
this.mark = mark;
}
return null;
}
_loop0_145(): any {
// _loop0_145: lambda_param_with_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_with_default: any;
while ((lambda_param_with_default = this.lambda_param_with_default()) !== null) {
children.push(lambda_param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_146(): any {
// _tmp_146: lambda_star_etc
const mark = this.mark;
{
let lambda_star_etc: any;
if ((lambda_star_etc = this.lambda_star_etc()) !== null) {
return lambda_star_etc;
}
this.mark = mark;
}
return null;
}
_loop1_147(): any {
// _loop1_147: lambda_param_no_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_no_default: any;
while ((lambda_param_no_default = this.lambda_param_no_default()) !== null) {
children.push(lambda_param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop0_148(): any {
// _loop0_148: lambda_param_with_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_with_default: any;
while ((lambda_param_with_default = this.lambda_param_with_default()) !== null) {
children.push(lambda_param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_149(): any {
// _tmp_149: lambda_star_etc
const mark = this.mark;
{
let lambda_star_etc: any;
if ((lambda_star_etc = this.lambda_star_etc()) !== null) {
return lambda_star_etc;
}
this.mark = mark;
}
return null;
}
_loop1_150(): any {
// _loop1_150: lambda_param_with_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_with_default: any;
while ((lambda_param_with_default = this.lambda_param_with_default()) !== null) {
children.push(lambda_param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_151(): any {
// _tmp_151: lambda_star_etc
const mark = this.mark;
{
let lambda_star_etc: any;
if ((lambda_star_etc = this.lambda_star_etc()) !== null) {
return lambda_star_etc;
}
this.mark = mark;
}
return null;
}
_loop1_152(): any {
// _loop1_152: lambda_param_no_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_no_default: any;
while ((lambda_param_no_default = this.lambda_param_no_default()) !== null) {
children.push(lambda_param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop1_153(): any {
// _loop1_153: lambda_param_no_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_no_default: any;
while ((lambda_param_no_default = this.lambda_param_no_default()) !== null) {
children.push(lambda_param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop0_154(): any {
// _loop0_154: lambda_param_no_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_no_default: any;
while ((lambda_param_no_default = this.lambda_param_no_default()) !== null) {
children.push(lambda_param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop1_155(): any {
// _loop1_155: lambda_param_with_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_with_default: any;
while ((lambda_param_with_default = this.lambda_param_with_default()) !== null) {
children.push(lambda_param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop0_156(): any {
// _loop0_156: lambda_param_no_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_no_default: any;
while ((lambda_param_no_default = this.lambda_param_no_default()) !== null) {
children.push(lambda_param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop1_157(): any {
// _loop1_157: lambda_param_with_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_with_default: any;
while ((lambda_param_with_default = this.lambda_param_with_default()) !== null) {
children.push(lambda_param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop0_158(): any {
// _loop0_158: lambda_param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_maybe_default: any;
while ((lambda_param_maybe_default = this.lambda_param_maybe_default()) !== null) {
children.push(lambda_param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_159(): any {
// _tmp_159: lambda_kwds
const mark = this.mark;
{
let lambda_kwds: any;
if ((lambda_kwds = this.lambda_kwds()) !== null) {
return lambda_kwds;
}
this.mark = mark;
}
return null;
}
_loop1_160(): any {
// _loop1_160: lambda_param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_maybe_default: any;
while ((lambda_param_maybe_default = this.lambda_param_maybe_default()) !== null) {
children.push(lambda_param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_161(): any {
// _tmp_161: lambda_kwds
const mark = this.mark;
{
let lambda_kwds: any;
if ((lambda_kwds = this.lambda_kwds()) !== null) {
return lambda_kwds;
}
this.mark = mark;
}
return null;
}
_tmp_162(): any {
// _tmp_162: fstring_conversion
const mark = this.mark;
{
let fstring_conversion: any;
if ((fstring_conversion = this.fstring_conversion()) !== null) {
return fstring_conversion;
}
this.mark = mark;
}
return null;
}
_tmp_163(): any {
// _tmp_163: fstring_full_format_spec
const mark = this.mark;
{
let fstring_full_format_spec: any;
if ((fstring_full_format_spec = this.fstring_full_format_spec()) !== null) {
return fstring_full_format_spec;
}
this.mark = mark;
}
return null;
}
_loop0_164(): any {
// _loop0_164: fstring_format_spec
let mark = this.mark;
const children: any[] = [];
{
let fstring_format_spec: any;
while ((fstring_format_spec = this.fstring_format_spec()) !== null) {
children.push(fstring_format_spec); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop0_165(): any {
// _loop0_165: fstring_middle
let mark = this.mark;
const children: any[] = [];
{
let fstring_middle: any;
while ((fstring_middle = this.fstring_middle()) !== null) {
children.push(fstring_middle); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_166(): any {
// _tmp_166: fstring_conversion
const mark = this.mark;
{
let fstring_conversion: any;
if ((fstring_conversion = this.fstring_conversion()) !== null) {
return fstring_conversion;
}
this.mark = mark;
}
return null;
}
_tmp_167(): any {
// _tmp_167: tstring_full_format_spec
const mark = this.mark;
{
let tstring_full_format_spec: any;
if ((tstring_full_format_spec = this.tstring_full_format_spec()) !== null) {
return tstring_full_format_spec;
}
this.mark = mark;
}
return null;
}
_loop0_168(): any {
// _loop0_168: tstring_format_spec
let mark = this.mark;
const children: any[] = [];
{
let tstring_format_spec: any;
while ((tstring_format_spec = this.tstring_format_spec()) !== null) {
children.push(tstring_format_spec); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_169(): any {
// _tmp_169: fstring_conversion
const mark = this.mark;
{
let fstring_conversion: any;
if ((fstring_conversion = this.fstring_conversion()) !== null) {
return fstring_conversion;
}
this.mark = mark;
}
return null;
}
_tmp_170(): any {
// _tmp_170: tstring_full_format_spec
const mark = this.mark;
{
let tstring_full_format_spec: any;
if ((tstring_full_format_spec = this.tstring_full_format_spec()) !== null) {
return tstring_full_format_spec;
}
this.mark = mark;
}
return null;
}
_loop0_171(): any {
// _loop0_171: tstring_middle
let mark = this.mark;
const children: any[] = [];
{
let tstring_middle: any;
while ((tstring_middle = this.tstring_middle()) !== null) {
children.push(tstring_middle); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop1_172(): any {
// _loop1_172: (fstring | string)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_287: any;
while ((_tmp_287 = this._tmp_287()) !== null) {
children.push(_tmp_287); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop1_173(): any {
// _loop1_173: tstring
let mark = this.mark;
const children: any[] = [];
{
let tstring: any;
while ((tstring = this.tstring()) !== null) {
children.push(tstring); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_174(): any {
// _tmp_174: star_named_expressions
const mark = this.mark;
{
let star_named_expressions: any;
if ((star_named_expressions = this.star_named_expressions()) !== null) {
return star_named_expressions;
}
this.mark = mark;
}
return null;
}
_tmp_175(): any {
// _tmp_175: star_named_expression ',' star_named_expressions?
const mark = this.mark;
{
let y: any;
let literal: any;
let z: any;
if ((y = this.star_named_expression()) !== null && (literal = this.literal(",")) !== null && ((z = this._tmp_288()), true)) {
return [y, ...(z ?? [])];
}
this.mark = mark;
}
return null;
}
_tmp_176(): any {
// _tmp_176: double_starred_kvpairs
const mark = this.mark;
{
let double_starred_kvpairs: any;
if ((double_starred_kvpairs = this.double_starred_kvpairs()) !== null) {
return double_starred_kvpairs;
}
this.mark = mark;
}
return null;
}
_loop0_177(): any {
// _loop0_177: ',' double_starred_kvpair
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.double_starred_kvpair()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_178(): any {
// _gather_178: double_starred_kvpair _loop0_177
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.double_starred_kvpair()) !== null && (seq = this._loop0_177()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_179(): any {
// _tmp_179: ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop1_180(): any {
// _loop1_180: for_if_clause
let mark = this.mark;
const children: any[] = [];
{
let for_if_clause: any;
while ((for_if_clause = this.for_if_clause()) !== null) {
children.push(for_if_clause); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop0_181(): any {
// _loop0_181: ('if' disjunction)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_289: any;
while ((_tmp_289 = this._tmp_289()) !== null) {
children.push(_tmp_289); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop0_182(): any {
// _loop0_182: ('if' disjunction)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_290: any;
while ((_tmp_290 = this._tmp_290()) !== null) {
children.push(_tmp_290); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_183(): any {
// _tmp_183: assignment_expression | expression !':='
const mark = this.mark;
{
let assignment_expression: any;
if ((assignment_expression = this.assignment_expression()) !== null) {
return assignment_expression;
}
this.mark = mark;
}
{
let expression: any;
if ((expression = this.expression()) !== null && this.lookahead(() => this.literal(":="), false)) {
return expression;
}
this.mark = mark;
}
return null;
}
_tmp_184(): any {
// _tmp_184: ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop0_185(): any {
// _loop0_185: ',' (starred_expression | (assignment_expression | expression !':=') !'=')
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this._tmp_291()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_186(): any {
// _gather_186: (starred_expression | (assignment_expression | expression !':=') !'=') _loop0_185
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this._tmp_291()) !== null && (seq = this._loop0_185()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_187(): any {
// _tmp_187: ',' kwargs
const mark = this.mark;
{
let literal: any;
let k: any;
if ((literal = this.literal(",")) !== null && (k = this.kwargs()) !== null) {
return k;
}
this.mark = mark;
}
return null;
}
_loop0_188(): any {
// _loop0_188: ',' kwarg_or_starred
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.kwarg_or_starred()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_189(): any {
// _gather_189: kwarg_or_starred _loop0_188
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.kwarg_or_starred()) !== null && (seq = this._loop0_188()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_190(): any {
// _loop0_190: ',' kwarg_or_double_starred
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.kwarg_or_double_starred()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_191(): any {
// _gather_191: kwarg_or_double_starred _loop0_190
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.kwarg_or_double_starred()) !== null && (seq = this._loop0_190()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_192(): any {
// _loop0_192: ',' kwarg_or_starred
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.kwarg_or_starred()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_193(): any {
// _gather_193: kwarg_or_starred _loop0_192
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.kwarg_or_starred()) !== null && (seq = this._loop0_192()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_194(): any {
// _loop0_194: ',' kwarg_or_double_starred
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.kwarg_or_double_starred()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_195(): any {
// _gather_195: kwarg_or_double_starred _loop0_194
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.kwarg_or_double_starred()) !== null && (seq = this._loop0_194()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_196(): any {
// _loop0_196: (',' star_target)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_292: any;
while ((_tmp_292 = this._tmp_292()) !== null) {
children.push(_tmp_292); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_197(): any {
// _tmp_197: ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop0_198(): any {
// _loop0_198: ',' star_target
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.star_target()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_199(): any {
// _gather_199: star_target _loop0_198
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.star_target()) !== null && (seq = this._loop0_198()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_200(): any {
// _tmp_200: ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop1_201(): any {
// _loop1_201: (',' star_target)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_293: any;
while ((_tmp_293 = this._tmp_293()) !== null) {
children.push(_tmp_293); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_202(): any {
// _tmp_202: ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_203(): any {
// _tmp_203: !'*' star_target
const mark = this.mark;
{
let star_target: any;
if (this.lookahead(() => this.literal("*"), false) && (star_target = this.star_target()) !== null) {
return star_target;
}
this.mark = mark;
}
return null;
}
_tmp_204(): any {
// _tmp_204: star_targets_tuple_seq
const mark = this.mark;
{
let star_targets_tuple_seq: any;
if ((star_targets_tuple_seq = this.star_targets_tuple_seq()) !== null) {
return star_targets_tuple_seq;
}
this.mark = mark;
}
return null;
}
_tmp_205(): any {
// _tmp_205: star_targets_list_seq
const mark = this.mark;
{
let star_targets_list_seq: any;
if ((star_targets_list_seq = this.star_targets_list_seq()) !== null) {
return star_targets_list_seq;
}
this.mark = mark;
}
return null;
}
_tmp_206(): any {
// _tmp_206: arguments
const mark = this.mark;
{
let arguments_: any;
if ((arguments_ = this.arguments()) !== null) {
return arguments_;
}
this.mark = mark;
}
return null;
}
_loop0_207(): any {
// _loop0_207: ',' del_target
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.del_target()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_208(): any {
// _gather_208: del_target _loop0_207
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.del_target()) !== null && (seq = this._loop0_207()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_209(): any {
// _tmp_209: ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_210(): any {
// _tmp_210: del_targets
const mark = this.mark;
{
let del_targets: any;
if ((del_targets = this.del_targets()) !== null) {
return del_targets;
}
this.mark = mark;
}
return null;
}
_tmp_211(): any {
// _tmp_211: del_targets
const mark = this.mark;
{
let del_targets: any;
if ((del_targets = this.del_targets()) !== null) {
return del_targets;
}
this.mark = mark;
}
return null;
}
_tmp_212(): any {
// _tmp_212: NEWLINE INDENT
const mark = this.mark;
{
let newline: any;
let indent: any;
if ((newline = this.expect("NEWLINE")) !== null && (indent = this.expect("INDENT")) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_213(): any {
// _tmp_213: slash_no_default | slash_with_default
const mark = this.mark;
{
let slash_no_default: any;
if ((slash_no_default = this.slash_no_default()) !== null) {
return slash_no_default;
}
this.mark = mark;
}
{
let slash_with_default: any;
if ((slash_with_default = this.slash_with_default()) !== null) {
return slash_with_default;
}
this.mark = mark;
}
return null;
}
_loop0_214(): any {
// _loop0_214: param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let param_maybe_default: any;
while ((param_maybe_default = this.param_maybe_default()) !== null) {
children.push(param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop0_215(): any {
// _loop0_215: param_no_default
let mark = this.mark;
const children: any[] = [];
{
let param_no_default: any;
while ((param_no_default = this.param_no_default()) !== null) {
children.push(param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop0_216(): any {
// _loop0_216: param_no_default
let mark = this.mark;
const children: any[] = [];
{
let param_no_default: any;
while ((param_no_default = this.param_no_default()) !== null) {
children.push(param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop1_217(): any {
// _loop1_217: param_no_default
let mark = this.mark;
const children: any[] = [];
{
let param_no_default: any;
while ((param_no_default = this.param_no_default()) !== null) {
children.push(param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_218(): any {
// _tmp_218: slash_no_default | slash_with_default
const mark = this.mark;
{
let slash_no_default: any;
if ((slash_no_default = this.slash_no_default()) !== null) {
return slash_no_default;
}
this.mark = mark;
}
{
let slash_with_default: any;
if ((slash_with_default = this.slash_with_default()) !== null) {
return slash_with_default;
}
this.mark = mark;
}
return null;
}
_loop0_219(): any {
// _loop0_219: param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let param_maybe_default: any;
while ((param_maybe_default = this.param_maybe_default()) !== null) {
children.push(param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_220(): any {
// _tmp_220: ',' | param_no_default
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
{
let param_no_default: any;
if ((param_no_default = this.param_no_default()) !== null) {
return param_no_default;
}
this.mark = mark;
}
return null;
}
_loop0_221(): any {
// _loop0_221: param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let param_maybe_default: any;
while ((param_maybe_default = this.param_maybe_default()) !== null) {
children.push(param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop1_222(): any {
// _loop1_222: param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let param_maybe_default: any;
while ((param_maybe_default = this.param_maybe_default()) !== null) {
children.push(param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_223(): any {
// _tmp_223: ')' | ','
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(")")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_224(): any {
// _tmp_224: ')' | ',' (')' | '**')
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(")")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
let _tmp_294: any;
if ((literal = this.literal(",")) !== null && (_tmp_294 = this._tmp_294()) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_225(): any {
// _tmp_225: param_no_default | ','
const mark = this.mark;
{
let param_no_default: any;
if ((param_no_default = this.param_no_default()) !== null) {
return param_no_default;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop0_226(): any {
// _loop0_226: param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let param_maybe_default: any;
while ((param_maybe_default = this.param_maybe_default()) !== null) {
children.push(param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_227(): any {
// _tmp_227: param_no_default | ','
const mark = this.mark;
{
let param_no_default: any;
if ((param_no_default = this.param_no_default()) !== null) {
return param_no_default;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_228(): any {
// _tmp_228: '*' | '**' | '/'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("*")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("**")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("/")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop1_229(): any {
// _loop1_229: param_with_default
let mark = this.mark;
const children: any[] = [];
{
let param_with_default: any;
while ((param_with_default = this.param_with_default()) !== null) {
children.push(param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_230(): any {
// _tmp_230: lambda_slash_no_default | lambda_slash_with_default
const mark = this.mark;
{
let lambda_slash_no_default: any;
if ((lambda_slash_no_default = this.lambda_slash_no_default()) !== null) {
return lambda_slash_no_default;
}
this.mark = mark;
}
{
let lambda_slash_with_default: any;
if ((lambda_slash_with_default = this.lambda_slash_with_default()) !== null) {
return lambda_slash_with_default;
}
this.mark = mark;
}
return null;
}
_loop0_231(): any {
// _loop0_231: lambda_param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_maybe_default: any;
while ((lambda_param_maybe_default = this.lambda_param_maybe_default()) !== null) {
children.push(lambda_param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop0_232(): any {
// _loop0_232: lambda_param_no_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_no_default: any;
while ((lambda_param_no_default = this.lambda_param_no_default()) !== null) {
children.push(lambda_param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop0_233(): any {
// _loop0_233: lambda_param_no_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_no_default: any;
while ((lambda_param_no_default = this.lambda_param_no_default()) !== null) {
children.push(lambda_param_no_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop0_234(): any {
// _loop0_234: ',' lambda_param
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this.lambda_param()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_235(): any {
// _gather_235: lambda_param _loop0_234
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.lambda_param()) !== null && (seq = this._loop0_234()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_236(): any {
// _tmp_236: lambda_slash_no_default | lambda_slash_with_default
const mark = this.mark;
{
let lambda_slash_no_default: any;
if ((lambda_slash_no_default = this.lambda_slash_no_default()) !== null) {
return lambda_slash_no_default;
}
this.mark = mark;
}
{
let lambda_slash_with_default: any;
if ((lambda_slash_with_default = this.lambda_slash_with_default()) !== null) {
return lambda_slash_with_default;
}
this.mark = mark;
}
return null;
}
_loop0_237(): any {
// _loop0_237: lambda_param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_maybe_default: any;
while ((lambda_param_maybe_default = this.lambda_param_maybe_default()) !== null) {
children.push(lambda_param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_238(): any {
// _tmp_238: ',' | lambda_param_no_default
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
{
let lambda_param_no_default: any;
if ((lambda_param_no_default = this.lambda_param_no_default()) !== null) {
return lambda_param_no_default;
}
this.mark = mark;
}
return null;
}
_loop0_239(): any {
// _loop0_239: lambda_param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_maybe_default: any;
while ((lambda_param_maybe_default = this.lambda_param_maybe_default()) !== null) {
children.push(lambda_param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop1_240(): any {
// _loop1_240: lambda_param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_maybe_default: any;
while ((lambda_param_maybe_default = this.lambda_param_maybe_default()) !== null) {
children.push(lambda_param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop1_241(): any {
// _loop1_241: lambda_param_with_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_with_default: any;
while ((lambda_param_with_default = this.lambda_param_with_default()) !== null) {
children.push(lambda_param_with_default); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_242(): any {
// _tmp_242: ':' | ',' (':' | '**')
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(":")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
let _tmp_295: any;
if ((literal = this.literal(",")) !== null && (_tmp_295 = this._tmp_295()) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_243(): any {
// _tmp_243: lambda_param_no_default | ','
const mark = this.mark;
{
let lambda_param_no_default: any;
if ((lambda_param_no_default = this.lambda_param_no_default()) !== null) {
return lambda_param_no_default;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop0_244(): any {
// _loop0_244: lambda_param_maybe_default
let mark = this.mark;
const children: any[] = [];
{
let lambda_param_maybe_default: any;
while ((lambda_param_maybe_default = this.lambda_param_maybe_default()) !== null) {
children.push(lambda_param_maybe_default); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_245(): any {
// _tmp_245: lambda_param_no_default | ','
const mark = this.mark;
{
let lambda_param_no_default: any;
if ((lambda_param_no_default = this.lambda_param_no_default()) !== null) {
return lambda_param_no_default;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal(",")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_246(): any {
// _tmp_246: '*' | '**' | '/'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("*")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("**")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("/")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_247(): any {
// _tmp_247: 'async'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("async")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop0_248(): any {
// _loop0_248: ',' (expression ['as' star_target])
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this._tmp_296()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_249(): any {
// _gather_249: (expression ['as' star_target]) _loop0_248
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this._tmp_296()) !== null && (seq = this._loop0_248()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_250(): any {
// _tmp_250: 'async'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("async")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop0_251(): any {
// _loop0_251: ',' (expressions ['as' star_target])
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this._tmp_297()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_252(): any {
// _gather_252: (expressions ['as' star_target]) _loop0_251
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this._tmp_297()) !== null && (seq = this._loop0_251()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_253(): any {
// _tmp_253: 'async'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("async")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop0_254(): any {
// _loop0_254: ',' (expression ['as' star_target])
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this._tmp_298()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_255(): any {
// _gather_255: (expression ['as' star_target]) _loop0_254
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this._tmp_298()) !== null && (seq = this._loop0_254()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_256(): any {
// _tmp_256: 'async'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("async")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_loop0_257(): any {
// _loop0_257: ',' (expressions ['as' star_target])
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this._tmp_299()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_258(): any {
// _gather_258: (expressions ['as' star_target]) _loop0_257
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this._tmp_299()) !== null && (seq = this._loop0_257()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_259(): any {
// _tmp_259: 'as' NAME
const mark = this.mark;
{
let literal: any;
let name: any;
if ((literal = this.literal("as")) !== null && (name = this.name()) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_260(): any {
// _tmp_260: 'as' NAME
const mark = this.mark;
{
let literal: any;
let name: any;
if ((literal = this.literal("as")) !== null && (name = this.name()) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_261(): any {
// _tmp_261: 'async'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("async")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_262(): any {
// _tmp_262: 'async'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("async")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_263(): any {
// _tmp_263: 'async'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("async")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_264(): any {
// _tmp_264: type_params
const mark = this.mark;
{
let type_params: any;
if ((type_params = this.type_params()) !== null) {
return type_params;
}
this.mark = mark;
}
return null;
}
_tmp_265(): any {
// _tmp_265: params
const mark = this.mark;
{
let params: any;
if ((params = this.params()) !== null) {
return params;
}
this.mark = mark;
}
return null;
}
_tmp_266(): any {
// _tmp_266: '->' expression
const mark = this.mark;
{
let literal: any;
let expression: any;
if ((literal = this.literal("->")) !== null && (expression = this.expression()) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_267(): any {
// _tmp_267: 'async'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal("async")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_268(): any {
// _tmp_268: type_params
const mark = this.mark;
{
let type_params: any;
if ((type_params = this.type_params()) !== null) {
return type_params;
}
this.mark = mark;
}
return null;
}
_tmp_269(): any {
// _tmp_269: params
const mark = this.mark;
{
let params: any;
if ((params = this.params()) !== null) {
return params;
}
this.mark = mark;
}
return null;
}
_tmp_270(): any {
// _tmp_270: '->' expression
const mark = this.mark;
{
let literal: any;
let expression: any;
if ((literal = this.literal("->")) !== null && (expression = this.expression()) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_271(): any {
// _tmp_271: func_type_comment
const mark = this.mark;
{
let func_type_comment: any;
if ((func_type_comment = this.func_type_comment()) !== null) {
return func_type_comment;
}
this.mark = mark;
}
return null;
}
_tmp_272(): any {
// _tmp_272: type_params
const mark = this.mark;
{
let type_params: any;
if ((type_params = this.type_params()) !== null) {
return type_params;
}
this.mark = mark;
}
return null;
}
_tmp_273(): any {
// _tmp_273: '(' arguments? ')'
const mark = this.mark;
{
let literal: any;
let _tmp_300: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && ((_tmp_300 = this._tmp_300()), true) && (literal_1 = this.literal(")")) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_274(): any {
// _tmp_274: type_params
const mark = this.mark;
{
let type_params: any;
if ((type_params = this.type_params()) !== null) {
return type_params;
}
this.mark = mark;
}
return null;
}
_tmp_275(): any {
// _tmp_275: '(' arguments? ')'
const mark = this.mark;
{
let literal: any;
let _tmp_301: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && ((_tmp_301 = this._tmp_301()), true) && (literal_1 = this.literal(")")) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_276(): any {
// _tmp_276: star_targets '='
const mark = this.mark;
{
let z: any;
let literal: any;
if ((z = this.star_targets()) !== null && (literal = this.literal("=")) !== null) {
return z;
}
this.mark = mark;
}
return null;
}
_tmp_277(): any {
// _tmp_277: '.' | '...'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(".")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("...")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_278(): any {
// _tmp_278: '.' | '...'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(".")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("...")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_279(): any {
// _tmp_279: '@' named_expression NEWLINE
const mark = this.mark;
{
let literal: any;
let f: any;
let newline: any;
if ((literal = this.literal("@")) !== null && (f = this.named_expression()) !== null && (newline = this.expect("NEWLINE")) !== null) {
return f;
}
this.mark = mark;
}
return null;
}
_tmp_280(): any {
// _tmp_280: arguments
const mark = this.mark;
{
let arguments_: any;
if ((arguments_ = this.arguments()) !== null) {
return arguments_;
}
this.mark = mark;
}
return null;
}
_tmp_281(): any {
// _tmp_281: ',' expression
const mark = this.mark;
{
let literal: any;
let c: any;
if ((literal = this.literal(",")) !== null && (c = this.expression()) !== null) {
return c;
}
this.mark = mark;
}
return null;
}
_tmp_282(): any {
// _tmp_282: ',' star_expression
const mark = this.mark;
{
let literal: any;
let c: any;
if ((literal = this.literal(",")) !== null && (c = this.star_expression()) !== null) {
return c;
}
this.mark = mark;
}
return null;
}
_tmp_283(): any {
// _tmp_283: 'or' conjunction
const mark = this.mark;
{
let literal: any;
let c: any;
if ((literal = this.literal("or")) !== null && (c = this.conjunction()) !== null) {
return c;
}
this.mark = mark;
}
return null;
}
_tmp_284(): any {
// _tmp_284: 'and' inversion
const mark = this.mark;
{
let literal: any;
let c: any;
if ((literal = this.literal("and")) !== null && (c = this.inversion()) !== null) {
return c;
}
this.mark = mark;
}
return null;
}
_tmp_285(): any {
// _tmp_285: slice | starred_expression
const mark = this.mark;
{
let slice: any;
if ((slice = this.slice()) !== null) {
return slice;
}
this.mark = mark;
}
{
let starred_expression: any;
if ((starred_expression = this.starred_expression()) !== null) {
return starred_expression;
}
this.mark = mark;
}
return null;
}
_tmp_286(): any {
// _tmp_286: expression
const mark = this.mark;
{
let expression: any;
if ((expression = this.expression()) !== null) {
return expression;
}
this.mark = mark;
}
return null;
}
_tmp_287(): any {
// _tmp_287: fstring | string
const mark = this.mark;
{
let fstring: any;
if ((fstring = this.fstring()) !== null) {
return fstring;
}
this.mark = mark;
}
{
let string: any;
if ((string = this.string()) !== null) {
return string;
}
this.mark = mark;
}
return null;
}
_tmp_288(): any {
// _tmp_288: star_named_expressions
const mark = this.mark;
{
let star_named_expressions: any;
if ((star_named_expressions = this.star_named_expressions()) !== null) {
return star_named_expressions;
}
this.mark = mark;
}
return null;
}
_tmp_289(): any {
// _tmp_289: 'if' disjunction
const mark = this.mark;
{
let literal: any;
let z: any;
if ((literal = this.literal("if")) !== null && (z = this.disjunction()) !== null) {
return z;
}
this.mark = mark;
}
return null;
}
_tmp_290(): any {
// _tmp_290: 'if' disjunction
const mark = this.mark;
{
let literal: any;
let z: any;
if ((literal = this.literal("if")) !== null && (z = this.disjunction()) !== null) {
return z;
}
this.mark = mark;
}
return null;
}
_tmp_291(): any {
// _tmp_291: starred_expression | (assignment_expression | expression !':=') !'='
const mark = this.mark;
{
let starred_expression: any;
if ((starred_expression = this.starred_expression()) !== null) {
return starred_expression;
}
this.mark = mark;
}
{
let _tmp_302: any;
if ((_tmp_302 = this._tmp_302()) !== null && this.lookahead(() => this.literal("="), false)) {
return _tmp_302;
}
this.mark = mark;
}
return null;
}
_tmp_292(): any {
// _tmp_292: ',' star_target
const mark = this.mark;
{
let literal: any;
let c: any;
if ((literal = this.literal(",")) !== null && (c = this.star_target()) !== null) {
return c;
}
this.mark = mark;
}
return null;
}
_tmp_293(): any {
// _tmp_293: ',' star_target
const mark = this.mark;
{
let literal: any;
let c: any;
if ((literal = this.literal(",")) !== null && (c = this.star_target()) !== null) {
return c;
}
this.mark = mark;
}
return null;
}
_tmp_294(): any {
// _tmp_294: ')' | '**'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(")")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("**")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_295(): any {
// _tmp_295: ':' | '**'
const mark = this.mark;
{
let literal: any;
if ((literal = this.literal(":")) !== null) {
return literal;
}
this.mark = mark;
}
{
let literal: any;
if ((literal = this.literal("**")) !== null) {
return literal;
}
this.mark = mark;
}
return null;
}
_tmp_296(): any {
// _tmp_296: expression ['as' star_target]
const mark = this.mark;
{
let expression: any;
let _tmp_303: any;
if ((expression = this.expression()) !== null && ((_tmp_303 = this._tmp_303()), true)) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_297(): any {
// _tmp_297: expressions ['as' star_target]
const mark = this.mark;
{
let expressions: any;
let _tmp_304: any;
if ((expressions = this.expressions()) !== null && ((_tmp_304 = this._tmp_304()), true)) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_298(): any {
// _tmp_298: expression ['as' star_target]
const mark = this.mark;
{
let expression: any;
let _tmp_305: any;
if ((expression = this.expression()) !== null && ((_tmp_305 = this._tmp_305()), true)) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_299(): any {
// _tmp_299: expressions ['as' star_target]
const mark = this.mark;
{
let expressions: any;
let _tmp_306: any;
if ((expressions = this.expressions()) !== null && ((_tmp_306 = this._tmp_306()), true)) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_300(): any {
// _tmp_300: arguments
const mark = this.mark;
{
let arguments_: any;
if ((arguments_ = this.arguments()) !== null) {
return arguments_;
}
this.mark = mark;
}
return null;
}
_tmp_301(): any {
// _tmp_301: arguments
const mark = this.mark;
{
let arguments_: any;
if ((arguments_ = this.arguments()) !== null) {
return arguments_;
}
this.mark = mark;
}
return null;
}
_tmp_302(): any {
// _tmp_302: assignment_expression | expression !':='
const mark = this.mark;
{
let assignment_expression: any;
if ((assignment_expression = this.assignment_expression()) !== null) {
return assignment_expression;
}
this.mark = mark;
}
{
let expression: any;
if ((expression = this.expression()) !== null && this.lookahead(() => this.literal(":="), false)) {
return expression;
}
this.mark = mark;
}
return null;
}
_tmp_303(): any {
// _tmp_303: 'as' star_target
const mark = this.mark;
{
let literal: any;
let star_target: any;
if ((literal = this.literal("as")) !== null && (star_target = this.star_target()) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_304(): any {
// _tmp_304: 'as' star_target
const mark = this.mark;
{
let literal: any;
let star_target: any;
if ((literal = this.literal("as")) !== null && (star_target = this.star_target()) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_305(): any {
// _tmp_305: 'as' star_target
const mark = this.mark;
{
let literal: any;
let star_target: any;
if ((literal = this.literal("as")) !== null && (star_target = this.star_target()) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
_tmp_306(): any {
// _tmp_306: 'as' star_target
const mark = this.mark;
{
let literal: any;
let star_target: any;
if ((literal = this.literal("as")) !== null && (star_target = this.star_target()) !== null) {
return true;
}
this.mark = mark;
}
return null;
}
}
