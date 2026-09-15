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
// compound_stmt: &('def' | '@' | 'async') function_def | &'if' if_stmt | &('class' | '@') class_def | &('for' | 'async') for_stmt | &'while' while_stmt
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
let for_stmt: any;
if (this.lookahead(() => this._tmp_10(), true) && (for_stmt = this.for_stmt()) !== null) {
return for_stmt;
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
if ((a = this.name()) !== null && (literal = this.literal(":")) !== null && (b = this.expression()) !== null && ((c = this._tmp_11()), true)) {
return ast.AnnAssign(this.setContext(a, ast.Store()), b, c, 1, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let literal: any;
let b: any;
let c: any;
if ((a = this._tmp_12()) !== null && (literal = this.literal(":")) !== null && (b = this.expression()) !== null && ((c = this._tmp_13()), true)) {
return ast.AnnAssign(a, b, c, 0, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
let b: any;
let tc: any;
if ((a = this._loop1_14()) !== null && (b = this.annotated_rhs()) !== null && this.lookahead(() => this.literal("="), false) && ((tc = this._tmp_15()), true)) {
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
if ((literal = this.literal("return")) !== null && ((a = this._tmp_16()), true)) {
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
if ((literal = this.literal("raise")) !== null && (a = this.expression()) !== null && ((b = this._tmp_17()), true)) {
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
if ((literal = this.literal("global")) !== null && (a = this._gather_19()) !== null) {
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
if ((literal = this.literal("nonlocal")) !== null && (a = this._gather_21()) !== null) {
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
if ((literal = this.literal("del")) !== null && (a = this.del_targets()) !== null && this.lookahead(() => this._tmp_22(), true)) {
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
if ((literal = this.literal("assert")) !== null && (a = this.expression()) !== null && ((b = this._tmp_23()), true)) {
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
if ((literal = this.literal("from")) !== null && (a = this._loop0_24()) !== null && (b = this.dotted_name()) !== null && (literal_1 = this.literal("import")) !== null && (c = this.import_from_targets()) !== null) {
return checkedImport(this, b.id, c, a.reduce((sum: number, token: Token) => sum + token.string.length, 0), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
let b: any;
if ((literal = this.literal("from")) !== null && (a = this._loop1_25()) !== null && (literal_1 = this.literal("import")) !== null && (b = this.import_from_targets()) !== null) {
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
let _tmp_26: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && (a = this.import_from_as_names()) !== null && ((_tmp_26 = this._tmp_26()), true) && (literal_1 = this.literal(")")) !== null) {
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
if ((a = this._gather_28()) !== null) {
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
if ((a = this.name()) !== null && ((b = this._tmp_29()), true)) {
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
if ((a = this._gather_31()) !== null) {
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
if ((a = this.dotted_name()) !== null && ((b = this._tmp_32()), true)) {
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
// block: NEWLINE INDENT statements DEDENT | simple_stmts
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
return null;
}
decorators(): any {
// decorators: (('@' named_expression NEWLINE))+
const mark = this.mark;
{
let a: any;
if ((a = this._loop1_33()) !== null) {
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
// class_def_raw: 'class' NAME type_params? ['(' arguments? ')'] ':' block
const mark = this.mark;
{
let literal: any;
let a: any;
let t: any;
let b: any;
let literal_1: any;
let c: any;
if ((literal = this.literal("class")) !== null && (a = this.name()) !== null && ((t = this._tmp_34()), true) && ((b = this._tmp_35()), true) && (literal_1 = this.literal(":")) !== null && (c = this.block()) !== null) {
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
// function_def_raw: 'def' NAME type_params? '(' params? ')' ['->' expression] ':' func_type_comment? block | 'async' 'def' NAME type_params? '(' params? ')' ['->' expression] ':' func_type_comment? block
const mark = this.mark;
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
if ((literal = this.literal("def")) !== null && (n = this.name()) !== null && ((t = this._tmp_36()), true) && (literal_1 = this.literal("(")) !== null && ((params = this._tmp_37()), true) && (literal_2 = this.literal(")")) !== null && ((a = this._tmp_38()), true) && (literal_3 = this.literal(":")) !== null && ((tc = this._tmp_39()), true) && (b = this.block()) !== null) {
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
if ((literal = this.literal("async")) !== null && (literal_1 = this.literal("def")) !== null && (n = this.name()) !== null && ((t = this._tmp_40()), true) && (literal_2 = this.literal("(")) !== null && ((params = this._tmp_41()), true) && (literal_3 = this.literal(")")) !== null && ((a = this._tmp_42()), true) && (literal_4 = this.literal(":")) !== null && ((tc = this._tmp_43()), true) && (b = this.block()) !== null) {
return ast.AsyncFunctionDef(n.id, (params ?? ast.arguments([], [], null, [], [], null, [])), b, [], a, this.typeComment(tc), (t ?? []), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
params(): any {
// params: parameters
const mark = this.mark;
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
if ((a = this.slash_no_default()) !== null && (b = this._loop0_44()) !== null && (c = this._loop0_45()) !== null && ((d = this._tmp_46()), true)) {
return makeArguments(a, null, b, c, d);
}
this.mark = mark;
}
{
let a: any;
let b: any;
let c: any;
if ((a = this.slash_with_default()) !== null && (b = this._loop0_47()) !== null && ((c = this._tmp_48()), true)) {
return makeArguments(null, a, null, b, c);
}
this.mark = mark;
}
{
let a: any;
let b: any;
let c: any;
if ((a = this._loop1_49()) !== null && (b = this._loop0_50()) !== null && ((c = this._tmp_51()), true)) {
return makeArguments(null, null, a, b, c);
}
this.mark = mark;
}
{
let a: any;
let b: any;
if ((a = this._loop1_52()) !== null && ((b = this._tmp_53()), true)) {
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
if ((a = this._loop1_54()) !== null && (literal = this.literal("/")) !== null && (literal_1 = this.literal(",")) !== null) {
return a;
}
this.mark = mark;
}
{
let a: any;
let literal: any;
if ((a = this._loop1_55()) !== null && (literal = this.literal("/")) !== null && this.lookahead(() => this.literal(")"), true)) {
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
if ((a = this._loop0_56()) !== null && (b = this._loop1_57()) !== null && (literal = this.literal("/")) !== null && (literal_1 = this.literal(",")) !== null) {
return {plainNames: a, namesWithDefaults: b};
}
this.mark = mark;
}
{
let a: any;
let b: any;
let literal: any;
if ((a = this._loop0_58()) !== null && (b = this._loop1_59()) !== null && (literal = this.literal("/")) !== null && this.lookahead(() => this.literal(")"), true)) {
return {plainNames: a, namesWithDefaults: b};
}
this.mark = mark;
}
return null;
}
star_etc(): any {
// star_etc: '*' param_no_default param_maybe_default* kwds? | '*' param_no_default_star_annotation param_maybe_default* kwds? | '*' ',' param_maybe_default+ kwds? | kwds
const mark = this.mark;
{
let literal: any;
let a: any;
let b: any;
let c: any;
if ((literal = this.literal("*")) !== null && (a = this.param_no_default()) !== null && (b = this._loop0_60()) !== null && ((c = this._tmp_61()), true)) {
return {vararg: a, kwonlyargs: b, kwarg: c};
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let b: any;
let c: any;
if ((literal = this.literal("*")) !== null && (a = this.param_no_default_star_annotation()) !== null && (b = this._loop0_62()) !== null && ((c = this._tmp_63()), true)) {
return {vararg: a, kwonlyargs: b, kwarg: c};
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let b: any;
let c: any;
if ((literal = this.literal("*")) !== null && (literal_1 = this.literal(",")) !== null && (b = this._loop1_64()) !== null && ((c = this._tmp_65()), true)) {
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
// kwds: '**' param_no_default
const mark = this.mark;
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
// default: '=' expression
const mark = this.mark;
{
let literal: any;
let a: any;
if ((literal = this.literal("=")) !== null && (a = this.expression()) !== null) {
return a;
}
this.mark = mark;
}
return null;
}
if_stmt(): any {
// if_stmt: 'if' named_expression ':' block elif_stmt | 'if' named_expression ':' block else_block?
const mark = this.mark;
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
if ((literal = this.literal("if")) !== null && (a = this.named_expression()) !== null && (literal_1 = this.literal(":")) !== null && (b = this.block()) !== null && ((c = this._tmp_66()), true)) {
return ast.If(a, b, (c ?? []), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
elif_stmt(): any {
// elif_stmt: 'elif' named_expression ':' block elif_stmt | 'elif' named_expression ':' block else_block?
const mark = this.mark;
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
if ((literal = this.literal("elif")) !== null && (a = this.named_expression()) !== null && (literal_1 = this.literal(":")) !== null && (b = this.block()) !== null && ((c = this._tmp_67()), true)) {
return ast.If(a, b, (c ?? []), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
else_block(): any {
// else_block: 'else' &&':' block
const mark = this.mark;
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
// while_stmt: 'while' named_expression ':' block else_block?
const mark = this.mark;
{
let literal: any;
let a: any;
let literal_1: any;
let b: any;
let c: any;
if ((literal = this.literal("while")) !== null && (a = this.named_expression()) !== null && (literal_1 = this.literal(":")) !== null && (b = this.block()) !== null && ((c = this._tmp_68()), true)) {
return ast.While(a, b, (c ?? []), ...this.span(mark));
}
this.mark = mark;
}
return null;
}
for_stmt(): any {
// for_stmt: 'for' star_targets 'in' ~ star_expressions ':' TYPE_COMMENT? block else_block? | 'async' 'for' star_targets 'in' ~ star_expressions ':' TYPE_COMMENT? block else_block?
const mark = this.mark;
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
if ((literal = this.literal("for")) !== null && (t = this.star_targets()) !== null && (literal_1 = this.literal("in")) !== null && (cut = true) && (ex = this.star_expressions()) !== null && (literal_2 = this.literal(":")) !== null && ((tc = this._tmp_69()), true) && (b = this.block()) !== null && ((el = this._tmp_70()), true)) {
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
if ((literal = this.literal("async")) !== null && (literal_1 = this.literal("for")) !== null && (t = this.star_targets()) !== null && (literal_2 = this.literal("in")) !== null && (cut = true) && (ex = this.star_expressions()) !== null && (literal_3 = this.literal(":")) !== null && ((tc = this._tmp_71()), true) && (b = this.block()) !== null && ((el = this._tmp_72()), true)) {
return ast.AsyncFor(t, ex, b, (el ?? []), this.typeComment(tc), ...this.span(mark));
}
this.mark = mark;
if (cut) return null;
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
if ((literal = this.literal("type")) !== null && (n = this.name()) !== null && ((t = this._tmp_73()), true) && (literal_1 = this.literal("=")) !== null && (b = this.expression()) !== null) {
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
let _tmp_76: any;
if ((a = this._gather_75()) !== null && ((_tmp_76 = this._tmp_76()), true)) {
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
if ((a = this.name()) !== null && ((b = this._tmp_77()), true) && ((c = this._tmp_78()), true)) {
return ast.TypeVar(a.id, b, c, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let b: any;
if ((literal = this.literal("*")) !== null && (a = this.name()) !== null && ((b = this._tmp_79()), true)) {
return ast.TypeVarTuple(a.id, b, ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let b: any;
if ((literal = this.literal("**")) !== null && (a = this.name()) !== null && ((b = this._tmp_80()), true)) {
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
let _tmp_82: any;
if ((a = this.expression()) !== null && (b = this._loop1_81()) !== null && ((_tmp_82 = this._tmp_82()), true)) {
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
if ((literal = this.literal("yield")) !== null && ((a = this._tmp_83()), true)) {
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
let _tmp_85: any;
if ((a = this.star_expression()) !== null && (b = this._loop1_84()) !== null && ((_tmp_85 = this._tmp_85()), true)) {
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
let _tmp_88: any;
if ((a = this._gather_87()) !== null && ((_tmp_88 = this._tmp_88()), true)) {
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
if ((a = this.conjunction()) !== null && (b = this._loop1_89()) !== null) {
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
if ((a = this.inversion()) !== null && (b = this._loop1_90()) !== null) {
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
if ((a = this.bitwise_or()) !== null && (b = this._loop1_91()) !== null) {
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
let _tmp_92: any;
let a: any;
if ((_tmp_92 = this._tmp_92()) !== null && (a = this.bitwise_or()) !== null) {
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
if ((a = this.primary()) !== null && (literal = this.literal("(")) !== null && ((b = this._tmp_93()), true) && (literal_1 = this.literal(")")) !== null) {
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
let _tmp_96: any;
if ((a = this._gather_95()) !== null && ((_tmp_96 = this._tmp_96()), true)) {
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
if (((a = this._tmp_97()), true) && (literal = this.literal(":")) !== null && ((b = this._tmp_98()), true) && ((c = this._tmp_99()), true)) {
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
if (this.lookahead(() => this._tmp_100(), true) && (strings = this.strings()) !== null) {
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
let _tmp_101: any;
if (this.lookahead(() => this.literal("("), true) && (_tmp_101 = this._tmp_101()) !== null) {
return _tmp_101;
}
this.mark = mark;
}
{
let _tmp_102: any;
if (this.lookahead(() => this.literal("["), true) && (_tmp_102 = this._tmp_102()) !== null) {
return _tmp_102;
}
this.mark = mark;
}
{
let _tmp_103: any;
if (this.lookahead(() => this.literal("{"), true) && (_tmp_103 = this._tmp_103()) !== null) {
return _tmp_103;
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
if ((literal = this.literal("(")) !== null && (a = this._tmp_104()) !== null && (literal_1 = this.literal(")")) !== null) {
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
if ((literal = this.literal("lambda")) !== null && ((a = this._tmp_105()), true) && (literal_1 = this.literal(":")) !== null && (b = this.expression()) !== null) {
return ast.Lambda((a ?? ast.arguments([], [], null, [], [], null, [])), b, ...this.span(mark));
}
this.mark = mark;
}
return null;
}
lambda_params(): any {
// lambda_params: lambda_parameters
const mark = this.mark;
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
if ((a = this.lambda_slash_no_default()) !== null && (b = this._loop0_106()) !== null && (c = this._loop0_107()) !== null && ((d = this._tmp_108()), true)) {
return makeArguments(a, null, b, c, d);
}
this.mark = mark;
}
{
let a: any;
let b: any;
let c: any;
if ((a = this.lambda_slash_with_default()) !== null && (b = this._loop0_109()) !== null && ((c = this._tmp_110()), true)) {
return makeArguments(null, a, null, b, c);
}
this.mark = mark;
}
{
let a: any;
let b: any;
let c: any;
if ((a = this._loop1_111()) !== null && (b = this._loop0_112()) !== null && ((c = this._tmp_113()), true)) {
return makeArguments(null, null, a, b, c);
}
this.mark = mark;
}
{
let a: any;
let b: any;
if ((a = this._loop1_114()) !== null && ((b = this._tmp_115()), true)) {
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
if ((a = this._loop1_116()) !== null && (literal = this.literal("/")) !== null && (literal_1 = this.literal(",")) !== null) {
return a;
}
this.mark = mark;
}
{
let a: any;
let literal: any;
if ((a = this._loop1_117()) !== null && (literal = this.literal("/")) !== null && this.lookahead(() => this.literal(":"), true)) {
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
if ((a = this._loop0_118()) !== null && (b = this._loop1_119()) !== null && (literal = this.literal("/")) !== null && (literal_1 = this.literal(",")) !== null) {
return {plainNames: a, namesWithDefaults: b};
}
this.mark = mark;
}
{
let a: any;
let b: any;
let literal: any;
if ((a = this._loop0_120()) !== null && (b = this._loop1_121()) !== null && (literal = this.literal("/")) !== null && this.lookahead(() => this.literal(":"), true)) {
return {plainNames: a, namesWithDefaults: b};
}
this.mark = mark;
}
return null;
}
lambda_star_etc(): any {
// lambda_star_etc: '*' lambda_param_no_default lambda_param_maybe_default* lambda_kwds? | '*' ',' lambda_param_maybe_default+ lambda_kwds? | lambda_kwds
const mark = this.mark;
{
let literal: any;
let a: any;
let b: any;
let c: any;
if ((literal = this.literal("*")) !== null && (a = this.lambda_param_no_default()) !== null && (b = this._loop0_122()) !== null && ((c = this._tmp_123()), true)) {
return {vararg: a, kwonlyargs: b, kwarg: c};
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let b: any;
let c: any;
if ((literal = this.literal("*")) !== null && (literal_1 = this.literal(",")) !== null && (b = this._loop1_124()) !== null && ((c = this._tmp_125()), true)) {
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
// lambda_kwds: '**' lambda_param_no_default
const mark = this.mark;
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
if ((literal = this.literal("{")) !== null && (a = this.annotated_rhs()) !== null && ((debug_expr = this.literal("=")), true) && ((conversion = this._tmp_126()), true) && ((format = this._tmp_127()), true) && (rbrace = this.literal("}")) !== null) {
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
if ((colon = this.literal(":")) !== null && (spec = this._loop0_128()) !== null) {
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
if ((a = this.expect("FSTRING_START")) !== null && (b = this._loop0_129()) !== null && (c = this.expect("FSTRING_END")) !== null) {
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
if ((literal = this.literal("{")) !== null && (a = this.annotated_rhs()) !== null && ((debug_expr = this.literal("=")), true) && ((conversion = this._tmp_130()), true) && ((format = this._tmp_131()), true) && (rbrace = this.literal("}")) !== null) {
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
if ((colon = this.literal(":")) !== null && (spec = this._loop0_132()) !== null) {
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
if ((literal = this.literal("{")) !== null && (a = this.annotated_rhs()) !== null && ((debug_expr = this.literal("=")), true) && ((conversion = this._tmp_133()), true) && ((format = this._tmp_134()), true) && (rbrace = this.literal("}")) !== null) {
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
if ((a = this.expect("TSTRING_START")) !== null && (b = this._loop0_135()) !== null && (c = this.expect("TSTRING_END")) !== null) {
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
if ((a = this._loop1_136()) !== null) {
return strings.concatenate(this, a, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
if ((a = this._loop1_137()) !== null) {
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
if ((literal = this.literal("[")) !== null && ((a = this._tmp_138()), true) && (literal_1 = this.literal("]")) !== null) {
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
if ((literal = this.literal("(")) !== null && ((a = this._tmp_139()), true) && (literal_1 = this.literal(")")) !== null) {
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
if ((literal = this.literal("{")) !== null && ((a = this._tmp_140()), true) && (literal_1 = this.literal("}")) !== null) {
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
let _tmp_143: any;
if ((a = this._gather_142()) !== null && ((_tmp_143 = this._tmp_143()), true)) {
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
if ((a = this._loop1_144()) !== null) {
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
if ((literal = this.literal("async")) !== null && (literal_1 = this.literal("for")) !== null && (a = this.star_targets()) !== null && (literal_2 = this.literal("in")) !== null && (cut = true) && (b = this.disjunction()) !== null && (c = this._loop0_145()) !== null) {
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
if ((literal = this.literal("for")) !== null && (a = this.star_targets()) !== null && (literal_1 = this.literal("in")) !== null && (cut = true) && (b = this.disjunction()) !== null && (c = this._loop0_146()) !== null) {
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
if ((literal = this.literal("(")) !== null && (a = this._tmp_147()) !== null && (b = this.for_if_clauses()) !== null && (literal_1 = this.literal(")")) !== null) {
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
let _tmp_148: any;
if ((a = this.args()) !== null && ((_tmp_148 = this._tmp_148()), true) && this.lookahead(() => this.literal(")"), true)) {
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
if ((a = this._gather_150()) !== null && ((b = this._tmp_151()), true)) {
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
if ((a = this._gather_153()) !== null && (literal = this.literal(",")) !== null && (b = this._gather_155()) !== null) {
return [...a, ...b];
}
this.mark = mark;
}
{
let _gather_157: any;
if ((_gather_157 = this._gather_157()) !== null) {
return _gather_157;
}
this.mark = mark;
}
{
let _gather_159: any;
if ((_gather_159 = this._gather_159()) !== null) {
return _gather_159;
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
let _tmp_161: any;
if ((a = this.star_target()) !== null && (b = this._loop0_160()) !== null && ((_tmp_161 = this._tmp_161()), true)) {
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
let _tmp_164: any;
if ((a = this._gather_163()) !== null && ((_tmp_164 = this._tmp_164()), true)) {
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
let _tmp_166: any;
if ((a = this.star_target()) !== null && (b = this._loop1_165()) !== null && ((_tmp_166 = this._tmp_166()), true)) {
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
if ((literal = this.literal("*")) !== null && (a = this._tmp_167()) !== null) {
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
if ((literal = this.literal("(")) !== null && ((a = this._tmp_168()), true) && (literal_1 = this.literal(")")) !== null) {
return ast.Tuple((a ?? []), ast.Store(), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("[")) !== null && ((a = this._tmp_169()), true) && (literal_1 = this.literal("]")) !== null) {
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
if ((a = this.t_primary()) !== null && (literal = this.literal("(")) !== null && ((b = this._tmp_170()), true) && (literal_1 = this.literal(")")) !== null && this.lookahead(() => this.t_lookahead(), true)) {
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
let _tmp_173: any;
if ((a = this._gather_172()) !== null && ((_tmp_173 = this._tmp_173()), true)) {
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
if ((literal = this.literal("(")) !== null && ((a = this._tmp_174()), true) && (literal_1 = this.literal(")")) !== null) {
return ast.Tuple((a ?? []), ast.Del(), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("[")) !== null && ((a = this._tmp_175()), true) && (literal_1 = this.literal("]")) !== null) {
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
if ((newline = this.expect("NEWLINE")) !== null && (t = this.expect("TYPE_COMMENT")) !== null && this.lookahead(() => this._tmp_176(), true)) {
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
// _tmp_10: 'for' | 'async'
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
_tmp_11(): any {
// _tmp_11: '=' annotated_rhs
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
_tmp_12(): any {
// _tmp_12: '(' single_target ')' | single_subscript_attribute_target
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
_tmp_13(): any {
// _tmp_13: '=' annotated_rhs
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
_loop1_14(): any {
// _loop1_14: (star_targets '=')
let mark = this.mark;
const children: any[] = [];
{
let _tmp_177: any;
while ((_tmp_177 = this._tmp_177()) !== null) {
children.push(_tmp_177); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_15(): any {
// _tmp_15: TYPE_COMMENT
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
_tmp_16(): any {
// _tmp_16: star_expressions
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
_tmp_17(): any {
// _tmp_17: 'from' expression
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
_loop0_18(): any {
// _loop0_18: ',' NAME
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
_gather_19(): any {
// _gather_19: NAME _loop0_18
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.name()) !== null && (seq = this._loop0_18()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_20(): any {
// _loop0_20: ',' NAME
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
_gather_21(): any {
// _gather_21: NAME _loop0_20
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.name()) !== null && (seq = this._loop0_20()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_22(): any {
// _tmp_22: ';' | NEWLINE
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
_tmp_23(): any {
// _tmp_23: ',' expression
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
_loop0_24(): any {
// _loop0_24: ('.' | '...')
let mark = this.mark;
const children: any[] = [];
{
let _tmp_178: any;
while ((_tmp_178 = this._tmp_178()) !== null) {
children.push(_tmp_178); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop1_25(): any {
// _loop1_25: ('.' | '...')
let mark = this.mark;
const children: any[] = [];
{
let _tmp_179: any;
while ((_tmp_179 = this._tmp_179()) !== null) {
children.push(_tmp_179); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_26(): any {
// _tmp_26: ','
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
_loop0_27(): any {
// _loop0_27: ',' import_from_as_name
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
_gather_28(): any {
// _gather_28: import_from_as_name _loop0_27
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.import_from_as_name()) !== null && (seq = this._loop0_27()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_29(): any {
// _tmp_29: 'as' NAME
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
_loop0_30(): any {
// _loop0_30: ',' dotted_as_name
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
_gather_31(): any {
// _gather_31: dotted_as_name _loop0_30
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.dotted_as_name()) !== null && (seq = this._loop0_30()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_32(): any {
// _tmp_32: 'as' NAME
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
_loop1_33(): any {
// _loop1_33: ('@' named_expression NEWLINE)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_180: any;
while ((_tmp_180 = this._tmp_180()) !== null) {
children.push(_tmp_180); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_34(): any {
// _tmp_34: type_params
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
_tmp_35(): any {
// _tmp_35: '(' arguments? ')'
const mark = this.mark;
{
let literal: any;
let z: any;
let literal_1: any;
if ((literal = this.literal("(")) !== null && ((z = this._tmp_181()), true) && (literal_1 = this.literal(")")) !== null) {
return z;
}
this.mark = mark;
}
return null;
}
_tmp_36(): any {
// _tmp_36: type_params
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
_tmp_37(): any {
// _tmp_37: params
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
_tmp_38(): any {
// _tmp_38: '->' expression
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
_tmp_39(): any {
// _tmp_39: func_type_comment
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
_tmp_40(): any {
// _tmp_40: type_params
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
_tmp_41(): any {
// _tmp_41: params
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
_tmp_42(): any {
// _tmp_42: '->' expression
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
_tmp_43(): any {
// _tmp_43: func_type_comment
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
_loop0_44(): any {
// _loop0_44: param_no_default
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
_loop0_45(): any {
// _loop0_45: param_with_default
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
_tmp_46(): any {
// _tmp_46: star_etc
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
_loop0_47(): any {
// _loop0_47: param_with_default
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
_tmp_48(): any {
// _tmp_48: star_etc
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
_loop1_49(): any {
// _loop1_49: param_no_default
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
_loop0_50(): any {
// _loop0_50: param_with_default
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
_tmp_51(): any {
// _tmp_51: star_etc
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
_loop1_52(): any {
// _loop1_52: param_with_default
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
_tmp_53(): any {
// _tmp_53: star_etc
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
_loop1_54(): any {
// _loop1_54: param_no_default
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
_loop0_56(): any {
// _loop0_56: param_no_default
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
_loop1_57(): any {
// _loop1_57: param_with_default
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
_loop0_58(): any {
// _loop0_58: param_no_default
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
_loop1_59(): any {
// _loop1_59: param_with_default
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
_loop0_60(): any {
// _loop0_60: param_maybe_default
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
_tmp_61(): any {
// _tmp_61: kwds
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
_loop0_62(): any {
// _loop0_62: param_maybe_default
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
_tmp_63(): any {
// _tmp_63: kwds
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
_loop1_64(): any {
// _loop1_64: param_maybe_default
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
_tmp_65(): any {
// _tmp_65: kwds
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
_tmp_66(): any {
// _tmp_66: else_block
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
// _tmp_69: TYPE_COMMENT
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
_tmp_70(): any {
// _tmp_70: else_block
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
_tmp_71(): any {
// _tmp_71: TYPE_COMMENT
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
_tmp_72(): any {
// _tmp_72: else_block
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
_tmp_73(): any {
// _tmp_73: type_params
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
_loop0_74(): any {
// _loop0_74: ',' type_param
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
_gather_75(): any {
// _gather_75: type_param _loop0_74
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.type_param()) !== null && (seq = this._loop0_74()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_76(): any {
// _tmp_76: ','
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
_tmp_77(): any {
// _tmp_77: type_param_bound
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
_tmp_78(): any {
// _tmp_78: type_param_default
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
_tmp_79(): any {
// _tmp_79: type_param_starred_default
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
_tmp_80(): any {
// _tmp_80: type_param_default
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
_loop1_81(): any {
// _loop1_81: (',' expression)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_182: any;
while ((_tmp_182 = this._tmp_182()) !== null) {
children.push(_tmp_182); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_82(): any {
// _tmp_82: ','
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
_tmp_83(): any {
// _tmp_83: star_expressions
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
_loop1_84(): any {
// _loop1_84: (',' star_expression)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_183: any;
while ((_tmp_183 = this._tmp_183()) !== null) {
children.push(_tmp_183); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_85(): any {
// _tmp_85: ','
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
_loop0_86(): any {
// _loop0_86: ',' star_named_expression
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
_gather_87(): any {
// _gather_87: star_named_expression _loop0_86
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.star_named_expression()) !== null && (seq = this._loop0_86()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_88(): any {
// _tmp_88: ','
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
_loop1_89(): any {
// _loop1_89: ('or' conjunction)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_184: any;
while ((_tmp_184 = this._tmp_184()) !== null) {
children.push(_tmp_184); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop1_90(): any {
// _loop1_90: ('and' inversion)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_185: any;
while ((_tmp_185 = this._tmp_185()) !== null) {
children.push(_tmp_185); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop1_91(): any {
// _loop1_91: compare_op_bitwise_or_pair
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
_tmp_92(): any {
// _tmp_92: '!='
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
_tmp_93(): any {
// _tmp_93: arguments
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
_loop0_94(): any {
// _loop0_94: ',' (slice | starred_expression)
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this._tmp_186()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_95(): any {
// _gather_95: (slice | starred_expression) _loop0_94
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this._tmp_186()) !== null && (seq = this._loop0_94()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_96(): any {
// _tmp_96: ','
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
_tmp_97(): any {
// _tmp_97: expression
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
_tmp_98(): any {
// _tmp_98: expression
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
_tmp_99(): any {
// _tmp_99: ':' expression?
const mark = this.mark;
{
let literal: any;
let d: any;
if ((literal = this.literal(":")) !== null && ((d = this._tmp_187()), true)) {
return d;
}
this.mark = mark;
}
return null;
}
_tmp_100(): any {
// _tmp_100: STRING | FSTRING_START | TSTRING_START
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
_tmp_101(): any {
// _tmp_101: tuple | group | genexp
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
_tmp_102(): any {
// _tmp_102: list | listcomp
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
_tmp_103(): any {
// _tmp_103: dict | set | dictcomp | setcomp
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
_tmp_104(): any {
// _tmp_104: yield_expr | named_expression
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
_tmp_105(): any {
// _tmp_105: lambda_params
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
_loop0_106(): any {
// _loop0_106: lambda_param_no_default
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
_loop0_107(): any {
// _loop0_107: lambda_param_with_default
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
_tmp_108(): any {
// _tmp_108: lambda_star_etc
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
_loop0_109(): any {
// _loop0_109: lambda_param_with_default
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
_tmp_110(): any {
// _tmp_110: lambda_star_etc
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
_loop1_111(): any {
// _loop1_111: lambda_param_no_default
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
_loop0_112(): any {
// _loop0_112: lambda_param_with_default
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
_tmp_113(): any {
// _tmp_113: lambda_star_etc
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
_loop1_114(): any {
// _loop1_114: lambda_param_with_default
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
_tmp_115(): any {
// _tmp_115: lambda_star_etc
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
_loop1_116(): any {
// _loop1_116: lambda_param_no_default
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
_loop1_117(): any {
// _loop1_117: lambda_param_no_default
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
_loop0_118(): any {
// _loop0_118: lambda_param_no_default
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
_loop1_119(): any {
// _loop1_119: lambda_param_with_default
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
_loop0_120(): any {
// _loop0_120: lambda_param_no_default
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
_loop1_121(): any {
// _loop1_121: lambda_param_with_default
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
_loop0_122(): any {
// _loop0_122: lambda_param_maybe_default
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
_tmp_123(): any {
// _tmp_123: lambda_kwds
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
_loop1_124(): any {
// _loop1_124: lambda_param_maybe_default
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
_tmp_125(): any {
// _tmp_125: lambda_kwds
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
_tmp_126(): any {
// _tmp_126: fstring_conversion
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
_tmp_127(): any {
// _tmp_127: fstring_full_format_spec
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
_loop0_128(): any {
// _loop0_128: fstring_format_spec
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
_loop0_129(): any {
// _loop0_129: fstring_middle
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
_tmp_130(): any {
// _tmp_130: fstring_conversion
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
_tmp_131(): any {
// _tmp_131: tstring_full_format_spec
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
_loop0_132(): any {
// _loop0_132: tstring_format_spec
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
_tmp_133(): any {
// _tmp_133: fstring_conversion
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
_tmp_134(): any {
// _tmp_134: tstring_full_format_spec
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
_loop0_135(): any {
// _loop0_135: tstring_middle
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
_loop1_136(): any {
// _loop1_136: (fstring | string)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_188: any;
while ((_tmp_188 = this._tmp_188()) !== null) {
children.push(_tmp_188); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop1_137(): any {
// _loop1_137: tstring
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
_tmp_138(): any {
// _tmp_138: star_named_expressions
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
_tmp_139(): any {
// _tmp_139: star_named_expression ',' star_named_expressions?
const mark = this.mark;
{
let y: any;
let literal: any;
let z: any;
if ((y = this.star_named_expression()) !== null && (literal = this.literal(",")) !== null && ((z = this._tmp_189()), true)) {
return [y, ...(z ?? [])];
}
this.mark = mark;
}
return null;
}
_tmp_140(): any {
// _tmp_140: double_starred_kvpairs
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
_loop0_141(): any {
// _loop0_141: ',' double_starred_kvpair
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
_gather_142(): any {
// _gather_142: double_starred_kvpair _loop0_141
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.double_starred_kvpair()) !== null && (seq = this._loop0_141()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_143(): any {
// _tmp_143: ','
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
_loop1_144(): any {
// _loop1_144: for_if_clause
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
_loop0_145(): any {
// _loop0_145: ('if' disjunction)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_190: any;
while ((_tmp_190 = this._tmp_190()) !== null) {
children.push(_tmp_190); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop0_146(): any {
// _loop0_146: ('if' disjunction)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_191: any;
while ((_tmp_191 = this._tmp_191()) !== null) {
children.push(_tmp_191); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_147(): any {
// _tmp_147: assignment_expression | expression !':='
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
_tmp_148(): any {
// _tmp_148: ','
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
_loop0_149(): any {
// _loop0_149: ',' (starred_expression | (assignment_expression | expression !':=') !'=')
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this._tmp_192()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_150(): any {
// _gather_150: (starred_expression | (assignment_expression | expression !':=') !'=') _loop0_149
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this._tmp_192()) !== null && (seq = this._loop0_149()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_151(): any {
// _tmp_151: ',' kwargs
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
_loop0_152(): any {
// _loop0_152: ',' kwarg_or_starred
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
_gather_153(): any {
// _gather_153: kwarg_or_starred _loop0_152
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.kwarg_or_starred()) !== null && (seq = this._loop0_152()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_154(): any {
// _loop0_154: ',' kwarg_or_double_starred
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
_gather_155(): any {
// _gather_155: kwarg_or_double_starred _loop0_154
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.kwarg_or_double_starred()) !== null && (seq = this._loop0_154()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_156(): any {
// _loop0_156: ',' kwarg_or_starred
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
_gather_157(): any {
// _gather_157: kwarg_or_starred _loop0_156
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.kwarg_or_starred()) !== null && (seq = this._loop0_156()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_158(): any {
// _loop0_158: ',' kwarg_or_double_starred
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
_gather_159(): any {
// _gather_159: kwarg_or_double_starred _loop0_158
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.kwarg_or_double_starred()) !== null && (seq = this._loop0_158()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_160(): any {
// _loop0_160: (',' star_target)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_193: any;
while ((_tmp_193 = this._tmp_193()) !== null) {
children.push(_tmp_193); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_161(): any {
// _tmp_161: ','
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
_loop0_162(): any {
// _loop0_162: ',' star_target
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
_gather_163(): any {
// _gather_163: star_target _loop0_162
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.star_target()) !== null && (seq = this._loop0_162()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_164(): any {
// _tmp_164: ','
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
_loop1_165(): any {
// _loop1_165: (',' star_target)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_194: any;
while ((_tmp_194 = this._tmp_194()) !== null) {
children.push(_tmp_194); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_166(): any {
// _tmp_166: ','
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
_tmp_167(): any {
// _tmp_167: !'*' star_target
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
_tmp_168(): any {
// _tmp_168: star_targets_tuple_seq
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
_tmp_169(): any {
// _tmp_169: star_targets_list_seq
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
_tmp_170(): any {
// _tmp_170: arguments
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
_loop0_171(): any {
// _loop0_171: ',' del_target
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
_gather_172(): any {
// _gather_172: del_target _loop0_171
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.del_target()) !== null && (seq = this._loop0_171()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_173(): any {
// _tmp_173: ','
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
_tmp_174(): any {
// _tmp_174: del_targets
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
_tmp_175(): any {
// _tmp_175: del_targets
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
_tmp_176(): any {
// _tmp_176: NEWLINE INDENT
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
_tmp_177(): any {
// _tmp_177: star_targets '='
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
_tmp_178(): any {
// _tmp_178: '.' | '...'
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
_tmp_179(): any {
// _tmp_179: '.' | '...'
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
_tmp_180(): any {
// _tmp_180: '@' named_expression NEWLINE
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
_tmp_181(): any {
// _tmp_181: arguments
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
_tmp_182(): any {
// _tmp_182: ',' expression
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
_tmp_183(): any {
// _tmp_183: ',' star_expression
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
_tmp_184(): any {
// _tmp_184: 'or' conjunction
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
_tmp_185(): any {
// _tmp_185: 'and' inversion
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
_tmp_186(): any {
// _tmp_186: slice | starred_expression
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
_tmp_187(): any {
// _tmp_187: expression
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
_tmp_188(): any {
// _tmp_188: fstring | string
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
_tmp_189(): any {
// _tmp_189: star_named_expressions
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
_tmp_190(): any {
// _tmp_190: 'if' disjunction
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
_tmp_191(): any {
// _tmp_191: 'if' disjunction
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
_tmp_192(): any {
// _tmp_192: starred_expression | (assignment_expression | expression !':=') !'='
const mark = this.mark;
{
let starred_expression: any;
if ((starred_expression = this.starred_expression()) !== null) {
return starred_expression;
}
this.mark = mark;
}
{
let _tmp_195: any;
if ((_tmp_195 = this._tmp_195()) !== null && this.lookahead(() => this.literal("="), false)) {
return _tmp_195;
}
this.mark = mark;
}
return null;
}
_tmp_193(): any {
// _tmp_193: ',' star_target
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
_tmp_194(): any {
// _tmp_194: ',' star_target
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
_tmp_195(): any {
// _tmp_195: assignment_expression | expression !':='
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
}
