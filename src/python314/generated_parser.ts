// Copyright (c) 2021 the Skulpt Project
// SPDX-License-Identifier: Python-2.0 AND MIT
// Generated from CPython 3.14.3, commit 323c59a5e348347be2ce2b7ea55fcb30bf68b2d3.
// Upstream grammar/actions retain their PSF license; see licenses/CPython.txt.
// Expression subset selected by tools/generate314/parser.py. Do not edit.
import * as ast from "./ast.ts";
import * as strings from "./strings.ts";
import { makeArguments } from "./parameters.ts";
import { Parser, memoize, memoizeLeftRec } from "./parser.ts";
export class ExpressionParser extends Parser {
eval(): any {
// eval: expressions NEWLINE* $
const mark = this.mark;
{
let a: any;
let _loop0_1: any;
let endmarker: any;
if ((a = this.expressions()) !== null && (_loop0_1 = this._loop0_1()) !== null && (endmarker = this.expect("ENDMARKER")) !== null) {
return ast.Expression(a);
}
this.mark = mark;
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
expressions(): any {
// expressions: expression ((',' expression))+ ','? | expression ',' | expression
const mark = this.mark;
{
let a: any;
let b: any;
let _tmp_3: any;
if ((a = this.expression()) !== null && (b = this._loop1_2()) !== null && ((_tmp_3 = this._tmp_3()), true)) {
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
if ((literal = this.literal("yield")) !== null && ((a = this._tmp_4()), true)) {
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
let _tmp_6: any;
if ((a = this.star_expression()) !== null && (b = this._loop1_5()) !== null && ((_tmp_6 = this._tmp_6()), true)) {
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
let _tmp_9: any;
if ((a = this._gather_8()) !== null && ((_tmp_9 = this._tmp_9()), true)) {
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
if ((a = this.conjunction()) !== null && (b = this._loop1_10()) !== null) {
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
if ((a = this.inversion()) !== null && (b = this._loop1_11()) !== null) {
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
if ((a = this.bitwise_or()) !== null && (b = this._loop1_12()) !== null) {
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
let _tmp_13: any;
let a: any;
if ((_tmp_13 = this._tmp_13()) !== null && (a = this.bitwise_or()) !== null) {
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
if ((a = this.primary()) !== null && (literal = this.literal("(")) !== null && ((b = this._tmp_14()), true) && (literal_1 = this.literal(")")) !== null) {
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
let _tmp_17: any;
if ((a = this._gather_16()) !== null && ((_tmp_17 = this._tmp_17()), true)) {
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
if (((a = this._tmp_18()), true) && (literal = this.literal(":")) !== null && ((b = this._tmp_19()), true) && ((c = this._tmp_20()), true)) {
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
if (this.lookahead(() => this._tmp_21(), true) && (strings = this.strings()) !== null) {
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
let _tmp_22: any;
if (this.lookahead(() => this.literal("("), true) && (_tmp_22 = this._tmp_22()) !== null) {
return _tmp_22;
}
this.mark = mark;
}
{
let _tmp_23: any;
if (this.lookahead(() => this.literal("["), true) && (_tmp_23 = this._tmp_23()) !== null) {
return _tmp_23;
}
this.mark = mark;
}
{
let _tmp_24: any;
if (this.lookahead(() => this.literal("{"), true) && (_tmp_24 = this._tmp_24()) !== null) {
return _tmp_24;
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
if ((literal = this.literal("(")) !== null && (a = this._tmp_25()) !== null && (literal_1 = this.literal(")")) !== null) {
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
if ((literal = this.literal("lambda")) !== null && ((a = this._tmp_26()), true) && (literal_1 = this.literal(":")) !== null && (b = this.expression()) !== null) {
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
if ((a = this.lambda_slash_no_default()) !== null && (b = this._loop0_27()) !== null && (c = this._loop0_28()) !== null && ((d = this._tmp_29()), true)) {
return makeArguments(a, null, b, c, d);
}
this.mark = mark;
}
{
let a: any;
let b: any;
let c: any;
if ((a = this.lambda_slash_with_default()) !== null && (b = this._loop0_30()) !== null && ((c = this._tmp_31()), true)) {
return makeArguments(null, a, null, b, c);
}
this.mark = mark;
}
{
let a: any;
let b: any;
let c: any;
if ((a = this._loop1_32()) !== null && (b = this._loop0_33()) !== null && ((c = this._tmp_34()), true)) {
return makeArguments(null, null, a, b, c);
}
this.mark = mark;
}
{
let a: any;
let b: any;
if ((a = this._loop1_35()) !== null && ((b = this._tmp_36()), true)) {
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
if ((a = this._loop1_37()) !== null && (literal = this.literal("/")) !== null && (literal_1 = this.literal(",")) !== null) {
return a;
}
this.mark = mark;
}
{
let a: any;
let literal: any;
if ((a = this._loop1_38()) !== null && (literal = this.literal("/")) !== null && this.lookahead(() => this.literal(":"), true)) {
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
if ((a = this._loop0_39()) !== null && (b = this._loop1_40()) !== null && (literal = this.literal("/")) !== null && (literal_1 = this.literal(",")) !== null) {
return {plainNames: a, namesWithDefaults: b};
}
this.mark = mark;
}
{
let a: any;
let b: any;
let literal: any;
if ((a = this._loop0_41()) !== null && (b = this._loop1_42()) !== null && (literal = this.literal("/")) !== null && this.lookahead(() => this.literal(":"), true)) {
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
if ((literal = this.literal("*")) !== null && (a = this.lambda_param_no_default()) !== null && (b = this._loop0_43()) !== null && ((c = this._tmp_44()), true)) {
return {vararg: a, kwonlyargs: b, kwarg: c};
}
this.mark = mark;
}
{
let literal: any;
let literal_1: any;
let b: any;
let c: any;
if ((literal = this.literal("*")) !== null && (literal_1 = this.literal(",")) !== null && (b = this._loop1_45()) !== null && ((c = this._tmp_46()), true)) {
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
if ((literal = this.literal("{")) !== null && (a = this.annotated_rhs()) !== null && ((debug_expr = this.literal("=")), true) && ((conversion = this._tmp_47()), true) && ((format = this._tmp_48()), true) && (rbrace = this.literal("}")) !== null) {
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
if ((colon = this.literal(":")) !== null && (spec = this._loop0_49()) !== null) {
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
if ((a = this.expect("FSTRING_START")) !== null && (b = this._loop0_50()) !== null && (c = this.expect("FSTRING_END")) !== null) {
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
if ((literal = this.literal("{")) !== null && (a = this.annotated_rhs()) !== null && ((debug_expr = this.literal("=")), true) && ((conversion = this._tmp_51()), true) && ((format = this._tmp_52()), true) && (rbrace = this.literal("}")) !== null) {
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
if ((colon = this.literal(":")) !== null && (spec = this._loop0_53()) !== null) {
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
if ((literal = this.literal("{")) !== null && (a = this.annotated_rhs()) !== null && ((debug_expr = this.literal("=")), true) && ((conversion = this._tmp_54()), true) && ((format = this._tmp_55()), true) && (rbrace = this.literal("}")) !== null) {
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
if ((a = this.expect("TSTRING_START")) !== null && (b = this._loop0_56()) !== null && (c = this.expect("TSTRING_END")) !== null) {
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
if ((a = this._loop1_57()) !== null) {
return strings.concatenate(this, a, ...this.span(mark));
}
this.mark = mark;
}
{
let a: any;
if ((a = this._loop1_58()) !== null) {
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
if ((literal = this.literal("[")) !== null && ((a = this._tmp_59()), true) && (literal_1 = this.literal("]")) !== null) {
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
if ((literal = this.literal("(")) !== null && ((a = this._tmp_60()), true) && (literal_1 = this.literal(")")) !== null) {
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
if ((literal = this.literal("{")) !== null && ((a = this._tmp_61()), true) && (literal_1 = this.literal("}")) !== null) {
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
let _tmp_64: any;
if ((a = this._gather_63()) !== null && ((_tmp_64 = this._tmp_64()), true)) {
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
if ((a = this._loop1_65()) !== null) {
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
if ((literal = this.literal("async")) !== null && (literal_1 = this.literal("for")) !== null && (a = this.star_targets()) !== null && (literal_2 = this.literal("in")) !== null && (cut = true) && (b = this.disjunction()) !== null && (c = this._loop0_66()) !== null) {
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
if ((literal = this.literal("for")) !== null && (a = this.star_targets()) !== null && (literal_1 = this.literal("in")) !== null && (cut = true) && (b = this.disjunction()) !== null && (c = this._loop0_67()) !== null) {
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
if ((literal = this.literal("(")) !== null && (a = this._tmp_68()) !== null && (b = this.for_if_clauses()) !== null && (literal_1 = this.literal(")")) !== null) {
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
let _tmp_69: any;
if ((a = this.args()) !== null && ((_tmp_69 = this._tmp_69()), true) && this.lookahead(() => this.literal(")"), true)) {
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
if ((a = this._gather_71()) !== null && ((b = this._tmp_72()), true)) {
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
if ((a = this._gather_74()) !== null && (literal = this.literal(",")) !== null && (b = this._gather_76()) !== null) {
return [...a, ...b];
}
this.mark = mark;
}
{
let _gather_78: any;
if ((_gather_78 = this._gather_78()) !== null) {
return _gather_78;
}
this.mark = mark;
}
{
let _gather_80: any;
if ((_gather_80 = this._gather_80()) !== null) {
return _gather_80;
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
let _tmp_82: any;
if ((a = this.star_target()) !== null && (b = this._loop0_81()) !== null && ((_tmp_82 = this._tmp_82()), true)) {
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
let _tmp_85: any;
if ((a = this._gather_84()) !== null && ((_tmp_85 = this._tmp_85()), true)) {
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
let _tmp_87: any;
if ((a = this.star_target()) !== null && (b = this._loop1_86()) !== null && ((_tmp_87 = this._tmp_87()), true)) {
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
if ((literal = this.literal("*")) !== null && (a = this._tmp_88()) !== null) {
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
if ((literal = this.literal("(")) !== null && ((a = this._tmp_89()), true) && (literal_1 = this.literal(")")) !== null) {
return ast.Tuple((a ?? []), ast.Store(), ...this.span(mark));
}
this.mark = mark;
}
{
let literal: any;
let a: any;
let literal_1: any;
if ((literal = this.literal("[")) !== null && ((a = this._tmp_90()), true) && (literal_1 = this.literal("]")) !== null) {
return ast.List((a ?? []), ast.Store(), ...this.span(mark));
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
if ((a = this.t_primary()) !== null && (literal = this.literal("(")) !== null && ((b = this._tmp_91()), true) && (literal_1 = this.literal(")")) !== null && this.lookahead(() => this.t_lookahead(), true)) {
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
_loop0_1(): any {
// _loop0_1: NEWLINE
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
_loop1_2(): any {
// _loop1_2: (',' expression)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_92: any;
while ((_tmp_92 = this._tmp_92()) !== null) {
children.push(_tmp_92); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_3(): any {
// _tmp_3: ','
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
_tmp_4(): any {
// _tmp_4: star_expressions
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
_loop1_5(): any {
// _loop1_5: (',' star_expression)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_93: any;
while ((_tmp_93 = this._tmp_93()) !== null) {
children.push(_tmp_93); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_6(): any {
// _tmp_6: ','
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
_loop0_7(): any {
// _loop0_7: ',' star_named_expression
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
_gather_8(): any {
// _gather_8: star_named_expression _loop0_7
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.star_named_expression()) !== null && (seq = this._loop0_7()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_9(): any {
// _tmp_9: ','
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
_loop1_10(): any {
// _loop1_10: ('or' conjunction)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_94: any;
while ((_tmp_94 = this._tmp_94()) !== null) {
children.push(_tmp_94); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop1_11(): any {
// _loop1_11: ('and' inversion)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_95: any;
while ((_tmp_95 = this._tmp_95()) !== null) {
children.push(_tmp_95); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop1_12(): any {
// _loop1_12: compare_op_bitwise_or_pair
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
_tmp_13(): any {
// _tmp_13: '!='
const mark = this.mark;
{
let tok: any;
if ((tok = this.literal("!=")) !== null) {
return tok;
}
this.mark = mark;
}
return null;
}
_tmp_14(): any {
// _tmp_14: arguments
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
_loop0_15(): any {
// _loop0_15: ',' (slice | starred_expression)
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this._tmp_96()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_16(): any {
// _gather_16: (slice | starred_expression) _loop0_15
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this._tmp_96()) !== null && (seq = this._loop0_15()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_17(): any {
// _tmp_17: ','
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
_tmp_18(): any {
// _tmp_18: expression
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
_tmp_19(): any {
// _tmp_19: expression
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
_tmp_20(): any {
// _tmp_20: ':' expression?
const mark = this.mark;
{
let literal: any;
let d: any;
if ((literal = this.literal(":")) !== null && ((d = this._tmp_97()), true)) {
return d;
}
this.mark = mark;
}
return null;
}
_tmp_21(): any {
// _tmp_21: STRING | FSTRING_START | TSTRING_START
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
_tmp_22(): any {
// _tmp_22: tuple | group | genexp
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
_tmp_23(): any {
// _tmp_23: list | listcomp
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
_tmp_24(): any {
// _tmp_24: dict | set | dictcomp | setcomp
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
_tmp_25(): any {
// _tmp_25: yield_expr | named_expression
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
_tmp_26(): any {
// _tmp_26: lambda_params
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
_loop0_27(): any {
// _loop0_27: lambda_param_no_default
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
_loop0_28(): any {
// _loop0_28: lambda_param_with_default
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
_tmp_29(): any {
// _tmp_29: lambda_star_etc
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
_loop0_30(): any {
// _loop0_30: lambda_param_with_default
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
_tmp_31(): any {
// _tmp_31: lambda_star_etc
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
_loop1_32(): any {
// _loop1_32: lambda_param_no_default
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
_loop0_33(): any {
// _loop0_33: lambda_param_with_default
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
_tmp_34(): any {
// _tmp_34: lambda_star_etc
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
_loop1_35(): any {
// _loop1_35: lambda_param_with_default
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
_tmp_36(): any {
// _tmp_36: lambda_star_etc
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
_loop1_37(): any {
// _loop1_37: lambda_param_no_default
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
_loop1_38(): any {
// _loop1_38: lambda_param_no_default
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
_loop0_39(): any {
// _loop0_39: lambda_param_no_default
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
_loop1_40(): any {
// _loop1_40: lambda_param_with_default
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
_loop0_41(): any {
// _loop0_41: lambda_param_no_default
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
_loop1_42(): any {
// _loop1_42: lambda_param_with_default
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
_loop0_43(): any {
// _loop0_43: lambda_param_maybe_default
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
_tmp_44(): any {
// _tmp_44: lambda_kwds
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
_loop1_45(): any {
// _loop1_45: lambda_param_maybe_default
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
_tmp_46(): any {
// _tmp_46: lambda_kwds
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
_tmp_47(): any {
// _tmp_47: fstring_conversion
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
_tmp_48(): any {
// _tmp_48: fstring_full_format_spec
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
_loop0_49(): any {
// _loop0_49: fstring_format_spec
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
_loop0_50(): any {
// _loop0_50: fstring_middle
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
_tmp_51(): any {
// _tmp_51: fstring_conversion
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
_tmp_52(): any {
// _tmp_52: tstring_full_format_spec
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
_loop0_53(): any {
// _loop0_53: tstring_format_spec
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
_tmp_54(): any {
// _tmp_54: fstring_conversion
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
_tmp_55(): any {
// _tmp_55: tstring_full_format_spec
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
_loop0_56(): any {
// _loop0_56: tstring_middle
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
_loop1_57(): any {
// _loop1_57: (fstring | string)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_98: any;
while ((_tmp_98 = this._tmp_98()) !== null) {
children.push(_tmp_98); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_loop1_58(): any {
// _loop1_58: tstring
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
_tmp_59(): any {
// _tmp_59: star_named_expressions
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
_tmp_60(): any {
// _tmp_60: star_named_expression ',' star_named_expressions?
const mark = this.mark;
{
let y: any;
let literal: any;
let z: any;
if ((y = this.star_named_expression()) !== null && (literal = this.literal(",")) !== null && ((z = this._tmp_99()), true)) {
return [y, ...(z ?? [])];
}
this.mark = mark;
}
return null;
}
_tmp_61(): any {
// _tmp_61: double_starred_kvpairs
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
_loop0_62(): any {
// _loop0_62: ',' double_starred_kvpair
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
_gather_63(): any {
// _gather_63: double_starred_kvpair _loop0_62
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.double_starred_kvpair()) !== null && (seq = this._loop0_62()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_64(): any {
// _tmp_64: ','
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
_loop1_65(): any {
// _loop1_65: for_if_clause
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
_loop0_66(): any {
// _loop0_66: ('if' disjunction)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_100: any;
while ((_tmp_100 = this._tmp_100()) !== null) {
children.push(_tmp_100); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_loop0_67(): any {
// _loop0_67: ('if' disjunction)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_101: any;
while ((_tmp_101 = this._tmp_101()) !== null) {
children.push(_tmp_101); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_tmp_68(): any {
// _tmp_68: assignment_expression | expression !':='
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
_tmp_69(): any {
// _tmp_69: ','
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
_loop0_70(): any {
// _loop0_70: ',' (starred_expression | (assignment_expression | expression !':=') !'=')
let mark = this.mark;
const children: any[] = [];
{
let literal: any;
let elem: any;
while ((literal = this.literal(",")) !== null && (elem = this._tmp_102()) !== null) {
children.push(elem); mark = this.mark;
}
this.mark = mark;
}
return children;
}
_gather_71(): any {
// _gather_71: (starred_expression | (assignment_expression | expression !':=') !'=') _loop0_70
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this._tmp_102()) !== null && (seq = this._loop0_70()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_tmp_72(): any {
// _tmp_72: ',' kwargs
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
_loop0_73(): any {
// _loop0_73: ',' kwarg_or_starred
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
_gather_74(): any {
// _gather_74: kwarg_or_starred _loop0_73
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.kwarg_or_starred()) !== null && (seq = this._loop0_73()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_75(): any {
// _loop0_75: ',' kwarg_or_double_starred
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
_gather_76(): any {
// _gather_76: kwarg_or_double_starred _loop0_75
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.kwarg_or_double_starred()) !== null && (seq = this._loop0_75()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_77(): any {
// _loop0_77: ',' kwarg_or_starred
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
_gather_78(): any {
// _gather_78: kwarg_or_starred _loop0_77
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.kwarg_or_starred()) !== null && (seq = this._loop0_77()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_79(): any {
// _loop0_79: ',' kwarg_or_double_starred
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
_gather_80(): any {
// _gather_80: kwarg_or_double_starred _loop0_79
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.kwarg_or_double_starred()) !== null && (seq = this._loop0_79()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
}
_loop0_81(): any {
// _loop0_81: (',' star_target)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_103: any;
while ((_tmp_103 = this._tmp_103()) !== null) {
children.push(_tmp_103); mark = this.mark;
}
this.mark = mark;
}
return children;
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
_loop0_83(): any {
// _loop0_83: ',' star_target
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
_gather_84(): any {
// _gather_84: star_target _loop0_83
const mark = this.mark;
{
let elem: any;
let seq: any;
if ((elem = this.star_target()) !== null && (seq = this._loop0_83()) !== null) {
return [elem, ...seq];
}
this.mark = mark;
}
return null;
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
_loop1_86(): any {
// _loop1_86: (',' star_target)
let mark = this.mark;
const children: any[] = [];
{
let _tmp_104: any;
while ((_tmp_104 = this._tmp_104()) !== null) {
children.push(_tmp_104); mark = this.mark;
}
this.mark = mark;
}
return children.length ? children : null;
}
_tmp_87(): any {
// _tmp_87: ','
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
_tmp_88(): any {
// _tmp_88: !'*' star_target
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
_tmp_89(): any {
// _tmp_89: star_targets_tuple_seq
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
_tmp_90(): any {
// _tmp_90: star_targets_list_seq
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
_tmp_91(): any {
// _tmp_91: arguments
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
_tmp_92(): any {
// _tmp_92: ',' expression
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
_tmp_93(): any {
// _tmp_93: ',' star_expression
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
_tmp_94(): any {
// _tmp_94: 'or' conjunction
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
_tmp_95(): any {
// _tmp_95: 'and' inversion
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
_tmp_96(): any {
// _tmp_96: slice | starred_expression
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
// _tmp_98: fstring | string
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
_tmp_99(): any {
// _tmp_99: star_named_expressions
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
_tmp_100(): any {
// _tmp_100: 'if' disjunction
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
_tmp_101(): any {
// _tmp_101: 'if' disjunction
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
_tmp_102(): any {
// _tmp_102: starred_expression | (assignment_expression | expression !':=') !'='
const mark = this.mark;
{
let starred_expression: any;
if ((starred_expression = this.starred_expression()) !== null) {
return starred_expression;
}
this.mark = mark;
}
{
let _tmp_105: any;
if ((_tmp_105 = this._tmp_105()) !== null && this.lookahead(() => this.literal("="), false)) {
return _tmp_105;
}
this.mark = mark;
}
return null;
}
_tmp_103(): any {
// _tmp_103: ',' star_target
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
_tmp_104(): any {
// _tmp_104: ',' star_target
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
_tmp_105(): any {
// _tmp_105: assignment_expression | expression !':='
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
