// Experimental adaptation of CPython 3.14.3 symbol-table behavior.
// See CPYTHON-LICENSE.txt and README.md for provenance and scope.
/** Same semantic blocks as the other candidate; only dispatch organization differs. */
import { Engine, syntax } from "./common.ts";
import { unsupported } from "./types.ts";
import type { Node, Of, ScopeResult, VisitorContract, Kind } from "./types.ts";
export class VisitorAnalyzer extends Engine implements VisitorContract {
    visit(node: Node): void {
        const accept = dispatch[node._type] as (visitor: VisitorContract, node: Node) => void;
        if (!accept) unsupported(node);
        accept(this, node);
    }
    visit_Module(node: Of<"Module">): void {
        this.walk(node.body);
    }
    visit_FunctionDef(node: Of<"FunctionDef">): void {
        if (node.returns || node.type_params?.length)
            throw new Error("Unsupported annotations or type parameters in experiment");
        this.checkArguments(node.args);
        this.bind(node.name, "assigned");
        this.walk(node.args.defaults);
        this.walk(node.args.kw_defaults);
        this.walk(node.decorator_list);
        this.enter(node.name, node.lineno!);
        this.visit(node.args);
        this.walk(node.body);
        this.leave();
    }
    visit_Lambda(node: Of<"Lambda">): void {
        this.checkArguments(node.args);
        this.walk(node.args.defaults);
        this.walk(node.args.kw_defaults);
        this.enter("lambda", node.lineno!);
        this.visit(node.args);
        this.visit(node.body);
        this.leave();
    }
    visit_arguments(node: Of<"arguments">): void {
        this.walk(node.posonlyargs);
        this.walk(node.args);
        this.maybe(node.vararg);
        this.walk(node.kwonlyargs);
        this.maybe(node.kwarg);
    }
    visit_arg(node: Of<"arg">): void {
        if (node.annotation) throw new Error("Unsupported annotations in experiment");
        this.bind(node.arg, "parameter");
    }
    visit_Return(node: Of<"Return">): void {
        this.maybe(node.value);
    }
    visit_Assign(node: Of<"Assign">): void {
        this.walk(node.targets);
        this.visit(node.value);
    }
    visit_Name(node: Of<"Name">): void {
        this.bind(node.id, node.ctx._type === "Load" ? "referenced" : "assigned");
    }
    visit_Constant(node: Of<"Constant">): void {
        // Literal values carry no symbol references.
    }
    visit_Expr(node: Of<"Expr">): void {
        this.visit(node.value);
    }
    visit_BinOp(node: Of<"BinOp">): void {
        this.visit(node.left);
        this.visit(node.right);
    }
    visit_BoolOp(node: Of<"BoolOp">): void {
        this.walk(node.values);
    }
    visit_Compare(node: Of<"Compare">): void {
        this.visit(node.left);
        this.walk(node.comparators);
    }
    visit_UnaryOp(node: Of<"UnaryOp">): void {
        this.visit(node.operand);
    }
    visit_Call(node: Of<"Call">): void {
        this.visit(node.func);
        this.walk(node.args);
        this.walk(node.keywords);
    }
    visit_keyword(node: Of<"keyword">): void {
        this.visit(node.value);
    }
    visit_Attribute(node: Of<"Attribute">): void {
        this.visit(node.value);
    }
    visit_Subscript(node: Of<"Subscript">): void {
        this.visit(node.value);
        this.visit(node.slice);
    }
    visit_Tuple(node: Of<"Tuple">): void {
        this.walk(node.elts);
    }
    visit_List(node: Of<"List">): void {
        this.walk(node.elts);
    }
    visit_Dict(node: Of<"Dict">): void {
        this.walk(node.keys);
        this.walk(node.values);
    }
    visit_Set(node: Of<"Set">): void {
        this.walk(node.elts);
    }
    visit_If(node: Of<"If">): void {
        this.visit(node.test);
        this.walk(node.body);
        this.walk(node.orelse);
    }
    visit_For(node: Of<"For">): void {
        this.visit(node.target);
        this.visit(node.iter);
        this.walk(node.body);
        this.walk(node.orelse);
    }
    visit_Global(node: Of<"Global">): void {
        for (const name of node.names) this.directive(name, "global");
    }
    visit_Nonlocal(node: Of<"Nonlocal">): void {
        for (const name of node.names) this.directive(name, "nonlocal");
    }
    visit_Import(node: Of<"Import">): void {
        this.walk(node.names);
    }
    visit_ImportFrom(node: Of<"ImportFrom">): void {
        this.walk(node.names);
    }
    visit_alias(node: Of<"alias">): void {
        if (node.name === "*") {
            if (this.current.type !== "module") syntax("import * only allowed at module level");
        } else this.bind(node.asname ?? node.name.split(".")[0], "imported");
    }
    visit_Pass(node: Of<"Pass">): void {
        // No bindings.
    }
    visit_GeneratorExp(node: Of<"GeneratorExp">): void {
        const first = node.generators[0];
        if (first.is_async) throw new Error("Unsupported asynchronous comprehension in experiment");
        this.iterable(first.iter);
        this.enter("genexpr", node.lineno!, true);
        this.bind(".0", "parameter");
        this.iterationTarget(first.target);
        this.walk(first.ifs);
        this.walk(node.generators.slice(1));
        this.visit(node.elt);
        this.leave();
    }
    visit_comprehension(node: Of<"comprehension">): void {
        if (node.is_async) throw new Error("Unsupported asynchronous comprehension in experiment");
        this.iterationTarget(node.target);
        this.iterable(node.iter);
        this.walk(node.ifs);
    }
    visit_NamedExpr(node: Of<"NamedExpr">): void {
        this.namedTarget(node.target);
        this.visit(node.value);
        this.visit(node.target);
    }
}
const dispatch: { [K in Kind]: (visitor: VisitorContract, node: Of<K>) => void } = {
    Module: (visitor, node) => visitor.visit_Module(node),
    FunctionDef: (visitor, node) => visitor.visit_FunctionDef(node),
    Lambda: (visitor, node) => visitor.visit_Lambda(node),
    arguments: (visitor, node) => visitor.visit_arguments(node),
    arg: (visitor, node) => visitor.visit_arg(node),
    Return: (visitor, node) => visitor.visit_Return(node),
    Assign: (visitor, node) => visitor.visit_Assign(node),
    Name: (visitor, node) => visitor.visit_Name(node),
    Constant: (visitor, node) => visitor.visit_Constant(node),
    Expr: (visitor, node) => visitor.visit_Expr(node),
    BinOp: (visitor, node) => visitor.visit_BinOp(node),
    BoolOp: (visitor, node) => visitor.visit_BoolOp(node),
    Compare: (visitor, node) => visitor.visit_Compare(node),
    UnaryOp: (visitor, node) => visitor.visit_UnaryOp(node),
    Call: (visitor, node) => visitor.visit_Call(node),
    keyword: (visitor, node) => visitor.visit_keyword(node),
    Attribute: (visitor, node) => visitor.visit_Attribute(node),
    Subscript: (visitor, node) => visitor.visit_Subscript(node),
    Tuple: (visitor, node) => visitor.visit_Tuple(node),
    List: (visitor, node) => visitor.visit_List(node),
    Dict: (visitor, node) => visitor.visit_Dict(node),
    Set: (visitor, node) => visitor.visit_Set(node),
    If: (visitor, node) => visitor.visit_If(node),
    For: (visitor, node) => visitor.visit_For(node),
    Global: (visitor, node) => visitor.visit_Global(node),
    Nonlocal: (visitor, node) => visitor.visit_Nonlocal(node),
    Import: (visitor, node) => visitor.visit_Import(node),
    ImportFrom: (visitor, node) => visitor.visit_ImportFrom(node),
    alias: (visitor, node) => visitor.visit_alias(node),
    Pass: (visitor, node) => visitor.visit_Pass(node),
    GeneratorExp: (visitor, node) => visitor.visit_GeneratorExp(node),
    comprehension: (visitor, node) => visitor.visit_comprehension(node),
    NamedExpr: (visitor, node) => visitor.visit_NamedExpr(node),
};
export function analyze(ast: Node): ScopeResult {
    const analyzer = new VisitorAnalyzer();
    analyzer.visit(ast);
    return analyzer.finish();
}
